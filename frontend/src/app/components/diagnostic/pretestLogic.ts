import { STRAND_CODES, STRAND_SHORT_LABEL, indexByStrandCode } from "../../../lib/api/diagnostic";
import type {
  LriAnswerValue,
  LriAttemptCreate,
  LriTestItem,
  LriTestListItem,
  StrandAttemptCreate,
  StrandTestItem,
  StrandTestListItem,
} from "../../../lib/api/types";

// Pure logic for the pretest screens (answer payloads, date display), kept free
// of React so it can be exercised on its own.

/** Four-point agreement scale used by the LRI. */
export const LIKERT_OPTIONS: readonly { label: string; value: LriAnswerValue }[] = [
  { label: "Strongly Disagree", value: 1 },
  { label: "Disagree", value: 2 },
  { label: "Agree", value: 3 },
  { label: "Strongly Agree", value: 4 },
];

/** True once every item has an answer. */
export function isComplete(items: readonly { item_id: number }[], answers: Record<number, unknown>): boolean {
  return items.length > 0 && items.every((item) => answers[item.item_id] !== undefined);
}

/**
 * Strand submission body: one `{item_id, option_id}` per answered item, in item
 * order. Unanswered items are left out - a manual submit only happens once
 * every item is answered, but a time-limit auto-submit sends whatever is
 * answered, and the server scores each missing item as incorrect.
 */
export function toStrandAttemptCreate(
  items: readonly StrandTestItem[],
  answers: Record<number, number>,
): StrandAttemptCreate {
  return {
    answers: items.flatMap((item) => {
      const option_id = answers[item.item_id];
      return option_id === undefined ? [] : [{ item_id: item.item_id, option_id }];
    }),
  };
}

/** LRI submission body: one `{item_id, answer_value}` per statement, in item order. */
export function toLriAttemptCreate(
  items: readonly LriTestItem[],
  answers: Record<number, LriAnswerValue>,
): LriAttemptCreate {
  return {
    answers: items.map((item) => {
      const answer_value = answers[item.item_id];
      if (answer_value === undefined) throw new Error(`Statement ${item.item_id} is unanswered`);
      return { item_id: item.item_id, answer_value };
    }),
  };
}

/**
 * Display a backend timestamp. The API sends UTC datetimes without a zone suffix
 * (e.g. "2026-09-19T00:45:12.255363"), which `new Date()` would read as local
 * time - so a "Z" is added when no zone is present.
 */
export function formatWhen(iso: string | null): string {
  if (!iso) return "";
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(iso);
  const date = new Date(hasZone ? iso : `${iso}Z`);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

// ── Pre-test progress ────────────────────────────────────────────────────────

/** Which pre-test parts the learner has finished, from their own records. */
export interface PretestProgress {
  intakeDone: boolean;
  lriDone: boolean;
  pretestStrands: { code: string; label: string; done: boolean }[];
}

/** Builds the progress from the three lists the API gives: the intake (null until submitted), the LRI tests and the strand pre-tests. */
export function toPretestProgress(
  intake: unknown | null,
  lriTests: readonly LriTestListItem[],
  strandPretests: readonly StrandTestListItem[],
): PretestProgress {
  const byCode = indexByStrandCode(strandPretests);
  return {
    intakeDone: intake !== null,
    lriDone: lriTests.length > 0 && lriTests.every((t) => t.attempt_status === "completed"),
    pretestStrands: STRAND_CODES.filter((c) => byCode[c]).map((c) => ({
      code: c.startsWith("LS1") ? "LS1" : c,
      label: STRAND_SHORT_LABEL[c],
      done: byCode[c]!.attempt_status === "completed",
    })),
  };
}

/**
 * The one rule for "the pre-test is done": Parts I to III, meaning the intake, the readiness inventory and every strand
 * pre-test. Learning Content and the dashboard's learning steps both use it.
 *
 * Part IV (the Muse 2 baseline recording) and the readiness result are NOT part of this yet, because the backend has no
 * record of either. When it does, add them here and nowhere else.
 */
export function isPretestComplete(progress: PretestProgress): boolean {
  return progress.intakeDone && progress.lriDone && progress.pretestStrands.length > 0 && progress.pretestStrands.every((s) => s.done);
}

/** Every part the rule looks at, in order, for showing what is done and what is left. */
export function pretestParts(progress: PretestProgress): { label: string; code?: string; done: boolean }[] {
  return [
    { label: "Participant Intake", done: progress.intakeDone },
    { label: "Readiness Inventory", done: progress.lriDone },
    ...progress.pretestStrands.map((s) => ({ label: s.label, code: s.code, done: s.done })),
  ];
}
