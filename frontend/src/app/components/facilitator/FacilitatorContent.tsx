import { useEffect, useState, type ComponentType } from "react";
import { Archive, BookOpen, Headphones, Upload, User, Video } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import type { PageProps } from "../../routes/ProtectedPage";
import { getContents } from "../../../lib/api/facilitatorContent";
import type { ContentLibraryItem, ContentType } from "../../../lib/api/types";
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
  Pill,
  SearchInput,
  type DataTableColumn,
} from "./shared";

const CURRICULUM_PAGE = "facilitator-curriculum";

// The icon and colours the mockup's cards gave each kind of content.
const TYPE_ICON: Record<ContentType, { Icon: ComponentType<{ className?: string }>; background: string; colour: string }> = {
  video: { Icon: Video, background: "bg-purple-50", colour: "text-purple-500" },
  audio: { Icon: Headphones, background: "bg-blue-50", colour: "text-blue-500" },
  reading: { Icon: BookOpen, background: "bg-green-50", colour: "text-green-500" },
};

type TypeFilter = ContentType | "all";

const TYPE_OPTIONS: readonly { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...CONTENT_TYPES.map((type) => ({ value: type, label: contentTypeLabel(type) })),
];

function TitleCell({ item }: { item: ContentLibraryItem }) {
  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-gray-800 text-sm font-medium">{item.title}</span>
        {item.is_own && <Pill tone="success">Mine</Pill>}
        <Pill tone="muted">{visibilityLabel(item.visibility)}</Pill>
      </div>
      {!item.is_own && item.uploader_name && <div className="text-gray-400 text-xs mt-0.5">Uploaded by {item.uploader_name}</div>}
    </div>
  );
}

function TypeCell({ type }: { type: ContentType }) {
  const { Icon, background, colour } = TYPE_ICON[type] ?? TYPE_ICON.reading;
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${background}`}>
        <Icon className={`w-3.5 h-3.5 ${colour}`} />
      </span>
      <span className="text-gray-600">{contentTypeLabel(type)}</span>
    </div>
  );
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
        <div>
          <div className="text-gray-700">{item.lesson_title}</div>
          <div className="text-gray-400 text-xs">{lessonContextText(item)}</div>
        </div>
      ),
    },
    {
      key: "evaluation",
      header: "Evaluation",
      render: (item) => <Pill tone={item.evaluation === null ? "muted" : "success"}>{evaluationPillText(item.evaluation)}</Pill>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        // The row itself opens View; clicks on the buttons must not open it twice.
        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => setViewing(item)}>View</Button>
          <span title={EVALUATION_UNAVAILABLE_HINT}>
            <Button variant="outline" size="sm" disabled>
              Evaluate<span className="sr-only">: {EVALUATION_UNAVAILABLE_HINT}</span>
            </Button>
          </span>
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
          description="Upload a video, an audio file, or a reading, then assign it to a cohort from Curriculum."
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

      <div className="p-5 space-y-5">
        <PageHeader
          eyebrow="Content Management"
          title="Content Library"
          subtitle={data ? librarySubtitle(data.counts) : undefined}
          action={
            <HeaderButton onClick={() => setUploading(true)}>
              <Upload className="w-4 h-4" /> Upload Content
            </HeaderButton>
          }
        />

        <Card padding="sm" className="flex items-center gap-3 flex-wrap">
          <SearchInput value={searchText} onChange={setSearchText} placeholder="Search by title" />
          <ChipGroup label="Type" options={TYPE_OPTIONS} value={type} onChange={setType} />
          <Chip selected={mineOnly} onClick={() => setMineOnly((value) => !value)}>
            <User className="w-3 h-3" aria-hidden="true" /> Mine only
          </Chip>
          <Chip selected={archived} onClick={() => setArchived((value) => !value)}>
            <Archive className="w-3 h-3" aria-hidden="true" /> Archived
          </Chip>
        </Card>

        {body}
      </div>
    </AppLayout>
  );
}
