import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { getDashboard } from "../../../lib/api/facilitator";
import type {
  DashboardAtRisk,
  DashboardAtRiskLearner,
  DashboardResponse,
  DashboardStrand,
  EvaluationCoverage,
  MpsAverage,
} from "../../../lib/api/types";
import { flagReasonText } from "../../../lib/atRisk";
import {
  AT_RISK_RULE_TEXT,
  atRiskNoticeTitle,
  averageProgressTile,
  evaluationTile,
  learnerCountLabel,
  loadFailureText,
  strandProgress,
} from "../../../lib/dashboardText";
import { formatLastActive } from "../../../lib/dates";
import { useFetch } from "../../../lib/hooks/useFetch";
import { formatMps, formatPercent, orDash, personName } from "../../../lib/labels";
import { learnerDetailPage } from "../../../lib/navigation";
import { useCohortSelection } from "../../../lib/store/cohortStore";
import {
  AtRiskReviewDialog,
  Button,
  Card,
  DataTable,
  ErrorState,
  LoadingState,
  NoCohortsState,
  NOT_YET_PROFILED,
  PageHeader,
  ProgressBar,
  ReadinessPill,
  CohortStatus,
  FLAG_STATUS_TONE,
  StatusText,
  SUMMARY_NUMBER,
  SummaryCell,
  SummaryEmpty,
  SummaryStrip,
  type DataTableColumn,
} from "./shared";
import { FOCUS_RING, MUTED, PAGE_BODY, SECTION_TITLE } from "./shared/tokens";

// A facilitator's working view: one summary strip, then the learners who need
// attention, then the per-strand numbers as a table. The serif is kept for the
// page title; every heading and number below it is DM Sans, and numbers are
// tabular so columns and figures line up.

/**
 * Readiness distribution value. The API returns null until readiness profiling
 * exists, and that is the only state built here; when it returns counts,
 * render them in place of the early return. The empty state is a quiet line,
 * not a badge: it must not be the loudest thing on the page.
 */
function ReadinessDistribution({ distribution }: { distribution: DashboardResponse["readiness_distribution"] }) {
  if (distribution === null) return <SummaryEmpty>{NOT_YET_PROFILED}</SummaryEmpty>;
  return null;
}

/** "3 / 10" with the evaluated count leading; a dash when no content is assigned. */
function EvaluationValue({ coverage }: { coverage: EvaluationCoverage }) {
  if (coverage.total === 0) return <span className={SUMMARY_NUMBER}>{evaluationTile(coverage).value}</span>;
  return (
    <span className="tabular-nums">
      <span className={SUMMARY_NUMBER}>{coverage.evaluated}</span>
      <span className="text-[1.25rem] font-bold text-[#4A4F5C]"> / {coverage.total}</span>
    </span>
  );
}

function DashboardSummary({ data }: { data: DashboardResponse }) {
  const progressTile = averageProgressTile(data.average_progress);
  const contentTile = evaluationTile(data.evaluation_coverage);
  return (
    <SummaryStrip>
      <SummaryCell label="Average progress" hint={progressTile.hint}>
        <span className={SUMMARY_NUMBER}>{progressTile.value}</span>
      </SummaryCell>
      <SummaryCell label="Content evaluation coverage" hint={contentTile.hint}>
        <EvaluationValue coverage={data.evaluation_coverage} />
      </SummaryCell>
      <SummaryCell label="Readiness distribution" hint="Readiness appears once EEG profiling is available.">
        <ReadinessDistribution distribution={data.readiness_distribution} />
      </SummaryCell>
    </SummaryStrip>
  );
}

/** An MPS average with how many learners it covers, e.g. "30" over "1 learner". */
function MpsCell({ average }: { average: MpsAverage }) {
  // Nobody has taken it: one quiet dash, as on Reports, not a dash over "0 learners".
  if (average.count === 0) return <span className="text-[#4A4F5C]">{formatMps(null)}</span>;
  return (
    <div className="tabular-nums">
      <div className="font-bold text-[#1B1D26]">{formatMps(average.average_mps)}</div>
      <div className={MUTED}>{learnerCountLabel(average.count)}</div>
    </div>
  );
}

const STRAND_COLUMNS: DataTableColumn<DashboardStrand>[] = [
  {
    key: "strand",
    header: "Strand",
    render: (strand) => (
      <div className="min-w-0">
        <div className="text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-[#4D35BD]">{strand.strand_code}</div>
        <div className="text-[#1B1D26] font-medium">{strand.strand_name}</div>
      </div>
    ),
  },
  {
    key: "completion",
    header: "Average completion",
    className: "w-[26%]",
    render: (strand) => {
      const progress = strandProgress(strand);
      if (progress.barValue === null) return <span className={MUTED}>{progress.caption}</span>;
      // The percentage gets a fixed slot so every track is the same length and the bars compare.
      return (
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <ProgressBar value={progress.barValue} showValue={false} label={`${strand.strand_name} average completion`} />
          </div>
          <span className="w-12 text-right font-bold tabular-nums text-[#1B1D26]">{formatPercent(progress.barValue)}</span>
        </div>
      );
    },
  },
  { key: "pretest", header: "Pretest average MPS", align: "right", render: (strand) => <MpsCell average={strand.pretest} /> },
  { key: "posttest", header: "Posttest average MPS", align: "right", render: (strand) => <MpsCell average={strand.posttest} /> },
  {
    key: "mastery",
    header: "At mastery",
    align: "right",
    render: (strand) => <span className="font-bold tabular-nums text-[#1B1D26]">{strand.posttest.mastery_count}</span>,
  },
];

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
            className={`text-[#1B1D26] font-bold hover:text-[#004270] hover:underline underline-offset-2 text-left rounded-md ${FOCUS_RING}`}
          >
            {personName(learner, "Unnamed learner")}
          </button>
          <div className={`${MUTED} tabular-nums`}>{orDash(learner.id_no)}</div>
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
              {flag.status === "reviewed" && <StatusText tone={FLAG_STATUS_TONE.reviewed}>Reviewed</StatusText>}
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
      className: "text-[#4A4F5C] whitespace-nowrap",
      render: (learner) => formatLastActive(learner.last_active_at),
    },
    {
      key: "review",
      header: "Review",
      render: (learner) => <Button variant="link" onClick={() => onReview(learner)}>Review</Button>,
    },
  ];

  const flagged = atRisk.learners.length > 0;
  const inactiveNote = !cohortIsActive && <p>Flags are only updated for active cohorts.</p>;

  // One region either way, its title inside, as every learner-page section is.
  if (!flagged) {
    return (
      <section aria-labelledby="at-risk-title" className="bg-white rounded-2xl border border-[#E2E0DA] px-6 py-5">
        <h3 id="at-risk-title" className={SECTION_TITLE}>At-Risk Learners</h3>
        <div className={`mt-1 space-y-1 ${MUTED}`}>
          <p>No learners flagged</p>
          {inactiveNote}
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="at-risk-title">
      <DataTable
        title="At-Risk Learners"
        titleId="at-risk-title"
        titleNote={
          <>
            <p className="flex items-start gap-2 text-[#1B1D26]" role="status">
              <AlertCircle className="w-4 h-4 mt-[3px] flex-shrink-0 text-[#835500]" aria-hidden="true" />
              <span>
                <strong className="font-bold">{atRiskNoticeTitle(atRisk.learner_count)}</strong>
                <span className="text-[#4A4F5C]"> — {AT_RISK_RULE_TEXT}</span>
              </span>
            </p>
            {inactiveNote}
          </>
        }
        columns={columns}
        rows={atRisk.learners}
        rowKey={(learner) => learner.learner_id}
      />
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
    body = (
      <>
        <DashboardSummary data={data} />

        <AtRiskSection
          atRisk={data.at_risk}
          cohortIsActive={data.cohort.status === "active"}
          onOpenLearner={(learnerId) => navigate(learnerDetailPage(learnerId, data.cohort.id))}
          onReview={setReviewLearner}
        />

        <section aria-labelledby="strand-progress-title">
          <DataTable
            title="Progress by Learning Strand"
            titleId="strand-progress-title"
            columns={STRAND_COLUMNS}
            rows={data.progress_by_strand}
            rowKey={(strand) => strand.strand_id}
            emptyMessage="No active learning strands"
          />
        </section>
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

      <div className={PAGE_BODY}>
        <PageHeader
          title="Cohort Overview"
          subtitle={headerCohort ? `${headerCohort.name}${data ? ` · ${learnerCountLabel(data.learner_count)}` : ""}` : undefined}
          status={headerCohort && <CohortStatus status={headerCohort.status} />}
        />
        {body}
      </div>
    </AppLayout>
  );
}
