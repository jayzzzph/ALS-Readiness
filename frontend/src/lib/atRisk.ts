import type { AtRiskFlagStatus, AtRiskFlagUpdate, AtRiskReason } from "./api/types";
import { atRiskReasonLabel, formatMps } from "./labels";

// Wording and rules for at-risk flags, shared by the Dashboard and Learner
// Detail. Pure functions only: no React, no API calls.

/** The parts of a flag its description is built from (DashboardFlag and AtRiskFlagSummary both fit). */
export interface FlagReasonParts {
  reason: AtRiskReason;
  strand_code: string | null;
  /** The MPS for low_mps, the number of inactive days for inactive. */
  trigger_value: number | null;
}

/**
 * What triggered the flag, or null when there is nothing to add to the label:
 * "LS1-EN, MPS 62.5" for a low score, "7 days" for inactivity.
 */
export function flagDetail(flag: FlagReasonParts): string | null {
  if (flag.reason === "low_mps") {
    const parts: string[] = [];
    if (flag.strand_code) parts.push(flag.strand_code);
    if (flag.trigger_value !== null) parts.push(`MPS ${formatMps(flag.trigger_value)}`);
    return parts.length > 0 ? parts.join(", ") : null;
  }

  if (flag.reason === "inactive") {
    if (flag.trigger_value === null) return null;
    const days = Math.round(flag.trigger_value);
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  return null;
}

/** The reason with its detail: "Low test score: LS1-EN, MPS 62.5", "Inactive: 7 days", "Low readiness". */
export function flagReasonText(flag: FlagReasonParts): string {
  const label = atRiskReasonLabel(flag.reason);
  const detail = flagDetail(flag);
  return detail ? `${label}: ${detail}` : label;
}

const STATUS_LABEL: Record<AtRiskFlagStatus, string> = {
  open: "Open",
  reviewed: "Reviewed",
  dismissed: "Dismissed",
  resolved: "Resolved",
};

export function flagStatusLabel(status: AtRiskFlagStatus): string {
  return STATUS_LABEL[status] ?? status;
}

/** Open and reviewed flags are the ones still in play; dismissed and resolved are history. */
export function isActiveFlag(flag: { status: AtRiskFlagStatus }): boolean {
  return flag.status === "open" || flag.status === "reviewed";
}

export interface FlagAction {
  /** The status the action sets. */
  status: AtRiskFlagUpdate["status"];
  label: string;
  /** Past tense, for the toast: "Flag marked as reviewed." */
  done: string;
}

const MARK_REVIEWED: FlagAction = { status: "reviewed", label: "Mark reviewed", done: "Flag marked as reviewed." };
const DISMISS: FlagAction = { status: "dismissed", label: "Dismiss", done: "Flag dismissed." };
export const REOPEN: FlagAction = { status: "open", label: "Reopen", done: "Flag reopened." };

/**
 * What a facilitator can do with a flag: an open flag can be marked reviewed
 * or dismissed; a reviewed flag can be dismissed or reopened; a dismissed flag
 * can be reopened. Nothing is offered for a closed flag - a resolved one, or
 * any flag with a `resolved_at`, since the backend refuses every change once
 * the condition has cleared.
 */
export function flagActions(status: AtRiskFlagStatus, resolvedAt: string | null): FlagAction[] {
  if (resolvedAt !== null) return [];
  if (status === "open") return [MARK_REVIEWED, DISMISS];
  if (status === "reviewed") return [DISMISS, REOPEN];
  if (status === "dismissed") return [REOPEN];
  return [];
}

/**
 * The action offered on a flag's row in the at-risk history: "review" opens
 * the review dialog (open and reviewed flags), "reopen" reopens a dismissed
 * flag straight from the row, null offers nothing (closed flags).
 */
export function flagRowAction(flag: { status: AtRiskFlagStatus; resolved_at: string | null }): "review" | "reopen" | null {
  if (flagActions(flag.status, flag.resolved_at).length === 0) return null;
  return flag.status === "dismissed" ? "reopen" : "review";
}

/** The longest note the API accepts. */
export const FLAG_NOTE_MAX_LENGTH = 500;

/** The note as the API should receive it: trimmed, or null to clear it. */
export function noteForRequest(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * A 409 or 422 on a flag action means the flag changed underneath the dialog
 * (already closed, already in that status) or the input was refused: the
 * dialog stays open and reloads so it shows the current state (FD13).
 */
export function shouldReloadAfterFailure(httpStatus: number | null): boolean {
  return httpStatus === 409 || httpStatus === 422;
}

/** Shown beside a cohort's flags when the cohort is not active: the backend only re-evaluates flags for active cohorts. */
export const FLAGS_NOT_UPDATED_TEXT = "Flags are only updated for active cohorts.";
