import { useCallback, useEffect, useState } from "react";

// Client-side draft of an in-progress attempt, so a reload (or an accidental
// tab close) doesn't lose answers or hand out a fresh timer. Keyed by
// (kind, learner, test) so drafts for different tests never interfere. Answers
// are keyed by item_id (option_id / answer_value as values), never by display
// position, so they realign with the deterministic per-(learner, test) shuffle.
//
// What's stored is the attempt's true start timestamp, not "time remaining" -
// remaining time goes stale the moment it's written and is recomputed from
// `startedAt` on every restore. localStorage only: same browser/device.

export type AttemptKind = "strand" | "lri";

export interface AttemptDraft<A> {
  startedAt: number;
  answers: Record<number, A>;
  current: number;
}

const draftKey = (kind: AttemptKind, learnerId: string | number, testId: number) =>
  `als:attempt-draft:v1:${kind}:${learnerId}:${testId}`;

function readDraft<A>(key: string): AttemptDraft<A> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.startedAt !== "number" || !Number.isFinite(parsed.startedAt) || typeof parsed.answers !== "object" || parsed.answers === null) return null;
    return { startedAt: parsed.startedAt, answers: parsed.answers, current: Number.isInteger(parsed.current) && parsed.current >= 0 ? parsed.current : 0 };
  } catch {
    return null;
  }
}

function writeDraft<A>(key: string, draft: AttemptDraft<A>) {
  try { window.localStorage.setItem(key, JSON.stringify(draft)); } catch { /* storage blocked/full: the attempt still works, just isn't resumable */ }
}

function removeDraft(key: string) {
  try { window.localStorage.removeItem(key); } catch { /* nothing to clear */ }
}

/** True when an unsubmitted draft is saved for this attempt (the hub labels it "Resume"). */
export const hasAttemptDraft = (kind: AttemptKind, learnerId: string | number, testId: number) =>
  readDraft(draftKey(kind, learnerId, testId)) !== null;

/** Drops a draft the server already shows as completed (e.g. submitted from another device). */
export const discardAttemptDraft = (kind: AttemptKind, learnerId: string | number, testId: number) =>
  removeDraft(draftKey(kind, learnerId, testId));

// Which attempt screen a hub has open, per browser tab (sessionStorage). The
// hubs route by URL but hold the open attempt in React state, so without this
// a reload drops the learner back on the hub - the draft is intact, but it
// looks lost. The hub reads it once after loading and reopens that attempt.
export type HubName = "pretest" | "posttest";
export interface OpenAttempt { kind: AttemptKind; testId: number }

const openAttemptKey = (hub: HubName) => `als:open-attempt:v1:${hub}`;

export function rememberOpenAttempt(hub: HubName, open: OpenAttempt | null) {
  try {
    if (open) window.sessionStorage.setItem(openAttemptKey(hub), JSON.stringify(open));
    else window.sessionStorage.removeItem(openAttemptKey(hub));
  } catch { /* storage blocked: a reload just lands on the hub */ }
}

export function readOpenAttempt(hub: HubName): OpenAttempt | null {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(openAttemptKey(hub)) ?? "null");
    return parsed && (parsed.kind === "strand" || parsed.kind === "lri") && Number.isInteger(parsed.testId) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Draft state for one attempt. `draft` is null until the learner starts (and
 * again after `clear`); a saved draft found on mount means the attempt is
 * resuming. Every change to the draft is written through immediately.
 */
export function useAttemptDraft<A>(kind: AttemptKind, learnerId: string | number, testId: number) {
  const key = draftKey(kind, learnerId, testId);
  const [draft, setDraft] = useState<AttemptDraft<A> | null>(() => readDraft<A>(key));

  useEffect(() => { if (draft) writeDraft(key, draft); }, [key, draft]);

  const start = useCallback(() => setDraft({ startedAt: Date.now(), answers: {}, current: 0 }), []);
  const setAnswer = useCallback((itemId: number, value: A) => setDraft((old) => old && { ...old, answers: { ...old.answers, [itemId]: value } }), []);
  const setCurrent = useCallback((update: (n: number) => number) => setDraft((old) => old && { ...old, current: update(old.current) }), []);
  // Removes storage synchronously; the null state stops the effect re-saving.
  const clear = useCallback(() => { removeDraft(key); setDraft(null); }, [key]);

  return { draft, start, setAnswer, setCurrent, clear };
}
