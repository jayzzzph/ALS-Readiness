import { useState } from "react";
import { Lock } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { getStrands } from "../../../lib/api/facilitatorCurriculum";
import { getStrandTests } from "../../../lib/api/facilitatorTests";
import type { StrandTestType, StrandTestViewerItem } from "../../../lib/api/types";
import { useFetch } from "../../../lib/hooks/useFetch";
import { strandTestDetailPage } from "../../../lib/navigation";
import {
  LOCKED_EXPLANATION,
  TESTS_SHARED_TEXT,
  TEST_TYPES,
  buildTestsQuery,
  emptyTestsText,
  testStatusLabel,
  testTypeLabel,
  testsFailureText,
  testsSubtitle,
} from "../../../lib/testsText";
import { Button, ChipGroup, DataTable, ErrorState, FilterBar, FilterDivider, PageHeader, StatusText, type DataTableColumn } from "./shared";
import { MUTED, PAGE_BODY } from "./shared/tokens";

const ALL = "all";

type TypeFilter = StrandTestType | typeof ALL;

/**
 * Locked or not, on the shared status vocabulary: Locked with its lock icon and
 * its explanation on hover; "No attempts yet" as the quiet not-started status.
 */
export function TestStatusText({ isLocked }: { isLocked: boolean }) {
  return isLocked ? (
    <StatusText tone="locked" title={LOCKED_EXPLANATION}>{testStatusLabel(true)}</StatusText>
  ) : (
    <StatusText tone="pending">{testStatusLabel(false)}</StatusText>
  );
}

const TYPE_OPTIONS: readonly { value: TypeFilter; label: string }[] = [
  { value: ALL, label: "All" },
  ...TEST_TYPES.map((type) => ({ value: type, label: testTypeLabel(type) })),
];

const COLUMNS: DataTableColumn<StrandTestViewerItem>[] = [
  { key: "test", header: "Test", render: (test) => <span className="text-[#1B1D26] font-bold whitespace-nowrap">{test.title}</span> },
  {
    key: "strand",
    header: "Strand",
    render: (test) => (
      <div className="min-w-0">
        <div className="text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-[#4D35BD]">{test.strand_code}</div>
        <div className="text-[#1B1D26]">{test.strand_name}</div>
      </div>
    ),
  },
  // Plain words: a coloured pill here read as a status (blue means done elsewhere).
  { key: "type", header: "Type", className: "whitespace-nowrap", render: (test) => testTypeLabel(test.type) },
  { key: "items", header: "Items", align: "right", render: (test) => <span className="font-bold tabular-nums">{test.item_count}</span> },
  { key: "attempts", header: "Attempts", align: "right", render: (test) => <span className="font-bold tabular-nums">{test.attempt_count}</span> },
  { key: "status", header: "Status", render: (test) => <TestStatusText isLocked={test.is_locked} /> },
];

export function FacilitatorTests({ navigate, user, onLogout }: PageProps) {
  // Tests are global, so this page reads neither the cohort nor the school year.
  // The filters live in this component only: nothing here is kept in storage.
  const [strandFilter, setStrandFilter] = useState<string>(ALL);
  const [type, setType] = useState<TypeFilter>(ALL);
  const filters = { strandId: strandFilter === ALL ? null : Number(strandFilter), type };

  const strands = useFetch(getStrands, [], { fallbackError: "Unable to load the learning strands." });
  const strandOptions = [
    { value: ALL, label: "All" },
    ...(strands.data?.items ?? []).map((strand) => ({ value: String(strand.id), label: strand.code })),
  ];

  // Keyed on both filters: a slow response for earlier ones is dropped by the hook.
  const tests = useFetch(() => getStrandTests(buildTestsQuery(filters)), [filters.strandId, type], {
    fallbackError: "Unable to load the strand tests.",
  });
  const data = tests.data;

  const filtered = filters.strandId !== null || type !== ALL;

  let body;
  if (tests.error) {
    const failure = testsFailureText(tests.errorStatus, tests.error);
    body = <ErrorState title={failure.title} message={failure.message} onRetry={failure.canRetry ? tests.reload : undefined} />;
  } else if (data && data.items.length === 0 && !filtered) {
    body = <p className={MUTED}>{emptyTestsText(filters)}</p>;
  } else {
    body = (
      <>
        <DataTable
          columns={COLUMNS}
          rows={data?.items ?? []}
          rowKey={(test) => test.id}
          onRowClick={(test) => navigate(strandTestDetailPage(test.id))}
          loading={!data}
          loadingLabel="Loading strand tests…"
          emptyMessage={emptyTestsText(filters)}
        />
        <p className={`${MUTED} flex items-center gap-2`}>
          <Lock className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> Locked: {LOCKED_EXPLANATION}
        </p>
      </>
    );
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-tests">
      <div className={PAGE_BODY}>
        <PageHeader
          title="Strand Tests"
          subtitle={data ? testsSubtitle(data.total) : undefined}
          // That the tests are shared and view only is context, not an alert: the quiet note line.
          note={TESTS_SHARED_TEXT}
        />

        <FilterBar label="Filter strand tests">
          <ChipGroup label="Strand" options={strandOptions} value={strandFilter} onChange={setStrandFilter} />
          <FilterDivider />
          <ChipGroup label="Type" options={TYPE_OPTIONS} value={type} onChange={setType} />
          {strands.error && (
            <span className="text-[#7A1A12] text-[0.9375rem] flex items-center gap-2" role="alert">
              The strand filter could not be loaded. <Button variant="link" onClick={strands.reload}>Try again</Button>
            </span>
          )}
        </FilterBar>

        {body}
      </div>
    </AppLayout>
  );
}
