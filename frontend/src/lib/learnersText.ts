import type {
  FacilitatorLearnerRow,
  LearnerIntakeSummary,
  LearnerProgress,
  LearnerStrandProgress,
  MembershipStatusFilter,
  StrandItem,
  StrandTestResult,
} from "./api/types";
import type { ListLearnersParams } from "./api/facilitator";
import { formatDate } from "./dates";
import { DASH, formatMps, formatPercent } from "./labels";

// Wording and decisions for the Learners list and Learner Detail pages.
// Pure functions only: no React, no API calls.

export const LEARNERS_PAGE_SIZE = 20;

// ── List: scope, query, subtitle ─────────────────────────────────────────────

export interface LearnerListControls {
  /** The selected cohort, or null for "All cohorts". */
  cohortId: number | null;
  /** The selected school year; used only with "All cohorts". */
  schoolYear: string | null;
  membership: MembershipStatusFilter;
  atRiskOnly: boolean;
  /** As typed (already debounced by the page). */
  search: string;
  page: number;
}

/**
 * The query for GET /api/facilitator/learners. With a cohort: cohort_id. With
 * "All cohorts": the school year and no cohort_id. Empty filters are left out
 * rather than sent blank.
 */
export function buildLearnerQuery(controls: LearnerListControls): ListLearnersParams {
  const params: ListLearnersParams = {
    membership_status: controls.membership,
    page: controls.page,
    page_size: LEARNERS_PAGE_SIZE,
  };
  if (controls.cohortId !== null) params.cohort_id = controls.cohortId;
  else if (controls.schoolYear) params.school_year = controls.schoolYear;
  if (controls.atRiskOnly) params.at_risk = true;
  const search = controls.search.trim();
  if (search) params.search = search;
  return params;
}

/** Everything that, when it changes, sends the list back to page 1. */
export function learnerFilterKey(controls: Omit<LearnerListControls, "page">): string {
  return JSON.stringify([controls.cohortId, controls.schoolYear, controls.membership, controls.atRiskOnly, controls.search.trim()]);
}

/** True when the list is narrowed by something other than the cohort scope and the default "Active" chip. */
export function hasActiveFilters(controls: Pick<LearnerListControls, "membership" | "atRiskOnly" | "search">): boolean {
  return controls.membership !== "active" || controls.atRiskOnly || controls.search.trim() !== "";
}

/** "Cohort A", or "all cohorts, 2026-2027" (just "all cohorts" when no year is known). */
export function scopeLabel(cohortName: string | null, schoolYear: string | null): string {
  if (cohortName !== null) return cohortName;
  return schoolYear ? `all cohorts, ${schoolYear}` : "all cohorts";
}

/**
 * The header subtitle: "12 learners · Cohort A", "1 learner · all cohorts,
 * 2026-2027". While the total is not known yet (null), just the scope.
 */
export function learnersSubtitle(total: number | null, cohortName: string | null, schoolYear: string | null): string {
  const scope = scopeLabel(cohortName, schoolYear);
  if (total === null) return scope.charAt(0).toUpperCase() + scope.slice(1);
  return `${total} ${total === 1 ? "learner" : "learners"} · ${scope}`;
}

/** The empty-table line: different for "nobody here" and "nobody matches". */
export function emptyListMessage(filtered: boolean, allCohorts: boolean): string {
  if (filtered) return "No learners match your search or filters.";
  return allCohorts ? "No learners in your cohorts for this school year." : "No learners in this cohort.";
}

/** "Showing 21 to 40 of 93", "Showing 0 of 0". */
export function showingRange(page: number, pageSize: number, total: number): string {
  if (total <= 0) return "Showing 0 of 0";
  const from = Math.min(total, (page - 1) * pageSize + 1);
  const to = Math.min(total, page * pageSize);
  return `Showing ${from} to ${to} of ${total}`;
}

// ── List: strand progress columns ────────────────────────────────────────────

export interface StrandColumn {
  strand_id: number;
  strand_code: string;
}

/**
 * One progress column per strand, in the order GET /api/facilitator/strands
 * returns them. Taken from the strand list, not from the rows, so the columns
 * and their headings are there even when no learner is listed.
 */
export function strandColumns(strands: readonly Pick<StrandItem, "id" | "code">[]): StrandColumn[] {
  return strands.map((strand) => ({ strand_id: strand.id, strand_code: strand.code }));
}

/** The row's progress entry for a strand column, matched by strand_id; undefined when the row has none. */
export function progressForStrand(row: Pick<FacilitatorLearnerRow, "progress">, strandId: number): LearnerStrandProgress | undefined {
  return row.progress.find((entry) => entry.strand_id === strandId);
}

export interface ProgressCell {
  /** The value for the bar, or null when a dash is shown instead. */
  barValue: number | null;
  /** "42%", or a dash when there is nothing to measure. */
  text: string;
  /** "5 of 12 lessons"; null with the dash. */
  detail: string | null;
}

/**
 * A progress cell. No entry, or a strand with no lessons for the cohort, is a
 * dash - not 0%, which would read as "has not started" (FD8).
 */
export function progressCell(progress: LearnerProgress | null | undefined): ProgressCell {
  if (!progress || progress.total_lessons === 0) return { barValue: null, text: DASH, detail: null };
  return {
    barValue: progress.percent,
    text: formatPercent(progress.percent),
    detail: `${progress.completed_lessons} of ${progress.total_lessons} ${progress.total_lessons === 1 ? "lesson" : "lessons"}`,
  };
}

// ── Detail: URL ──────────────────────────────────────────────────────────────

/** A positive whole number from a URL segment or query value; null for anything else ("abc", "12x", "0", "-3", "1.5"). */
export function parseIdParam(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!/^[0-9]+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// ── Detail: cells and rows ───────────────────────────────────────────────────

export interface TestCell {
  /** The MPS, or "Not taken". */
  main: string;
  /** "13 / 20 items"; null when not taken. */
  score: string | null;
  /** The Philippine date it was submitted; null when not taken or not recorded. */
  date: string | null;
}

/** A pretest or posttest cell. The MPS is shown as returned; a taken test with no MPS shows a dash. */
export function testCell(result: StrandTestResult | null): TestCell {
  if (result === null) return { main: "Not taken", score: null, date: null };
  return {
    main: formatMps(result.mps),
    score: `${result.score} / ${result.total_items} items`,
    date: formatDate(result.submitted_at),
  };
}

/** "0 months", "1 month", "14 months". */
export function monthsText(months: number): string {
  return `${months} ${months === 1 ? "month" : "months"}`;
}

/** "No", "Yes, 1 time", "Yes, 3 times". */
export function aeTestText(hasTaken: boolean, attemptCount: number): string {
  if (!hasTaken) return "No";
  return `Yes, ${attemptCount} ${attemptCount === 1 ? "time" : "times"}`;
}

export interface IntakeRow {
  label: string;
  value: string;
}

/** The intake card's rows, built only from fields the response contains. */
export function intakeRows(intake: LearnerIntakeSummary): IntakeRow[] {
  return [
    { label: "Age", value: String(intake.age) },
    { label: "Highest educational attainment", value: intake.highest_educational_attainment.trim() || DASH },
    { label: "ALS learning strands", value: intake.als_learning_strands.length > 0 ? intake.als_learning_strands.join(", ") : DASH },
    { label: "Enrolled in ALS", value: monthsText(intake.als_enrollment_months) },
    { label: "Has taken the A&E test", value: aeTestText(intake.has_taken_ae_test, intake.ae_test_attempt_count) },
    { label: "Submitted", value: formatDate(intake.submitted_at) ?? DASH },
  ];
}

export interface LoadFailureText {
  title: string;
  message: string;
  canRetry: boolean;
}

/** A failed list load: a 403 is an access message, not a retryable error (FD13). */
export function listFailureText(httpStatus: number | null, message: string): LoadFailureText {
  if (httpStatus === 403) {
    return {
      title: "You do not have access to this cohort",
      message: "You can only view learners in cohorts you are assigned to. Choose another cohort from the top bar.",
      canRetry: false,
    };
  }
  return { title: "The learners could not be loaded", message, canRetry: true };
}

/**
 * A failed detail load. The API answers 403 both for a learner in none of the
 * caller's cohorts and for one that does not exist, so the message covers both.
 */
export function detailFailureText(httpStatus: number | null, message: string): LoadFailureText {
  if (httpStatus === 403) {
    return {
      title: "You do not have access to this learner",
      message: "This learner is not in any of your cohorts, or does not exist.",
      canRetry: false,
    };
  }
  return { title: "The learner could not be loaded", message, canRetry: true };
}

// ── Detail: summary tiles ────────────────────────────────────────────────────

export interface TileText {
  value: string;
  /** The line beneath; null for none. */
  hint: string | null;
}

/** LRI tile: the score exactly as returned, with the date submitted; a dash and "Not taken yet" when there is none. */
export function lriTile(lri: { score: number; submitted_at: string | null } | null): TileText {
  if (lri === null) return { value: DASH, hint: "Not taken yet" };
  const date = formatDate(lri.submitted_at);
  return { value: String(lri.score), hint: date ? `Submitted ${date}` : null };
}
