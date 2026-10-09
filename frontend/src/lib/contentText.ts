import type { ListContentsParams } from "./api/facilitatorContent";
import type {
  ContentEvaluationSummary,
  ContentLibraryCounts,
  ContentLibraryItem,
  ContentType,
  ContentUpdate,
  ContentVisibility,
  StimulusLevel,
} from "./api/types";

// Wording and decisions for the Content Library page and its upload and view
// dialogs. Pure functions only: no React, no API calls.

export const CONTENT_PAGE_SIZE = 20;

/** The longest title the API accepts. */
export const CONTENT_TITLE_MAX_LENGTH = 255;

// ── Allowed files ────────────────────────────────────────────────────────────

/**
 * The file extensions the backend accepts, and the content type each becomes.
 * Mirrors ContentService.ALLOWED_EXTENSIONS and ContentService._derive_content_type
 * in backend/app/services/content.py. Used for the file picker's accept list
 * and a friendly check before uploading; the server remains the authority.
 */
export const ALLOWED_CONTENT_EXTENSIONS: Record<ContentType, readonly string[]> = {
  video: ["mp4", "mov", "webm"],
  audio: ["mp3", "wav", "m4a"],
  reading: ["pdf", "txt", "docx"],
};

/** Every content type, in the order the type filter lists them. */
export const CONTENT_TYPES = Object.keys(ALLOWED_CONTENT_EXTENSIONS) as ContentType[];

const ALL_EXTENSIONS = CONTENT_TYPES.flatMap((type) => ALLOWED_CONTENT_EXTENSIONS[type]);

/** The `accept` value for the file input: ".mp4,.mov,...". */
export const CONTENT_FILE_ACCEPT = ALL_EXTENSIONS.map((extension) => `.${extension}`).join(",");

/** "MP4, MOV, WEBM, MP3, ..." for the drop zone's hint and the refusal message. */
export const ALLOWED_EXTENSIONS_TEXT = ALL_EXTENSIONS.map((extension) => extension.toUpperCase()).join(", ");

/** The part after the last dot, lower-cased, as the backend reads it; null when the name has no dot. */
export function fileExtension(fileName: string): string | null {
  if (!fileName.includes(".")) return null;
  return fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
}

export type FileCheck = { ok: true; type: ContentType } | { ok: false; message: string };

/** Whether the backend would accept a file with this name, and the content type it would get. */
export function checkContentFile(fileName: string): FileCheck {
  const extension = fileExtension(fileName);
  if (extension === null || extension === "") {
    return { ok: false, message: `This file has no extension, so its type cannot be told. Allowed types: ${ALLOWED_EXTENSIONS_TEXT}.` };
  }
  const type = CONTENT_TYPES.find((candidate) => ALLOWED_CONTENT_EXTENSIONS[candidate].includes(extension));
  if (type === undefined) {
    return { ok: false, message: `.${extension} files are not supported. Allowed types: ${ALLOWED_EXTENSIONS_TEXT}.` };
  }
  return { ok: true, type };
}

/** The title pre-filled from a file name: the name without its last extension, trimmed, and cut to the longest title allowed. */
export function titleFromFileName(fileName: string): string {
  const name = fileName.trim();
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : dot === 0 ? "" : name;
  return base.trim().slice(0, CONTENT_TITLE_MAX_LENGTH);
}

/** "0 B", "512 B", "1.5 KB", "142 MB", "1.2 GB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const rounded = unit === 0 || value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unit]}`;
}

// ── List: header, query, empty states ────────────────────────────────────────

/** "42 items · 15 evaluated · 27 not yet evaluated"; "1 item" for one. */
export function librarySubtitle(counts: ContentLibraryCounts): string {
  return `${counts.total} ${counts.total === 1 ? "item" : "items"} · ${counts.evaluated} evaluated · ${counts.not_evaluated} not yet evaluated`;
}

export interface ContentListControls {
  /** As typed (already debounced by the page). */
  search: string;
  /** A content type, or "all". */
  type: ContentType | "all";
  mineOnly: boolean;
  archived: boolean;
  page: number;
}

/** The query for GET /api/facilitator/contents. Filters that are off are left out, not sent blank. */
export function buildContentQuery(controls: ContentListControls): ListContentsParams {
  const params: ListContentsParams = { page: controls.page, page_size: CONTENT_PAGE_SIZE };
  if (controls.type !== "all") params.type = controls.type;
  if (controls.mineOnly) params.mine = true;
  if (controls.archived) params.status = "archived";
  const search = controls.search.trim();
  if (search) params.search = search;
  return params;
}

/** Everything that, when it changes, sends the list back to page 1. */
export function contentFilterKey(controls: Omit<ContentListControls, "page">): string {
  return JSON.stringify([controls.search.trim(), controls.type, controls.mineOnly, controls.archived]);
}

export type EmptyLibraryKind = "library" | "filtered" | "archived" | "archived-filtered";

/**
 * Which empty state applies: nothing in the library at all, nothing matching
 * the search or filters, or no archived items (with or without a filter).
 */
export function emptyLibraryKind(controls: Omit<ContentListControls, "page">): EmptyLibraryKind {
  const filtered = controls.search.trim() !== "" || controls.type !== "all";
  if (controls.archived) return filtered ? "archived-filtered" : "archived";
  return filtered || controls.mineOnly ? "filtered" : "library";
}

/** The line for each empty state. The archived list only ever holds the caller's own items. */
export function emptyLibraryText(kind: EmptyLibraryKind): string {
  if (kind === "library") return "No content yet";
  if (kind === "filtered") return "No content matches your search or filters.";
  if (kind === "archived") return "You have no archived content. Only content you uploaded and archived is listed here.";
  return "None of your archived content matches your search or filters. Only content you uploaded and archived is listed here.";
}

// ── Labels ───────────────────────────────────────────────────────────────────

const STIMULUS_LEVEL_LABEL: Record<StimulusLevel, string> = { low: "Low", medium: "Medium", high: "High" };

export function stimulusLevelLabel(level: StimulusLevel): string {
  return STIMULUS_LEVEL_LABEL[level] ?? level;
}

/** The evaluation pill: "Evaluated · High", or "Not evaluated" when there is none (FD8). */
export function evaluationPillText(evaluation: ContentEvaluationSummary | null): string {
  return evaluation === null ? "Not evaluated" : `Evaluated · ${stimulusLevelLabel(evaluation.stimulus_level)}`;
}

/** Shown on the disabled Evaluate button (FD9). */
export const EVALUATION_UNAVAILABLE_HINT = "Evaluation is not available yet";

const VISIBILITY_LABEL: Record<ContentVisibility, string> = { private: "Private", public: "Public" };

export function visibilityLabel(visibility: ContentVisibility): string {
  return VISIBILITY_LABEL[visibility] ?? visibility;
}

/**
 * Who can see an item of each visibility. Follows ContentAccess in
 * backend/app/services/facilitator_scope.py: the uploader and public content
 * are visible and assignable; anything assigned to a cohort is also visible,
 * but not assignable, to that cohort's other facilitators.
 */
export const VISIBILITY_EXPLANATION: Record<ContentVisibility, string> = {
  private:
    "Only you see it in the library and can assign it. Once you assign it to a cohort, that cohort's other facilitators can see it too, but they cannot assign it to other cohorts.",
  public: "Every facilitator sees it in the library and can assign it to their own cohorts. Only you can edit or archive it.",
};

/** The visibility options, in the order the form lists them: the default first. */
export const VISIBILITY_OPTIONS: readonly ContentVisibility[] = ["private", "public"];

/** "LS-CODE · Module title", the line beneath a lesson title. */
export function lessonContextText(item: Pick<ContentLibraryItem, "strand_code" | "module_title">): string {
  return `${item.strand_code} · ${item.module_title}`;
}

// ── View dialog: what the caller may do ──────────────────────────────────────

export interface ContentActions {
  canEdit: boolean;
  canArchive: boolean;
  canRestore: boolean;
  /** Shown in place of the buttons when the caller did not upload the item. */
  readOnlyNote: string | null;
}

/**
 * Only the uploader can change an item: Edit and Archive while it is active,
 * Restore once it is archived. Anyone else gets a line saying why not.
 */
export function contentActions(item: Pick<ContentLibraryItem, "is_own" | "status">): ContentActions {
  if (!item.is_own) {
    return { canEdit: false, canArchive: false, canRestore: false, readOnlyNote: "Only the uploader can change this item." };
  }
  if (item.status === "archived") return { canEdit: false, canArchive: false, canRestore: true, readOnlyNote: null };
  if (item.status === "active") return { canEdit: true, canArchive: true, canRestore: false, readOnlyNote: null };
  return { canEdit: false, canArchive: false, canRestore: false, readOnlyNote: null };
}

/** What archiving does. The item is not deleted and its cohort assignments are kept. */
export const ARCHIVE_CONTENT_TEXT =
  "It will leave the library's default list and the curriculum, so it can no longer be assigned and learners will no longer see it. Its cohort assignments are kept, and nothing is deleted. You can restore it from the Archived filter.";

// ── Edit: only what changed ──────────────────────────────────────────────────

export interface ContentEditForm {
  title: string;
  description: string;
  visibility: ContentVisibility;
  /** The lesson chosen in the pickers; null when none is chosen, which keeps the current lesson. */
  lessonId: number | null;
}

/**
 * The PATCH body for an edit: only the fields that differ from the item, with
 * the title and description trimmed and a blank description sent as null.
 * An empty object means there is nothing to save.
 */
export function contentEditPayload(
  item: Pick<ContentLibraryItem, "title" | "description" | "visibility" | "lesson_id">,
  form: ContentEditForm,
): ContentUpdate {
  const payload: ContentUpdate = {};

  const title = form.title.trim();
  if (title !== item.title.trim()) payload.title = title;

  const description = form.description.trim() === "" ? null : form.description.trim();
  const currentDescription = item.description === null || item.description.trim() === "" ? null : item.description.trim();
  if (description !== currentDescription) payload.description = description;

  if (form.visibility !== item.visibility) payload.visibility = form.visibility;
  if (form.lessonId !== null && form.lessonId !== item.lesson_id) payload.lesson_id = form.lessonId;

  return payload;
}

// ── Upload flow ──────────────────────────────────────────────────────────────

export type UploadPhase = "form" | "requesting" | "uploading" | "saving";

export const UPLOAD_STEPS: readonly { phase: Exclude<UploadPhase, "form">; label: string }[] = [
  { phase: "requesting", label: "Prepare" },
  { phase: "uploading", label: "Upload file" },
  { phase: "saving", label: "Save details" },
];

/**
 * The step to highlight (0-based), and how many are already done. Before the
 * run starts nothing is active; once the file is in storage the first two
 * steps stay done, so a retry shows only "Save details" left.
 */
export function uploadStepState(phase: UploadPhase, fileUploaded: boolean): { active: number | null; done: number } {
  if (phase === "requesting") return { active: 0, done: 0 };
  if (phase === "uploading") return { active: 1, done: 1 };
  if (phase === "saving") return { active: 2, done: 2 };
  return { active: null, done: fileUploaded ? 2 : 0 };
}

// ── Failures ─────────────────────────────────────────────────────────────────

/** The backend `code` values the Content Library gives its own wording. */
export const ContentErrorCode = {
  /** 400 - the file name or file key has a missing or unsupported extension. */
  INVALID_CONTENT_FILE: "INVALID_CONTENT_FILE",
  /** 503 - file storage is not configured, or cannot be reached. */
  STORAGE_UNAVAILABLE: "STORAGE_UNAVAILABLE",
  /** 404 - no file exists in storage at the file key, or the key is outside the upload folder. */
  CONTENT_FILE_NOT_FOUND: "CONTENT_FILE_NOT_FOUND",
  /** 409 - another content item already uses this file key. */
  CONTENT_FILE_KEY_ALREADY_USED: "CONTENT_FILE_KEY_ALREADY_USED",
  /** 409 - the lesson's strand is archived. */
  STRAND_NOT_ACTIVE: "STRAND_NOT_ACTIVE",
  /** 409 - the lesson is archived. */
  LESSON_NOT_ACTIVE: "LESSON_NOT_ACTIVE",
  /** 409 - the lesson's module is archived. */
  MODULE_NOT_ACTIVE: "MODULE_NOT_ACTIVE",
  /** 404 - no such lesson. */
  LESSON_NOT_FOUND: "LESSON_NOT_FOUND",
  /** 404 - missing, deleted, hidden from the caller, or someone else's archived item. */
  CONTENT_NOT_FOUND: "CONTENT_NOT_FOUND",
  /** 403 - the caller can see the item but did not upload it. */
  CONTENT_EDIT_DENIED: "CONTENT_EDIT_DENIED",
  /** 404 - the signed-in user has no facilitator profile. */
  FACILITATOR_NOT_FOUND: "FACILITATOR_NOT_FOUND",
  /** 422 - a field failed validation; the first detail is the message. */
  REQUEST_VALIDATION: "REQUEST_VALIDATION",
} as const;

const ERROR_MESSAGE: Record<string, string> = {
  INVALID_CONTENT_FILE: `This file type is not supported. Allowed types: ${ALLOWED_EXTENSIONS_TEXT}.`,
  STORAGE_UNAVAILABLE: "File storage is not set up on this server, or cannot be reached. Please contact the administrator.",
  CONTENT_FILE_NOT_FOUND: "The uploaded file was not found in storage. Please upload the file again.",
  CONTENT_FILE_KEY_ALREADY_USED: "The uploaded file is already attached to another content item. Please upload the file again.",
  LESSON_NOT_ACTIVE: "This lesson has been archived, so content cannot be placed in it. Choose another lesson.",
  MODULE_NOT_ACTIVE: "This lesson's module has been archived, so content cannot be placed in it. Choose another lesson.",
  STRAND_NOT_ACTIVE: "This lesson's learning strand has been archived, so content cannot be placed in it. Choose a lesson in another strand.",
  LESSON_NOT_FOUND: "This lesson no longer exists. Choose another lesson.",
  CONTENT_NOT_FOUND: "This content is no longer available. It may have been archived, or made private by its owner.",
  CONTENT_EDIT_DENIED: "Only the uploader can change this item.",
  FACILITATOR_NOT_FOUND: "Your account has no facilitator profile, so it cannot upload content. Please contact the administrator.",
};

/** Where an archived module or lesson is brought back. */
const RESTORE_WHERE = "This is done on the Curriculum page, with Show archived turned on.";

const RESTORE_ERROR_MESSAGE: Record<string, string> = {
  LESSON_NOT_ACTIVE: `This item's lesson is archived, so it cannot be restored yet. Restore the lesson first. ${RESTORE_WHERE}`,
  MODULE_NOT_ACTIVE: `This item's module is archived, so it cannot be restored yet. Restore the module first. ${RESTORE_WHERE}`,
  STRAND_NOT_ACTIVE:
    "This item's learning strand is archived, so it cannot be restored yet. The strand must be restored first: please ask the administrator.",
};

/**
 * The toast for a refused restore of an archived item. The three not-active
 * codes mean something different here than on an upload or a move: a parent
 * has to be restored before the item can be, and the message says which.
 */
export function contentRestoreErrorMessage(code: string | undefined, httpStatus: number | null, serverMessage: string): string {
  if (code !== undefined && Object.prototype.hasOwnProperty.call(RESTORE_ERROR_MESSAGE, code)) return RESTORE_ERROR_MESSAGE[code];
  return contentErrorMessage(code, httpStatus, serverMessage);
}

/**
 * The toast for a refused request to our API: our wording for the codes above,
 * a distinct line when the server did not answer at all, and otherwise the
 * server's own message (for a 422 that is the first validation detail).
 */
export function contentErrorMessage(code: string | undefined, httpStatus: number | null, serverMessage: string): string {
  if (code !== undefined && Object.prototype.hasOwnProperty.call(ERROR_MESSAGE, code)) return ERROR_MESSAGE[code];
  if (httpStatus === null) return "The server could not be reached. Check your connection and try again.";
  return serverMessage;
}

/**
 * The message when the PUT to file storage itself fails. No response at all
 * means the browser could not complete the request (the network, or the
 * storage bucket not allowing uploads from this site) - not a server error.
 */
export function storageUploadFailureMessage(httpStatus: number | null): string {
  if (httpStatus === null) {
    return "The file could not reach file storage. Check your connection and try again. If it keeps failing, the storage may not allow uploads from this site: please contact the administrator.";
  }
  if (httpStatus === 403) return "File storage refused the upload. The upload link may have expired; please try again.";
  return `File storage refused the upload (error ${httpStatus}). Please try again, or contact the administrator.`;
}

/**
 * After a failed "save details" step: whether the file already in storage can
 * be reused for the retry. Not when the server says the file is missing or of
 * an unsupported type - then it has to be chosen and uploaded again.
 */
export function keepsUploadedFile(code: string | undefined): boolean {
  return (
    code !== ContentErrorCode.CONTENT_FILE_NOT_FOUND &&
    code !== ContentErrorCode.INVALID_CONTENT_FILE &&
    code !== ContentErrorCode.CONTENT_FILE_KEY_ALREADY_USED
  );
}

/** Whether the lesson pickers hold a lesson that can no longer be used, and should be reloaded. */
export function isLessonUnusable(code: string | undefined): boolean {
  return (
    code === ContentErrorCode.LESSON_NOT_ACTIVE ||
    code === ContentErrorCode.MODULE_NOT_ACTIVE ||
    code === ContentErrorCode.STRAND_NOT_ACTIVE ||
    code === ContentErrorCode.LESSON_NOT_FOUND
  );
}

/** Whether the list behind a dialog is stale after a refused edit, archive, or restore: the item is gone or no longer the caller's. */
export function shouldReloadLibrary(code: string | undefined): boolean {
  return code === ContentErrorCode.CONTENT_NOT_FOUND || code === ContentErrorCode.CONTENT_EDIT_DENIED;
}

export interface LoadFailureText {
  title: string;
  message: string;
  canRetry: boolean;
}

/** A failed list load: a 403 is an access message, not a retryable error (FD13). */
export function libraryFailureText(httpStatus: number | null, message: string): LoadFailureText {
  if (httpStatus === 403) {
    return {
      title: "You do not have access to the content library",
      message: "The content library is for facilitators. If you should have access, please contact the administrator.",
      canRetry: false,
    };
  }
  return { title: "The content could not be loaded", message, canRetry: true };
}

/**
 * Why "Open file" has no link. The detail request fails as a whole when
 * storage cannot be reached (503), and returns a null read_url when storage is
 * not configured; a 404 means the item itself is gone.
 */
export function fileUnavailableText(detailStatus: number | null, detailFailed: boolean): string {
  if (detailFailed && detailStatus === 404) return "This content is no longer available.";
  if (detailFailed && detailStatus === 503) return "File is not available: file storage cannot be reached.";
  if (detailFailed) return "File is not available: its details could not be loaded from the server.";
  return "File is not available";
}
