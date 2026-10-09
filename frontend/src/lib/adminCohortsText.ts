import type { ListUsersParams } from "./api/admin";
import type { ListCohortsParams } from "./api/adminCohorts";
import type { AdminUserListItem, CohortCreate, CohortMemberStatus, CohortResponse, CohortStatus } from "./api/types";
import { formatDate } from "./dates";
import { DASH, cohortStatusLabel } from "./labels";

// Wording and decisions for the admin Cohorts page and its member picker.
// Pure functions only: no React, no API calls.

// ── School year and dates ────────────────────────────────────────────────────

/** Shown under the school year field and when it is wrong. Mirrors validate_school_year in backend/app/schemas/cohort.py. */
export const SCHOOL_YEAR_FORMAT_TEXT = "Two consecutive years in the form YYYY-YYYY, for example 2026-2027.";

/** Null when the school year is valid; otherwise what is wrong with it. */
export function schoolYearError(value: string): string | null {
  const text = value.trim();
  if (text === "") return "Enter the school year.";
  const match = /^([0-9]{4})-([0-9]{4})$/.exec(text);
  if (match === null) return `The school year must be ${SCHOOL_YEAR_FORMAT_TEXT.charAt(0).toLowerCase()}${SCHOOL_YEAR_FORMAT_TEXT.slice(1)}`;
  if (Number(match[2]) !== Number(match[1]) + 1) return "The second year must be the year right after the first, for example 2026-2027.";
  return null;
}

const ISO_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

/**
 * Null when the dates are acceptable. The backend's create schema requires
 * both dates and a start strictly before the end (ISO dates compare as text).
 */
export function cohortDatesError(startDate: string, endDate: string): string | null {
  if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) return "Enter both the start date and the end date.";
  if (startDate >= endDate) return "The start date must be before the end date.";
  return null;
}

/** The longest cohort name the API accepts. */
export const COHORT_NAME_MAX_LENGTH = 100;

export interface CohortForm {
  name: string;
  schoolYear: string;
  /** YYYY-MM-DD, or "" while not chosen. */
  startDate: string;
  endDate: string;
}

export interface CohortFormErrors {
  name: string | null;
  schoolYear: string | null;
  dates: string | null;
}

export function cohortFormErrors(form: CohortForm): CohortFormErrors {
  return {
    name: form.name.trim() === "" ? "Enter a name for the cohort." : null,
    schoolYear: schoolYearError(form.schoolYear),
    dates: cohortDatesError(form.startDate, form.endDate),
  };
}

/**
 * The POST /api/cohorts body - exactly the four fields its schema accepts,
 * with the name and school year trimmed - or null while the form is invalid.
 */
export function cohortCreatePayload(form: CohortForm): CohortCreate | null {
  const errors = cohortFormErrors(form);
  if (errors.name || errors.schoolYear || errors.dates) return null;
  return { name: form.name.trim(), school_year: form.schoolYear.trim(), start_date: form.startDate, end_date: form.endDate };
}

// ── List: filters ────────────────────────────────────────────────────────────

/** The school years found in a cohort list, each once, newest first ("2026-2027" style labels sort as text). */
export function distinctSchoolYears(cohorts: readonly Pick<CohortResponse, "school_year">[]): string[] {
  return [...new Set(cohorts.map((cohort) => cohort.school_year))].sort().reverse();
}

/** Every cohort status, in the order the filter and the status control list them. */
export const COHORT_STATUSES: readonly CohortStatus[] = ["upcoming", "active", "completed", "archived"];

export interface CohortFilters {
  /** A school year, or null for all. */
  schoolYear: string | null;
  /** A status, or null for all. */
  status: CohortStatus | null;
}

/** The query for GET /api/cohorts: `school_year` and `status`, each left out when set to All. */
export function buildCohortsQuery(filters: CohortFilters): ListCohortsParams {
  const params: ListCohortsParams = {};
  if (filters.schoolYear !== null) params.school_year = filters.schoolYear;
  if (filters.status !== null) params.status = filters.status;
  return params;
}

/**
 * The list in a steady order: newest school year first, then by name. The API
 * returns cohorts in no particular order, so without this the rows could
 * change places between reloads.
 */
export function sortCohorts<T extends Pick<CohortResponse, "school_year" | "name" | "id">>(cohorts: readonly T[]): T[] {
  return [...cohorts].sort(
    (a, b) => b.school_year.localeCompare(a.school_year) || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.id - b.id,
  );
}

/** "3 cohorts", "1 cohort"; "2 of 7 cohorts shown" under a filter. */
export function cohortsCountText(shown: number, total: number | null, filtered: boolean): string {
  if (filtered && total !== null) return `${shown} of ${total} ${total === 1 ? "cohort" : "cohorts"} shown`;
  return `${shown} ${shown === 1 ? "cohort" : "cohorts"}`;
}

// ── Detail: status ───────────────────────────────────────────────────────────

/** The statuses the "Change status" control offers: every status but the current one. */
export function statusOptions(current: CohortStatus): CohortStatus[] {
  return COHORT_STATUSES.filter((status) => status !== current);
}

const STATUS_MEANING: Record<CohortStatus, string> = {
  active: "Facilitators can assign content, and at-risk flags are updated.",
  completed: "The cohort stays visible to its facilitators as read-only.",
  upcoming: "The cohort is visible to its facilitators as read-only, and has not started yet.",
  archived: "The cohort is hidden from facilitators entirely.",
};

/** One sentence on what a status means for the cohort's facilitators. */
export function statusMeaning(status: CohortStatus): string {
  return STATUS_MEANING[status] ?? "";
}

/** The standing hint on every cohort: how to close a school year without cutting facilitators off. */
export const YEAR_END_HINT =
  "At the end of a school year, mark the cohort Completed and leave its facilitator assignments active, so facilitators can still view its history.";

/**
 * Whether people can be assigned to a cohort in this status, and if not, why.
 * The backend refuses new assignments to a completed or archived cohort;
 * ending and reactivating existing ones is allowed in any status.
 */
export function assignmentRule(status: CohortStatus): { canAssign: boolean; note: string | null } {
  if (status === "completed" || status === "archived") {
    return {
      canAssign: false,
      note: `No one new can be assigned to ${cohortStatusLabel(status) === "Archived" ? "an archived" : "a completed"} cohort. Existing assignments can still be ended or reactivated.`,
    };
  }
  return { canAssign: true, note: null };
}

// ── Detail: members ──────────────────────────────────────────────────────────

export type MemberRole = "facilitator" | "learner";

export type MemberAction = "end" | "reactivate";

/** End on an active assignment or membership, Reactivate on an ended one. */
export function memberAction(status: CohortMemberStatus): MemberAction {
  return status === "active" ? "end" : "reactivate";
}

/** The status a row's action sets. */
export function memberActionStatus(action: MemberAction): CohortMemberStatus {
  return action === "end" ? "ended" : "active";
}

/** What ending means, for the confirmation. */
export function endConfirmText(role: MemberRole): string {
  return role === "facilitator"
    ? "This facilitator will immediately lose access to this cohort, including its history. You can reactivate the assignment later."
    : "This learner's membership in this cohort will end, which frees them to be assigned to another cohort. Their progress and results are kept, and you can reactivate the membership later.";
}

export type MemberCounts = Record<CohortMemberStatus, number>;

export function memberCounts(members: readonly { status: CohortMemberStatus }[]): MemberCounts {
  const counts: MemberCounts = { active: 0, ended: 0 };
  for (const member of members) {
    if (member.status === "active") counts.active++;
    else if (member.status === "ended") counts.ended++;
  }
  return counts;
}

/** "12 active · 3 ended". */
export function memberCountsText(counts: MemberCounts): string {
  return `${counts.active} active · ${counts.ended} ended`;
}

// ── Picker ───────────────────────────────────────────────────────────────────

/** The id the assign routes take for this role: the learners-table or facilitators-table id, never the user id. */
export function roleIdOf(user: Pick<AdminUserListItem, "learner_id" | "facilitator_id">, role: MemberRole): number | null {
  return role === "learner" ? user.learner_id : user.facilitator_id;
}

export interface PickerRowState {
  /** Whether the Assign button is offered. */
  assignable: boolean;
  /** Shown in place of the button when it is not. */
  reason: string | null;
  /** A marker beside the name that does not block assigning, e.g. a deactivated account. */
  note: string | null;
}

/**
 * Whether a person in the picker can be assigned. Not when they have no
 * record for the role, are already active in this cohort, or have an ended
 * assignment here (the backend refuses a second one; it is reactivated from
 * the table instead). A deactivated account can still be assigned, and is marked.
 */
export function pickerRowState(
  user: Pick<AdminUserListItem, "learner_id" | "facilitator_id" | "is_active">,
  role: MemberRole,
  members: ReadonlyMap<number, CohortMemberStatus>,
): PickerRowState {
  const note = user.is_active ? null : "Account deactivated";
  const roleId = roleIdOf(user, role);
  if (roleId === null) {
    return { assignable: false, reason: `This account has no ${role} record, so it cannot be assigned.`, note };
  }
  const here = members.get(roleId);
  if (here === "active") return { assignable: false, reason: "Already assigned", note };
  if (here === "ended") return { assignable: false, reason: "Ended in this cohort. Reactivate it from the table.", note };
  return { assignable: true, reason: null, note };
}

/** How many people the picker shows at a time. */
export const PICKER_PAGE_SIZE = 8;

/**
 * The query for GET /api/admin/users behind the picker: the role, a page, and
 * the search when there is one. The server does the matching (name or ID
 * number), so a blank search is left out rather than sent empty.
 */
export function pickerQuery(role: MemberRole, search: string, page: number): ListUsersParams {
  const params: ListUsersParams = { page, page_size: PICKER_PAGE_SIZE, role };
  const text = search.trim();
  if (text) params.search = text;
  return params;
}

/** The "Date ended" cell: the Philippine date an assignment or membership ended; a dash while it is active. */
export function dateEndedText(endedAt: string | null | undefined): string {
  return formatDate(endedAt) ?? DASH;
}

// ── Failures ─────────────────────────────────────────────────────────────────

/** The backend `code` values the Cohorts page gives its own wording. */
export const AdminCohortErrorCode = {
  /** 409 - the learner has an active membership in a cohort (assign or reactivate). */
  LEARNER_ALREADY_IN_ACTIVE_COHORT: "LEARNER_ALREADY_IN_ACTIVE_COHORT",
  /** 409 - the learner already has a membership row in this cohort, active or ended. */
  COHORT_LEARNER_ALREADY_EXISTS: "COHORT_LEARNER_ALREADY_EXISTS",
  /** 409 - the facilitator already has an assignment row in this cohort, active or ended. */
  COHORT_FACILITATOR_ALREADY_EXISTS: "COHORT_FACILITATOR_ALREADY_EXISTS",
  /** 400 - assigning to a completed or archived cohort. */
  INVALID_COHORT_STATUS: "INVALID_COHORT_STATUS",
  /** 404 */
  COHORT_NOT_FOUND: "COHORT_NOT_FOUND",
  /** 404 */
  LEARNER_NOT_FOUND: "LEARNER_NOT_FOUND",
  /** 404 */
  FACILITATOR_NOT_FOUND: "FACILITATOR_NOT_FOUND",
  /** 404 - no such membership row. */
  COHORT_LEARNER_NOT_FOUND: "COHORT_LEARNER_NOT_FOUND",
  /** 404 - no such assignment row. */
  COHORT_FACILITATOR_NOT_FOUND: "COHORT_FACILITATOR_NOT_FOUND",
  /** 422 - a field failed validation (school year, dates, name length); the first detail is the message. */
  REQUEST_VALIDATION: "REQUEST_VALIDATION",
} as const;

const ERROR_MESSAGE: Record<string, string> = {
  LEARNER_ALREADY_IN_ACTIVE_COHORT:
    "This learner is already active in another cohort. A learner can be active in only one cohort at a time: end their other membership first.",
  COHORT_LEARNER_ALREADY_EXISTS: "This learner is already in this cohort. If their membership has ended, reactivate it from the table.",
  COHORT_FACILITATOR_ALREADY_EXISTS: "This facilitator is already assigned to this cohort. If the assignment has ended, reactivate it from the table.",
  INVALID_COHORT_STATUS: "No one new can be assigned to a completed or archived cohort. Change the cohort's status first.",
  COHORT_NOT_FOUND: "This cohort no longer exists.",
  LEARNER_NOT_FOUND: "This learner no longer exists.",
  FACILITATOR_NOT_FOUND: "This facilitator no longer exists.",
  COHORT_LEARNER_NOT_FOUND: "This membership no longer exists.",
  COHORT_FACILITATOR_NOT_FOUND: "This assignment no longer exists.",
};

/** Pydantic prefixes a model validator's message with "Value error, "; the reader does not need it. */
export function cleanValidationMessage(message: string): string {
  return message.replace(/^Value error,\s*/i, "");
}

/**
 * The toast for a refused action: our wording for the codes above, a distinct
 * line when the server did not answer, and otherwise the server's own message
 * (for a 422 that is the first validation detail, e.g. the school year rule).
 */
export function adminCohortErrorMessage(code: string | undefined, httpStatus: number | null, serverMessage: string): string {
  if (code !== undefined && Object.prototype.hasOwnProperty.call(ERROR_MESSAGE, code)) return ERROR_MESSAGE[code];
  if (httpStatus === null) return "The server could not be reached. Check your connection and try again.";
  return cleanValidationMessage(serverMessage);
}

/** Whether the detail is out of step with the server after a refused action: any 409, and any 404. */
export function shouldReloadCohort(httpStatus: number | null): boolean {
  return httpStatus === 409 || httpStatus === 404;
}

export interface LoadFailureText {
  title: string;
  message: string;
  canRetry: boolean;
}

/** A failed detail load: a 404 is a cohort id that does not exist; anything else can be retried. */
export function cohortDetailFailureText(httpStatus: number | null, message: string): LoadFailureText {
  if (httpStatus === 404) {
    return { title: "Cohort not found", message: "This link does not point to a cohort. Choose one from the list.", canRetry: false };
  }
  return { title: "The cohort could not be loaded", message, canRetry: true };
}
