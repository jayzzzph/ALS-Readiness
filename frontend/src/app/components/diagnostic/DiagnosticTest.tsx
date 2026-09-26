import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, LoaderCircle, LockKeyhole, Star } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import { ImageWithFallback } from "../figma/ImageWithFallback";
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
import { LriAttempt, StrandAttempt } from "./PretestAttempts";
import { ScoreCompareModal } from "./ScoreCompareModal";
import { StrandTestCard } from "./StrandTestCard";
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

function PretestLoadingIndicator() {
  return (
    <div className="py-12 flex justify-center">
      <LoaderCircle className="w-6 h-6 text-[#3535C5] animate-spin" />
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
    } catch (err) {
      setError(getErrorMessage(err, "The pre-test could not be loaded. Please try again."));
    } finally { setLoading(false); }
  };
  useEffect(() => { loadHub(); }, []);

  const backToHub = () => { setView({ name: "hub" }); loadHub(); };

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

  return <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="diagnostic-test">
    <main className="p-6 max-w-6xl mx-auto w-full">
      <section className="bg-gradient-to-r from-[#182f68] to-[#3535C5] rounded-2xl p-7 text-white mb-6">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-[0.16em] mb-2">Baseline assessment · Muse 2 baseline recording</p>
        <h2 className="text-2xl font-bold mb-2">Pre-test</h2>
        <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">Complete the participant intake, Learner Readiness Inventory, three diagnostic exams, and a short baseline EEG recording to establish your baseline.</p>
      </section>

      {loading ? <PretestLoadingIndicator /> : error ? (
        <div role="alert" className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          <span>{error}</span><button onClick={loadHub} className="font-semibold underline shrink-0">Try again</button>
        </div>
      ) : <>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Stat icon={ClipboardList} label="Diagnostic tests" value={`${completedStrands.length}/${strands.length}`} />
          <Stat icon={CheckCircle2} label="LRI status" value={lriComplete ? "Complete" : "Pending"} />
          <Stat icon={Star} label="Pre-test status" value={allComplete ? "Complete" : "In progress"} />
        </div>

        <div className="space-y-5">
          <PartCard number="Part I" title="Participant intake" description="Background questionnaire required before all assessment activities." status={intakeComplete ? "Completed" : "Required"} action={intakeComplete ? "Review intake" : "Complete intake"} onClick={() => navigate("participant-intake")} />

          {lriTests.length === 0 && <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"><p className="text-xs font-bold text-[#3535C5] uppercase tracking-wider mb-1">Part II</p><h3 className="text-gray-800 font-bold text-lg">Learner Readiness Inventory</h3><p className="text-sm text-gray-500 mt-1">No readiness inventory is currently available.</p></section>}
          {lriTests.map((test) => {
            const done = test.attempt_status === "completed";
            // Completed, no further action - no score is fetched or shown here.
            return <PartCard key={test.test_id} number="Part II" title={test.title} description={test.description} status={done ? "Completed" : intakeComplete ? "Ready to attempt" : "Locked until Part I"} disabled={!done && !intakeComplete} action={done ? undefined : "Attempt LRI"} onClick={done ? undefined : () => setView({ name: "lri-attempt", test })} />;
          })}

          <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
              <div><p className="text-xs font-bold text-[#3535C5] uppercase tracking-wider mb-1">Part III</p><h3 className="text-gray-800 font-bold text-lg">Diagnostic / Equivalency Exams</h3><p className="text-gray-500 text-sm mt-1">One baseline exam for each enrolled learning strand. Completed pre-tests cannot be retaken.</p></div>
              <span className={`inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full text-xs font-medium ${lriComplete ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}><LockKeyhole className="w-3.5 h-3.5" /> {lriComplete ? "Part II complete" : strandsLockReason}</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {strands.map((test) => (
                <StrandTestCard
                  key={test.test_id}
                  test={test}
                  canAttempt={lriComplete}
                  disabledReason={strandsLockReason}
                  onAttempt={() => setView({ name: "strand-attempt", test })}
                  canShowScore={test.attempt_status === "completed" && postByCode[test.strand_code]?.attempt_status === "completed"}
                  onShowScore={() => setScoreStrand(test.strand_code)}
                />
              ))}
              {!strands.length && <p className="text-sm text-gray-500">No pre-test strands are currently available.</p>}
            </div>
          </section>

          <PartCard
            number="Part IV"
            title="Baseline EEG Recording"
            description="A short baseline recording using the Muse 2 headband, taken right after the diagnostic exams."
            status={allComplete ? "Ready to record" : "Locked until Part I–III complete"}
            disabled={!allComplete}
            action="Start Recording"
            onClick={() => setView({ name: "baseline-eeg" })}
          />
        </div>
      </>}

      {scoreStrand && byCode[scoreStrand] && postByCode[scoreStrand] && (
        <ScoreCompareModal
          strandLabel={STRAND_SHORT_LABEL[scoreStrand]}
          pretestTestId={byCode[scoreStrand]!.test_id}
          posttestTestId={postByCode[scoreStrand]!.test_id}
          onClose={() => setScoreStrand(null)}
        />
      )}
    </main>
  </AppLayout>;
}

function Stat({ icon: Icon, label, value }) { return <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3"><div className="w-10 h-10 bg-indigo-50 text-[#3535C5] rounded-xl flex items-center justify-center"><Icon className="w-5 h-5" /></div><div><p className="text-lg font-bold text-gray-800">{value}</p><p className="text-xs text-gray-500">{label}</p></div></div>; }

function PartCard({ number, title, imageUrl, description, status, action, onClick, disabled }: { number: string; title: string; imageUrl?: string | null; description: string; status: string; action?: string; onClick?: () => void; disabled?: boolean }) { return <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-5 sm:items-center sm:justify-between">{imageUrl && <ImageWithFallback src={imageUrl} alt="" className="h-24 w-full sm:w-36 object-cover rounded-xl" />}<div className="flex-1"><p className="text-xs font-bold text-[#3535C5] uppercase tracking-wider mb-1">{number}</p><h3 className="text-gray-800 font-bold text-lg">{title}</h3><p className="text-gray-500 text-sm mt-1">{description}</p></div><div className="flex flex-col sm:items-end gap-2 shrink-0"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status === "Completed" ? "bg-green-50 text-green-700" : disabled ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{status}</span>{action && onClick && <button onClick={onClick} disabled={disabled} className="px-4 py-2.5 rounded-xl text-sm font-medium bg-[#3535C5] text-white hover:bg-[#2929a8] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">{action}</button>}</div></section>; }
