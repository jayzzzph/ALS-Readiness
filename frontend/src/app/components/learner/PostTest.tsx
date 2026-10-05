import { useEffect, useRef, useState } from "react";
import { AlertCircle, LoaderCircle, Lock } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import { STRAND_CODES, STRAND_SHORT_LABEL, getStrandTests, indexByStrandCode } from "../../../lib/api/diagnostic";
import { getErrorMessage } from "../../../lib/api/errors";
import type { StrandCode, StrandTestListItem } from "../../../lib/api/types";
import { discardAttemptDraft, hasAttemptDraft, readOpenAttempt, rememberOpenAttempt } from "../diagnostic/attemptDraft";
import { Ring } from "../diagnostic/DiagnosticTest";
import { StrandAttempt, type NextStep } from "../diagnostic/PretestAttempts";
import { ScoreCompareModal } from "../diagnostic/ScoreCompareModal";
import { StrandTestCard, primaryButton, secondaryButton } from "../diagnostic/StrandTestCard";

// Post-test hub: one real diagnostic exam per in-scope strand (LS1-EN, LS1-FIL,
// LS3 - no Science/AP, those were never in scope). Reuses Phase 2's overview
// modal, countdown and shuffle utilities via StrandAttempt directly, rather
// than reimplementing any of them - a posttest attempt is just a strand-test
// attempt against `test_type=posttest` tests, same as pretest is for
// `test_type=pretest`. No score is fetched or shown here, and a strand whose
// pretest isn't done yet isn't offered - the backend rejects that
// (PRETEST_REQUIRED) but the UI shouldn't let a learner walk into it.

type View = { name: "hub" } | { name: "strand-attempt"; test: StrandTestListItem };

// Type roles from DESIGN.md: serif headings, Atkinson Hyperlegible for sentences learners read.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;
const cardTitle = "text-2xl leading-[1.25] text-[#1B1D26]";

function PostTestLoadingIndicator() {
  return (
    <div role="status" className="py-12 flex items-center justify-center gap-3 text-lg text-[#4A4F5C]" style={reading}>
      <LoaderCircle className="w-6 h-6 text-[#00538A] motion-safe:animate-spin" aria-hidden="true" /> Loading your post-test...
    </div>
  );
}

export function PostTest({ navigate, user, onLogout }) {
  const learnerId: string | number = user?.raw?.id ?? user?.id_no ?? "anonymous";
  const [postTests, setPostTests] = useState<StrandTestListItem[]>([]);
  const [preTests, setPreTests] = useState<StrandTestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>({ name: "hub" });
  const [scoreStrand, setScoreStrand] = useState<StrandCode | null>(null);
  // Only the first hub load after mounting may reopen an attempt (i.e. after a reload).
  const reopenPending = useRef(true);

  const loadHub = async () => {
    setLoading(true); setError("");
    try {
      const [postData, preData] = await Promise.all([getStrandTests("posttest"), getStrandTests("pretest")]);
      setPostTests(postData.tests);
      setPreTests(preData.tests);

      // A draft for a test the server already has as completed is stale (submitted elsewhere).
      postData.tests.forEach((t) => { if (t.attempt_status === "completed") discardAttemptDraft("strand", learnerId, t.test_id); });

      // Reopen the post-test that was on screen before a reload - only if it's still
      // unsubmitted, still has a draft, and its strand's pretest is done.
      if (reopenPending.current) {
        reopenPending.current = false;
        const open = readOpenAttempt("posttest");
        const test = open?.kind === "strand" ? postData.tests.find((t) => t.test_id === open.testId) : undefined;
        const pretestDone = test && preData.tests.some((p) => p.strand_code === test.strand_code && p.attempt_status === "completed");
        if (test && pretestDone && test.attempt_status !== "completed" && hasAttemptDraft("strand", learnerId, test.test_id)) setView({ name: "strand-attempt", test });
        else rememberOpenAttempt("posttest", null);
      }
    } catch (err) {
      setError(getErrorMessage(err, "The post-test could not be loaded. Please try again."));
    } finally { setLoading(false); }
  };
  useEffect(() => { loadHub(); }, []);

  const openAttempt = (test: StrandTestListItem) => {
    rememberOpenAttempt("posttest", { kind: "strand", testId: test.test_id });
    setView({ name: "strand-attempt", test });
  };
  const backToHub = () => { rememberOpenAttempt("posttest", null); setView({ name: "hub" }); loadHub(); };

  // What the success screen offers next, from the lists the hub already loaded: the first post-test not done yet whose
  // pretest is done, other than the one just submitted. Opening it marks the finished one done here, so a chain of
  // tests doesn't offer one that was already finished. null = nothing left, undefined = not known (something is left
  // but its pretest isn't done, so it isn't offered).
  const nextPostTestStep = (justDone: number): NextStep | null | undefined => {
    const now = indexByStrandCode(postTests);
    const nowPre = indexByStrandCode(preTests);
    const ordered = STRAND_CODES.map((code) => now[code]).filter((test): test is StrandTestListItem => Boolean(test));
    if (!ordered.length) return undefined;
    const left = ordered.filter((test) => test.test_id !== justDone && test.attempt_status !== "completed");
    if (!left.length) return null;
    const next = left.find((test) => nowPre[test.strand_code]?.attempt_status === "completed");
    if (!next) return undefined;
    return {
      label: `Next: ${STRAND_SHORT_LABEL[next.strand_code]} post-test`,
      onOpen: () => {
        setPostTests((tests) => tests.map((test) => (test.test_id === justDone ? { ...test, attempt_status: "completed" } : test)));
        openAttempt(next);
      },
    };
  };

  if (view.name === "strand-attempt") return <StrandAttempt test={view.test} learnerId={learnerId} onClose={backToHub} stage="Post-test" backLabel="Back to post-test" next={nextPostTestStep(view.test.test_id)} />;

  // Strands are identified by strand_code, never by name; unknown codes are skipped.
  const byCode = indexByStrandCode(postTests);
  // Same pretest/posttest cross-reference as the attempt gate; it also drives "Show Score".
  const preByCode = indexByStrandCode(preTests);
  const strands = STRAND_CODES.map((code) => byCode[code]).filter((test): test is StrandTestListItem => Boolean(test));
  const completedStrands = strands.filter((test) => test.attempt_status === "completed");
  const allComplete = strands.length > 0 && completedStrands.length === strands.length;
  const pretestDone = (test: StrandTestListItem) => preByCode[test.strand_code]?.attempt_status === "completed";
  const someOpen = strands.some(pretestDone);
  const someLocked = strands.some((test) => test.attempt_status !== "completed" && !pretestDone(test));

  // Only one strand button is the deep blue primary: a test with a saved draft ("Resume post-test") if there is one,
  // else the first strand that is open and not done.
  const openStrands = strands.filter((test) => test.attempt_status !== "completed" && pretestDone(test));
  const nextStrand = openStrands.find((test) => hasAttemptDraft("strand", learnerId, test.test_id)) ?? openStrands[0];

  const lockedState = (
    <section aria-labelledby="post-locked-title" className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
      <h3 id="post-locked-title" className={`${cardTitle} flex items-center gap-3`} style={display}>
        <Lock className="w-6 h-6 shrink-0 text-[#4A4F5C]" strokeWidth={1.75} aria-hidden="true" /> The post-test opens after your pre-test
      </h3>
      <p className="mt-3 max-w-[34rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
        Finish the pre-test for a strand first. Then you can answer that strand's questions again here.
      </p>
      <button onClick={() => navigate("diagnostic-test")} className={`mt-5 ${primaryButton}`}>Go to the pre-test</button>
    </section>
  );

  const strandRows = (
    <section aria-labelledby="post-strands-title" className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
      <h3 id="post-strands-title" className={cardTitle} style={display}>Strand post-tests</h3>
      <p className="mt-2 max-w-[34rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>One for each strand. A finished post-test can't be retaken.</p>
      <ul className="mt-4 divide-y divide-[#E2E0DA] border-t border-[#E2E0DA]">
        {strands.map((test) => (
          <li key={test.test_id}>
            <StrandTestCard
              variant="row"
              emphasis={test.test_id === nextStrand?.test_id ? "primary" : "secondary"}
              test={test}
              canAttempt={pretestDone(test)}
              disabledReason="Complete the pre-test for this strand first"
              attemptLabel={hasAttemptDraft("strand", learnerId, test.test_id) ? "Resume post-test" : "Start post-test"}
              onAttempt={() => openAttempt(test)}
              canShowScore={pretestDone(test) && test.attempt_status === "completed"}
              onShowScore={() => setScoreStrand(test.strand_code)}
            />
          </li>
        ))}
        {!strands.length && <li className="py-4 text-lg text-[#4A4F5C]" style={reading}>No post-test strands are currently available.</li>}
      </ul>
      {someLocked && (
        <p className="mt-4 flex items-start gap-2 text-lg leading-snug text-[#4A4F5C]" style={reading}>
          <Lock className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" /> A strand without a start button opens after its pre-test is done.
        </p>
      )}
    </section>
  );

  return <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="post-test">
    <div className="w-full max-w-[90rem] px-6 lg:px-8 py-10">
      <h2 className="text-[3rem] leading-[1.1] text-[#1B1D26]" style={display}>Post-test</h2>
      <p className="mt-3 max-w-[40rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
        Answer the strand questions again to see how far you've come.
      </p>

      <div className="mt-8">
        {loading ? <PostTestLoadingIndicator /> : error ? (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-5 text-[#7A1A12]">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-lg leading-snug" style={reading}>{error}</p>
              <button onClick={loadHub} className={`mt-3 ${secondaryButton}`}>Try again</button>
            </div>
          </div>
        ) : (
          /* Same two-column grid as the pre-test hub: main column, with the progress aside at the right from xl. */
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 space-y-6">
              {strands.length > 0 && !someOpen && !allComplete ? lockedState : strandRows}
            </div>

            <div className="content-start">
              <section aria-labelledby="post-progress-title" className="rounded-2xl border border-[#E2E0DA] bg-white p-6">
                <h3 id="post-progress-title" className={`${cardTitle} mb-6`} style={display}>Your progress</h3>
                <div className="flex justify-center">
                  <Ring value={completedStrands.length} total={strands.length}>
                    <span className="text-[2rem] leading-none tabular-nums text-[#1B1D26]" style={display}>{completedStrands.length} of {strands.length}</span>
                    <span className="mt-1.5 text-base font-bold text-[#4A4F5C]">done</span>
                  </Ring>
                </div>
              </section>

              <section aria-labelledby="post-next-title" className="mt-6 rounded-2xl border border-[#E2E0DA] bg-white p-6">
                <h3 id="post-next-title" className={cardTitle} style={display}>What's next</h3>
                {allComplete ? (
                  <button onClick={() => navigate("my-progress")} className={`mt-4 ${primaryButton}`}>See your progress</button>
                ) : (
                  <p className="mt-2 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>Finish your remaining post-tests</p>
                )}
              </section>
            </div>
          </div>
        )}
      </div>

      {scoreStrand && preByCode[scoreStrand] && byCode[scoreStrand] && (
        <ScoreCompareModal
          strandLabel={STRAND_SHORT_LABEL[scoreStrand]}
          pretestTestId={preByCode[scoreStrand]!.test_id}
          posttestTestId={byCode[scoreStrand]!.test_id}
          onClose={() => setScoreStrand(null)}
        />
      )}
    </div>
  </AppLayout>;
}
