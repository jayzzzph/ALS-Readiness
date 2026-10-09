import { useState } from "react";
import { AlertCircle, Download, TrendingUp, Users } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { getErrorStatus } from "../../../lib/api/errors";
import { downloadCohortSummaryCsv, getCohortSummary } from "../../../lib/api/facilitator";
import type { CohortSummaryResponse, MembershipStatusFilter, ReportLearner, ReportStrandTotals } from "../../../lib/api/types";
import { formatLastActive } from "../../../lib/dates";
import { saveBlob } from "../../../lib/download";
import { useFetch } from "../../../lib/hooks/useFetch";
import { cohortStatusLabel, formatMps, formatPercent, memberStatusLabel, orDash, personName } from "../../../lib/labels";
import { learnerDetailPage } from "../../../lib/navigation";
import {
  MEMBERSHIP_OPTIONS,
  atRiskBreakdownText,
  atRiskReasonsText,
  averageCell,
  csvFailureText,
  gainText,
  generatedText,
  masteredText,
  masteryCountText,
  reportFailureText,
  reportSubtitle,
  strandGroups,
  strandOfLearner,
  thresholdsText,
} from "../../../lib/reportsText";
import { useCohortSelection } from "../../../lib/store/cohortStore";
import { toast } from "../../../lib/toast";
import {
  Card,
  ChipGroup,
  DataTable,
  ErrorState,
  HeaderButton,
  LoadingState,
  NoCohortsState,
  PageHeader,
  Pill,
  ProgressBar,
  StatTile,
  type DataTableColumn,
} from "./shared";

function AverageWithCount({ average, count }: { average: number | null; count: number }) {
  const cell = averageCell(average, count);
  return (
    <div>
      <div className="text-gray-800 font-medium">{cell.main}</div>
      <div className="text-gray-400 text-xs">{cell.detail}</div>
    </div>
  );
}

const STRAND_COLUMNS: DataTableColumn<ReportStrandTotals>[] = [
  { key: "strand", header: "Strand", render: (strand) => <span className="text-gray-800 font-medium">{strand.strand_code}</span> },
  {
    key: "progress",
    header: "Average progress",
    render: (strand) => <ProgressBar value={strand.average_progress} widthClass="w-24" label={`${strand.strand_code} average progress`} />,
  },
  { key: "pretest", header: "Pretest average", render: (strand) => <AverageWithCount average={strand.pretest.average_mps} count={strand.pretest.count} /> },
  { key: "posttest", header: "Posttest average", render: (strand) => <AverageWithCount average={strand.posttest.average_mps} count={strand.posttest.count} /> },
  {
    key: "gain",
    header: "Average gain",
    render: (strand) => (
      <div>
        <div className="text-gray-800 font-medium">{gainText(strand.gain.average)}</div>
        <div className="text-gray-400 text-xs">{averageCell(null, strand.gain.count).detail}</div>
      </div>
    ),
  },
  { key: "mastered", header: "Mastered", render: (strand) => masteryCountText(strand.mastery_count) },
];

/** The learners table's columns: fixed ones either side of one column group per strand in the response. */
function learnerColumns(data: CohortSummaryResponse, onOpenLearner: (learnerId: number) => void): DataTableColumn<ReportLearner>[] {
  const strandColumns = strandGroups(data.totals.strands, data.learners).flatMap((code): DataTableColumn<ReportLearner>[] => [
    {
      key: `${code}-progress`,
      group: code,
      header: "Progress",
      className: "whitespace-nowrap",
      // A learner with no entry for this strand shows a dash, as do the cells beside it.
      render: (learner) => formatPercent(strandOfLearner(learner, code)?.progress_percent),
    },
    { key: `${code}-pretest`, group: code, header: "Pretest", render: (learner) => formatMps(strandOfLearner(learner, code)?.pretest_mps) },
    { key: `${code}-posttest`, group: code, header: "Posttest", render: (learner) => formatMps(strandOfLearner(learner, code)?.posttest_mps) },
    { key: `${code}-gain`, group: code, header: "Gain", className: "whitespace-nowrap", render: (learner) => gainText(strandOfLearner(learner, code)?.gain) },
    { key: `${code}-mastered`, group: code, header: "Mastered", render: (learner) => masteredText(strandOfLearner(learner, code)?.mastered) },
  ]);

  return [
    {
      key: "learner",
      header: "Learner",
      pinned: true,
      className: "whitespace-nowrap",
      render: (learner) => (
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenLearner(learner.learner_id)}
              className="text-gray-800 text-sm font-medium hover:text-orange-600 hover:underline text-left"
            >
              {personName(learner, "Unnamed learner")}
            </button>
            {learner.membership_status === "ended" && <Pill tone="muted">{memberStatusLabel(learner.membership_status)}</Pill>}
          </div>
          <div className="text-gray-400 text-xs font-mono">{orDash(learner.id_no)}</div>
        </div>
      ),
    },
    {
      key: "overall",
      header: "Overall progress",
      render: (learner) => <ProgressBar value={learner.overall_progress} widthClass="w-20" label="Overall progress" />,
    },
    ...strandColumns,
    { key: "lri", header: "LRI score", className: "whitespace-nowrap", render: (learner) => orDash(learner.lri_score) },
    { key: "last-active", header: "Last active", className: "text-gray-500 text-xs whitespace-nowrap", render: (learner) => formatLastActive(learner.last_active_at) },
    { key: "at-risk", header: "At-risk", className: "whitespace-nowrap", render: (learner) => atRiskReasonsText(learner.at_risk_reasons) },
  ];
}

export function FacilitatorReports({ navigate, user, onLogout }: PageProps) {
  // The report is about one cohort, so "All cohorts" is not offered here.
  const selection = useCohortSelection({ allowAll: false });
  const cohortId = selection.cohortId;

  const [membership, setMembership] = useState<MembershipStatusFilter>(MEMBERSHIP_OPTIONS[0].value);

  // Keyed on the cohort and the filter: a slow response for earlier ones is dropped by the hook.
  const report = useFetch(
    () => getCohortSummary(cohortId as number, membership),
    [cohortId, membership],
    { enabled: cohortId !== null, fallbackError: "Unable to load the report." },
  );
  const data = report.data;

  const [downloading, setDownloading] = useState(false);

  // The same cohort and filter as the report on screen, so the file matches it.
  const downloadCsv = async () => {
    if (cohortId === null) return;
    setDownloading(true);
    try {
      const file = await downloadCohortSummaryCsv(cohortId, membership);
      saveBlob(file.blob, file.filename);
      toast.success(`Downloaded ${file.filename}.`);
    } catch (requestError) {
      toast.error(csvFailureText(getErrorStatus(requestError)));
    } finally {
      setDownloading(false);
    }
  };

  const cohortsLoading = !selection.ready || selection.loading;
  // Before the report answers, the header falls back to the cohort picked in the top bar.
  const headerCohort = data?.cohort ?? selection.cohort;

  let body;
  if (selection.error) {
    body = <ErrorState title="Your cohorts could not be loaded" message={selection.error} onRetry={selection.reload} />;
  } else if (cohortsLoading) {
    body = <LoadingState label="Loading your cohorts…" />;
  } else if (selection.hasNoCohorts || cohortId === null) {
    body = <Card padding="none"><NoCohortsState /></Card>;
  } else {
    const failure = report.error ? reportFailureText(report.errorStatus, report.error) : null;
    body = (
      <>
        <Card padding="sm" className="flex items-center gap-3 flex-wrap">
          <ChipGroup label="Membership" options={MEMBERSHIP_OPTIONS} value={membership} onChange={setMembership} />
        </Card>

        {failure ? (
          <ErrorState title={failure.title} message={failure.message} onRetry={failure.canRetry ? report.reload : undefined} />
        ) : !data ? (
          <LoadingState label="Loading the report…" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Learners" icon={Users} tone="blue" value={data.totals.learner_count} />
              <StatTile
                label="Average progress"
                icon={TrendingUp}
                tone="green"
                value={formatPercent(data.totals.average_progress)}
                hint="across all strands"
              />
              <StatTile
                label="At-risk learners"
                icon={AlertCircle}
                tone="red"
                value={data.totals.at_risk.learner_count}
                hint={atRiskBreakdownText(data.totals.at_risk.by_reason) ?? undefined}
              />
            </div>

            <section className="space-y-3">
              <h3 className="text-gray-800 font-semibold text-sm">By learning strand</h3>
              <DataTable
                columns={STRAND_COLUMNS}
                rows={data.totals.strands}
                rowKey={(strand) => strand.strand_code}
                emptyMessage="No active learning strands."
              />
            </section>

            <section className="space-y-3">
              <h3 className="text-gray-800 font-semibold text-sm">Learners</h3>
              <DataTable
                columns={learnerColumns(data, (learnerId) => navigate(learnerDetailPage(learnerId, data.cohort.id)))}
                rows={data.learners}
                rowKey={(learner) => learner.learner_id}
                emptyMessage="No learners in this cohort for this membership filter."
              />
            </section>

            <p className="text-gray-400 text-xs">
              {generatedText(data.generated_at)}. {thresholdsText(data.thresholds)}
            </p>
            <p className="text-gray-400 text-xs">
              This report contains learners' personal information. Share it only with authorized ALS personnel.
            </p>
          </>
        )}
      </>
    );
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-reports">
      {/* min-w-0 keeps the wide learners table scrolling inside its own card, not the page. */}
      <div className="p-5 space-y-5 min-w-0">
        <PageHeader
          eyebrow="Reports"
          title="Reports"
          subtitle={
            headerCohort ? (
              <span className="flex items-center gap-2 flex-wrap">
                <span>{reportSubtitle(headerCohort.name, headerCohort.school_year)}</span>
                {headerCohort.status !== "active" && <Pill tone="muted">{cohortStatusLabel(headerCohort.status)}</Pill>}
              </span>
            ) : undefined
          }
          action={
            <HeaderButton onClick={() => void downloadCsv()} disabled={cohortId === null || downloading}>
              <Download className="w-4 h-4" /> {downloading ? "Preparing CSV…" : "Download CSV"}
            </HeaderButton>
          }
        />
        {body}
      </div>
    </AppLayout>
  );
}
