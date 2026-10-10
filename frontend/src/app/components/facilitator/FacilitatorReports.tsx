import { useState } from "react";
import { Download } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { getErrorStatus } from "../../../lib/api/errors";
import { downloadCohortSummaryCsv, getCohortSummary } from "../../../lib/api/facilitator";
import type { CohortSummaryResponse, MembershipStatusFilter, ReportLearner, ReportStrandTotals } from "../../../lib/api/types";
import { formatLastActive } from "../../../lib/dates";
import { saveBlob } from "../../../lib/download";
import { useFetch } from "../../../lib/hooks/useFetch";
import { DASH, formatMps, formatPercent, orDash, personName } from "../../../lib/labels";
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
  CohortStatus,
  DataTable,
  ErrorState,
  FilterBar,
  HeaderButton,
  LoadingState,
  NoCohortsState,
  PageHeader,
  MemberStatus,
  ProgressBar,
  SUMMARY_NUMBER,
  SummaryCell,
  SummaryStrip,
  type DataTableColumn,
} from "./shared";
import { FOCUS_RING, MUTED, PAGE_BODY } from "./shared/tokens";

/** A figure in a table cell: bold and tabular, or a quiet dash when there is none. */
function Figure({ text }: { text: string }) {
  if (text === DASH) return <span className="text-[#4A4F5C]">{DASH}</span>;
  return <span className="font-bold tabular-nums text-[#1B1D26]">{text}</span>;
}

/**
 * An average with how many learners it covers. When nobody is covered the
 * cell is a single quiet dash, not "— / 0 learners".
 */
function AverageWithCount({ main, count }: { main: string; count: number }) {
  if (count === 0) return <Figure text={DASH} />;
  return (
    <div className="tabular-nums">
      <Figure text={main} />
      <div className={MUTED}>{averageCell(null, count).detail}</div>
    </div>
  );
}

const STRAND_COLUMNS: DataTableColumn<ReportStrandTotals>[] = [
  {
    key: "strand",
    header: "Strand",
    render: (strand) => <span className="text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-[#4D35BD]">{strand.strand_code}</span>,
  },
  {
    key: "progress",
    header: "Average progress",
    className: "w-[24%]",
    render: (strand) => {
      if (strand.average_progress === null) return <Figure text={DASH} />;
      // The percentage gets a fixed slot so every track is the same length and the bars compare.
      return (
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <ProgressBar value={strand.average_progress} showValue={false} label={`${strand.strand_code} average progress`} />
          </div>
          <span className="w-12 text-right"><Figure text={formatPercent(strand.average_progress)} /></span>
        </div>
      );
    },
  },
  {
    key: "pretest",
    header: "Pretest average",
    align: "right",
    render: (strand) => <AverageWithCount main={formatMps(strand.pretest.average_mps)} count={strand.pretest.count} />,
  },
  {
    key: "posttest",
    header: "Posttest average",
    align: "right",
    render: (strand) => <AverageWithCount main={formatMps(strand.posttest.average_mps)} count={strand.posttest.count} />,
  },
  {
    key: "gain",
    header: "Average gain",
    align: "right",
    render: (strand) => <AverageWithCount main={gainText(strand.gain.average)} count={strand.gain.count} />,
  },
  {
    key: "mastered",
    header: "Mastered",
    align: "right",
    // "2 learners": the count leads, the noun is quiet.
    render: (strand) => {
      const [count, ...noun] = masteryCountText(strand.mastery_count).split(" ");
      return (
        <span className="whitespace-nowrap">
          <Figure text={count} /> <span className={MUTED}>{noun.join(" ")}</span>
        </span>
      );
    },
  },
];

/** A learner-table cell: tabular, right-aligned by its column, with dashes kept quiet. */
const quietCell = (text: string) => (text === DASH ? <span className="text-[#4A4F5C]">{DASH}</span> : <span className="tabular-nums">{text}</span>);

/**
 * One strand for one learner: the progress, then "MPS 30 → 45" and "Gain +15 ·
 * Mastered: Yes" under it when there is something to say. With no entry for
 * the strand it is one quiet dash.
 */
function StrandCell({ strand }: { strand: ReturnType<typeof strandOfLearner> }) {
  const progress = formatPercent(strand?.progress_percent);
  const pre = formatMps(strand?.pretest_mps);
  const post = formatMps(strand?.posttest_mps);
  if (progress === DASH && pre === DASH && post === DASH) return quietCell(DASH);
  const gain = gainText(strand?.gain);
  const mastered = masteredText(strand?.mastered);
  const outcome = [gain !== DASH ? `Gain ${gain}` : null, mastered !== DASH ? `Mastered: ${mastered}` : null].filter(Boolean).join(" · ");
  return (
    <div className="tabular-nums">
      <div className={progress === DASH ? "text-[#4A4F5C]" : "font-bold text-[#1B1D26]"}>{progress}</div>
      {(pre !== DASH || post !== DASH) && <div className={MUTED}>MPS {pre} → {post}</div>}
      {outcome && <div className={MUTED}>{outcome}</div>}
    </div>
  );
}

/** The learners table's columns: fixed ones either side of one column group per strand in the response. */
function learnerColumns(data: CohortSummaryResponse, onOpenLearner: (learnerId: number) => void): DataTableColumn<ReportLearner>[] {
  // One column per strand instead of five, so the table fits a laptop screen without scrolling
  // sideways: the progress leads, with the MPS as "pretest → posttest" and the gain and mastery
  // under it. Every figure is still on screen (and all of them are in the CSV).
  const strandColumns = strandGroups(data.totals.strands, data.learners).map((code): DataTableColumn<ReportLearner> => ({
    key: `${code}-strand`,
    header: code,
    align: "right",
    className: "whitespace-nowrap",
    // A learner with no entry for this strand shows a dash.
    render: (learner) => <StrandCell strand={strandOfLearner(learner, code)} />,
  }));

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
              className={`text-[#1B1D26] font-bold hover:text-[#004270] hover:underline underline-offset-2 text-left rounded-md ${FOCUS_RING}`}
            >
              {personName(learner, "Unnamed learner")}
            </button>
          </div>
          <div className={`${MUTED} tabular-nums flex items-center gap-2`}>
            {orDash(learner.id_no)}
            {learner.membership_status === "ended" && <><span aria-hidden="true">·</span><MemberStatus status={learner.membership_status} /></>}
          </div>
        </div>
      ),
    },
    {
      key: "overall",
      header: "Overall progress",
      render: (learner) => <ProgressBar value={learner.overall_progress} widthClass="w-20" label="Overall progress" />,
    },
    ...strandColumns,
    { key: "lri", header: "LRI score", align: "right", className: "whitespace-nowrap", render: (learner) => quietCell(orDash(learner.lri_score)) },
    { key: "last-active", header: "Last active", className: "text-[#4A4F5C] whitespace-nowrap", render: (learner) => formatLastActive(learner.last_active_at) },
    { key: "at-risk", header: "At-risk", className: "whitespace-nowrap", render: (learner) => quietCell(atRiskReasonsText(learner.at_risk_reasons)) },
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
    // The filter applies to the whole report: it heads the content it filters, in the same bar as every
    // page, and stays put while a new filter loads or fails.
    const filterBar = (
      <FilterBar label="Filter the report">
        <ChipGroup label="Membership" options={MEMBERSHIP_OPTIONS} value={membership} onChange={setMembership} />
      </FilterBar>
    );
    body = failure ? (
      <>
        {filterBar}
        <ErrorState title={failure.title} message={failure.message} onRetry={failure.canRetry ? report.reload : undefined} />
      </>
    ) : !data ? (
      <>
        {filterBar}
        <LoadingState label="Loading the report…" />
      </>
    ) : (
      <>
        {filterBar}

        <SummaryStrip>
          <SummaryCell label="Learners">
            <span className={SUMMARY_NUMBER}>{data.totals.learner_count}</span>
          </SummaryCell>
          <SummaryCell label="Average progress" hint="across all strands">
            <span className={SUMMARY_NUMBER}>{formatPercent(data.totals.average_progress)}</span>
          </SummaryCell>
          <SummaryCell label="At-risk learners" hint={atRiskBreakdownText(data.totals.at_risk.by_reason) ?? undefined}>
            <span className={SUMMARY_NUMBER}>{data.totals.at_risk.learner_count}</span>
          </SummaryCell>
        </SummaryStrip>

        <section aria-labelledby="report-strands-title">
          <DataTable
            title="By learning strand"
            titleId="report-strands-title"
            columns={STRAND_COLUMNS}
            rows={data.totals.strands}
            rowKey={(strand) => strand.strand_code}
            emptyMessage="No active learning strands."
          />
        </section>

        <section aria-labelledby="report-learners-title">
          <DataTable
            title="Learners"
            titleId="report-learners-title"
            columns={learnerColumns(data, (learnerId) => navigate(learnerDetailPage(learnerId, data.cohort.id)))}
            rows={data.learners}
            rowKey={(learner) => learner.learner_id}
            emptyMessage="No learners in this cohort for this membership filter."
          />
        </section>

        <div className="space-y-1">
          <p className={MUTED}>
            {generatedText(data.generated_at)}. {thresholdsText(data.thresholds)}
          </p>
          <p className={MUTED}>
            This report contains learners' personal information. Share it only with authorized ALS personnel.
          </p>
        </div>
      </>
    );
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-reports">
      {/* min-w-0 keeps the wide learners table scrolling inside its own card, not the page. */}
      <div className={`${PAGE_BODY} min-w-0`}>
        <PageHeader
          title="Reports"
          subtitle={headerCohort ? reportSubtitle(headerCohort.name, headerCohort.school_year) : undefined}
          status={headerCohort && <CohortStatus status={headerCohort.status} />}
          action={
            <HeaderButton onClick={() => void downloadCsv()} disabled={cohortId === null || downloading}>
              <Download className="w-4 h-4" aria-hidden="true" /> {downloading ? "Preparing CSV…" : "Download CSV"}
            </HeaderButton>
          }
        />
        {body}
      </div>
    </AppLayout>
  );
}
