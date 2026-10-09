import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, LoaderCircle, Lock } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import {
  STRAND_CODES,
  STRAND_SHORT_LABEL,
  getLriTests,
  getParticipantIntake,
  getStrandTests,
  indexByStrandCode,
} from "../../../lib/api/diagnostic";
import { getErrorMessage } from "../../../lib/api/errors";
import type { LriTestListItem, StrandTestListItem } from "../../../lib/api/types";
import { INTAKE_SAVED_FLAG, discardAttemptDraft, hasAttemptDraft, readOpenAttempt, rememberOpenAttempt } from "./attemptDraft";
import { LriAttempt, StrandAttempt, type NextStep } from "./PretestAttempts";
import { StrandTestCard, primaryButton, secondaryButton } from "./StrandTestCard";
import { BASELINE_SECONDS, describeDuration } from "../../features/eeg/constants";
import { BaselineEegRecording } from "./BaselineEegRecording";
import { StimulusExposure } from "./StimulusExposure";
import { getEegStatus } from "../../../lib/api/eegSessions";
import { SectionError } from "../shared/SectionError";

// Readiness Profiling hub (the learner's pre-test): Part I participant intake, Part II Learner Readiness Inventory,
// Part III one diagnostic exam per strand, Part IV baseline EEG, Part V stimulus content exposure (EEG).
// Parts IV and V are done when the server has a saved "baseline" / "exposed" EEG session; that is loaded on its own, so a
// failure shows a retry and the two parts as not done instead of breaking the page. All of it comes from the real API; if
// something fails to load, the hub says so (with a retry) rather than showing
// stand-in content.
//
// Sequential gate: Part II is locked until Part I is done, and Part III (all 3
// strand pretests, gated together as a single unit - not per-strand) is locked
// until Part II is done. Client-only, like the original intake gate - this is
// workflow sequencing, not the research-validity concern pretest-before-posttest
// is, so the backend isn't asked to reject an out-of-order strand-test submission
// here. A strand pretest that's already completed (e.g. from before this gate
// existed) still shows as completed regardless of the gate - the gate only blocks
// starting a new attempt, never hides a real completion.

type View =
  | { name: "hub" }
  | { name: "strand-attempt"; test: StrandTestListItem }
  | { name: "lri-attempt"; test: LriTestListItem }
  | { name: "baseline-eeg" }
  | { name: "stimulus-exposure" };

// Type roles from DESIGN.md: serif headings, DM Sans chrome, Atkinson Hyperlegible for sentences learners read.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const cardTitle = "text-2xl leading-[1.25] text-[#1B1D26]";

function PretestLoadingIndicator() {
  return (
    <div role="status" className="py-12 flex items-center justify-center gap-3 text-lg text-[#4A4F5C]" style={reading}>
      <LoaderCircle className="w-6 h-6 text-[#00538A] motion-safe:animate-spin" aria-hidden="true" /> Loading Readiness Profiling...
    </div>
  );
}

export function DiagnosticTest({ navigate, user, onLogout }) {
  // Seeds Task 5's per-(learner, test) shuffle - stable for this learner, falls
  // back gracefully if `raw.id` isn't populated for some reason.
  const learnerId: string | number = user?.raw?.id ?? user?.id_no ?? "anonymous";
  const [strandTests, setStrandTests] = useState<StrandTestListItem[]>([]);
  const [lriTests, setLriTests] = useState<LriTestListItem[]>([]);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>({ name: "hub" });
  const [eegStatus, setEegStatus] = useState<{ baselineDone: boolean; exposedDone: boolean }>({ baselineDone: false, exposedDone: false });
  const [eegError, setEegError] = useState(false);
  // Only the first hub load after mounting may reopen an attempt (i.e. after a reload).
  const reopenPending = useRef(true);
  // Set by Part I when it saves and sends the learner here; read once, then cleared.
  const [intakeSaved] = useState(() => {
    try {
      const flagged = window.sessionStorage.getItem(INTAKE_SAVED_FLAG) === "1";
      window.sessionStorage.removeItem(INTAKE_SAVED_FLAG);
      return flagged;
    } catch { return false; }
  });

  // Gate for Parts II/III is the learner's real intake record, not a browser-local flag.
  const loadHub = async () => {
    setLoading(true); setError("");
    try {
      const [strandData, lriData, intake] = await Promise.all([
        getStrandTests("pretest"),
        getLriTests(),
        getParticipantIntake(),
      ]);
      setStrandTests(strandData.tests);
      setLriTests(lriData.tests);
      setIntakeComplete(intake !== null);

      // A draft for a test the server already has as completed is stale (submitted elsewhere).
      strandData.tests.forEach((t) => { if (t.attempt_status === "completed") discardAttemptDraft("strand", learnerId, t.test_id); });
      lriData.tests.forEach((t) => { if (t.attempt_status === "completed") discardAttemptDraft("lri", learnerId, t.test_id); });

      // Reopen the attempt that was on screen before a reload - only if it's still
      // unsubmitted, still has a draft, and its gate is still met.
      if (reopenPending.current) {
        reopenPending.current = false;
        const open = readOpenAttempt("pretest");
        const lriDone = lriData.tests.length > 0 && lriData.tests.every((t) => t.attempt_status === "completed");
        const lri = open?.kind === "lri" ? lriData.tests.find((t) => t.test_id === open.testId) : undefined;
        const strand = open?.kind === "strand" ? strandData.tests.find((t) => t.test_id === open.testId) : undefined;
        if (lri && lri.attempt_status !== "completed" && intake !== null && hasAttemptDraft("lri", learnerId, lri.test_id)) setView({ name: "lri-attempt", test: lri });
        else if (strand && strand.attempt_status !== "completed" && lriDone && hasAttemptDraft("strand", learnerId, strand.test_id)) setView({ name: "strand-attempt", test: strand });
        else rememberOpenAttempt("pretest", null);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Readiness Profiling could not be loaded. Please try again."));
    } finally { setLoading(false); }
  };
  const loadEegStatus = async () => {
    setEegError(false);
    try { setEegStatus(await getEegStatus()); }
    catch { setEegStatus({ baselineDone: false, exposedDone: false }); setEegError(true); }
  };
  useEffect(() => { loadHub(); loadEegStatus(); }, []);

  const openAttempt = (next: Exclude<View, { name: "hub" }>) => {
    rememberOpenAttempt("pretest", { kind: next.name === "lri-attempt" ? "lri" : "strand", testId: next.test.test_id });
    setView(next);
  };
  const backToHub = () => { rememberOpenAttempt("pretest", null); setView({ name: "hub" }); loadHub(); loadEegStatus(); };

  // What the success screen offers next, from the lists the hub already loaded: the first strand exam not done yet,
  // other than the one just submitted (`justDone`; null after the LRI). Opening it marks `justDone` done here, so a
  // chain of exams doesn't offer one that was already finished. null = nothing left, undefined = not known.
  const nextStrandStep = (justDone: number | null): NextStep | null | undefined => {
    const now = indexByStrandCode(strandTests);
    const ordered = STRAND_CODES.map((code) => now[code]).filter((test): test is StrandTestListItem => Boolean(test));
    if (!ordered.length) return undefined;
    const next = ordered.find((test) => test.test_id !== justDone && test.attempt_status !== "completed");
    if (!next) return null;
    return {
      label: `Next: ${STRAND_SHORT_LABEL[next.strand_code]} diagnostic exam`,
      onOpen: () => {
        if (justDone !== null) setStrandTests((tests) => tests.map((test) => (test.test_id === justDone ? { ...test, attempt_status: "completed" } : test)));
        openAttempt({ name: "strand-attempt", test: next });
      },
    };
  };

  // Keyed by test so each exam gets a fresh instance: without it React reuses one StrandAttempt when "Next" swaps the
  // test, carrying the previous exam's submitted screen (and draft state) into the new one.
  if (view.name === "strand-attempt") return <StrandAttempt key={view.test.test_id} test={view.test} learnerId={learnerId} onClose={backToHub} next={nextStrandStep(view.test.test_id)} />;
  if (view.name === "lri-attempt") return <LriAttempt key={view.test.test_id} test={view.test} learnerId={learnerId} onClose={backToHub} next={nextStrandStep(null)} />;
  if (view.name === "baseline-eeg") return <BaselineEegRecording learnerId={user?.raw?.id != null ? String(user.raw.id) : null} onClose={backToHub} />;
  if (view.name === "stimulus-exposure") return <StimulusExposure learnerId={user?.raw?.id != null ? String(user.raw.id) : null} onClose={backToHub} />;

  // Strands are identified by strand_code, never by name; unknown codes are skipped.
  const byCode = indexByStrandCode(strandTests);
  const strands = STRAND_CODES.map((code) => byCode[code]).filter((test): test is StrandTestListItem => Boolean(test));
  const completedStrands = strands.filter((test) => test.attempt_status === "completed");
  const lriComplete = lriTests.length > 0 && lriTests.every((test) => test.attempt_status === "completed");
  const allComplete = strands.length > 0 && completedStrands.length === strands.length && lriComplete;
  // Part III (all 3 strand pretests) locks/unlocks as one unit on Part II (the LRI), not per-strand -
  // coarser than the posttest hub's per-strand pretest-before-posttest gate. Whichever prerequisite
  // is actually missing gets named, so a learner isn't told "do the LRI" when they haven't even done
  // intake yet.
  const strandsLockReason = !intakeComplete ? "Complete your Participant Intake first" : "Complete the LRI Assessment first";

  // Where the learner is: the first part not yet done. Everything after it waits.
  const strandsDone = strands.length > 0 && completedStrands.length === strands.length;
  const partDone = [intakeComplete, lriComplete, strandsDone, eegStatus.baselineDone, eegStatus.exposedDone];
  const currentPart = partDone.findIndex((d) => !d);
  const statusOf = (index: number): PartStatus => (partDone[index] ? "done" : index === currentPart ? "current" : "locked");
  const doneCount = partDone.filter(Boolean).length;

  // Only one strand button is the deep blue primary: a test with a saved draft ("Resume test") if there is one, else the first not-done strand.
  const notDone = strands.filter((test) => test.attempt_status !== "completed");
  const nextStrand = notDone.find((test) => hasAttemptDraft("strand", learnerId, test.test_id)) ?? notDone[0];

  const strandRows = (
    <ul className="divide-y divide-[#E2E0DA] border-t border-[#E2E0DA]">
      {strands.map((test) => (
        <li key={test.test_id}>
          <StrandTestCard
            variant="row"
            emphasis={test.test_id === nextStrand?.test_id ? "primary" : "secondary"}
            test={test}
            canAttempt={lriComplete}
            disabledReason={strandsLockReason}
            attemptLabel={hasAttemptDraft("strand", learnerId, test.test_id) ? "Resume test" : undefined}
            onAttempt={() => openAttempt({ name: "strand-attempt", test })}
          />
        </li>
      ))}
      {!strands.length && <li className="py-4 text-lg text-[#4A4F5C]" style={reading}>No diagnostic exams are currently available.</li>}
    </ul>
  );

  return <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="diagnostic-test">
    <div className="w-full max-w-[90rem] px-6 lg:px-8 py-10">
      <h2 className="text-[3rem] leading-[1.1] text-[#1B1D26]" style={display}>Readiness Profiling</h2>
      <p className="mt-3 max-w-[40rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
        Do these five parts in order. Each one opens when the one before it is done.
      </p>

      {intakeSaved && (
        <div role="status" className="mt-6 flex items-center gap-3 rounded-xl border border-[#00538A] bg-[#CFE4FF] px-5 py-4 text-[#1B1D26]">
          <Check className="w-5 h-5 shrink-0 text-[#00538A]" strokeWidth={2.5} aria-hidden="true" />
          <p className="text-lg leading-snug" style={reading}>Part I saved. You can continue with Part II.</p>
        </div>
      )}

      <div className="mt-8">
        {loading ? <PretestLoadingIndicator /> : error ? (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-5 text-[#7A1A12]">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-lg leading-snug" style={reading}>{error}</p>
              <button onClick={loadHub} className={`mt-3 ${secondaryButton}`}>Try again</button>
            </div>
          </div>
        ) : (
          /* Same two-column grid as the dashboard: the timeline takes the main column, the aside sits at the right from xl
             and drops under the timeline below that. */
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
            {eegError && <div className="mb-4 rounded-xl border border-[#E2E0DA] bg-white p-4"><SectionError message="We could not check your EEG recordings, so Parts IV and V show as not done for now." onRetry={loadEegStatus} /></div>}
            <ol aria-label="Readiness Profiling parts">
              <TimelineItem index={1} status={statusOf(0)}>
                <PartBody number="Part I" title="Participant intake" description="Background questionnaire required before all assessment activities." status={statusOf(0)} note="Finish the earlier parts first" action={intakeComplete ? "Review intake" : "Complete intake"} onClick={() => navigate("participant-intake")} />
              </TimelineItem>

              <TimelineItem index={2} status={statusOf(1)}>
                {lriTests.length === 0 && <PartBody number="Part II" title="Learner Readiness Inventory" description="No readiness inventory is currently available." status={statusOf(1)} note="Finish Part I first" />}
                {lriTests.map((test) => {
                  const done = test.attempt_status === "completed";
                  // Completed, no further action - no score is fetched or shown here.
                  return <PartBody key={test.test_id} number="Part II" title={test.title} description={test.description} status={statusOf(1)} note="Finish Part I first" disabled={!done && !intakeComplete} action={done ? undefined : hasAttemptDraft("lri", learnerId, test.test_id) ? "Resume LRI" : "Attempt LRI"} onClick={done ? undefined : () => openAttempt({ name: "lri-attempt", test })} />;
                })}
              </TimelineItem>

              <TimelineItem index={3} status={statusOf(2)}>
                <PartBody number="Part III" title="Diagnostic / Equivalency Exams" description="One baseline exam for each enrolled learning strand. Completed exams cannot be retaken." status={statusOf(2)} note={intakeComplete ? "Finish Part II first" : "Finish Part I first"}>
                  {strandRows}
                </PartBody>
              </TimelineItem>

              <TimelineItem index={4} status={statusOf(3)}>
                <PartBody number="Part IV" title="Baseline EEG Recording" description={`A resting baseline recording using the Muse 2 headband, about ${describeDuration(BASELINE_SECONDS)} long, taken right after the diagnostic exams.`} status={statusOf(3)} note="Finish Parts I to III first" disabled={!allComplete} action="Start Recording" onClick={() => setView({ name: "baseline-eeg" })} />
              </TimelineItem>

              <TimelineItem index={5} status={statusOf(4)} last>
                <PartBody number="Part V" title="Stimulus Content Exposure" description="Watch a video while the Muse 2 headband records. Your facilitator sets it up with you." status={statusOf(4)} note="Finish Part IV first" disabled={!eegStatus.baselineDone} action="Start Video" onClick={() => setView({ name: "stimulus-exposure" })} />
              </TimelineItem>
            </ol>
            </div>

            <div className="grid gap-6 content-start lg:grid-cols-2 xl:grid-cols-1">
              <section aria-labelledby="hub-progress-title" className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
                <h3 id="hub-progress-title" className={`${cardTitle} mb-6`} style={display}>Your progress</h3>
                <div className="flex justify-center">
                  <Ring value={doneCount} total={partDone.length}>
                    <span className="text-[2rem] leading-none tabular-nums text-[#1B1D26]" style={display}>{doneCount} of {partDone.length}</span>
                    <span className="mt-1.5 text-base font-bold text-[#4A4F5C]">parts done</span>
                  </Ring>
                </div>
              </section>

              {/* Navy is reserved for Muse 2. */}
              <section aria-labelledby="hub-muse-title" className="rounded-2xl bg-[#1C1D33] p-6 text-white">
                <h3 id="hub-muse-title" className="text-2xl leading-[1.25]" style={display}>Muse 2 recordings</h3>
                <p className="mt-3 text-lg leading-relaxed text-[#D9DBEA]" style={reading}>
                  Parts IV and V use your Muse 2 headband: first a resting recording, then a recording while you watch a video. Your facilitator sets it up with you at the learning center, right after the exams.
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  </AppLayout>;
}

type PartStatus = "done" | "current" | "locked";

export function Ring({ value, total, size = 136, stroke = 12, children }: { value: number; total: number; size?: number; stroke?: number; children: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = total > 0 ? c * (1 - value / total) : c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E1E2E7" strokeWidth={stroke} />
        {value > 0 && (
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#00538A" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={offset}
            className={`motion-safe:transition-[stroke-dashoffset] motion-safe:duration-300 ${easeOut} motion-safe:starting:[stroke-dashoffset:var(--ring-c)]`}
            style={{ ["--ring-c" as string]: `${c}` }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/** One stop on the timeline: the marker on the left, the thin line down to the next marker, and the part beside them. */
function TimelineItem({ index, status, last = false, children }: { index: number; status: PartStatus; last?: boolean; children: ReactNode }) {
  // The marker is centered on the first line of the part: a 48px band when compact, level with the title when expanded.
  const markerTop = status === "current" ? "top-5" : "top-1";
  const lineTop = status === "current" ? "top-[3.75rem]" : "top-11";
  const look = status === "done" ? "bg-[#00538A] border-[#00538A] text-white" : status === "current" ? "bg-[#FFAB2E] border-[#FFAB2E] text-[#1B1D26]" : "bg-white border-[#8A8F9C] text-[#4A4F5C]";
  return (
    <li className={`relative pl-16 ${last ? "" : "pb-6"}`}>
      {!last && <span className={`absolute left-[19px] bottom-0 w-0.5 rounded-full ${lineTop} ${status === "done" ? "bg-[#00538A]" : "bg-[#E1E2E7]"}`} aria-hidden="true" />}
      <span className={`absolute left-0 ${markerTop} w-10 h-10 rounded-full border-2 flex items-center justify-center text-[1.0625rem] font-bold tabular-nums ${look}`} aria-hidden="true">
        {status === "done" ? <Check className="w-5 h-5" strokeWidth={2.5} /> : status === "locked" ? <Lock className="w-5 h-5" strokeWidth={1.75} /> : index}
      </span>
      <div className="space-y-4">{children}</div>
    </li>
  );
}

/**
 * A part, in the shape its state calls for (words always say the state, never color alone):
 *  - done: one compact row, "Done", and its secondary action; any content (Part III's strand rows) stays visible beneath it;
 *  - current: the only expanded card, with its description, its content and the one deep blue action;
 *  - locked: one compact row with the reason.
 */
function PartBody({ number, title, description, status, note, action, onClick, disabled, children }: { number: string; title: string; description: string; status: PartStatus; note: string; action?: string; onClick?: () => void; disabled?: boolean; children?: ReactNode }) {
  const heading = <><span className="text-[#4A4F5C]">{number}: </span>{title}</>;

  if (status === "current") {
    return (
      <section aria-label={`${number}: ${title}`} aria-current="step" className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
        <h3 className={cardTitle} style={display}>{heading}</h3>
        <p className="mt-2 max-w-[34rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>{description}</p>
        <p className="mt-3 text-base font-bold leading-snug text-[#835500]" style={reading}>You are here</p>
        {children && <div className="mt-4">{children}</div>}
        {action && onClick && <button onClick={onClick} disabled={disabled} className={`mt-5 ${primaryButton}`}>{action}</button>}
      </section>
    );
  }

  return (
    <section aria-label={`${number}: ${title}`}>
      <div className="min-h-12 flex flex-col justify-center gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className={`text-lg font-bold leading-snug ${status === "locked" ? "text-[#4A4F5C]" : "text-[#1B1D26]"}`} style={reading}>{heading}</h3>
          <p className={`text-base leading-snug ${status === "done" ? "font-bold text-[#00538A]" : "text-[#4A4F5C]"}`} style={reading}>{status === "done" ? "Done" : note}</p>
        </div>
        {status === "done" && action && onClick && <button onClick={onClick} className={`shrink-0 ${secondaryButton}`}>{action}</button>}
      </div>
      {status === "done" && children && <div className="mt-3">{children}</div>}
    </section>
  );
}
