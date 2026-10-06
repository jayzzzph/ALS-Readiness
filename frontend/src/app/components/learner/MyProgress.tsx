import { useEffect, useState } from "react";
import { Activity, ArrowDown, ArrowUp, History, Minus } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import { SectionError } from "../shared/SectionError";
import {
  STRAND_CODES, STRAND_SHORT_LABEL, getLriAttemptResult, getLriTests, getStrandAttemptResult, getStrandTests, indexByStrandCode,
} from "../../../lib/api/diagnostic";
import { getMyStrands } from "../../../lib/api/learningContents";
import type { LearningStrandProgress, LriAttemptResult, StrandAttemptResult, StrandTestListItem } from "../../../lib/api/types";

// Type roles from DESIGN.md: serif headings, Atkinson Hyperlegible for the sentences and numbers a learner reads.
// Everything here comes from the learner's own records. Where nothing exists yet, a calm note says what will appear.
// Scores never use red: a gain is deep blue, a dip is amber, and the words always say which.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;

const card = "bg-white border border-[#E2E0DA] rounded-2xl p-8";
const cardTitle = "text-2xl leading-[1.25] text-[#1B1D26]";
const overline = "text-[0.9375rem] font-bold uppercase tracking-[0.06em] leading-snug";
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";

interface StrandScores {
  code: string;
  label: string;
  /** False when no post-test exists for this strand. */
  hasPost: boolean;
  pre: StrandAttemptResult | null;
  post: StrandAttemptResult | null;
}

type Load<T> = { status: "loading" } | { status: "error" } | { status: "ready"; value: T };

const attemptIfDone = (test: StrandTestListItem | undefined) =>
  test && test.attempt_status === "completed" ? getStrandAttemptResult(test.test_id) : Promise.resolve(null);

async function loadScores(): Promise<StrandScores[]> {
  const [pre, post] = await Promise.all([getStrandTests("pretest"), getStrandTests("posttest")]);
  const preBy = indexByStrandCode(pre.tests);
  const postBy = indexByStrandCode(post.tests);
  return Promise.all(
    STRAND_CODES.filter((c) => preBy[c] || postBy[c]).map(async (code) => ({
      code: code.startsWith("LS1") ? "LS1" : code,
      label: STRAND_SHORT_LABEL[code],
      hasPost: !!postBy[code],
      pre: await attemptIfDone(preBy[code]),
      post: await attemptIfDone(postBy[code]),
    })),
  );
}

async function loadLri(): Promise<LriAttemptResult | null> {
  const { tests } = await getLriTests();
  const test = tests[0];
  return test && test.attempt_status === "completed" ? getLriAttemptResult(test.test_id) : null;
}

/** null when the learner is not in an active cohort yet (the backend answers 404). */
async function loadStrands(): Promise<LearningStrandProgress[] | null> {
  try {
    return await getMyStrands();
  } catch (err) {
    if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
    throw err;
  }
}

function useLoad<T>(load: () => Promise<T>, attempt: number): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    load()
      .then((value) => { if (!cancelled) setState({ status: "ready", value }); })
      .catch(() => { if (!cancelled) setState({ status: "error" }); });
    return () => { cancelled = true; };
  }, [attempt]);
  return state;
}

/* ── Pieces ── */

function Skeleton({ className }: { className: string }) {
  return <div className={`rounded-lg bg-[#F2F1ED] motion-safe:animate-pulse ${className}`} aria-hidden="true" />;
}

function Note({ icon: Icon, title, children }: { icon: typeof Activity; title: string; children: string }) {
  return (
    <div className="py-4 text-center">
      <Icon className="mx-auto mb-3 w-7 h-7 text-[#4A4F5C]" strokeWidth={1.5} aria-hidden="true" />
      <p className="text-lg font-bold text-[#1B1D26]" style={reading}>{title}</p>
      <p className="mt-1 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>{children}</p>
    </div>
  );
}

const points = (n: number) => `${n} ${n === 1 ? "point" : "points"}`;

function StrandScoreRow({ strand }: { strand: StrandScores }) {
  const { pre, post } = strand;
  const change = pre && post ? Math.round((post.mps - pre.mps) * 100) / 100 : null;
  const improved = change !== null && change >= 0;
  const changeWords = change === null ? "" : change === 0 ? "No change" : `${improved ? "Up" : "Down"} ${points(Math.abs(change))}`;
  return (
    <li className="py-6 first:pt-0 last:pb-0">
      <div className={`${overline} text-[#4D35BD]`}>{strand.code}</div>
      <h4 className="mt-1 text-lg font-bold text-[#1B1D26]" style={reading}>{strand.label}</h4>
      <div className="mt-4 grid gap-4 sm:grid-cols-2" style={reading}>
        <div className="rounded-xl bg-[#F2F1ED] p-5 text-center">
          <p className="text-lg font-bold text-[#4A4F5C]">Before the lessons</p>
          {pre ? (
            <>
              <p className="mt-1 text-[2.5rem] leading-none tabular-nums text-[#1B1D26]" style={display}>{pre.mps}%</p>
              <p className="mt-2 text-base text-[#4A4F5C]">{pre.total_score} of {pre.item_count} correct</p>
            </>
          ) : (
            <p className="mt-3 text-lg text-[#4A4F5C]">Not taken yet</p>
          )}
        </div>
        <div className={`rounded-xl p-5 text-center ${post ? (improved ? "bg-[#CFE4FF]" : "bg-[#FFDEB5]") : "bg-[#F2F1ED]"}`}>
          <p className={`text-lg font-bold ${post ? "text-[#1B1D26]" : "text-[#4A4F5C]"}`}>After the lessons</p>
          {post ? (
            <>
              <p className="mt-1 text-[2.5rem] leading-none tabular-nums text-[#1B1D26]" style={display}>{post.mps}%</p>
              <p className="mt-2 text-base text-[#1B1D26]">{post.total_score} of {post.item_count} correct</p>
            </>
          ) : (
            <p className="mt-3 text-lg text-[#4A4F5C]">{strand.hasPost ? "Appears after your post-test" : "No post-test for this strand yet"}</p>
          )}
        </div>
      </div>
      {change !== null && (
        <p className={`mt-4 flex items-center justify-center gap-2 text-lg font-bold ${improved ? "text-[#00538A]" : "text-[#835500]"}`} style={reading}>
          {change === 0 ? <Minus className="w-5 h-5" aria-hidden="true" /> : improved ? <ArrowUp className="w-5 h-5" aria-hidden="true" /> : <ArrowDown className="w-5 h-5" aria-hidden="true" />}
          {changeWords}
        </p>
      )}
    </li>
  );
}

function Bar({ percent }: { percent: number }) {
  return (
    <div className="h-2 rounded-full bg-[#E1E2E7] overflow-hidden" aria-hidden="true">
      <div
        className={`h-full rounded-full bg-[#00538A] origin-left motion-safe:transition-[scale] motion-safe:duration-300 ${easeOut} motion-safe:starting:[scale:0_1]`}
        style={{ scale: `${Math.max(0, Math.min(100, percent)) / 100} 1` }}
      />
    </div>
  );
}

/* ── Page ── */

export function MyProgress({ navigate, user, onLogout }) {
  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt((n) => n + 1);
  const scores = useLoad(loadScores, attempt);
  const lri = useLoad(loadLri, attempt);
  const strands = useLoad(loadStrands, attempt);

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="my-progress">
      <div className="w-full max-w-[90rem] px-6 lg:px-8 py-10">
        <h2 className="text-[3rem] leading-[1.1] text-[#1B1D26]" style={display}>My Progress</h2>
        <p className="mt-3 mb-10 max-w-[40rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>Your scores and lessons so far.</p>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Main column */}
          <div className="space-y-6 min-w-0">
            <section aria-labelledby="scores-title" className={card}>
              <h3 id="scores-title" className={`${cardTitle} mb-6`} style={display}>Your test scores</h3>
              {scores.status === "loading" ? (
                <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
              ) : scores.status === "error" ? (
                <SectionError message="Your test scores could not be loaded. Please try again." onRetry={retry} />
              ) : scores.value.length === 0 ? (
                <Note icon={History} title="No scores yet">Your scores for each strand appear here after you take the tests.</Note>
              ) : (
                <ul className="divide-y divide-[#E2E0DA]">{scores.value.map((s) => <StrandScoreRow key={s.label} strand={s} />)}</ul>
              )}
            </section>

            <section aria-labelledby="lessons-title" className={card}>
              <h3 id="lessons-title" className={`${cardTitle} mb-6`} style={display}>Lessons done</h3>
              {strands.status === "loading" ? (
                <div className="space-y-5"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
              ) : strands.status === "error" ? (
                <SectionError message="Your lessons could not be loaded. Please try again." onRetry={retry} />
              ) : !strands.value || strands.value.length === 0 ? (
                <Note icon={History} title="No lessons yet">
                  {strands.value === null ? "Your lessons appear here after your facilitator adds you to a cohort." : "Your lessons will appear here once your facilitator adds them to your cohort."}
                </Note>
              ) : (
                <ul className="divide-y divide-[#E2E0DA]">
                  {strands.value.map((s) => (
                    <li key={s.strand_id} className="py-5 first:pt-0 last:pb-0">
                      <div className={`${overline} text-[#4D35BD]`}>{s.code}</div>
                      <div className="mt-1 flex items-baseline justify-between gap-4">
                        <span className="text-lg font-bold text-[#1B1D26]" style={reading}>{s.name}</span>
                        <span className="shrink-0 text-base tabular-nums text-[#4A4F5C]">
                          {s.total_lessons > 0 ? `${s.completed_lessons} of ${s.total_lessons} lessons` : "No lessons yet"}
                        </span>
                      </div>
                      {s.total_lessons > 0 && <div className="mt-3"><Bar percent={s.progress_percent ?? 0} /></div>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Aside */}
          <div className="grid gap-6 content-start lg:grid-cols-3 xl:grid-cols-1 min-w-0">
            <section aria-labelledby="lri-title" className={card}>
              <h3 id="lri-title" className={`${cardTitle} mb-4`} style={display}>Readiness inventory</h3>
              {lri.status === "loading" ? (
                <Skeleton className="h-24" />
              ) : lri.status === "error" ? (
                <SectionError message="Your inventory result could not be loaded. Please try again." onRetry={retry} />
              ) : lri.value ? (
                <div style={reading}>
                  <p className="text-[2.5rem] leading-none tabular-nums text-[#1B1D26]" style={display}>{lri.value.lri_score} <span className="text-lg text-[#4A4F5C]" style={reading}>of 4</span></p>
                  <p className="mt-3 text-lg leading-relaxed text-[#4A4F5C]">The average of your answers, on a scale from 1 to 4.</p>
                </div>
              ) : (
                <Note icon={History} title="Not taken yet">Your result appears here after you finish the readiness inventory in the pre-test.</Note>
              )}
            </section>

            <section aria-labelledby="readiness-title" className={card}>
              <h3 id="readiness-title" className={`${cardTitle} mb-4`} style={display}>Your readiness level</h3>
              <Note icon={Activity} title="Not available yet">
                Your readiness level appears here after your Muse 2 baseline recording at the learning center has been analyzed.
              </Note>
            </section>

            <section aria-labelledby="history-title" className={card}>
              <h3 id="history-title" className={`${cardTitle} mb-4`} style={display}>Over time</h3>
              <Note icon={History} title="Nothing to chart yet">
                A chart of how your readiness changes will appear here once there is more than one reading to compare.
              </Note>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
