import type {
  AtRiskReason,
  CohortMemberStatus,
  FacilitatorCohortItem,
  FacilitatorRosterRow,
  MembershipStatusFilter,
  ReportAtRiskByReason,
  ReportLearner,
  ReportLearnerStrand,
  ReportThresholds,
} from "./api/types";
import { learnerCountLabel } from "./dashboardText";
import { formatCalendarDate, formatDateTime } from "./dates";
import { DASH, atRiskReasonLabel, formatMps } from "./labels";

// Wording and decisions for the Reports page (the cohort summary) and the My
// Cohorts page. Pure functions only: no React, no API calls. Every figure is
// shown as the API returned it; nothing is computed here.

// ── Reports: header and controls ─────────────────────────────────────────────

/**
 * Scope first, as on every facilitator page: "Cohort A, 2026-2027 · Cohort
 * summary". The year is left out when the cohort's name already carries it.
 */
export function reportSubtitle(cohortName: string, schoolYear: string): string {
  const scope = cohortName.includes(schoolYear) ? cohortName : `${cohortName}, ${schoolYear}`;
  return `${scope} · Cohort summary`;
}

/** The membership chips, default first. The values are the API's `membership_status`. */
export const MEMBERSHIP_OPTIONS: readonly { value: MembershipStatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "ended", label: "Ended" },
  { value: "all", label: "All" },
];

// ── Reports: summary tiles ───────────────────────────────────────────────────

export interface ReasonCount {
  reason: AtRiskReason;
  label: string;
  count: number;
}

/** The at-risk tile's breakdown: each reason the response lists with a count above zero, in the order returned. */
export function atRiskBreakdown(byReason: ReportAtRiskByReason): ReasonCount[] {
  return (Object.entries(byReason) as [AtRiskReason, number][])
    .filter(([, count]) => count > 0)
    .map(([reason, count]) => ({ reason, label: atRiskReasonLabel(reason), count }));
}

/** "2 Low test score · 1 Inactive"; null when no reason has a count. */
export function atRiskBreakdownText(byReason: ReportAtRiskByReason): string | null {
  const parts = atRiskBreakdown(byReason).map((item) => `${item.count} ${item.label}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

// ── Reports: cells ───────────────────────────────────────────────────────────

export interface AverageCell {
  /** The average, or a dash when there is none. */
  main: string;
  /** How many learners the average covers: "3 learners". */
  detail: string;
}

/** An average MPS with the number of learners it covers. A null average is a dash, not 0 (FD8). */
export function averageCell(average: number | null, count: number): AverageCell {
  return { main: formatMps(average), detail: learnerCountLabel(count) };
}

/** A gain with its sign: "+12.5", "-3", "0"; a dash when there is none. */
export function gainText(gain: number | null | undefined): string {
  if (gain === null || gain === undefined || !Number.isFinite(gain)) return DASH;
  const text = formatMps(gain);
  return gain > 0 ? `+${text}` : text;
}

/** Yes, No, or a dash when the learner has no posttest. */
export function masteredText(mastered: boolean | null | undefined): string {
  if (mastered === null || mastered === undefined) return DASH;
  return mastered ? "Yes" : "No";
}

/** "2 learners" in the strand table's Mastered column. */
export function masteryCountText(count: number): string {
  return learnerCountLabel(count);
}

/** The reason labels, joined; a dash when the learner has no flag. */
export function atRiskReasonsText(reasons: readonly AtRiskReason[]): string {
  return reasons.length > 0 ? reasons.map(atRiskReasonLabel).join(", ") : DASH;
}

// ── Reports: strand column groups ────────────────────────────────────────────

/**
 * The strand codes that head the learners table's column groups, taken from
 * the response: the totals' strands in the order returned, then any strand a
 * learner carries that the totals do not (first seen first). Nothing about
 * which strands exist is assumed.
 */
export function strandGroups(
  totalsStrands: readonly { strand_code: string }[],
  learners: readonly Pick<ReportLearner, "strands">[],
): string[] {
  const codes: string[] = [];
  const seen = new Set<string>();
  const add = (code: string) => {
    if (seen.has(code)) return;
    seen.add(code);
    codes.push(code);
  };
  for (const strand of totalsStrands) add(strand.strand_code);
  for (const learner of learners) for (const strand of learner.strands) add(strand.strand_code);
  return codes;
}

/** The learner's figures for one strand group, matched by code; undefined when the learner has none. */
export function strandOfLearner(learner: Pick<ReportLearner, "strands">, strandCode: string): ReportLearnerStrand | undefined {
  return learner.strands.find((strand) => strand.strand_code === strandCode);
}

// ── Reports: footer ──────────────────────────────────────────────────────────

/** "Generated Oct 5, 2026, 9:30 AM (Philippine time)". */
export function generatedText(generatedAt: string): string {
  return `Generated ${formatDateTime(generatedAt) ?? DASH} (Philippine time)`;
}

/** The report's definitions, with the numbers read from the response's thresholds. */
export function thresholdsText(thresholds: ReportThresholds): string {
  const days = `${thresholds.inactivity_days} ${thresholds.inactivity_days === 1 ? "day" : "days"}`;
  return `Mastery is a posttest MPS at or above ${formatMps(thresholds.mps_mastery)}. A learner is flagged inactive after ${days} without activity.`;
}

// ── Reports: failures ────────────────────────────────────────────────────────

export interface LoadFailureText {
  title: string;
  message: string;
  canRetry: boolean;
}

/** A failed report load: a 403 is an access message, not a retryable error (FD13). */
export function reportFailureText(httpStatus: number | null, message: string): LoadFailureText {
  if (httpStatus === 403) {
    return {
      title: "You do not have access to this cohort",
      message: "You can only view reports for cohorts you are assigned to. Choose another cohort from the top bar.",
      canRetry: false,
    };
  }
  return { title: "The report could not be loaded", message, canRetry: true };
}

/** The toast for a failed CSV download. The error body is a file, not JSON, so only the status is read. */
export function csvFailureText(httpStatus: number | null): string {
  if (httpStatus === 403) return "You do not have access to this cohort, so its report cannot be downloaded.";
  if (httpStatus === null) return "The server could not be reached. Check your connection and try again.";
  return "The CSV could not be downloaded. Please try again.";
}

// ── My Cohorts ───────────────────────────────────────────────────────────────

/** Scope first, as on every facilitator page: "SY 2026-2027 · 3 cohorts"; without a year, just the count. */
export function cohortsSubtitle(count: number, schoolYear: string | null): string {
  const cohorts = `${count} ${count === 1 ? "cohort" : "cohorts"}`;
  return schoolYear ? `SY ${schoolYear} · ${cohorts}` : cohorts;
}

/**
 * The cohort My Cohorts opens on when the URL names none: the top bar's
 * selection when it is in the list, otherwise the first one listed. Null for an empty list.
 */
export function defaultCohortId(cohorts: readonly Pick<FacilitatorCohortItem, "id">[], selectedId: number | null): number | null {
  if (cohorts.length === 0) return null;
  return cohorts.some((cohort) => cohort.id === selectedId) ? selectedId : cohorts[0].id;
}

/** Shown on both the page and its empty state: facilitators cannot create cohorts or add members. */
export const COHORTS_ASSIGNED_TEXT = "Cohorts and their members are assigned by an administrator.";

/** "Jun 1, 2026 to Mar 31, 2027", "Starts Jun 1, 2026", "Ends Mar 31, 2027"; null when neither date is set. */
export function cohortDatesText(cohort: Pick<FacilitatorCohortItem, "start_date" | "end_date">): string | null {
  const start = formatCalendarDate(cohort.start_date);
  const end = formatCalendarDate(cohort.end_date);
  if (start && end) return `${start} to ${end}`;
  if (start) return `Starts ${start}`;
  if (end) return `Ends ${end}`;
  return null;
}

export type RosterCounts = Record<CohortMemberStatus, number>;

/** How many of the roster's memberships are active and how many have ended. */
export function rosterCounts(roster: readonly Pick<FacilitatorRosterRow, "status">[]): RosterCounts {
  const counts: RosterCounts = { active: 0, ended: 0 };
  for (const row of roster) {
    if (row.status === "active") counts.active++;
    else if (row.status === "ended") counts.ended++;
  }
  return counts;
}

/** "12 active · 3 ended". */
export function rosterCountsText(counts: RosterCounts): string {
  return `${counts.active} active · ${counts.ended} ended`;
}

/**
 * A failed roster load. The API answers 403 both for a cohort that is not the
 * caller's and for one that does not exist, so the message covers both.
 */
export function rosterFailureText(httpStatus: number | null, message: string): LoadFailureText {
  if (httpStatus === 403 || httpStatus === 404) {
    return {
      title: "You do not have access to this cohort",
      message: "This cohort is not one of yours, or does not exist. Choose a cohort from the list.",
      canRetry: false,
    };
  }
  return { title: "The roster could not be loaded", message, canRetry: true };
}
