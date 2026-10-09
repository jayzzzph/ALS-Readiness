import type { CohortStatus, StrandItem, StructureStatus } from "./api/types";
import { cohortStatusLabel } from "./labels";

// Wording and decisions for the Curriculum page and its assign picker.
// Pure functions only: no React, no API calls.

// ── Strand tabs ──────────────────────────────────────────────────────────────

/** The tab to show: the remembered strand if the API still lists it, else the first one, else none. */
export function pickStrandId(strands: readonly Pick<StrandItem, "id">[], rememberedId: number | null): number | null {
  if (rememberedId !== null && strands.some((strand) => strand.id === rememberedId)) return rememberedId;
  return strands.length > 0 ? strands[0].id : null;
}

/** The strand's code and name, joined: "CODE · Name". */
export function strandTabLabel(strand: Pick<StrandItem, "code" | "name">): string {
  return `${strand.code} · ${strand.name}`;
}

// ── Reordering ───────────────────────────────────────────────────────────────

export type MoveDirection = "up" | "down";

/** Whether the item can move that way: not up from the first place, not down from the last. */
export function canMove(ids: readonly number[], id: number, direction: MoveDirection): boolean {
  const index = ids.indexOf(id);
  if (index === -1) return false;
  return direction === "up" ? index > 0 : index < ids.length - 1;
}

/**
 * The full list of ids after moving one a place up or down - what the order
 * endpoints expect. Null when the move is not possible.
 */
export function moveId(ids: readonly number[], id: number, direction: MoveDirection): number[] | null {
  if (!canMove(ids, id, direction)) return null;
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// ── What the selected cohort allows ──────────────────────────────────────────

export interface CurriculumControls {
  /** Add, edit, reorder and archive. Structure is global, so this never depends on the cohort. */
  canAuthor: boolean;
  canAssign: boolean;
  canUnassign: boolean;
  /** Whether the lessons list what is assigned to a cohort (true) or simply the content they hold (false). */
  hasCohort: boolean;
  /** The one muted line saying why assignment is hidden; null when it is not. */
  note: string | null;
}

/**
 * Assignment needs an active cohort (FD12): an upcoming or completed cohort
 * shows what is assigned but offers no assign or unassign, and a facilitator
 * with no cohort sees the structure only.
 */
export function curriculumControls(cohort: { name: string; status: CohortStatus } | null): CurriculumControls {
  if (cohort === null) {
    return {
      canAuthor: true,
      canAssign: false,
      canUnassign: false,
      hasCohort: false,
      note: "You have no cohort in this school year, so there is nothing to assign content to. You can still build the structure.",
    };
  }
  if (cohort.status === "active") {
    return { canAuthor: true, canAssign: true, canUnassign: true, hasCohort: true, note: null };
  }
  return {
    canAuthor: true,
    canAssign: false,
    canUnassign: false,
    hasCohort: true,
    note: `Content can only be assigned or unassigned in an active cohort. ${cohort.name} is ${cohortStatusLabel(cohort.status).toLowerCase()}. You can still edit the structure.`,
  };
}

/** The first half of the header subtitle, and all of it while the cohorts are still loading. */
export const STRUCTURE_SHARED_TEXT = "Structure is shared across all cohorts.";

/** The header subtitle, naming the cohort that assignment applies to. */
export function curriculumSubtitle(cohortName: string | null): string {
  return cohortName === null
    ? `${STRUCTURE_SHARED_TEXT} You have no cohort to assign content to.`
    : `${STRUCTURE_SHARED_TEXT} Content assignment applies to ${cohortName}.`;
}

/**
 * The lesson pill: "No content assigned", "1 content assigned", "3 contents
 * assigned". Without a cohort nothing is "assigned", so it counts the lesson's
 * content instead: "No content", "1 content", "3 contents".
 */
export function lessonPillText(count: number, hasCohort: boolean): string {
  if (count <= 0) return hasCohort ? "No content assigned" : "No content";
  const noun = count === 1 ? "content" : "contents";
  return hasCohort ? `${count} ${noun} assigned` : `${count} ${noun}`;
}

// ── Authoring forms and confirmations ────────────────────────────────────────

/** The longest title the API accepts. */
export const TITLE_MAX_LENGTH = 255;

export interface StructureFormValues {
  title: string;
  /** Null clears the description. */
  description: string | null;
}

/** The form as the API should receive it: both trimmed, a blank description as null. Null when the title is blank. */
export function structureFormValues(title: string, description: string): StructureFormValues | null {
  const trimmedTitle = title.trim();
  if (trimmedTitle === "") return null;
  const trimmedDescription = description.trim();
  return { title: trimmedTitle, description: trimmedDescription === "" ? null : trimmedDescription };
}

function countText(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** What archiving a module hides. Nothing is deleted, and assignments are kept. */
export function archiveModuleText(lessonCount: number): string {
  const lessons = lessonCount === 0 ? "This module" : `This module and its ${countText(lessonCount, "lesson", "lessons")}`;
  return `${lessons} will be hidden from the curriculum for every cohort, and from learners, and will stop counting toward progress. Nothing is deleted: the lessons, their content, and each cohort's content assignments are kept.`;
}

/** What archiving a lesson hides. Nothing is deleted, and assignments are kept. */
export function archiveLessonText(): string {
  return "This lesson and its content will be hidden from the curriculum for every cohort, and from learners, and will stop counting toward progress. Nothing is deleted: the content and each cohort's content assignments are kept.";
}

/** The two ways back from an archive. */
export const ARCHIVE_UNDO_HINT = "You can undo this from the message that appears right after archiving, or restore it later by turning on Show archived.";

// ── Failures ─────────────────────────────────────────────────────────────────

/** The backend `code` values the Curriculum page and the picker give their own wording. */
export const CurriculumErrorCode = {
  /** 409 - assign or unassign in a cohort that is upcoming or completed. */
  COHORT_NOT_ACTIVE: "COHORT_NOT_ACTIVE",
  /** 409 - the content is already assigned to the cohort. */
  CONTENT_ALREADY_ASSIGNED: "CONTENT_ALREADY_ASSIGNED",
  /** 409 - adding a module to, or restoring one in, an archived strand. */
  STRAND_NOT_ACTIVE: "STRAND_NOT_ACTIVE",
  /** 409 - adding or restoring a lesson, or assigning content, under an archived module. */
  MODULE_NOT_ACTIVE: "MODULE_NOT_ACTIVE",
  /** 409 - assigning content under an archived lesson. */
  LESSON_NOT_ACTIVE: "LESSON_NOT_ACTIVE",
  /** 400 - the reorder list is not exactly the parent's active items. */
  INVALID_ORDER: "INVALID_ORDER",
  /** 404 - no such strand, or it is archived. */
  LEARNING_STRAND_NOT_FOUND: "LEARNING_STRAND_NOT_FOUND",
  /** 404 */
  MODULE_NOT_FOUND: "MODULE_NOT_FOUND",
  /** 404 */
  LESSON_NOT_FOUND: "LESSON_NOT_FOUND",
  /** 404 - missing, archived, or someone else's private content. */
  CONTENT_NOT_FOUND: "CONTENT_NOT_FOUND",
  /** 404 - unassigning content that is not assigned to the cohort. */
  CONTENT_NOT_ASSIGNED: "CONTENT_NOT_ASSIGNED",
  /** 404 */
  COHORT_NOT_FOUND: "COHORT_NOT_FOUND",
  /** 403 - the cohort is not one of the caller's. */
  COHORT_ACCESS_DENIED: "COHORT_ACCESS_DENIED",
} as const;

const ERROR_MESSAGE: Record<string, string> = {
  COHORT_NOT_ACTIVE: "This cohort is no longer active, so its content assignments cannot be changed.",
  CONTENT_ALREADY_ASSIGNED: "This content is already assigned to this cohort.",
  STRAND_NOT_ACTIVE: "This learning strand has been archived, so nothing can be added to it, restored in it, or assigned from it. The strand must be restored first: please ask the administrator.",
  MODULE_NOT_ACTIVE: "This lesson's module is archived, so nothing under it can be added, restored, or assigned. Restore the module first: turn on Show archived and choose Restore on the module.",
  LESSON_NOT_ACTIVE: "This lesson has been archived, so its content cannot be assigned.",
  INVALID_ORDER: "The list changed while you were reordering it. It has been refreshed; please try again.",
  LEARNING_STRAND_NOT_FOUND: "This learning strand is no longer available.",
  MODULE_NOT_FOUND: "This module no longer exists.",
  LESSON_NOT_FOUND: "This lesson no longer exists.",
  CONTENT_NOT_FOUND: "This content is no longer available. It may have been archived, or made private by its owner.",
  CONTENT_NOT_ASSIGNED: "This content is no longer assigned to this cohort.",
  COHORT_NOT_FOUND: "This cohort no longer exists.",
  COHORT_ACCESS_DENIED: "You do not have access to this cohort.",
};

/**
 * The toast for a refused action: our wording for the codes above, a general
 * access or not-found line for an unrecognised 403 or 404, and otherwise the
 * server's own message.
 */
export function curriculumErrorMessage(code: string | undefined, httpStatus: number | null, serverMessage: string): string {
  if (code !== undefined && Object.prototype.hasOwnProperty.call(ERROR_MESSAGE, code)) return ERROR_MESSAGE[code];
  if (httpStatus === 403) return "You do not have access to do this.";
  if (httpStatus === 404) return "This item no longer exists.";
  return serverMessage;
}

/**
 * Whether the tree is out of step with the server after a refused action: any
 * 409 (the state changed underneath), any 404 (the item is gone), and a
 * refused reorder.
 */
export function shouldReloadTree(httpStatus: number | null, code: string | undefined): boolean {
  return httpStatus === 409 || httpStatus === 404 || code === CurriculumErrorCode.INVALID_ORDER;
}

export type PickerFailureEffect = "remove-row" | "close" | "keep";

/**
 * What the assign picker does after a refused assign. The content is already
 * assigned or gone: drop its row. The cohort, module, or lesson can no longer
 * take assignments: nothing here can succeed, so close. Anything else: keep
 * the row for another try.
 */
export function pickerFailureEffect(code: string | undefined): PickerFailureEffect {
  if (code === CurriculumErrorCode.CONTENT_ALREADY_ASSIGNED || code === CurriculumErrorCode.CONTENT_NOT_FOUND) return "remove-row";
  if (
    code === CurriculumErrorCode.COHORT_NOT_ACTIVE ||
    code === CurriculumErrorCode.COHORT_NOT_FOUND ||
    code === CurriculumErrorCode.COHORT_ACCESS_DENIED ||
    code === CurriculumErrorCode.MODULE_NOT_ACTIVE ||
    code === CurriculumErrorCode.LESSON_NOT_ACTIVE ||
    code === CurriculumErrorCode.LESSON_NOT_FOUND
  ) {
    return "close";
  }
  return "keep";
}

export interface LoadFailureText {
  title: string;
  message: string;
  canRetry: boolean;
}

/** A failed tree load: a 403 is an access message, not a retryable error (FD13); a 404 is an archived or missing strand. */
export function treeFailureText(httpStatus: number | null, message: string): LoadFailureText {
  if (httpStatus === 403) {
    return {
      title: "You do not have access to this cohort",
      message: "You can only view the curriculum for cohorts you are assigned to. Choose another cohort from the top bar.",
      canRetry: false,
    };
  }
  if (httpStatus === 404) {
    return {
      title: "This learning strand is no longer available",
      message: "It may have been archived. Try again to refresh the list of strands.",
      canRetry: true,
    };
  }
  return { title: "The curriculum could not be loaded", message, canRetry: true };
}

// ── Archived items (shown with "Show archived") ──────────────────────────────

/** The ids of the active items, in the order shown. The order endpoints take exactly these, and Move up / Move down step over anything archived. */
export function activeIds<T extends { status: StructureStatus }>(items: readonly T[], idOf: (item: T) => number): number[] {
  return items.filter((item) => item.status === "active").map(idOf);
}

export interface ModuleActions {
  /** Shown greyed, with the "Archived" pill. */
  archived: boolean;
  canEdit: boolean;
  canMove: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canAddLesson: boolean;
}

/** What a module offers: everything while active; once archived, Restore and nothing else. */
export function moduleActions(module: { status: StructureStatus }, controls: Pick<CurriculumControls, "canAuthor">): ModuleActions {
  const archived = module.status !== "active";
  const author = controls.canAuthor;
  return {
    archived,
    canEdit: author && !archived,
    canMove: author && !archived,
    canArchive: author && !archived,
    canRestore: author && archived,
    canAddLesson: author && !archived,
  };
}

export interface LessonActions {
  /** The lesson itself is archived: greyed, with the "Archived" pill. */
  archived: boolean;
  /** Greyed, because it or its module is archived. */
  muted: boolean;
  canEdit: boolean;
  canMove: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canAssign: boolean;
  canUnassign: boolean;
  /** A short line saying why nothing can be done here; null when something can. */
  note: string | null;
}

/** Shown on a lesson whose module is archived, whatever the lesson's own status. */
export const MODULE_ARCHIVED_NOTE = "Its module is archived. Restore the module first.";

/**
 * What a lesson offers. Active under an active module: everything, with
 * assignment as the cohort allows. Archived under an active module: Restore
 * only. Under an archived module nothing at all, with a note - an active
 * lesson there is hidden along with its module, and an archived one cannot be
 * restored until the module is.
 */
export function lessonActions(
  lesson: { status: StructureStatus },
  module: { status: StructureStatus },
  controls: Pick<CurriculumControls, "canAuthor" | "canAssign" | "canUnassign">,
): LessonActions {
  const archived = lesson.status !== "active";
  const moduleArchived = module.status !== "active";
  const usable = !archived && !moduleArchived;
  const author = controls.canAuthor;
  return {
    archived,
    muted: archived || moduleArchived,
    canEdit: author && usable,
    canMove: author && usable,
    canArchive: author && usable,
    canRestore: author && archived && !moduleArchived,
    canAssign: controls.canAssign && usable,
    canUnassign: controls.canUnassign && usable,
    note: moduleArchived ? MODULE_ARCHIVED_NOTE : null,
  };
}
