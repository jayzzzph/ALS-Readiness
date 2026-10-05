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
import type { LriTestListItem, StrandCode, StrandTestListItem } from "../../../lib/api/types";
import { discardAttemptDraft, hasAttemptDraft, readOpenAttempt, rememberOpenAttempt } from "./attemptDraft";
import { LriAttempt, StrandAttempt } from "./PretestAttempts";
import { ScoreCompareModal } from "./ScoreCompareModal";
import { StrandTestCard, secondaryButton } from "./StrandTestCard";
import { BaselineEegRecording } from "./BaselineEegRecording";

// Pre-test hub: Part I participant intake, Part II Learner Readiness Inventory,
// Part III one diagnostic exam per strand. All of it comes from the real API; if
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
  | { name: "baseline-eeg" };

// Type roles from DESIGN.md: serif headings, DM Sans chrome, Atkinson Hyperlegible for sentences learners read.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const card = "bg-white border border-[#E2E0DA] rounded-2xl p-8";
const cardTitle = "text-2xl leading-[1.25] text-[#1B1D26]";

function PretestLoadingIndicator() {
  return (
    <div role="status" className="py-12 flex items-center justify-center gap-3 text-lg text-[#4A4F5C]" style={reading}>
      <LoaderCircle className="w-6 h-6 text-[#00538A] motion-safe:animate-spin" aria-hidden="true" /> Loading your pre-test...
    </div>
  );
}

export function DiagnosticTest({ navigate, user, onLogout }) {
  // Seeds Task 5's per-(learner, test) shuffle - stable for this learner, falls
  // back gracefully if `raw.id` isn't populated for some reason.
  const learnerId: string | number = user?.raw?.id ?? user?.id_no ?? "anonymous";
  const [strandTests, setStrandTests] = useState<StrandTestListItem[]>([]);
  const [postStrandTests, setPostStrandTests] = useState<StrandTestListItem[]>([]);
  const [lriTests, setLriTests] = useState<LriTestListItem[]>([]);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>({ name: "hub" });
  const [scoreStrand, setScoreStrand] = useState<StrandCode | null>(null);
  // Only the first hub load after mounting may reopen an attempt (i.e. after a reload).
  const reopenPending = useRef(true);

  // Gate for Parts II/III is the learner's real intake record, not a browser-local flag.
  // The posttest list is fetched too (read-only here) - not to gate anything, but because
  // "Show Score" needs to know whether the posttest half is also done, and its test_id.
  const loadHub = async () => {
    setLoading(true); setError("");
    try {
      const [strandData, postStrandData, lriData, intake] = await Promise.all([
        getStrandTests("pretest"),
        getStrandTests("posttest"),
        getLriTests(),
        getParticipantIntake(),
      ]);
      setStrandTests(strandData.tests);
      setPostStrandTests(postStrandData.tests);
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
      setError(getErrorMessage(err, "The pre-test could not be loaded. Please try again."));
    } finally { setLoading(false); }
  };
  useEffect(() => { loadHub(); }, []);

  const openAttempt = (next: Exclude<View, { name: "hub" }>) => {
    rememberOpenAttempt("pretest", { kind: next.name === "lri-attempt" ? "lri" : "strand", testId: next.test.test_id });
    setView(next);
  };
  const backToHub = () => { rememberOpenAttempt("pretest", null); setView({ name: "hub" }); loadHub(); };

  if (view.name === "strand-attempt") return <StrandAttempt test={view.test} learnerId={learnerId} onClose={backToHub} />;
  if (view.name === "lri-attempt") return <LriAttempt test={view.test} learnerId={learnerId} onClose={backToHub} />;
  if (view.name === "baseline-eeg") return <BaselineEegRecording onClose={backToHub} onComplete={() => navigate("stimulus-content")} />;

  // Strands are identified by strand_code, never by name; unknown codes are skipped.
  const byCode = indexByStrandCode(strandTests);
  const postByCode = indexByStrandCode(postStrandTests);
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
  const partDone = [intakeComplete, lriComplete, strandsDone, false];
  const currentPart = partDone.findIndex((d) => !d);
  const statusOf = (index: number): PartStatus => (partDone[index] ? "done" : index === currentPart ? "current" : "locked");
  const doneCount = partDone.filter(Boolean).length;

  return <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="diagnostic-test">
    <div className="w-full max-w-[60rem] px-6 lg:px-8 py-10">
      <h2 className="text-[3rem] leading-[1.1] text-[#1B1D26]" style={display}>Pre-test</h2>
      <p className="mt-4 max-w-[40rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
        Do these four parts in order. Each one opens when the one before it is done.
      </p>
      {!loading && !error && (
        <div className="mt-6 flex items-center gap-4 max-w-[40rem]">
          <div role="progressbar" aria-labelledby="parts-done-label" aria-valuemin={0} aria-valuemax={partDone.length} aria-valuenow={doneCount} className="h-2 flex-1 rounded-full bg-[#E1E2E7] overflow-hidden">
            <div className={`h-full rounded-full bg-[#00538A] origin-left motion-safe:transition-[scale] motion-safe:duration-300 ${easeOut}`} style={{ scale: `${doneCount / partDone.length} 1` }} />
          </div>
          <p id="parts-done-label" className="shrink-0 text-base font-bold tabular-nums text-[#4A4F5C]">{doneCount} of {partDone.length} parts done</p>
        </div>
      )}

      <div className="mt-10">
        {loading ? <PretestLoadingIndicator /> : error ? (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-5 text-[#7A1A12]">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-lg leading-snug" style={reading}>{error}</p>
              <button onClick={loadHub} className={`mt-3 ${secondaryButton}`}>Try again</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <PartCard index={1} number="Part I" title="Participant intake" description="Background questionnaire required before all assessment activities." status={statusOf(0)} action={intakeComplete ? "Review intake" : "Complete intake"} onClick={() => navigate("participant-intake")} />

            {lriTests.length === 0 && <PartCard index={2} number="Part II" title="Learner Readiness Inventory" description="No readiness inventory is currently available." status={statusOf(1)} note="Finish Part I first" />}
            {lriTests.map((test) => {
              const done = test.attempt_status === "completed";
              // Completed, no further action - no score is fetched or shown here.
              return <PartCard key={test.test_id} index={2} number="Part II" title={test.title} description={test.description} status={statusOf(1)} note="Finish Part I first" disabled={!done && !intakeComplete} action={done ? undefined : hasAttemptDraft("lri", learnerId, test.test_id) ? "Resume LRI" : "Attempt LRI"} onClick={done ? undefined : () => openAttempt({ name: "lri-attempt", test })} />;
            })}

            <PartShell index={3} number="Part III" title="Diagnostic / Equivalency Exams" description="One baseline exam for each enrolled learning strand. Completed pre-tests cannot be retaken." status={statusOf(2)} note={intakeComplete ? "Finish Part II first" : "Finish Part I first"}>
              <ul className="mt-6 divide-y divide-[#E2E0DA] border-t border-[#E2E0DA] sm:ml-16">
                {strands.map((test) => (
                  <li key={test.test_id}>
                    <StrandTestCard
                      variant="row"
                      test={test}
                      canAttempt={lriComplete}
                      disabledReason={strandsLockReason}
                      attemptLabel={hasAttemptDraft("strand", learnerId, test.test_id) ? "Resume test" : undefined}
                      onAttempt={() => openAttempt({ name: "strand-attempt", test })}
                      canShowScore={test.attempt_status === "completed" && postByCode[test.strand_code]?.attempt_status === "completed"}
                      onShowScore={() => setScoreStrand(test.strand_code)}
                    />
                  </li>
                ))}
              </ul>
              {!strands.length && <p className="mt-6 text-lg text-[#4A4F5C] sm:ml-16" style={reading}>No pre-test strands are currently available.</p>}
            </PartShell>

            <PartCard
              index={4}
              number="Part IV"
              title="Baseline EEG Recording"
              description="A short baseline recording using the Muse 2 headband, taken right after the diagnostic exams."
              status={statusOf(3)}
              note="Finish Parts I to III first"
              disabled={!allComplete}
              action="Start Recording"
              onClick={() => setView({ name: "baseline-eeg" })}
            />
          </div>
        )}
      </div>

      {scoreStrand && byCode[scoreStrand] && postByCode[scoreStrand] && (
        <ScoreCompareModal
          strandLabel={STRAND_SHORT_LABEL[scoreStrand]}
          pretestTestId={byCode[scoreStrand]!.test_id}
          posttestTestId={postByCode[scoreStrand]!.test_id}
          onClose={() => setScoreStrand(null)}
        />
      )}
    </div>
  </AppLayout>;
}

type PartStatus = "done" | "current" | "locked";

/** The part's state as a mark you can read at a glance: done is a check, current is amber with its number, locked is a lock. */
function StatusMark({ status, index }: { status: PartStatus; index: number }) {
  const look = status === "done" ? "bg-[#00538A] border-[#00538A] text-white" : status === "current" ? "bg-[#FFAB2E] border-[#FFAB2E] text-[#1B1D26]" : "bg-white border-[#8A8F9C] text-[#4A4F5C]";
  return (
    <span className={`w-10 h-10 shrink-0 rounded-full border-2 flex items-center justify-center text-[1.0625rem] font-bold tabular-nums ${look}`} aria-hidden="true">
      {status === "done" ? <Check className="w-5 h-5" strokeWidth={2.5} /> : status === "locked" ? <Lock className="w-5 h-5" strokeWidth={1.75} /> : index}
    </span>
  );
}

/** One card per part: the status mark, the title, what it is, and where it stands in words (not color alone). */
function PartShell({ index, number, title, description, status, note, aside, children }: { index: number; number: string; title: string; description: string; status: PartStatus; note: string; aside?: ReactNode; children?: ReactNode }) {
  return (
    <section aria-label={`${number}: ${title}`} className={card}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <StatusMark status={status} index={index} />
        <div className="min-w-0 flex-1">
          <h3 className={cardTitle} style={display}><span className="text-[#4A4F5C]">{number}: </span>{title}</h3>
          <p className="mt-2 max-w-[34rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>{description}</p>
          <p className={`mt-3 text-base leading-snug ${status === "current" ? "font-bold text-[#835500]" : status === "done" ? "font-bold text-[#00538A]" : "text-[#4A4F5C]"}`} style={reading}>
            {status === "done" ? "Done" : status === "current" ? "You are here" : note}
          </p>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** A part with one action. Only the part the learner is on gets the deep blue button; a finished part's action is outlined; a locked one is muted and disabled. */
function PartCard({ index, number, title, description, status, note = "", action, onClick, disabled }: { index: number; number: string; title: string; description: string; status: PartStatus; note?: string; action?: string; onClick?: () => void; disabled?: boolean }) {
  const aside = action && onClick ? (
    <button onClick={onClick} disabled={disabled} className={`sm:self-center ${status === "done" ? secondaryButton : primaryButton}`}>{action}</button>
  ) : null;
  return <PartShell index={index} number={number} title={title} description={description} status={status} note={note} aside={aside} />;
}
