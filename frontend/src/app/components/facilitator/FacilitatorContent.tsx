import { useEffect, useState, type ComponentType } from "react";
import { Archive, BookOpen, Headphones, Upload, User, Video } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { getContents } from "../../../lib/api/facilitatorContent";
import type { ContentEvaluationSummary, ContentLibraryItem, ContentType } from "../../../lib/api/types";
import {
  CONTENT_TYPES,
  EVALUATION_UNAVAILABLE_HINT,
  buildContentQuery,
  contentFilterKey,
  emptyLibraryKind,
  emptyLibraryText,
  evaluationPillText,
  lessonContextText,
  libraryFailureText,
  librarySubtitle,
  stimulusLevelLabel,
  visibilityLabel,
} from "../../../lib/contentText";
import { useDebouncedValue } from "../../../lib/hooks/useDebouncedValue";
import { useFetch } from "../../../lib/hooks/useFetch";
import { contentTypeLabel } from "../../../lib/labels";
import { ContentUploadDialog } from "./ContentUploadDialog";
import { ContentViewDialog } from "./ContentViewDialog";
import {
  Button,
  Card,
  Chip,
  ChipGroup,
  DataTable,
  EmptyState,
  ErrorState,
  HeaderButton,
  PageHeader,
  Pagination,
  LevelMeter,
  SearchInput,
  FilterBar,
  FilterDivider,
  type DataTableColumn,
} from "./shared";
import { MUTED, PAGE_BODY } from "./shared/tokens";

const CURRICULUM_PAGE = "facilitator-learning-contents";

// Each kind of content gets its icon; the label beside it carries the meaning.
const TYPE_ICON: Record<ContentType, ComponentType<{ className?: string }>> = {
  video: Video,
  audio: Headphones,
  reading: BookOpen,
};
type TypeFilter = ContentType | "all";

const TYPE_OPTIONS: readonly { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...CONTENT_TYPES.map((type) => ({ value: type, label: contentTypeLabel(type) })),
];

/** The title, with who owns it and who can see it as one quiet line under it instead of pills. */
function TitleCell({ item }: { item: ContentLibraryItem }) {
  const owner = item.is_own ? "Mine" : item.uploader_name ? `Uploaded by ${item.uploader_name}` : null;
  return (
    <div className="min-w-0">
      <div className="text-[#1B1D26] font-bold">{item.title}</div>
      <div className={`${MUTED} mt-0.5`}>{[owner, visibilityLabel(item.visibility)].filter(Boolean).join(" · ")}</div>
    </div>
  );
}

function TypeCell({ type }: { type: ContentType }) {
  const Icon = TYPE_ICON[type] ?? TYPE_ICON.reading;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[#4A4F5C]">
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      {contentTypeLabel(type)}
    </span>
  );
}

/**
 * The stimulus level on a neutral three-step meter with its word: a low level
 * is not a problem, so it is not red. "Not evaluated" is a quiet line.
 */
function EvaluationCell({ evaluation }: { evaluation: ContentEvaluationSummary | null }) {
  if (evaluation === null) return <span className={MUTED}>{evaluationPillText(null)}</span>;
  return <LevelMeter level={evaluation.stimulus_level} label={stimulusLevelLabel(evaluation.stimulus_level)} srPrefix="Evaluated ·" />;
}

export function FacilitatorContent({ navigate, user, onLogout }: PageProps) {
  const [searchText, setSearchText] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [archived, setArchived] = useState(false);
  const search = useDebouncedValue(searchText, 300);

  const filters = { search, type, mineOnly, archived };
  const filterKey = contentFilterKey(filters);

  // The page is remembered together with the filters it belongs to, so any
  // change of control lands on page 1 without a second request.
  const [paging, setPaging] = useState({ filterKey, page: 1 });
  const page = paging.filterKey === filterKey ? paging.page : 1;

  // Keyed on every input: a slow response for earlier inputs is dropped by the hook.
  const list = useFetch(
    () => getContents(buildContentQuery({ ...filters, page })),
    [filterKey, page],
    { fallbackError: "Unable to load the content library." },
  );
  const data = list.data;
  const rows = data?.items ?? [];

  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<ContentLibraryItem | null>(null);

  // Archiving or restoring the last row of the last page leaves that page empty: step back one.
  const pageIsPastTheEnd = data !== null && data.items.length === 0 && data.total > 0 && page > 1;
  useEffect(() => {
    if (pageIsPastTheEnd) setPaging({ filterKey, page: page - 1 });
  }, [pageIsPastTheEnd, filterKey, page]);

  // A new item is active and the caller's own, so with the filters cleared it is on page 1.
  const showNewUpload = () => {
    setSearchText("");
    setType("all");
    setMineOnly(false);
    setArchived(false);
    setPaging({ filterKey, page: 1 });
    list.reload();
  };

  const columns: DataTableColumn<ContentLibraryItem>[] = [
    { key: "title", header: "Title", render: (item) => <TitleCell item={item} /> },
    { key: "type", header: "Type", render: (item) => <TypeCell type={item.type} /> },
    {
      key: "lesson",
      header: "Lesson",
      render: (item) => (
        <div className="min-w-0">
          <div className="text-[#1B1D26]">{item.lesson_title}</div>
          <div className={MUTED}>{lessonContextText(item)}</div>
        </div>
      ),
    },
    { key: "evaluation", header: "Evaluation", render: (item) => <EvaluationCell evaluation={item.evaluation} /> },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        // The row itself opens View; clicks on the buttons must not open it twice.
        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => setViewing(item)}>View</Button>
          {/* Evaluation is not available yet; the disabled button is only shown where there is something to evaluate. */}
          {item.evaluation === null && (
            <span title={EVALUATION_UNAVAILABLE_HINT}>
              <Button variant="outline" size="sm" disabled>
                Evaluate<span className="sr-only">: {EVALUATION_UNAVAILABLE_HINT}</span>
              </Button>
            </span>
          )}
        </div>
      ),
    },
  ];

  const emptyKind = emptyLibraryKind(filters);

  let body;
  if (list.error) {
    const failure = libraryFailureText(list.errorStatus, list.error);
    body = <ErrorState title={failure.title} message={failure.message} onRetry={failure.canRetry ? list.reload : undefined} />;
  } else if (data && data.total === 0 && emptyKind === "library") {
    body = (
      <Card padding="none">
        <EmptyState
          icon={BookOpen}
          title={emptyLibraryText(emptyKind)}
          description="Upload a video, an audio file, or a reading, then assign it to a cohort from Learning Contents."
          action={<Button variant="accent" onClick={() => setUploading(true)}><Upload className="w-3.5 h-3.5" /> Upload Content</Button>}
        />
      </Card>
    );
  } else {
    body = (
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(item) => item.id}
        onRowClick={setViewing}
        loading={!data}
        loadingLabel="Loading content…"
        emptyMessage={emptyLibraryText(emptyKind)}
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
    );
  }

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="facilitator-content">
      {uploading && (
        <ContentUploadDialog
          onClose={() => setUploading(false)}
          onUploaded={showNewUpload}
          onOpenCurriculum={() => navigate(CURRICULUM_PAGE)}
        />
      )}
      {viewing && (
        <ContentViewDialog
          item={viewing}
          onClose={() => setViewing(null)}
          onChanged={list.reload}
          onOpenCurriculum={() => navigate(CURRICULUM_PAGE)}
        />
      )}

      <div className={PAGE_BODY}>
        <PageHeader
          title="Content Library"
          subtitle={data ? librarySubtitle(data.counts) : undefined}
          action={
            <HeaderButton onClick={() => setUploading(true)}>
              <Upload className="w-4 h-4" aria-hidden="true" /> Upload Content
            </HeaderButton>
          }
        />

        {/* One bar, one line at 1280px: search, then type, then the two toggles, split by quiet rules. */}
        <FilterBar label="Filter content">
          <SearchInput value={searchText} onChange={setSearchText} placeholder="Search by title" />
          <FilterDivider />
          <ChipGroup label="Type" options={TYPE_OPTIONS} value={type} onChange={setType} />
          <FilterDivider />
          <div className="flex items-center gap-2">
            <Chip selected={mineOnly} onClick={() => setMineOnly((value) => !value)}>
              <User className="w-4 h-4" aria-hidden="true" /> Mine only
            </Chip>
            <Chip selected={archived} onClick={() => setArchived((value) => !value)}>
              <Archive className="w-4 h-4" aria-hidden="true" /> Archived
            </Chip>
          </div>
        </FilterBar>

        {body}
      </div>
    </AppLayout>
  );
}
