import type { DashboardStrand, EvaluationCoverage, MpsAverage } from "./api/types";
import { DASH, formatMps, formatPercent } from "./labels";

// Wording for the facilitator Dashboard, including what each block says when
// a value is null or zero (FD8). Pure functions only.

/** "0 learners", "1 learner", "3 learners". */
export function learnerCountLabel(count: number): string {
  return `${count} ${count === 1 ? "learner" : "learners"}`;
}

export interface TileText {
  value: string;
  hint: string;
}

/** Average progress tile: the whole-number percent, or a dash when the cohort has no members. */
export function averageProgressTile(averageProgress: number | null): TileText {
  return { value: formatPercent(averageProgress), hint: "across all strands" };
}

/**
 * Content evaluation coverage tile, as the wireframe draws it: "3 / 10" over
 * "items evaluated · 7 not yet evaluated"; a dash with "No content assigned"
 * when there is none.
 */
export function evaluationTile(coverage: EvaluationCoverage): TileText {
  if (coverage.total === 0) return { value: DASH, hint: "No content assigned" };
  return {
    value: `${coverage.evaluated} / ${coverage.total}`,
    hint: `items evaluated · ${coverage.total - coverage.evaluated} not yet evaluated`,
  };
}

/** A strand card's heading, as on the Curriculum tabs: "CODE · Name". */
export function strandCardTitle(strand: Pick<DashboardStrand, "strand_code" | "strand_name">): string {
  return `${strand.strand_code} · ${strand.strand_name}`;
}

export interface StrandProgressText {
  /** The value for the bar, or null when no bar should be drawn. */
  barValue: number | null;
  caption: string;
}

/**
 * A strand card's progress: no bar and "No lessons assigned yet" when the
 * strand has no lessons for this cohort; no bar and a dash when the cohort has
 * no members to average over; otherwise the bar and "58% average completion".
 */
export function strandProgress(strand: Pick<DashboardStrand, "total_lessons" | "average_percent">): StrandProgressText {
  if (strand.total_lessons === 0) return { barValue: null, caption: "No lessons assigned yet" };
  return {
    barValue: strand.average_percent,
    caption: `${formatPercent(strand.average_percent)} average completion`,
  };
}

/** "62.5 (3 learners)", or "— (0 learners)" when nobody has taken the test. */
export function mpsAverageText(average: MpsAverage): string {
  return `${formatMps(average.average_mps)} (${learnerCountLabel(average.count)})`;
}

/** "2 at mastery". */
export function masteryText(masteryCount: number): string {
  return `${masteryCount} at mastery`;
}

/** The amber notice above the at-risk table, in the wireframe's words: "1 learner flagged at-risk", "4 learners flagged at-risk". */
export function atRiskNoticeTitle(learnerCount: number): string {
  return `${learnerCountLabel(learnerCount)} flagged at-risk`;
}

/** The rule in plain words, without the thresholds (which the dashboard response does not carry). */
export const AT_RISK_RULE_TEXT = "low posttest score or prolonged inactivity";

export interface LoadFailureText {
  title: string;
  message: string;
  /** False when trying again cannot help. */
  canRetry: boolean;
}

/** How a failed dashboard load is presented: a 403 is an access message, not a retryable error (FD13). */
export function loadFailureText(httpStatus: number | null, message: string): LoadFailureText {
  if (httpStatus === 403) {
    return {
      title: "You do not have access to this cohort",
      message: "You can only view cohorts you are assigned to. Choose another cohort from the top bar.",
      canRetry: false,
    };
  }
  return { title: "The dashboard could not be loaded", message, canRetry: true };
}
