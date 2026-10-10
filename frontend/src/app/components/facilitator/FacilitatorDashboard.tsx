import { useState } from "react";
import { Activity, CheckCircle, TrendingUp, Users } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { getDashboard } from "../../../lib/api/facilitator";
import type {
  DashboardAtRisk,
  DashboardAtRiskLearner,
  DashboardResponse,
  DashboardStrand,
} from "../../../lib/api/types";
import { flagReasonText } from "../../../lib/atRisk";
import {
  AT_RISK_RULE_TEXT,
  atRiskNoticeTitle,
  averageProgressTile,
  evaluationTile,
  learnerCountLabel,
  loadFailureText,
  masteryText,
  mpsAverageText,
  strandCardTitle,
  strandProgress,
} from "../../../lib/dashboardText";
import { formatLastActive } from "../../../lib/dates";
import { useFetch } from "../../../lib/hooks/useFetch";
import { cohortStatusLabel, orDash, personName } from "../../../lib/labels";
import { learnerDetailPage } from "../../../lib/navigation";
import { useCohortSelection } from "../../../lib/store/cohortStore";
import {
  AtRiskReviewDialog,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  NoCohortsState,
  Notice,
  NOT_YET_PROFILED,
  PageHeader,
  Pill,
  ProgressBar,
  ReadinessPill,
  StatTile,
  type DataTableColumn,
} from "./shared";
import { DISPLAY_FONT } from "./shared/tokens";

/**
 * Readiness distribution tile body. The API returns null until readiness
 * profiling exists, and that is the only state built here; when it returns
 * counts, render them in place of the early return.
 */
function ReadinessDistribution({ distribution }: { distribution: DashboardResponse["readiness_distribution"] }) {
  if (distribution === null) return <Pill tone="muted">{NOT_YET_PROFILED}</Pill>;
  return null;
}

function StrandCard({ strand, learnerCount }: { strand: DashboardStrand; learnerCount: number }) {
  const progress = strandProgress(strand);
  return (
    <Card
      title={strandCardTitle(strand)}
      action={<span className="text-[#4A4F5C] text-[0.9375rem] flex-shrink-0">{learnerCountLabel(learnerCount)}</span>}
    >
      {progress.barValue !== null && (
        <ProgressBar value={progress.barValue} size="md" showValue={false} label={`${strand.strand_name} average completion`} />
      )}
      <div className="text-[#4A4F5C] text-[0.9375rem] mt-2">{progress.caption}</div>
      <div className="text-[#4A4F5C] text-[0.9375rem] mt-3 pt-3 border-t border-[#E2E0DA]">
        Pretest average MPS {mpsAverageText(strand.pretest)} · Posttest average MPS {mpsAverageText(strand.posttest)} · {masteryText(strand.posttest.mastery_count)}
      </div>
    </Card>
  );
}

interface AtRiskSectionProps {
  atRisk: DashboardAtRisk;
  cohortIsActive: boolean;
  onOpenLearner: (learnerId: number) => void;
  onReview: (learner: DashboardAtRiskLearner) => void;
}

function AtRiskSection({ atRisk, cohortIsActive, onOpenLearner, onReview }: AtRiskSectionProps) {
  const columns: DataTableColumn<DashboardAtRiskLearner>[] = [
    {
      key: "learner",
      header: "Learner",
      render: (learner) => (
        <div>
          <button
            type="button"
            onClick={() => onOpenLearner(learner.learner_id)}
            className="text-[#1B1D26] text-[0.9375rem] font-medium hover:text-[#004270] hover:underline text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A] rounded-md"
          >
            {personName(learner, "Unnamed learner")}
          </button>
          <div className="text-[#4A4F5C] text-[0.9375rem] tabular-nums">{orDash(learner.id_no)}</div>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (learner) => (
        <div className="space-y-1">
          {learner.flags.map((flag) => (
            <div key={flag.id} className="flex items-center gap-2 flex-wrap">
              <span>{flagReasonText(flag)}</span>
              {flag.status === "reviewed" && <Pill tone="neutral">Reviewed</Pill>}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "readiness",
      header: "Readiness",
      // The dashboard's at-risk rows carry no readiness field; there is none to show until profiling exists.
      render: () => <ReadinessPill readiness={null} />,
    },
    {
      key: "progress",
      header: "Progress",
      render: (learner) => <ProgressBar value={learner.overall_progress} widthClass="w-24" label="Overall progress" />,
    },
    {
      key: "last-active",
      header: "Last Active",
      className: "text-[#4A4F5C] text-[0.9375rem]",
      render: (learner) => formatLastActive(learner.last_active_at),
    },
    {
      key: "review",
      header: "Review",
      render: (learner) => <Button variant="link" onClick={() => onReview(learner)}>Review</Button>,
    },
  ];

  return (
    <section className="space-y-4">
      <h3 className="text-[1.5rem] leading-[1.25] text-[#1B1D26]" style={DISPLAY_FONT}>At-Risk Learners</h3>

      {!cohortIsActive && <Notice>Flags are only updated for active cohorts.</Notice>}

      {atRisk.learners.length === 0 ? (
        <Card padding="none">
          <EmptyState title="No learners flagged" icon={Users} />
        </Card>
      ) : (
        <>
          <Notice tone="warning" title={atRiskNoticeTitle(atRisk.learner_count)}>
            — {AT_RISK_RULE_TEXT}
          </Notice>
          <DataTable columns={columns} rows={atRisk.learners} rowKey={(learner) => learner.learner_id} />
        </>
      )}
    </section>
  );
}

export function FacilitatorDashboard({ navigate, user, onLogout }: PageProps) {
  // This page needs one cohort, so "All cohorts" is not offered here.
  const selection = useCohortSelection({ allowAll: false });
  const cohortId = selection.cohortId;

  // Keyed on the cohort: a slow response for a previous cohort is dropped by the hook.
  const dashboard = useFetch(
    () => getDashboard(cohortId as number),
    [cohortId],
    { enabled: cohortId !== null, fallbackError: "Unable to load the dashboard." },
  );
  const data = dashboard.data;

  const [reviewLearner, setReviewLearner] = useState<DashboardAtRiskLearner | null>(null);

  const cohortsLoading = !selection.ready || selection.loading;
  // Before the dashboard answers, the header falls back to the cohort picked in the top bar.
  const headerCohort = data?.cohort ?? selection.cohort;

  let body;
  if (selection.error) {
    body = <ErrorState title="Your cohorts could not be loaded" message={selection.error} onRetry={selection.reload} />;
  } else if (cohortsLoading) {
    body = <LoadingState label="Loading your cohorts…" />;
  } else if (selection.hasNoCohorts || cohortId === null) {
    body = <Card padding="none"><NoCohortsState /></Card>;
  } else if (dashboard.error) {
    const failure = loadFailureText(dashboard.errorStatus, dashboard.error);
    body = <ErrorState title={failure.title} message={failure.message} onRetry={failure.canRetry ? dashboard.reload : undefined} />;
  } else if (!data) {
    body = <LoadingState label="Loading the dashboard…" />;
  } else {
    const progressTile = averageProgressTile(data.average_progress);
    const contentTile = evaluationTile(data.evaluation_coverage);

    body = (
      <>
        <div className="grid grid-cols-3 gap-4">
          <StatTile
            label="Readiness distribution"
            icon={Activity}
            tone="teal"
            value={<ReadinessDistribution distribution={data.readiness_distribution} />}
            hint="Readiness appears once EEG profiling is available."
          />
          <StatTile label="Average progress" icon={TrendingUp} tone="blue" value={progressTile.value} hint={progressTile.hint} />
          <StatTile label="Content evaluation coverage" icon={CheckCircle} tone="green" value={contentTile.value} hint={contentTile.hint} />
        </div>

        <section className="space-y-4">
          <h3 className="text-[1.5rem] leading-[1.25] text-[#1B1D26]" style={DISPLAY_FONT}>Progress by Learning Strand</h3>
          {data.progress_by_strand.length === 0 ? (
            <Card padding="none"><EmptyState title="No active learning strands" /></Card>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {data.progress_by_strand.map((strand) => (
                <StrandCard key={strand.strand_id} strand={strand} learnerCount={data.learner_count} />
              ))}
            </div>
          )}
        </section>

        <AtRiskSection
          atRisk={data.at_risk}
          cohortIsActive={data.cohort.status === "active"}
          onOpenLearner={(learnerId) => navigate(learnerDetailPage(learnerId, data.cohort.id))}
          onReview={setReviewLearner}
        />
      </>
    );
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-dashboard">
      {reviewLearner && cohortId !== null && (
        <AtRiskReviewDialog
          learner={reviewLearner}
          cohortId={cohortId}
          onClose={() => setReviewLearner(null)}
          onChanged={dashboard.reload}
        />
      )}

      <div className="p-6 space-y-6">
        <PageHeader
          eyebrow="Facilitator Dashboard"
          title="Cohort Overview"
          subtitle={
            headerCohort ? (
              <span className="flex items-center gap-2 flex-wrap">
                <span>
                  {headerCohort.name}
                  {data ? ` · ${learnerCountLabel(data.learner_count)}` : ""}
                </span>
                {headerCohort.status !== "active" && <Pill tone="muted">{cohortStatusLabel(headerCohort.status)}</Pill>}
              </span>
            ) : undefined
          }
        />
        {body}
      </div>
    </AppLayout>
  );
}
