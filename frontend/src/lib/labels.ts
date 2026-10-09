import type { AtRiskReason, CohortMemberStatus, CohortStatus, ContentType } from "./api/types";

// Display labels and number formats shared by the facilitator screens
// (FD7, FD8, FD11). Missing values are shown as a dash, never as a placeholder number.

/** Shown wherever a value is missing. */
export const DASH = "—";

// ── Labels ───────────────────────────────────────────────────────────────────

const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  video: "Watching",
  audio: "Listening",
  reading: "Reading",
};

/** FD7: video is Watching, audio is Listening, reading is Reading. */
export function contentTypeLabel(type: ContentType): string {
  return CONTENT_TYPE_LABEL[type] ?? type;
}

const AT_RISK_REASON_LABEL: Record<AtRiskReason, string> = {
  low_mps: "Low test score",
  inactive: "Inactive",
  low_readiness: "Low readiness",
};

export function atRiskReasonLabel(reason: AtRiskReason): string {
  return AT_RISK_REASON_LABEL[reason] ?? reason;
}

const COHORT_STATUS_LABEL: Record<CohortStatus, string> = {
  upcoming: "Upcoming",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

export function cohortStatusLabel(status: CohortStatus): string {
  return COHORT_STATUS_LABEL[status] ?? status;
}

const MEMBER_STATUS_LABEL: Record<CohortMemberStatus, string> = {
  active: "Active",
  ended: "Ended",
};

export function memberStatusLabel(status: CohortMemberStatus): string {
  return MEMBER_STATUS_LABEL[status] ?? status;
}

/** "First Last" from the API's nullable name fields; falls back to the given text (default: a dash). */
export function personName(
  person: { first_name: string | null; last_name: string | null },
  fallback: string = DASH,
): string {
  const name = [person.first_name, person.last_name].filter(Boolean).join(" ").trim();
  return name || fallback;
}

// ── Numbers ──────────────────────────────────────────────────────────────────

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** FD11: a percentage as a whole number ("47%"); a dash when there is no value. */
export function formatPercent(value: number | null | undefined): string {
  return isNumber(value) ? `${Math.round(value)}%` : DASH;
}

/** FD11: MPS with up to two decimals and no trailing zeros ("65", "65.5", "66.67"); a dash when there is no value. */
export function formatMps(value: number | null | undefined): string {
  if (!isNumber(value)) return DASH;
  return String(Math.round(value * 100) / 100);
}

/** Any text or number, or a dash when it is null, undefined, or blank. */
/** "0 learners", "1 learner", "3 learners". The plural defaults to the singular with an "s". */
export function countLabel(count: number, singular: string, plural: string = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  const text = String(value).trim();
  return text || DASH;
}
