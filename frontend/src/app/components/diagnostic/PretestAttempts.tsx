import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertCircle, ArrowLeft, ArrowRight, CircleCheck, Clock, LoaderCircle, Maximize2, X } from "lucide-react";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  STRAND_SHORT_LABEL,
  getLriTestWithItems,
  getStrandTestWithItems,
  submitLriAttempt,
  submitStrandAttempt,
} from "../../../lib/api/diagnostic";
import { getErrorMessage, isAttemptAlreadySubmitted } from "../../../lib/api/errors";
import type { LriAnswerValue, LriTestListItem, StrandTestListItem } from "../../../lib/api/types";
import { LIKERT_OPTIONS, isComplete, toLriAttemptCreate, toStrandAttemptCreate } from "./pretestLogic";
import { useAttemptDraft } from "./attemptDraft";
import { shuffleForLearner } from "./shuffle";
import { LRI_TEST_TIME_LIMIT_SECONDS, STRAND_TEST_TIME_LIMIT_SECONDS, TIME_RUNNING_LOW_SECONDS, TIME_WARNING_SECONDS, formatCountdown, useCountdown, useSubmitOnExpiry } from "./testTiming";
import { TestOverviewModal } from "./TestOverviewModal";

// The screens a learner sees while taking a strand test or the LRI: an
// overview modal, then the questions, then a plain success message - no score
// is fetched or shown here (results-retrieval stays correct on the backend,
// it's just not surfaced on this screen). A failure is shown as a failure
// (with a retry), never replaced by placeholder content.
//
// StrandAttempt is generic over test_type - it doesn't know or care whether
// `test` is a pretest or a posttest (both are plain StrandTestListItems from
// the same endpoints). The posttest hub (learner/PostTest.tsx) reuses it
// directly rather than duplicating it, passing its own `stage` and `backLabel`;
// LriAttempt has no posttest equivalent.
//
// Both render in DESIGN.md's focused test mode: no sidebar, a white header with
// the wordmark, the stage and "Save & Exit", and one centered column on paper.

const ALREADY_SUBMITTED_MESSAGE = "You've already submitted this test (perhaps on another tab or device) - nothing more to do here.";
const SUBMIT_SUCCESS_MESSAGE = "Good work. Your answers are saved.";
const answeredLine = (answered: number, total: number) => `You answered ${answered} of ${total} questions.`;

/** What the success screen offers after a submit: the next unfinished test in the same stage. Never a score. */
export type NextStep = { label: string; onOpen: () => void };
/** Shown instead when the clock ran out; unanswered questions are named so the result isn't a surprise. */
const timeUpMessage = (answered: number, total: number) =>
  `Time's up. Your answers were submitted. You answered ${answered} of ${total} questions.`;

// ── Look ─────────────────────────────────────────────────────────────────────

// TEMPORARY, as in AppLayout: these screens render outside AppLayout, so they load the DM fonts themselves.
const fontCss = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');";

// Type roles from DESIGN.md: serif headings and short question stems, DM Sans chrome, Atkinson Hyperlegible for what learners read.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;
const chrome = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
// One curve for every state change on these screens (DESIGN.md, Common Fate).
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
// Pressable controls dip slightly on press; under reduced motion they only change color.
const press = `active:scale-[0.97] motion-reduce:active:scale-100 disabled:active:scale-100 transition-[background-color,border-color,color,scale] duration-150 ${easeOut}`;
const buttonBase = `h-12 min-w-40 px-6 inline-flex items-center justify-center gap-2 rounded-xl text-[0.9375rem] font-bold tracking-[0.01em] disabled:cursor-not-allowed ${press} ${focus}`;
// "Not yet" stays readable: a muted fill rather than near-invisible grey.
const primaryButton = `${buttonBase} bg-[#00538A] text-white hover:bg-[#004270] disabled:bg-[#E1E2E7] disabled:text-[#4A4F5C]`;
const secondaryButton = `${buttonBase} border border-[#00538A] bg-white text-[#00538A] hover:bg-[#CFE4FF] disabled:border-[#E2E0DA] disabled:bg-transparent disabled:text-[#6B7080]`;
const card = "bg-white border border-[#E2E0DA] rounded-2xl";

// ── Shared pieces ────────────────────────────────────────────────────────────

type LoadState<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

/** Runs `load` on mount and again whenever the returned retry function is called. */
function useLoad<T>(load: () => Promise<T>, errorFallback: string): [LoadState<T>, () => void] {
  const [state, setState] = useState<LoadState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    load()
      .then((data) => { if (!cancelled) setState({ status: "ready", data }); })
      .catch((err) => { if (!cancelled) setState({ status: "error", message: getErrorMessage(err, errorFallback) }); });
    return () => { cancelled = true; };
    // `load` is stable for a given screen; only a retry should re-run it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return [state, () => setAttempt((n) => n + 1)];
}

/** Quiet until the warning point: muted text, error red from 10 minutes left, then darker error ink at zero. Plain text, not a chip. */
function Countdown({ secondsLeft, expired }: { secondsLeft: number; expired: boolean }) {
  const runningLow = !expired && secondsLeft <= TIME_RUNNING_LOW_SECONDS;
  const tone = expired ? "text-[#7A1A12] font-bold" : runningLow ? "text-[#B42318] font-bold" : "text-[#4A4F5C] font-medium";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[0.9375rem] tabular-nums whitespace-nowrap transition-colors duration-200 ${easeOut} ${tone}`}>
      <Clock className="w-[18px] h-[18px]" aria-hidden="true" />
      {expired ? "Time's up" : `${formatCountdown(secondsLeft)} left`}
    </span>
  );
}

/**
 * Focused test mode frame. `title` names the stage in the header ("Readiness Profiling");
 * the exit button closes the attempt - answers are already saved as a draft on
 * every change, so leaving keeps them. `exitHint` says what leaving does, as
 * visible text (a tooltip would never open on touch): inline just before the
 * exit button on wide screens, and on its own line under the bar on narrow ones,
 * so the header row itself stays one centered 64px line. `wide` is for the LRI table; `maxWidth` overrides the column
 * width and `compact` trims the vertical padding, for screens that must fit one viewport without scrolling.
 */
export function AttemptShell({ title, onClose, exitLabel = "Save & Exit", exitHint, countdown, footer, wide = false, maxWidth, compact = false, children }: { title: string; onClose: () => void; exitLabel?: string; exitHint?: string; countdown?: ReactNode; footer?: ReactNode; wide?: boolean; maxWidth?: string; compact?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F8F6F2] text-[#1B1D26] selection:bg-[#FFAB2E]/50" style={chrome}>
      <style>{fontCss}</style>
      <header className="sticky top-0 z-10 bg-white border-b border-[#E2E0DA]">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[#00538A] text-[1.75rem] leading-none" style={display}>ALSense</span>
            <span className="h-6 w-px shrink-0 bg-[#E2E0DA]" aria-hidden="true" />
            <span className="text-[0.9375rem] font-bold text-[#4A4F5C] truncate">{title}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {countdown}
            {countdown && exitHint && <span className="hidden lg:block h-6 w-px bg-[#E2E0DA]" aria-hidden="true" />}
            {exitHint && <p id="exit-hint" className="hidden lg:block text-[0.9375rem] text-[#4A4F5C]">{exitHint}</p>}
            <button onClick={onClose} aria-describedby={exitHint ? "exit-hint" : undefined} className={`h-11 px-3 -mr-2 inline-flex items-center gap-1.5 rounded-lg text-[0.9375rem] font-bold text-[#1B1D26] hover:bg-[#F2F1ED] ${press} ${focus}`}>
              <X className="w-5 h-5" aria-hidden="true" /> {exitLabel}
            </button>
          </div>
        </div>
        {/* Narrow screens: the same hint, right-aligned under the row (screen readers get it from #exit-hint either way). */}
        {exitHint && <p aria-hidden="true" className="lg:hidden px-4 sm:px-6 pb-2 -mt-1 text-right text-[0.9375rem] leading-5 text-[#4A4F5C]">{exitHint}</p>}
      </header>
      <main className={`flex-1 px-4 sm:px-6 ${compact ? "py-6" : "py-10 sm:py-12"}`}>
        <div className={`mx-auto ${maxWidth ?? (wide ? "max-w-5xl" : "max-w-3xl")}`}>{children}</div>
      </main>
      {/* Sticks to the bottom of the viewport while its natural spot is below the fold; at the end of a long page it rests
          under main's bottom padding, so the last answer is never covered. */}
      {footer && (
        <div className="sticky bottom-0 z-10 border-t border-[#E2E0DA] bg-white px-4 sm:px-6 pb-[env(safe-area-inset-bottom)]">
          <div className={`mx-auto py-3 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>{footer}</div>
        </div>
      )}
    </div>
  );
}

function Loading() {
  return <div className="py-16 flex justify-center"><LoaderCircle className="w-7 h-7 text-[#00538A] motion-safe:animate-spin" aria-label="Loading" /></div>;
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#B42318] bg-[#FDECEA] p-5 text-[#7A1A12]">
      <span className="flex items-start gap-3 text-lg leading-snug" style={reading}><AlertCircle className="w-5 h-5 mt-1 shrink-0" aria-hidden="true" />{message}</span>
      <button onClick={onRetry} className={secondaryButton}>Try again</button>
    </div>
  );
}

function SubmitError({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-4 text-lg leading-snug text-[#7A1A12]" style={reading}>
      <AlertCircle className="w-5 h-5 mt-1 shrink-0" aria-hidden="true" />{message}
    </p>
  );
}

function SubmitButton({ disabled, saving, onSubmit }: { disabled: boolean; saving: boolean; onSubmit: () => void }) {
  return (
    <button onClick={onSubmit} disabled={disabled || saving} aria-busy={saving} className={primaryButton}>
      {saving ? <><LoaderCircle className="w-5 h-5 motion-safe:animate-spin" aria-hidden="true" /> Submitting…</> : "Submit my answers"}
    </button>
  );
}

/** Used by the LRI: the submit action on its own row under the table. */
function SubmitBar({ disabled, saving, error, onSubmit }: { disabled: boolean; saving: boolean; error: string; onSubmit: () => void }) {
  return (
    <div className="border-t border-[#E2E0DA] pt-6 mt-8">
      {error && <div className="mb-6"><SubmitError message={error} /></div>}
      <div className="flex justify-end"><SubmitButton disabled={disabled} saving={saving} onSubmit={onSubmit} /></div>
    </div>
  );
}

/** Plain success state after a submission (or a 409 "already submitted") - no score, per the locked decision. */
/**
 * `next`: a test to offer (primary button, with "Back" as the secondary), `null` when nothing in the stage is left
 * (the hub is the only button), or left out when it isn't known (a single "Back" button).
 */
function AttemptSuccess({ title, message, detail, next, closeLabel, onClose }: { title: string; message: string; detail?: string; next?: NextStep | null; closeLabel: string; onClose: () => void }) {
  return (
    <section className={`${card} px-6 py-12 sm:px-8 text-center`}>
      <span className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-[#CFE4FF] text-[#00538A]"><CircleCheck className="w-8 h-8" aria-hidden="true" /></span>
      <h1 className="mt-6 text-[2rem] leading-[1.2]" style={display}>{title}</h1>
      <div data-testid="attempt-success" className="mt-3 mx-auto max-w-[46ch] space-y-1 text-lg leading-[1.6] text-[#4A4F5C]" style={reading}>
        <p>{message}</p>
        {detail && <p>{detail}</p>}
        {next === null && <p>That was the last one. Everything in this stage is done.</p>}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {next ? (
          <>
            <button onClick={next.onOpen} className={primaryButton}>{next.label}</button>
            <button onClick={onClose} className={secondaryButton}>{closeLabel}</button>
          </>
        ) : <button onClick={onClose} className={primaryButton}>{closeLabel}</button>}
      </div>
    </section>
  );
}

/** Shown in the last TIME_WARNING_SECONDS so the auto-submit at zero isn't a surprise. */
function TimeWarningNotice() {
  return (
    <p role="status" className="flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-4 text-lg leading-snug text-[#7A1A12]" style={reading}>
      <Clock className="w-5 h-5 mt-1 shrink-0 text-[#B42318]" aria-hidden="true" />
      Less than a minute left. When time runs out, your answers will be submitted automatically as they are.
    </p>
  );
}

/**
 * Shown once the time limit has run out - live, or already on restoring a draft
 * after a reload. Answers are locked either way, and the attempt is being (or,
 * if that failed, can be re-) submitted as it stands.
 */
function TimeUpNotice() {
  return (
    <p role="status" className="flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-4 text-lg leading-snug text-[#7A1A12]" style={reading}>
      <AlertCircle className="w-5 h-5 mt-1 shrink-0" aria-hidden="true" />
      Time's up. Your answers are locked and are being submitted as they are. Unanswered questions count as incorrect.
    </p>
  );
}

/** One answer row: the whole row is the label of a visually hidden native radio, so arrow keys and screen readers work as a radio group. */
function AnswerOption({ name, text, selected, locked, onSelect }: { name: string; text: string; selected: boolean; locked: boolean; onSelect: () => void }) {
  const state = selected
    ? "border-[#00538A] bg-[#CFE4FF] shadow-[inset_0_0_0_1px_#00538A]"
    : locked ? "border-[#E2E0DA] bg-[#F2F1ED] text-[#4A4F5C]" : "border-[#8A8F9C] bg-white hover:border-[#00538A]";
  return (
    <label
      className={`flex min-h-[76px] items-center gap-4 rounded-xl border px-6 py-4 transition-[background-color,border-color,box-shadow,scale] duration-150 ${easeOut} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#00538A] ${state} ${locked ? "cursor-not-allowed" : "cursor-pointer active:scale-[0.99] motion-reduce:active:scale-100"}`}
    >
      <input type="radio" name={name} checked={selected} disabled={locked} onChange={onSelect} className="sr-only" />
      {/* Pinned inline at 18px (DESIGN.md, Body Learner) so no inherited label/button size can shrink it. */}
      <span className="flex-1 font-normal leading-[1.6]" style={{ ...reading, fontSize: "1.125rem" }}>{text}</span>
      <span aria-hidden="true" className={`grid place-items-center w-6 h-6 shrink-0 rounded-full border-2 bg-white transition-colors duration-150 ${easeOut} ${selected ? "border-[#00538A]" : "border-[#8A8F9C]"}`}>
        {/* The dot grows in from half size; under reduced motion it only fades. */}
        <span className={`w-3 h-3 rounded-full bg-[#00538A] transition-[opacity,scale] duration-150 ${easeOut} ${selected ? "opacity-100 scale-100" : "opacity-0 scale-50 motion-reduce:scale-100"}`} />
      </span>
    </label>
  );
}

/**
 * A question's picture (often a reading passage) at the card's full width. The
 * picture is a button that opens it larger in a dialog; Escape, the Close
 * button or a click outside closes it, and focus returns to the picture.
 * Rendered inside the keyed question card, so the open state resets per question.
 */
function QuestionImage({ src, label }: { src: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        disabled={failed}
        aria-label={`${label}. Open it larger.`}
        className={`group mb-6 block w-full rounded-xl text-left enabled:cursor-zoom-in ${focus}`}
      >
        <ImageWithFallback src={src} alt={label} onError={() => setFailed(true)} className="block w-full h-auto rounded-xl border border-[#E2E0DA]" />
        {!failed && (
          <span className="mt-2 inline-flex items-center gap-1.5 text-[0.9375rem] font-bold text-[#00538A] underline-offset-4 group-hover:underline">
            <Maximize2 className="w-4 h-4" aria-hidden="true" /> See the picture larger
          </span>
        )}
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={`fixed inset-0 z-50 bg-[#1B1D26]/70 transition-opacity duration-200 ${easeOut} starting:opacity-0`} />
        {/* Floats, so it takes the one soft shadow DESIGN.md allows. Enters with a fade and, motion allowing, a slight scale. */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex w-max max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-4rem)] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-4rem)] flex-col rounded-2xl bg-white shadow-[0_8px_24px_rgba(27,29,38,0.08)] transition-[opacity,scale] duration-200 ${easeOut} starting:opacity-0 motion-safe:starting:scale-[0.97] focus:outline-none`}
          style={chrome}
        >
          <div className="flex items-center justify-between gap-4 border-b border-[#E2E0DA] py-2 pl-6 pr-3">
            <DialogPrimitive.Title className="text-[0.9375rem] font-bold text-[#1B1D26]">{label}</DialogPrimitive.Title>
            <DialogPrimitive.Close className={`h-11 px-3 inline-flex items-center gap-1.5 rounded-lg text-[0.9375rem] font-bold text-[#1B1D26] hover:bg-[#F2F1ED] ${press} ${focus}`}>
              <X className="w-5 h-5" aria-hidden="true" /> Close
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-[#F2F1ED] p-4 sm:p-6">
            {/* The dialog hugs the picture: as wide as it needs (up to 64rem or the screen), as tall as it is (up to the screen), then it scrolls here. */}
            <img src={src} alt={label} className="block h-auto w-[min(64rem,calc(100vw-3.5rem))] sm:w-[min(64rem,calc(100vw-7rem))] rounded-lg" />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Question stems are Headlines in the serif; short ones run larger, long ones switch to the reading face (DESIGN.md, Serif-Is-For-Headings). */
function stemStyle(text: string): { className: string; style: typeof display | typeof reading } {
  const words = text.trim().split(/\s+/).length;
  if (words > 25) return { className: "text-2xl leading-[1.5]", style: reading };
  if (words <= 10) return { className: "text-[2rem] sm:text-[2.5rem] leading-[1.15]", style: display };
  return { className: "text-[2rem] leading-[1.2]", style: display };
}

/** What a strand test is called in this stage, for the success screen: "English post-test", "English diagnostic exam". */
const PROFILING = "Readiness Profiling";
const strandName = (test: StrandTestListItem, stage: string) => `${STRAND_SHORT_LABEL[test.strand_code] ?? test.strand_name} ${stage === PROFILING ? "diagnostic exam" : stage.toLowerCase()}`;
const strandTitle = (test: StrandTestListItem) => `${STRAND_SHORT_LABEL[test.strand_code] ?? test.strand_name} diagnostic exam`;

// ── Strand: take the test ────────────────────────────────────────────────────

export function StrandAttempt({ test, learnerId, onClose, stage = PROFILING, backLabel = stage === PROFILING ? `Back to ${PROFILING}` : `Back to ${stage.toLowerCase()}`, next }: { test: StrandTestListItem; learnerId: string | number; onClose: () => void; stage?: string; backLabel?: string; next?: NextStep | null }) {
  const [detail, retry] = useLoad(() => getStrandTestWithItems(test.test_id), "This test could not be opened.");
  // A saved draft means this is a resumed attempt: skip the overview, restore answers and position.
  const { draft, start, setAnswer, setCurrent, clear } = useAttemptDraft<number>("strand", learnerId, test.test_id);
  const phase = draft ? "in-progress" : "overview";
  const answers = draft?.answers ?? {};
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [finished, setFinished] = useState<{ alreadySubmitted: boolean; counts?: { answered: number; total: number }; timeUp?: { answered: number; total: number } } | null>(null);

  const rawItems = detail.status === "ready" ? detail.data.items : [];
  // Computed once per loaded attempt - stable across re-renders while answering,
  // stable across a reload for the same learner+test (deterministic seed).
  const items = useMemo(() => shuffleForLearner(rawItems, learnerId, test.test_id), [rawItems, learnerId, test.test_id]);
  // Clamped so a restored position can't point past the end if the item set shrank since.
  const current = Math.min(draft?.current ?? 0, Math.max(0, items.length - 1));

  const { secondsLeft, expired } = useCountdown(STRAND_TEST_TIME_LIMIT_SECONDS, draft?.startedAt ?? null);

  // Used for both a manual submit and the time-limit auto-submit below.
  const submit = async () => {
    setSaving(true); setSubmitError("");
    try {
      await submitStrandAttempt(test.test_id, toStrandAttemptCreate(items, answers));
      clear();
      // `expired` is the latest render's value, so it is true when the clock triggered this submit.
      const answered = items.filter((it) => answers[it.item_id] !== undefined).length;
      setFinished({ alreadySubmitted: false, counts: { answered, total: items.length }, timeUp: expired ? { answered, total: items.length } : undefined });
    } catch (err) {
      // A 409 means another tab/device already submitted: that's a completed
      // state to show, not an error to surface.
      if (isAttemptAlreadySubmitted(err)) { clear(); setFinished({ alreadySubmitted: true }); }
      else setSubmitError(getErrorMessage(err, "Your answers could not be submitted. Please try again."));
    } finally { setSaving(false); }
  };

  // Time's up (live, or on restoring an already-expired draft): submit what's answered.
  useSubmitOnExpiry(expired, detail.status === "ready" && items.length > 0 && !saving && !finished, submit);

  // After Back/Next, move focus to the new question so a screen reader reads it,
  // and bring the top of the page back into view if the learner had scrolled down.
  const stemRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const goTo = (index: number) => { moved.current = true; setCurrent(() => index); };
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    stemRef.current?.focus({ preventScroll: true });
    if (window.scrollY > 0) window.scrollTo({ top: 0 });
  }, [current]);

  if (finished) {
    return (
      <AttemptShell title={stage} onClose={onClose} exitLabel="Exit">
        <AttemptSuccess
          title={`${strandName(test, stage)} submitted`}
          message={finished.alreadySubmitted ? ALREADY_SUBMITTED_MESSAGE : finished.timeUp ? timeUpMessage(finished.timeUp.answered, finished.timeUp.total) : SUBMIT_SUCCESS_MESSAGE}
          detail={!finished.alreadySubmitted && !finished.timeUp && finished.counts ? answeredLine(finished.counts.answered, finished.counts.total) : undefined}
          next={next}
          closeLabel={backLabel}
          onClose={onClose}
        />
      </AttemptShell>
    );
  }

  if (phase === "overview") {
    return (
      <AttemptShell title={stage} onClose={onClose} exitLabel="Exit">
      <TestOverviewModal
        title={strandTitle(test)}
        description={`Diagnostic exam for ${STRAND_SHORT_LABEL[test.strand_code] ?? test.strand_name}. Read each question carefully and choose the best answer for every item before submitting.`}
        timeLimitSeconds={STRAND_TEST_TIME_LIMIT_SECONDS}
        itemCount={detail.status === "ready" ? rawItems.length : undefined}
        onStart={start}
        onCancel={onClose}
      />
      </AttemptShell>
    );
  }

  const item = items[current];
  const total = items.length;
  const answeredCount = items.filter((it) => answers[it.item_id] !== undefined).length;
  const complete = isComplete(items, answers);
  const firstUnanswered = items.findIndex((it) => answers[it.item_id] === undefined);
  // Submit takes Next's place on the last question - and on any question once
  // time is up, since that's where a failed auto-submit is retried.
  const showSubmit = current === total - 1 || expired;
  const stem = item ? stemStyle(item.question_text) : null;
  const stemId = item ? `question-${item.item_id}` : undefined;

  // Pinned in AttemptShell's footer so Back and Next stay in view whatever notices or question length are above.
  const footer = detail.status === "ready" && item && (
    <div className="flex items-center justify-between gap-4">
      <button onClick={() => goTo(current - 1)} disabled={current === 0} className={secondaryButton}><ArrowLeft className="w-5 h-5" aria-hidden="true" /> Back</button>
      {showSubmit
        // After expiry an incomplete attempt is submittable too - that's the retry if the auto-submit failed.
        ? <SubmitButton disabled={!expired && !complete} saving={saving} onSubmit={submit} />
        : <button onClick={() => goTo(current + 1)} className={primaryButton}>Next <ArrowRight className="w-5 h-5" aria-hidden="true" /></button>}
    </div>
  );

  return (
    <AttemptShell
      title={stage}
      onClose={onClose}
      exitHint="Your answers are saved. The timer keeps running."
      footer={footer || undefined}
      countdown={secondsLeft !== null ? <Countdown secondsLeft={secondsLeft} expired={expired} /> : undefined}
    >
      <p className="text-[0.9375rem] font-bold uppercase tracking-[0.06em] leading-snug text-[#4D35BD]">
        {test.strand_code}: {STRAND_SHORT_LABEL[test.strand_code] ?? test.strand_name}
      </p>

      {detail.status === "loading" && <Loading />}
      {detail.status === "error" && <div className="mt-6"><LoadError message={detail.message} onRetry={retry} /></div>}
      {detail.status === "ready" && total === 0 && <p className="mt-6 text-lg text-[#4A4F5C]" style={reading}>This test has no questions yet.</p>}
      {detail.status === "ready" && item && stem && (
        <>
          <p className="mt-2 text-[0.9375rem] font-bold tabular-nums">Question {current + 1} of {total}</p>
          {/* Answered progress, with its label on the same row (DESIGN.md, Connectedness), so it can't be read as
              the question position above. The fill slides rather than stretches, so its rounded end keeps its shape. */}
          <div className="mt-2 flex items-center gap-4">
            <div role="progressbar" aria-labelledby="answered-label" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredCount} className="h-2 flex-1 rounded-full bg-[#E1E2E7] overflow-hidden">
              <div className={`h-full rounded-full bg-[#4D35BD] motion-safe:transition-[translate] duration-200 ${easeOut}`} style={{ translate: `${(answeredCount / total) * 100 - 100}% 0` }} />
            </div>
            <p id="answered-label" className="shrink-0 text-[0.9375rem] text-[#4A4F5C] tabular-nums">{answeredCount} of {total} answered</p>
          </div>

          {/* Notices sit above the question card, under the progress bar, so they never push Back and Next out of view. */}
          {(expired || (secondsLeft !== null && secondsLeft <= TIME_WARNING_SECONDS) || submitError) && (
            <div className="mt-6 space-y-3">
              {expired ? <TimeUpNotice /> : secondsLeft !== null && secondsLeft <= TIME_WARNING_SECONDS && <TimeWarningNotice />}
              {submitError && <SubmitError message={submitError} />}
            </div>
          )}

          {/* Keyed by item so each new question settles in: a short fade, plus a small rise when motion is allowed. */}
          <section key={item.item_id} className={`mt-12 ${card} p-6 sm:p-8 transition-[opacity,translate] duration-200 ${easeOut} starting:opacity-0 motion-safe:starting:translate-y-1`}>
            {/* Not every question has an image (asset_url is null when there's none, or storage isn't configured). */}
            {item.asset_url && <QuestionImage src={item.asset_url} label={`Picture for question ${current + 1}`} />}
            <h1 id={stemId} ref={stemRef} tabIndex={-1} className={`text-pretty whitespace-pre-line text-[#1B1D26] outline-none ${stem.className}`} style={stem.style}>{item.question_text}</h1>
            <div role="radiogroup" aria-labelledby={stemId} className="mt-8 space-y-3">
              {item.options.map((option) => (
                <AnswerOption
                  key={option.option_id}
                  name={`item-${item.item_id}`}
                  text={option.option_text}
                  selected={answers[item.item_id] === option.option_id}
                  locked={expired}
                  onSelect={() => setAnswer(item.item_id, option.option_id)}
                />
              ))}
            </div>
          </section>

          {showSubmit && !complete && !expired && firstUnanswered >= 0 && (
            <p className="mt-6 text-lg leading-snug text-[#4A4F5C]" style={reading}>
              {total - answeredCount === 1 ? "1 question still needs an answer." : `${total - answeredCount} questions still need an answer.`}{" "}
              <button onClick={() => goTo(firstUnanswered)} className={`rounded-sm font-bold text-[#00538A] underline underline-offset-4 decoration-[#00538A]/40 hover:decoration-[#00538A] ${focus}`} style={chrome}>
                Go to question {firstUnanswered + 1}
              </button>
            </p>
          )}
        </>
      )}
    </AttemptShell>
  );
}

// ── LRI: take the inventory ──────────────────────────────────────────────────

export function LriAttempt({ test, learnerId, onClose, next }: { test: LriTestListItem; learnerId: string | number; onClose: () => void; next?: NextStep | null }) {
  // The LRI detail always includes its statements - there's no include_items switch.
  const [detail, retry] = useLoad(() => getLriTestWithItems(test.test_id), "The Learner Readiness Inventory could not be opened.");
  const { draft, start, setAnswer, clear } = useAttemptDraft<LriAnswerValue>("lri", learnerId, test.test_id);
  const phase = draft ? "in-progress" : "overview";
  const answers = draft?.answers ?? {};
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [finished, setFinished] = useState<{ alreadySubmitted: boolean; counts?: { answered: number; total: number } } | null>(null);

  const rawItems = detail.status === "ready" ? detail.data.items : [];
  const items = useMemo(() => shuffleForLearner(rawItems, learnerId, test.test_id), [rawItems, learnerId, test.test_id]);

  const { secondsLeft, expired } = useCountdown(LRI_TEST_TIME_LIMIT_SECONDS, draft?.startedAt ?? null);

  if (finished) {
    return (
      <AttemptShell title={PROFILING} onClose={onClose} exitLabel="Exit">
        <AttemptSuccess
          title="Learner Readiness Inventory submitted"
          message={finished.alreadySubmitted ? ALREADY_SUBMITTED_MESSAGE : SUBMIT_SUCCESS_MESSAGE}
          detail={!finished.alreadySubmitted && finished.counts ? answeredLine(finished.counts.answered, finished.counts.total) : undefined}
          next={next}
          closeLabel={`Back to ${PROFILING}`}
          onClose={onClose}
        />
      </AttemptShell>
    );
  }

  if (phase === "overview") {
    return (
      <AttemptShell title={PROFILING} onClose={onClose} exitLabel="Exit">
      <TestOverviewModal
        title={test.title}
        description={test.description}
        timeLimitSeconds={LRI_TEST_TIME_LIMIT_SECONDS}
        itemCount={detail.status === "ready" ? rawItems.length : undefined}
        onStart={start}
        onCancel={onClose}
      />
      </AttemptShell>
    );
  }

  const answeredCount = items.filter((it) => answers[it.item_id] !== undefined).length;

  const submit = async () => {
    setSaving(true); setSubmitError("");
    try {
      await submitLriAttempt(test.test_id, toLriAttemptCreate(items, answers));
      clear();
      setFinished({ alreadySubmitted: false, counts: { answered: items.filter((it) => answers[it.item_id] !== undefined).length, total: items.length } });
    } catch (err) {
      if (isAttemptAlreadySubmitted(err)) { clear(); setFinished({ alreadySubmitted: true }); }
      else setSubmitError(getErrorMessage(err, "Your LRI responses could not be submitted. Please try again."));
    } finally { setSaving(false); }
  };

  return (
    <AttemptShell
      title={PROFILING}
      wide
      onClose={onClose}
      exitHint={LRI_TEST_TIME_LIMIT_SECONDS === null ? "Your answers are saved." : "Your answers are saved. The timer keeps running."}
      countdown={secondsLeft !== null ? <Countdown secondsLeft={secondsLeft} expired={expired} /> : undefined}
    >
      <section className={`${card} p-6 sm:p-8`}>
        <h1 className="text-[2rem] leading-[1.2]" style={display}>{test.title}</h1>
        <p className="mt-2 mb-8 text-lg text-[#4A4F5C]" style={reading}>Select one response for every statement.</p>
        {detail.status === "loading" && <Loading />}
        {detail.status === "error" && <LoadError message={detail.message} onRetry={retry} />}
        {detail.status === "ready" && items.length === 0 && <p className="text-lg text-[#4A4F5C]" style={reading}>This inventory has no statements yet.</p>}
        {detail.status === "ready" && items.length > 0 && (
          <>
            <div className="mb-6 flex items-center gap-4">
              <div role="progressbar" aria-labelledby="lri-answered-label" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={answeredCount} className="h-2 flex-1 rounded-full bg-[#E1E2E7] overflow-hidden">
                <div className={`h-full rounded-full bg-[#00538A] motion-safe:transition-[translate] duration-200 ${easeOut}`} style={{ translate: `${(answeredCount / items.length) * 100 - 100}% 0` }} />
              </div>
              <p id="lri-answered-label" className="shrink-0 text-[0.9375rem] text-[#4A4F5C] tabular-nums">{answeredCount} of {items.length} answered</p>
            </div>
            {/* Hairline rows on white; answered rows take a faint blue wash so the unanswered ones stand out; the column labels stay under the sticky header while the learner scrolls. Each Likert cell is a
                48px+ tap target: the whole cell is the label of a visually hidden native radio, drawn like the question screen's answer options. */}
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr>
                  <th scope="col" className="sticky top-[5.5rem] lg:top-16 z-[1] bg-[#F2F1ED] border-b border-[#E2E0DA] rounded-tl-xl px-4 py-3 text-left text-[0.9375rem] font-bold tracking-[0.01em] text-[#1B1D26]" style={chrome}>Statement</th>
                  {LIKERT_OPTIONS.map(({ label }, column) => <th key={label} scope="col" className={`sticky top-[5.5rem] lg:top-16 z-[1] w-[5.5rem] sm:w-28 bg-[#F2F1ED] border-b border-[#E2E0DA] px-1 py-3 text-center text-[0.9375rem] font-bold leading-tight tracking-[0.01em] text-[#1B1D26] ${column === LIKERT_OPTIONS.length - 1 ? "rounded-tr-xl" : ""}`} style={chrome}>{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.item_id} className={`border-b border-[#E2E0DA] last:border-b-0 transition-colors duration-150 ${easeOut} ${answers[item.item_id] !== undefined ? "bg-[#CFE4FF]/25" : ""}`}>
                    <th scope="row" className="px-4 py-4 text-left align-middle font-normal text-[#1B1D26]">
                      <span className="leading-[1.6]" style={{ ...reading, fontSize: "1.125rem" }}><span className="mr-2 font-bold tabular-nums text-[#4A4F5C]">{index + 1}.</span>{item.question_text}</span>
                    </th>
                    {LIKERT_OPTIONS.map(({ label, value }) => {
                      const selected = answers[item.item_id] === value;
                      return (
                        <td key={value} className="p-1 align-middle">
                          <label className={`flex h-14 items-center justify-center rounded-xl transition-[background-color,scale] duration-150 ${easeOut} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-2px] has-[:focus-visible]:outline-[#00538A] ${selected ? "bg-[#CFE4FF]" : expired ? "" : "hover:bg-[#F2F1ED]"} ${expired ? "cursor-not-allowed" : "cursor-pointer active:scale-[0.97] motion-reduce:active:scale-100"}`}>
                            <input aria-label={`${item.question_text}: ${label}`} type="radio" name={`item-${item.item_id}`} value={value} checked={selected} disabled={expired} onChange={() => setAnswer(item.item_id, value)} className="sr-only" />
                            <span aria-hidden="true" className={`grid place-items-center w-6 h-6 rounded-full border-2 transition-colors duration-150 ${easeOut} ${selected ? "border-[#00538A] bg-white" : expired ? "border-[#E2E0DA] bg-[#F2F1ED]" : "border-[#8A8F9C] bg-white"}`}>
                              <span className={`w-3 h-3 rounded-full bg-[#00538A] transition-[opacity,scale] duration-150 ${easeOut} ${selected ? "opacity-100 scale-100" : "opacity-0 scale-50 motion-reduce:scale-100"}`} />
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {expired && <div className="mt-6"><TimeUpNotice /></div>}
            <SubmitBar disabled={!isComplete(items, answers)} saving={saving} error={submitError} onSubmit={submit} />
          </>
        )}
      </section>
    </AttemptShell>
  );
}
