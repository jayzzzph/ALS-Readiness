// The Learners list. The file keeps the name of the "Cohort" mockup it was
// revised from, so its history is preserved; everything it shows says "Learners".
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { getLearners } from "../../../lib/api/facilitator";
import { getStrands } from "../../../lib/api/facilitatorCurriculum";
import type { FacilitatorLearnerRow, MembershipStatusFilter } from "../../../lib/api/types";
import { formatLastActive } from "../../../lib/dates";
import { useDebouncedValue } from "../../../lib/hooks/useDebouncedValue";
import { useFetch } from "../../../lib/hooks/useFetch";
import { atRiskReasonLabel, memberStatusLabel, orDash, personName } from "../../../lib/labels";
import {
  buildLearnerQuery,
  emptyListMessage,
  hasActiveFilters,
  learnerFilterKey,
  learnersSubtitle,
  listFailureText,
  progressCell,
  progressForStrand,
  strandColumns,
} from "../../../lib/learnersText";
import { learnerDetailPage } from "../../../lib/navigation";
import { useCohortSelection } from "../../../lib/store/cohortStore";
import {
  Card,
  Chip,
  ChipGroup,
  DataTable,
  ErrorState,
  LoadingState,
  NoCohortsState,
  PageHeader,
  Pagination,
  Pill,
  ProgressBar,
  ReadinessPill,
  SearchInput,
  type DataTableColumn,
} from "./shared";

const MEMBERSHIP_OPTIONS: readonly { value: MembershipStatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "ended", label: "Ended" },
  { value: "all", label: "All" },
];

function LearnerCell({ row }: { row: FacilitatorLearnerRow }) {
  const reasons = row.at_risk_reasons.map(atRiskReasonLabel).join(", ");
  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[#1B1D26] text-[0.9375rem] font-medium">{personName(row, "Unnamed learner")}</span>
        {row.at_risk_reasons.length > 0 && (
          <span className="inline-flex items-center text-[#BA1A1A]" title={`At risk: ${reasons}`}>
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">At risk: {reasons}</span>
          </span>
        )}
        {row.membership_status === "ended" && <Pill tone="muted">{memberStatusLabel(row.membership_status)}</Pill>}
      </div>
      <div className="text-[#4A4F5C] text-[0.9375rem] tabular-nums">{orDash(row.id_no)}</div>
    </div>
  );
}

export function FacilitatorCohort({ navigate, user, onLogout }: PageProps) {
  const selection = useCohortSelection({ allowAll: true });

  const [searchText, setSearchText] = useState("");
  const [membership, setMembership] = useState<MembershipStatusFilter>("active");
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const search = useDebouncedValue(searchText, 300);

  const filters = { cohortId: selection.cohortId, schoolYear: selection.schoolYear, membership, atRiskOnly, search };
  const filterKey = learnerFilterKey(filters);

  // The page is remembered together with the filters it belongs to, so any
  // change of control or cohort lands on page 1 without a second request.
  const [paging, setPaging] = useState({ filterKey, page: 1 });
  const page = paging.filterKey === filterKey ? paging.page : 1;

  const cohortsReady = selection.ready && !selection.loading && !selection.error && !selection.hasNoCohorts;
  // Keyed on every input: a slow response for earlier inputs is dropped by the hook.
  const list = useFetch(
    () => getLearners(buildLearnerQuery({ ...filters, page })),
    [filterKey, page],
    { enabled: cohortsReady, fallbackError: "Unable to load the learners." },
  );
  const data = list.data;
  const rows = data?.items ?? [];

  // The strand columns come from the strand list, not from the rows, so they
  // and their headings are there even when the result is empty.
  const strands = useFetch(getStrands, [], { fallbackError: "Unable to load the learning strands." });
  const strandCols = strandColumns(strands.data?.items ?? []);

  const columns: DataTableColumn<FacilitatorLearnerRow>[] = [
    { key: "learner", header: "Learner", render: (row) => <LearnerCell row={row} /> },
    { key: "cohort", header: "Cohort", className: "text-[#4A4F5C]", render: (row) => row.cohort_name },
    { key: "readiness", header: "Readiness", render: (row) => <ReadinessPill readiness={row.readiness} /> },
    ...strandCols.map((strand): DataTableColumn<FacilitatorLearnerRow> => ({
      key: `strand-${strand.strand_id}`,
      header: `${strand.strand_code} Progress`,
      render: (row) => {
        // A row with no entry for this strand shows a dash.
        const cell = progressCell(progressForStrand(row, strand.strand_id));
        return <ProgressBar value={cell.barValue} widthClass="w-16" label={`${strand.strand_code} progress`} />;
      },
    })),
    { key: "last-active", header: "Last Active", className: "text-[#4A4F5C] text-[0.9375rem]", render: (row) => formatLastActive(row.last_active_at) },
  ];

  let body;
  if (selection.error) {
    body = <ErrorState title="Your cohorts could not be loaded" message={selection.error} onRetry={selection.reload} />;
  } else if (!selection.ready || selection.loading) {
    body = <LoadingState label="Loading your cohorts…" />;
  } else if (selection.hasNoCohorts) {
    body = <Card padding="none"><NoCohortsState /></Card>;
  } else {
    const failure = list.error ? listFailureText(list.errorStatus, list.error) : null;
    body = (
      <>
        <Card padding="sm" className="flex items-center gap-3 flex-wrap">
          <SearchInput value={searchText} onChange={setSearchText} placeholder="Search by name or ID number" />
          <ChipGroup label="Membership" options={MEMBERSHIP_OPTIONS} value={membership} onChange={setMembership} />
          <Chip selected={atRiskOnly} onClick={() => setAtRiskOnly((value) => !value)}>
            <AlertCircle className="w-3 h-3" aria-hidden="true" /> At risk only
          </Chip>
        </Card>

        {failure ? (
          <ErrorState title={failure.title} message={failure.message} onRetry={failure.canRetry ? list.reload : undefined} />
        ) : strands.error ? (
          <ErrorState title="The learning strands could not be loaded" message={strands.error} onRetry={strands.reload} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => `${row.learner_id}-${row.cohort_id}`}
            onRowClick={(row) => navigate(learnerDetailPage(row.learner_id, row.cohort_id))}
            loading={!data || !strands.data}
            loadingLabel="Loading learners…"
            emptyMessage={emptyListMessage(hasActiveFilters(filters), selection.isAllCohorts)}
            footer={
              data && (
                <Pagination
                  page={data.page}
                  pageSize={data.page_size}
                  total={data.total}
                  onPageChange={(next) => setPaging({ filterKey, page: next })}
                  disabled={list.loading}
                  summary="range"
                />
              )
            }
          />
        )}
      </>
    );
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-learners" allowAllCohorts>
      <div className="p-6 space-y-6">
        <PageHeader
          eyebrow="Learners"
          title="Learners"
          subtitle={
            cohortsReady
              ? learnersSubtitle(data ? data.total : null, selection.cohort ? selection.cohort.name : null, selection.schoolYear)
              : undefined
          }
        />
        {body}
      </div>
    </AppLayout>
  );
}
