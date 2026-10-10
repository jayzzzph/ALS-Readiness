import { useState } from "react";
import { ClipboardList, Lock } from "lucide-react";
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
import { Button, Card, ChipGroup, DataTable, EmptyState, ErrorState, Notice, PageHeader, Pill, type DataTableColumn, type PillTone } from "./shared";

const ALL = "all";

const TYPE_TONE: Record<StrandTestType, PillTone> = { pretest: "neutral", posttest: "success" };

type TypeFilter = StrandTestType | typeof ALL;

const TYPE_OPTIONS: readonly { value: TypeFilter; label: string }[] = [
  { value: ALL, label: "All" },
  ...TEST_TYPES.map((type) => ({ value: type, label: testTypeLabel(type) })),
];

const COLUMNS: DataTableColumn<StrandTestViewerItem>[] = [
  { key: "test", header: "Test", render: (test) => <span className="text-[#1B1D26] font-medium">{test.title}</span> },
  {
    key: "strand",
    header: "Strand",
    render: (test) => (
      <div>
        <div className="text-[#1B1D26] font-medium">{test.strand_code}</div>
        <div className="text-[#4A4F5C] text-[0.9375rem]">{test.strand_name}</div>
      </div>
    ),
  },
  { key: "type", header: "Type", render: (test) => <Pill tone={TYPE_TONE[test.type] ?? "muted"}>{testTypeLabel(test.type)}</Pill> },
  { key: "items", header: "Items", render: (test) => test.item_count },
  { key: "attempts", header: "Attempts", render: (test) => test.attempt_count },
  {
    key: "status",
    header: "Status",
    render: (test) =>
      test.is_locked ? (
        <span title={LOCKED_EXPLANATION}>
          <Pill tone="warning"><Lock className="w-3 h-3" aria-hidden="true" /> {testStatusLabel(true)}</Pill>
        </span>
      ) : (
        <Pill tone="muted">{testStatusLabel(false)}</Pill>
      ),
  },
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
    body = <Card padding="none"><EmptyState icon={ClipboardList} title={emptyTestsText(filters)} /></Card>;
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
        <p className="text-[#4A4F5C] text-[0.9375rem] flex items-center gap-1.5">
          <Lock className="w-3 h-3 flex-shrink-0" aria-hidden="true" /> Locked: {LOCKED_EXPLANATION}
        </p>
      </>
    );
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-tests">
      <div className="p-6 space-y-6">
        <PageHeader eyebrow="Strand Tests" title="Strand Tests" subtitle={data ? testsSubtitle(data.total) : undefined} />
        <Notice>{TESTS_SHARED_TEXT}</Notice>

        <Card padding="sm" className="flex items-center gap-x-5 gap-y-3 flex-wrap">
          <ChipGroup label="Strand" options={strandOptions} value={strandFilter} onChange={setStrandFilter} />
          <ChipGroup label="Type" options={TYPE_OPTIONS} value={type} onChange={setType} />
          {strands.error && (
            <span className="text-[#7A1A12] text-[0.9375rem] flex items-center gap-2" role="alert">
              The strand filter could not be loaded. <Button variant="link" onClick={strands.reload}>Try again</Button>
            </span>
          )}
        </Card>

        {body}
      </div>
    </AppLayout>
  );
}
