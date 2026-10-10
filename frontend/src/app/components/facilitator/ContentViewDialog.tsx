import { useState, type FormEvent, type ReactNode } from "react";
import { Check, ExternalLink } from "lucide-react";
import { getErrorCode, getErrorMessage, getErrorStatus } from "../../../lib/api/errors";
import { getContent, updateContent } from "../../../lib/api/facilitatorContent";
import type { ContentLibraryItem, ContentUpdate, ContentVisibility } from "../../../lib/api/types";
import {
  ARCHIVE_CONTENT_TEXT,
  CONTENT_TITLE_MAX_LENGTH,
  VISIBILITY_EXPLANATION,
  VISIBILITY_OPTIONS,
  contentActions,
  contentEditPayload,
  contentErrorMessage,
  contentRestoreErrorMessage,
  evaluationPillText,
  fileUnavailableText,
  lessonContextText,
  shouldReloadLibrary,
  visibilityLabel,
} from "../../../lib/contentText";
import { isMissing, requiredError } from "../../../lib/formText";
import { formatDateTime } from "../../../lib/dates";
import { useFetch } from "../../../lib/hooks/useFetch";
import { contentTypeLabel, orDash } from "../../../lib/labels";
import { toast } from "../../../lib/toast";
import { Button, FIELD_CLASS, Field, LessonPicker, Modal, Notice, Pill } from "./shared";

interface ContentViewDialogProps {
  /** The row that was opened. Shown at once; the detail request then adds the file link and refreshes the rest. */
  item: ContentLibraryItem;
  onClose: () => void;
  /** Called after an edit, archive, or restore, and after a refusal that shows the list is stale. */
  onChanged: () => void;
  /** Opens the Curriculum page, where lessons are added. */
  onOpenCurriculum: () => void;
}

type Mode = "view" | "edit" | "confirm-archive";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[#4A4F5C] text-[0.9375rem]">{label}</dt>
      <dd className="text-[#1B1D26] text-[0.9375rem] mt-0.5">{children}</dd>
    </div>
  );
}

interface EditFormProps {
  item: ContentLibraryItem;
  saving: boolean;
  onSave: (payload: ContentUpdate) => void;
  onCancel: () => void;
  onOpenCurriculum: () => void;
}

function EditForm({ item, saving, onSave, onCancel, onOpenCurriculum }: EditFormProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [visibility, setVisibility] = useState<ContentVisibility>(item.visibility);
  const [lessonId, setLessonId] = useState<number | null>(null);
  // A blank title is pointed out once the field was left or Save was tried.
  const [titleTouched, setTitleTouched] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const payload = contentEditPayload(item, { title, description, visibility, lessonId });
  const hasChanges = Object.keys(payload).length > 0;
  const titleError = requiredError("Title", title, titleTouched || attempted);
  const canSave = hasChanges && !isMissing(title) && !saving;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (canSave) onSave(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Title" htmlFor="content-edit-title" error={titleError}>
        <input
          id="content-edit-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => setTitleTouched(true)}
          maxLength={CONTENT_TITLE_MAX_LENGTH}
          aria-required="true"
          aria-invalid={titleError !== null}
          disabled={saving}
          className={FIELD_CLASS}
        />
      </Field>

      <Field label="Description (optional)" htmlFor="content-edit-description">
        <textarea
          id="content-edit-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          disabled={saving}
          className={FIELD_CLASS}
        />
      </Field>

      <Field
        label="Lesson"
        hint={`Currently in: ${item.lesson_title} (${lessonContextText(item)}). It stays there unless you choose another lesson.`}
      >
        <LessonPicker
          lessonId={lessonId}
          onChange={setLessonId}
          initial={{ strandCode: item.strand_code, lessonId: item.lesson_id }}
          disabled={saving}
          onOpenCurriculum={onOpenCurriculum}
        />
      </Field>

      <Field label="Visibility">
        <div className="space-y-2" role="radiogroup" aria-label="Visibility">
          {VISIBILITY_OPTIONS.map((option) => (
            <label key={option} className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="content-edit-visibility"
                value={option}
                checked={visibility === option}
                onChange={() => setVisibility(option)}
                disabled={saving}
                className="mt-1 accent-[#00538A]"
              />
              <span>
                <span className="block text-[#1B1D26] text-[0.9375rem] font-medium">{visibilityLabel(option)}</span>
                <span className="block text-[#4A4F5C] text-[0.9375rem]">{VISIBILITY_EXPLANATION[option]}</span>
              </span>
            </label>
          ))}
        </div>
      </Field>

      <Notice>The file and the content type ({contentTypeLabel(item.type)}) cannot be changed. To replace the file, upload it as new content.</Notice>

      <div className="flex gap-3">
        <Button onClick={onCancel} disabled={saving} className="flex-1">Back</Button>
        <Button type="submit" variant="primary" disabled={!hasChanges || saving} className="flex-1">
          {saving ? "Saving…" : hasChanges ? "Save changes" : "No changes"}
        </Button>
      </div>
    </form>
  );
}

/**
 * One content item: its details and a link to open the file. The uploader can
 * edit it (title, description, visibility, lesson), archive it, and restore
 * it once archived; anyone else can only look.
 */
export function ContentViewDialog({ item: listItem, onClose, onChanged, onOpenCurriculum }: ContentViewDialogProps) {
  const detail = useFetch(() => getContent(listItem.id), [listItem.id], { fallbackError: "Unable to load this content." });
  // The row's own data until the detail arrives, and still if it fails.
  const item: ContentLibraryItem = detail.data ?? listItem;
  const actions = contentActions(item);

  const [mode, setMode] = useState<Mode>("view");
  const [saving, setSaving] = useState(false);

  // `restoring` picks the wording for a refusal: a not-active parent means something different on a restore.
  const save = async (payload: ContentUpdate, done: string, fallback: string, restoring = false) => {
    setSaving(true);
    try {
      await updateContent(item.id, payload);
      toast.success(done);
      onChanged();
      onClose();
    } catch (requestError) {
      const code = getErrorCode(requestError);
      const message = restoring ? contentRestoreErrorMessage : contentErrorMessage;
      toast.error(message(code, getErrorStatus(requestError), getErrorMessage(requestError, fallback)));
      // The item is gone or no longer the caller's: the list behind is stale.
      if (shouldReloadLibrary(code)) onChanged();
      setSaving(false);
    }
  };

  let body: ReactNode;
  if (mode === "edit") {
    body = (
      <EditForm
        item={item}
        saving={saving}
        onSave={(payload) => void save(payload, "Content saved.", "The content could not be saved.")}
        onCancel={() => setMode("view")}
        onOpenCurriculum={onOpenCurriculum}
      />
    );
  } else if (mode === "confirm-archive") {
    body = (
      <div className="space-y-4">
        <p className="text-[#1B1D26] text-[0.9375rem] font-semibold">Archive this content?</p>
        <p className="text-[#4A4F5C] text-[0.9375rem]">{ARCHIVE_CONTENT_TEXT}</p>
        <div className="flex gap-3">
          <Button onClick={() => setMode("view")} disabled={saving} className="flex-1">Back</Button>
          <Button
            variant="primary"
            onClick={() => void save({ status: "archived" }, "Content archived.", "The content could not be archived.")}
            disabled={saving}
            className="flex-1"
          >
            {saving ? "Archiving…" : "Archive"}
          </Button>
        </div>
      </div>
    );
  } else {
    const readUrl = detail.data?.read_url ?? null;
    const uploadedAt = formatDateTime(item.uploaded_at);
    body = (
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Pill tone="neutral">{contentTypeLabel(item.type)}</Pill>
          <Pill tone="muted">{visibilityLabel(item.visibility)}</Pill>
          {item.is_own && <Pill tone="success">Mine</Pill>}
          {item.status === "archived" && <Pill tone="warning">Archived</Pill>}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <DetailRow label="Lesson">
            {item.lesson_title}
            <span className="block text-[#4A4F5C] text-[0.9375rem]">{lessonContextText(item)}</span>
          </DetailRow>
          <DetailRow label="Uploaded by">
            {orDash(item.uploader_name)}
            <span className="block text-[#4A4F5C] text-[0.9375rem]">{uploadedAt ? `${uploadedAt} (Philippine time)` : "Date not recorded"}</span>
          </DetailRow>
          <DetailRow label="Evaluation">
            {item.evaluation === null ? (
              <Pill tone="muted">{evaluationPillText(null)}</Pill>
            ) : (
              <>
                <Pill tone="success"><Check className="w-3.5 h-3.5" aria-hidden="true" />{evaluationPillText(item.evaluation)}</Pill>
                <span className="block text-[#4A4F5C] text-[0.9375rem] mt-1">
                  Cognitive sustainability rating: {item.evaluation.cognitive_sustainability_rating}
                </span>
              </>
            )}
          </DetailRow>
          <DetailRow label="File">
            {readUrl ? (
              <a
                href={readUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#00538A] hover:text-[#004270] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A] rounded-md"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" /> Open file
              </a>
            ) : detail.loading && !detail.error ? (
              <span className="text-[#4A4F5C]">Checking the file…</span>
            ) : (
              <span className="text-[#4A4F5C]">
                {fileUnavailableText(detail.errorStatus, detail.error !== null)}{" "}
                {detail.error !== null && detail.errorStatus !== 404 && <Button variant="link" onClick={detail.reload}>Try again</Button>}
              </span>
            )}
          </DetailRow>
        </dl>

        <dl>
          <DetailRow label="Description">
            {item.description && item.description.trim() !== "" ? (
              <span className="whitespace-pre-wrap">{item.description}</span>
            ) : (
              <span className="text-[#4A4F5C]">No description</span>
            )}
          </DetailRow>
        </dl>

        {actions.readOnlyNote && <Notice>{actions.readOnlyNote}</Notice>}

        <div className="flex gap-3">
          <Button onClick={onClose} disabled={saving} className="flex-1">Close</Button>
          {actions.canArchive && <Button onClick={() => setMode("confirm-archive")} disabled={saving} className="flex-1">Archive</Button>}
          {actions.canEdit && <Button variant="primary" onClick={() => setMode("edit")} disabled={saving} className="flex-1">Edit</Button>}
          {actions.canRestore && (
            <Button
              variant="primary"
              onClick={() => void save({ status: "active" }, "Content restored.", "The content could not be restored.", true)}
              disabled={saving}
              className="flex-1"
            >
              {saving ? "Restoring…" : "Restore"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Modal
      title={mode === "edit" ? "Edit Content" : item.title}
      subtitle={mode === "edit" ? item.title : undefined}
      onClose={onClose}
      busy={saving}
      size="lg"
    >
      {body}
    </Modal>
  );
}
