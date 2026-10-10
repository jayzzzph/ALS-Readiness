import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { UserX } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { getErrorMessage, getErrorStatus } from "../../../lib/api/errors";
import { getLearner, updateAtRiskFlag } from "../../../lib/api/facilitator";
import type {
  AtRiskFlagSummary,
  FacilitatorLearnerDetailResponse,
  LearnerMembership,
  LearnerStrandDetail,
  StrandTestResult,
} from "../../../lib/api/types";
import {
  FLAGS_NOT_UPDATED_TEXT,
  REOPEN,
  flagReasonText,
  flagRowAction,
  flagStatusLabel,
  shouldReloadAfterFailure,
} from "../../../lib/atRisk";
import { formatDate, formatDateTime, formatLastActive } from "../../../lib/dates";
import { useFetch } from "../../../lib/hooks/useFetch";
import { DASH, memberStatusLabel, orDash, personName } from "../../../lib/labels";
import { detailFailureText, intakeRows, lriTile, parseIdParam, progressCell, testCell } from "../../../lib/learnersText";
import { LEARNER_COHORT_PARAM, learnerDetailPage } from "../../../lib/navigation";
import { toast } from "../../../lib/toast";
import {
  AtRiskReviewDialog,
  CohortStatus,
  FLAG_STATUS_TONE,
  MemberStatus,
  Section,
  StatusText,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  NOT_YET_PROFILED,
  PageHeader,
  ProgressBar,
  ReadinessPill,
  SUMMARY_NUMBER,
  SummaryCell,
  SummaryEmpty,
  SummaryStrip,
  type DataTableColumn,
} from "./shared";
import { MUTED, PAGE_BODY } from "./shared/tokens";

const LEARNERS_PAGE = "facilitator-learners";

/** An MPS with its raw score and date under it, right-aligned as a number; "Not taken" quietly. */
function TestResultCell({ result }: { result: StrandTestResult | null }) {
  const cell = testCell(result);
  if (result === null) return <span className={MUTED}>{cell.main}</span>;
  return (
    <div className="tabular-nums">
      <div className="text-[#1B1D26] font-bold">{cell.main}</div>
      <div className={`${MUTED} whitespace-nowrap`}>{cell.score}{cell.date ? ` · ${cell.date}` : ""}</div>
    </div>
  );
}

const STRAND_COLUMNS: DataTableColumn<LearnerStrandDetail>[] = [
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
  { key: "pretest", header: "Pretest MPS", align: "right", className: "w-[19%]", render: (strand) => <TestResultCell result={strand.pretest} /> },
  { key: "posttest", header: "Posttest MPS", align: "right", className: "w-[19%]", render: (strand) => <TestResultCell result={strand.posttest} /> },
  {
    key: "progress",
    header: "Progress",
    className: "w-[24%]",
    render: (strand) => {
      const cell = progressCell(strand.progress);
      if (cell.barValue === null) return <span className={MUTED}>{cell.text}</span>;
      // The percentage gets a fixed slot so every track is the same length and the bars compare.
      return (
        <div>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <ProgressBar value={cell.barValue} showValue={false} label={`${strand.strand_code} progress`} />
            </div>
            <span className="w-12 text-right font-bold tabular-nums text-[#1B1D26]">{cell.text}</span>
          </div>
          {cell.detail && <div className={`${MUTED} mt-0.5`}>{cell.detail}</div>}
        </div>
      );
    },
  },
];

/**
 * The readiness figure. The API types it as null until EEG profiling exists,
 * and that is the only state built here: a quiet line, not a badge.
 */
function ReadinessValue({ readiness }: { readiness: FacilitatorLearnerDetailResponse["readiness"] }) {
  if (readiness === null) return <SummaryEmpty>{NOT_YET_PROFILED}</SummaryEmpty>;
  return <ReadinessPill readiness={readiness} />;
}

/** The header status: the cohort's, as on every page, and an ended membership as a quiet word. */
function MembershipStatus({ membership }: { membership: Pick<LearnerMembership, "status" | "membership_status"> }) {
  return (
    <>
      <CohortStatus status={membership.status} />
      {membership.membership_status === "ended" && (
        <StatusText tone="quiet">Membership {memberStatusLabel(membership.membership_status).toLowerCase()}</StatusText>
      )}
    </>
  );
}

interface LoadedProps {
  data: FacilitatorLearnerDetailResponse;
  onReview: () => void;
  onReopen: (flag: AtRiskFlagSummary) => void;
  /** The dismissed flag being reopened, or null. */
  reopeningFlagId: number | null;
  onOpenCohort: (cohortId: number) => void;
}

function LoadedDetail({ data, onReview, onReopen, reopeningFlagId, onOpenCohort }: LoadedProps) {
  const lri = lriTile(data.lri);

  const flagColumns: DataTableColumn<AtRiskFlagSummary>[] = [
    { key: "reason", header: "Reason", render: (flag) => flagReasonText(flag) },
    { key: "status", header: "Status", render: (flag) => <StatusText tone={FLAG_STATUS_TONE[flag.status] ?? "quiet"}>{flagStatusLabel(flag.status)}</StatusText> },
    { key: "detected", header: "Detected", className: "text-[#4A4F5C] whitespace-nowrap", render: (flag) => formatDate(flag.detected_at) ?? DASH },
    { key: "resolved", header: "Resolved", className: "text-[#4A4F5C] whitespace-nowrap", render: (flag) => formatDate(flag.resolved_at) ?? DASH },
    { key: "reviewed-by", header: "Reviewed by", className: "text-[#4A4F5C]", render: (flag) => orDash(flag.reviewed_by_name) },
    { key: "note", header: "Note", className: "text-[#4A4F5C] max-w-xs whitespace-pre-wrap", render: (flag) => orDash(flag.note) },
    {
      key: "review",
      header: "Review",
      render: (flag) => {
        const action = flagRowAction(flag);
        if (action === "review") return <Button variant="link" onClick={onReview}>Review</Button>;
        if (action === "reopen") {
          return (
            <Button variant="link" onClick={() => onReopen(flag)} disabled={reopeningFlagId !== null}>
              {reopeningFlagId === flag.id ? "Reopening…" : REOPEN.label}
            </Button>
          );
        }
        return null;
      },
    },
  ];

  const hasFlags = data.at_risk_flags.length > 0;

  return (
    <>
      <SummaryStrip>
        <SummaryCell label="Last active" hint={formatDateTime(data.last_active_at) ?? undefined}>
          <span className={SUMMARY_NUMBER}>{formatLastActive(data.last_active_at)}</span>
        </SummaryCell>
        <SummaryCell label="LRI score" hint={lri.hint ?? undefined}>
          <span className={SUMMARY_NUMBER}>{lri.value}</span>
        </SummaryCell>
        <SummaryCell label="Readiness" hint="Readiness appears once EEG profiling is available.">
          <ReadinessValue readiness={data.readiness} />
        </SummaryCell>
      </SummaryStrip>

      {/* Every section is one region with its title inside, as on the learner pages. */}
      <section aria-labelledby="strands-title">
        <DataTable
          title="Performance by strand"
          titleId="strands-title"
          columns={STRAND_COLUMNS}
          rows={data.strands}
          rowKey={(strand) => strand.strand_id}
          emptyMessage="No active learning strands."
        />
      </section>

      <section aria-labelledby="flags-title">
        {hasFlags ? (
          <DataTable
            title="At-risk history"
            titleId="flags-title"
            titleNote={data.cohort.status !== "active" && <p>{FLAGS_NOT_UPDATED_TEXT}</p>}
            columns={flagColumns}
            rows={data.at_risk_flags}
            rowKey={(flag) => flag.id}
          />
        ) : (
          <Section
            titleId="flags-title"
            title="At-risk history"
            note={
              <>
                <p>No flags for this learner</p>
                {data.cohort.status !== "active" && <p>{FLAGS_NOT_UPDATED_TEXT}</p>}
              </>
            }
          />
        )}
      </section>

      <Section titleId="intake-title" title="Intake summary" note={data.intake === null && <p>No intake form submitted yet</p>}>
        {data.intake !== null && (
          <dl className="grid grid-cols-3 gap-x-6 gap-y-5">
            {intakeRows(data.intake).map((row) => (
              <div key={row.label} className="min-w-0">
                <dt className={MUTED}>{row.label}</dt>
                <dd className="text-[#1B1D26] text-base font-bold mt-1">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Section>

      {data.memberships.length > 0 && (
        <Section titleId="other-cohorts-title" title="Other cohorts">
          <ul className="divide-y divide-[#E2E0DA] -my-3">
            {data.memberships.map((membership) => (
              <li key={membership.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[#1B1D26] font-bold">{membership.name}</span>
                  {!membership.name.includes(membership.school_year) && <span className={MUTED}>SY {membership.school_year}</span>}
                  <MemberStatus status={membership.membership_status} />
                </div>
                <Button variant="link" onClick={() => onOpenCohort(membership.id)}>View in this cohort</Button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

export function FacilitatorLearnerDetail({ navigate, user, onLogout }: PageProps) {
  // The learner and the cohort both come from the URL, not from the top bar's
  // selection, so a reload or a shared link shows the same view.
  const params = useParams();
  const [searchParams] = useSearchParams();
  const learnerId = parseIdParam(params.learnerId);
  // Absent (or unreadable): no cohort_id is sent and the backend chooses the membership.
  const cohortId = parseIdParam(searchParams.get(LEARNER_COHORT_PARAM));

  // Keyed on both: moving to another learner or cohort reloads, and a slow
  // earlier response is dropped by the hook.
  const detail = useFetch(
    () => getLearner(learnerId as number, cohortId ?? undefined),
    [learnerId, cohortId],
    { enabled: learnerId !== null, fallbackError: "Unable to load this learner." },
  );
  const data = detail.data;

  const [reviewing, setReviewing] = useState(false);
  const [reopeningFlagId, setReopeningFlagId] = useState<number | null>(null);

  // A dismissed flag is reopened straight from its row. Only the status is
  // sent, so the flag keeps its note.
  const reopen = async (flag: AtRiskFlagSummary) => {
    setReopeningFlagId(flag.id);
    try {
      await updateAtRiskFlag(flag.id, { status: REOPEN.status });
      toast.success(REOPEN.done);
      detail.reload();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "The flag could not be reopened."));
      // The flag is no longer what the row shows (e.g. it closed meanwhile).
      if (shouldReloadAfterFailure(getErrorStatus(requestError))) detail.reload();
    } finally {
      setReopeningFlagId(null);
    }
  };

  let body;
  if (learnerId === null) {
    body = (
      <Card padding="none">
        <EmptyState icon={UserX} title="Learner not found" description="This link does not point to a learner. Go back to the Learners list and open one from there." />
      </Card>
    );
  } else if (detail.error) {
    const failure = detailFailureText(detail.errorStatus, detail.error);
    body = <ErrorState title={failure.title} message={failure.message} onRetry={failure.canRetry ? detail.reload : undefined} />;
  } else if (!data) {
    body = <LoadingState label="Loading the learner…" />;
  } else {
    body = (
      <LoadedDetail
        data={data}
        onReview={() => setReviewing(true)}
        onReopen={(flag) => void reopen(flag)}
        reopeningFlagId={reopeningFlagId}
        onOpenCohort={(otherCohortId) => navigate(learnerDetailPage(data.learner.learner_id, otherCohortId))}
      />
    );
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage={LEARNERS_PAGE} hideCohortControls>
      {reviewing && data && (
        <AtRiskReviewDialog
          learner={data.learner}
          cohortId={data.cohort.id}
          onClose={() => setReviewing(false)}
          onChanged={detail.reload}
        />
      )}

      <div className={PAGE_BODY}>
        <PageHeader
          backLabel="Back to Learners"
          onBack={() => navigate(LEARNERS_PAGE)}
          title={data ? personName(data.learner, "Unnamed learner") : "Learner"}
          subtitle={
            data
              ? // Cohort names often carry the school year already; say it once.
                `${orDash(data.learner.id_no)} · ${data.cohort.name}${data.cohort.name.includes(data.cohort.school_year) ? "" : ` · SY ${data.cohort.school_year}`}`
              : undefined
          }
          status={data && <MembershipStatus membership={data.cohort} />}
        />
        {body}
      </div>
    </AppLayout>
  );
}
