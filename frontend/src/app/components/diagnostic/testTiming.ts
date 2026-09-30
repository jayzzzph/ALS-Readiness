import { useEffect, useRef, useState } from "react";

// Frontend time limits, shared by pretest (this phase) and posttest (Phase 3).
// Nullable by design: a null limit means the test is untimed. The countdown
// runs from the attempt's persisted start time (see attemptDraft.ts), so a
// reload resumes it. At zero a timed attempt locks its answers and is
// submitted automatically with whatever has been answered (useSubmitOnExpiry);
// unanswered items score as incorrect. This replaced an earlier "countdown is
// display-only, never blocks or auto-submits" design: in real use learners
// kept answering past the limit, which made timing the test meaningless.
//
// Enforcement is still client-side only - the schema has no "attempt started
// at" timestamp for the server to check a submission against (only submission
// time is captured), so a tampered client could still submit late.

/** Strand diagnostic exams: 20 multiple-choice items. */
export const STRAND_TEST_TIME_LIMIT_SECONDS: number | null = 30 * 60;

/** Learner Readiness Inventory: untimed by decision - a self-report inventory, not a timed exam. */
export const LRI_TEST_TIME_LIMIT_SECONDS: number | null = null;

/** Seconds left at which the countdown starts warning that the attempt will auto-submit. */
export const TIME_WARNING_SECONDS = 60;

/** "12:34"; caps at 59:59 display-wise only if given a value under an hour (these limits are). */
export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Whole seconds left of `limitSeconds` given the attempt's true start time; never negative. */
export function computeSecondsLeft(limitSeconds: number, startedAt: number, now = Date.now()): number {
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000)); // a start "in the future" (clock change) counts as just started
  return Math.max(0, limitSeconds - elapsed);
}

/**
 * Remaining time for an attempt that began at `startedAtMs` (a persisted
 * timestamp, so a reload resumes rather than restarts). Recomputed from the
 * timestamp every second, so it's correct even on the first render after a
 * restore - including an already-expired one, which yields 0 / `expired`.
 * A null limit (untimed) or null start (attempt not started) means
 * `secondsLeft` stays null and `expired` stays false.
 */
export function useCountdown(limitSeconds: number | null, startedAtMs: number | null): { secondsLeft: number | null; expired: boolean } {
  const compute = () => (limitSeconds === null || startedAtMs === null ? null : computeSecondsLeft(limitSeconds, startedAtMs));
  const [secondsLeft, setSecondsLeft] = useState<number | null>(compute);

  useEffect(() => {
    setSecondsLeft(compute());
    if (limitSeconds === null || startedAtMs === null) return;
    const id = window.setInterval(() => setSecondsLeft(compute()), 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limitSeconds, startedAtMs]);

  return { secondsLeft, expired: secondsLeft === 0 };
}

/**
 * Submits a timed attempt once its time runs out. `expired` comes from
 * useCountdown, so this covers both a live countdown reaching zero and a
 * reload restoring an attempt that had already expired - one path for both.
 * `submit` must be the screen's ordinary (manual) submit, not a separate one.
 *
 * Fires at most once per mounted attempt. `ready` holds it off while there's
 * nothing sensible to submit yet (items still loading) or a submission is
 * already in flight - if a manual submit is racing the clock, this waits for
 * it and only fires if that one failed (on success the draft is cleared and
 * `expired` drops back to false). If the auto-submit itself fails, the screen
 * shows the error and its submit button, which stays usable for a retry.
 */
export function useSubmitOnExpiry(expired: boolean, ready: boolean, submit: () => void) {
  const fired = useRef(false);
  const latestSubmit = useRef(submit);
  latestSubmit.current = submit; // the latest render's submit, so it sends the latest answers

  useEffect(() => {
    if (!expired || !ready || fired.current) return;
    fired.current = true;
    latestSubmit.current();
  }, [expired, ready]);
}
