import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, LoaderCircle } from "lucide-react";
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
import { LRI_TEST_TIME_LIMIT_SECONDS, STRAND_TEST_TIME_LIMIT_SECONDS, TIME_WARNING_SECONDS, formatCountdown, useCountdown, useSubmitOnExpiry } from "./testTiming";
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
// directly rather than duplicating it; LriAttempt has no posttest equivalent.

const ALREADY_SUBMITTED_MESSAGE = "You've already submitted this test (perhaps on another tab or device) - nothing more to do here.";
const SUBMIT_SUCCESS_MESSAGE = "Your responses have been submitted. Thank you for completing this.";

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

function CountdownBadge({ secondsLeft, expired }: { secondsLeft: number; expired: boolean }) {
  const tone = expired ? "bg-red-50 text-red-700" : secondsLeft <= TIME_WARNING_SECONDS ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-[#3535C5]";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${tone}`}>
      <Clock className="w-3.5 h-3.5" /> {expired ? "Time's up" : formatCountdown(secondsLeft)}
    </span>
  );
}

export function AttemptShell({ title, subtitle, onClose, countdown, backLabel = "Back to pre-test", children }: { title: string; subtitle?: string; onClose: () => void; countdown?: ReactNode; backLabel?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F0F4F8] p-4 sm:p-8">
      <main className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-5">
          <button onClick={onClose} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#3535C5]"><ChevronLeft className="w-4 h-4" /> {backLabel}</button>
          {countdown}
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

function Loading() {
  return <div className="py-12 flex justify-center"><LoaderCircle className="w-6 h-6 text-[#3535C5] animate-spin" /></div>;
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
      <span>{message}</span>
      <button onClick={onRetry} className="font-semibold underline shrink-0">Try again</button>
    </div>
  );
}

function SubmitBar({ disabled, saving, error, onSubmit }: { disabled: boolean; saving: boolean; error: string; onSubmit: () => void }) {
  return (
    <div className="border-t border-gray-100 pt-5 mt-6">
      {error && <p role="alert" className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</p>}
      <div className="flex justify-end">
        <button onClick={onSubmit} disabled={disabled || saving} className="px-5 py-2.5 bg-[#3535C5] hover:bg-[#2929a8] text-white rounded-xl text-sm font-medium disabled:bg-gray-200 disabled:text-gray-400">{saving ? "Submitting…" : "Submit baseline responses"}</button>
      </div>
    </div>
  );
}

/** Plain success state after a submission (or a 409 "already submitted") - no score, per the locked decision. */
function AttemptSuccess({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8" /></div>
      <p data-testid="attempt-success" className="text-gray-800 text-base font-medium max-w-md mx-auto">{message}</p>
      <button onClick={onClose} className="mt-8 px-5 py-2.5 rounded-xl bg-[#3535C5] text-white hover:bg-[#2929a8] text-sm font-medium">Back to pre-test</button>
    </div>
  );
}

/** Shown in the last TIME_WARNING_SECONDS so the auto-submit at zero isn't a surprise. */
function TimeWarningNotice() {
  return <p role="status" className="mt-6 p-3 rounded-xl bg-amber-50 text-amber-800 text-sm">Less than a minute left - when time runs out, your answers will be submitted automatically as they are.</p>;
}

/**
 * Shown once the time limit has run out - live, or already on restoring a draft
 * after a reload. Answers are locked either way, and the attempt is being (or,
 * if that failed, can be re-) submitted as it stands.
 */
function TimeUpNotice() {
  return <p role="status" className="mt-6 p-3 rounded-xl bg-red-50 text-red-700 text-sm">Time's up - your answers are locked and are being submitted as they are. Unanswered questions count as incorrect.</p>;
}

const strandTitle = (test: StrandTestListItem) => `${STRAND_SHORT_LABEL[test.strand_code] ?? test.strand_name} diagnostic exam`;

// ── Strand: take the test ────────────────────────────────────────────────────

export function StrandAttempt({ test, learnerId, onClose, backLabel }: { test: StrandTestListItem; learnerId: string | number; onClose: () => void; backLabel?: string }) {
  const [detail, retry] = useLoad(() => getStrandTestWithItems(test.test_id), "This test could not be opened.");
  // A saved draft means this is a resumed attempt: skip the overview, restore answers and position.
  const { draft, start, setAnswer, setCurrent, clear } = useAttemptDraft<number>("strand", learnerId, test.test_id);
  const phase = draft ? "in-progress" : "overview";
  const answers = draft?.answers ?? {};
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [finished, setFinished] = useState<{ alreadySubmitted: boolean } | null>(null);

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
      setFinished({ alreadySubmitted: false });
    } catch (err) {
      // A 409 means another tab/device already submitted: that's a completed
      // state to show, not an error to surface.
      if (isAttemptAlreadySubmitted(err)) { clear(); setFinished({ alreadySubmitted: true }); }
      else setSubmitError(getErrorMessage(err, "Your answers could not be submitted. Please try again."));
    } finally { setSaving(false); }
  };

  // Time's up (live, or on restoring an already-expired draft): submit what's answered.
  useSubmitOnExpiry(expired, detail.status === "ready" && items.length > 0 && !saving && !finished, submit);

  if (finished) {
    return (
      <AttemptShell title={strandTitle(test)} subtitle={test.title} onClose={onClose} backLabel={backLabel}>
        <AttemptSuccess message={finished.alreadySubmitted ? ALREADY_SUBMITTED_MESSAGE : SUBMIT_SUCCESS_MESSAGE} onClose={onClose} />
      </AttemptShell>
    );
  }

  if (phase === "overview") {
    return (
      <TestOverviewModal
        title={strandTitle(test)}
        description={`Diagnostic exam for ${STRAND_SHORT_LABEL[test.strand_code] ?? test.strand_name}. Read each question carefully and choose the best answer for every item before submitting.`}
        timeLimitSeconds={STRAND_TEST_TIME_LIMIT_SECONDS}
        itemCount={detail.status === "ready" ? rawItems.length : undefined}
        onStart={start}
        onCancel={onClose}
      />
    );
  }

  const item = items[current];

  return (
    <AttemptShell
      title={strandTitle(test)}
      subtitle={detail.status === "ready" ? `Question ${current + 1} of ${items.length}` : test.title}
      onClose={onClose}
      countdown={secondsLeft !== null ? <CountdownBadge secondsLeft={secondsLeft} expired={expired} /> : undefined}
      backLabel={backLabel}
    >
      {detail.status === "loading" && <Loading />}
      {detail.status === "error" && <LoadError message={detail.message} onRetry={retry} />}
      {detail.status === "ready" && items.length === 0 && <p className="text-sm text-gray-500">This test has no questions yet.</p>}
      {detail.status === "ready" && item && (
        <>
          <div className="h-2 bg-gray-100 rounded-full mb-6"><div className="h-full bg-[#3535C5] rounded-full" style={{ width: `${((current + 1) / items.length) * 100}%` }} /></div>
          <section className="border border-gray-100 rounded-2xl p-6">
            {/* Not every question has an image (asset_url is null when there's none, or storage isn't configured). */}
            {item.asset_url && <ImageWithFallback src={item.asset_url} alt="Illustration for this question" className="max-h-72 w-auto max-w-full object-contain rounded-xl mb-5" />}
            <p className="text-gray-800 text-lg font-medium leading-relaxed mb-6 whitespace-pre-line">{item.question_text}</p>
            <div className="space-y-3">
              {item.options.map((option, index) => (
                <button key={option.option_id} aria-pressed={answers[item.item_id] === option.option_id} disabled={expired} onClick={() => setAnswer(item.item_id, option.option_id)} className={`w-full flex text-left gap-3 p-4 border rounded-xl transition-colors ${answers[item.item_id] === option.option_id ? "border-[#3535C5] bg-indigo-50 text-indigo-900" : "border-gray-200 hover:border-indigo-300 text-gray-700"}`}>
                  <span className="w-6 h-6 shrink-0 rounded-full border flex justify-center items-center text-xs font-semibold">{String.fromCharCode(65 + index)}</span>{option.option_text}
                </button>
              ))}
            </div>
          </section>
          <div className="flex justify-between mt-5">
            <button onClick={() => setCurrent(() => current - 1)} disabled={current === 0} className="inline-flex gap-1 items-center px-4 py-2 text-sm text-gray-600 disabled:text-gray-300"><ChevronLeft className="w-4 h-4" /> Previous</button>
            {current < items.length - 1 ? <button onClick={() => setCurrent(() => current + 1)} className="inline-flex gap-1 items-center px-4 py-2 rounded-xl text-sm text-white bg-[#3535C5]">Next <ChevronRight className="w-4 h-4" /></button> : <span />}
          </div>
          {expired ? <TimeUpNotice /> : secondsLeft !== null && secondsLeft <= TIME_WARNING_SECONDS && <TimeWarningNotice />}
          {/* After expiry an incomplete attempt is submittable too - that's the retry if the auto-submit failed. */}
          <SubmitBar disabled={!expired && !isComplete(items, answers)} saving={saving} error={submitError} onSubmit={submit} />
        </>
      )}
    </AttemptShell>
  );
}

// ── LRI: take the inventory ──────────────────────────────────────────────────

export function LriAttempt({ test, learnerId, onClose }: { test: LriTestListItem; learnerId: string | number; onClose: () => void }) {
  // The LRI detail always includes its statements - there's no include_items switch.
  const [detail, retry] = useLoad(() => getLriTestWithItems(test.test_id), "The Learner Readiness Inventory could not be opened.");
  const { draft, start, setAnswer, clear } = useAttemptDraft<LriAnswerValue>("lri", learnerId, test.test_id);
  const phase = draft ? "in-progress" : "overview";
  const answers = draft?.answers ?? {};
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [finished, setFinished] = useState<{ alreadySubmitted: boolean } | null>(null);

  const rawItems = detail.status === "ready" ? detail.data.items : [];
  const items = useMemo(() => shuffleForLearner(rawItems, learnerId, test.test_id), [rawItems, learnerId, test.test_id]);

  const { secondsLeft, expired } = useCountdown(LRI_TEST_TIME_LIMIT_SECONDS, draft?.startedAt ?? null);

  if (finished) {
    return (
      <AttemptShell title={test.title} onClose={onClose}>
        <AttemptSuccess message={finished.alreadySubmitted ? ALREADY_SUBMITTED_MESSAGE : SUBMIT_SUCCESS_MESSAGE} onClose={onClose} />
      </AttemptShell>
    );
  }

  if (phase === "overview") {
    return (
      <TestOverviewModal
        title={test.title}
        description={test.description}
        timeLimitSeconds={LRI_TEST_TIME_LIMIT_SECONDS}
        itemCount={detail.status === "ready" ? rawItems.length : undefined}
        onStart={start}
        onCancel={onClose}
      />
    );
  }

  const submit = async () => {
    setSaving(true); setSubmitError("");
    try {
      await submitLriAttempt(test.test_id, toLriAttemptCreate(items, answers));
      clear();
      setFinished({ alreadySubmitted: false });
    } catch (err) {
      if (isAttemptAlreadySubmitted(err)) { clear(); setFinished({ alreadySubmitted: true }); }
      else setSubmitError(getErrorMessage(err, "Your LRI responses could not be submitted. Please try again."));
    } finally { setSaving(false); }
  };

  return (
    <AttemptShell
      title={test.title}
      subtitle="Select one response for every statement."
      onClose={onClose}
      countdown={secondsLeft !== null ? <CountdownBadge secondsLeft={secondsLeft} expired={expired} /> : undefined}
    >
      {detail.status === "loading" && <Loading />}
      {detail.status === "error" && <LoadError message={detail.message} onRetry={retry} />}
      {detail.status === "ready" && items.length === 0 && <p className="text-sm text-gray-500">This inventory has no statements yet.</p>}
      {detail.status === "ready" && items.length > 0 && (
        <>
          <div className="overflow-x-auto border border-slate-800 rounded-sm">
            <table className="w-full min-w-[700px] table-fixed border-collapse text-sm">
              <thead className="bg-[#244477] text-white">
                <tr>
                  <th className="w-1/2 border border-slate-800 p-3 text-center font-semibold">Statement</th>
                  {LIKERT_OPTIONS.map(({ label }) => <th key={label} className="w-[12.5%] border border-slate-800 p-2 text-center font-semibold leading-tight">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.item_id} className="odd:bg-white even:bg-slate-50">
                    <td className="border border-slate-800 p-3 text-gray-800 align-top"><span className="font-semibold mr-1">{index + 1}.</span>{item.question_text}</td>
                    {LIKERT_OPTIONS.map(({ label, value }) => (
                      <td key={value} className="border border-slate-800 p-3 text-center">
                        <input aria-label={`${item.question_text}: ${label}`} type="radio" name={`item-${item.item_id}`} value={value} checked={answers[item.item_id] === value} disabled={expired} onChange={() => setAnswer(item.item_id, value)} className="h-4 w-4 accent-[#244477]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {expired && <TimeUpNotice />}
          <SubmitBar disabled={!isComplete(items, answers)} saving={saving} error={submitError} onSubmit={submit} />
        </>
      )}
    </AttemptShell>
  );
}
