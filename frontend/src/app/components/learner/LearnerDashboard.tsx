import { useEffect, useState } from "react";
import { ClipboardList, BookOpen, TrendingUp, Target, Check, CircleCheck, Clock, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";
import { STRAND_CODES, STRAND_SHORT_LABEL, getLriTests, getParticipantIntake, getStrandTests, indexByStrandCode } from "../../../lib/api/diagnostic";
import { getMyStrands } from "../../../lib/api/learningContents";
import { getErrorMessage } from "../../../lib/api/errors";
import type { LearningStrandProgress } from "../../../lib/api/types";

// Type roles from DESIGN.md: serif headings, DM Sans chrome, Atkinson Hyperlegible for sentences learners read.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
// Every progress fill shares one reveal: 300ms on the same curve, skipped entirely under reduced motion.
const fillReveal = `motion-safe:duration-300 ${easeOut}`;
const card = "bg-white border border-[#E2E0DA] rounded-2xl p-8";
const cardTitle = "text-2xl leading-[1.25] text-[#1B1D26]";
const overline = "text-[0.9375rem] font-bold uppercase tracking-[0.06em] leading-snug";

type StepStatus = "done" | "current" | "locked";

/** Everything the dashboard shows comes from the learner's real records; nothing is sample data. */
interface DashboardData {
  intakeDone: boolean;
  lriDone: boolean;
  pretestStrands: { code: string; label: string; done: boolean }[];
  posttestDone: boolean;
  /** null when the learner is not in an active cohort yet (the backend answers 404). */
  strands: LearningStrandProgress[] | null;
}

async function loadDashboard(): Promise<DashboardData> {
  const [intake, lri, pre, post, strands] = await Promise.all([
    getParticipantIntake(),
    getLriTests(),
    getStrandTests("pretest"),
    getStrandTests("posttest"),
    getMyStrands().catch((err) => { if (err?.response?.status === 404) return null; throw err; }),
  ]);
  const preByCode = indexByStrandCode(pre.tests);
  const postTests = STRAND_CODES.map((c) => indexByStrandCode(post.tests)[c]).filter(Boolean);
  return {
    intakeDone: intake !== null,
    lriDone: lri.tests.length > 0 && lri.tests.every((t) => t.attempt_status === "completed"),
    pretestStrands: STRAND_CODES.filter((c) => preByCode[c]).map((c) => ({
      code: c.startsWith("LS1") ? "LS1" : c, label: STRAND_SHORT_LABEL[c], done: preByCode[c].attempt_status === "completed",
    })),
    posttestDone: postTests.length > 0 && postTests.every((t) => t.attempt_status === "completed"),
    strands,
  };
}

function pipelineFor(d: DashboardData) {
  const pretestDone = d.intakeDone && d.lriDone && d.pretestStrands.length > 0 && d.pretestStrands.every((s) => s.done);
  const contentDone = !!d.strands?.length && d.strands.every((s) => s.progress_percent === 100);
  const raw = [
    { label: "Pre-test",         icon: ClipboardList, page: "diagnostic-test",  done: pretestDone,   action: "Continue to Pre-test" },
    { label: "Learning Content", icon: BookOpen,      page: "stimulus-content", done: contentDone,   action: "Go to Learning Content" },
    { label: "Post-test",        icon: Target,        page: "post-test",        done: d.posttestDone, action: "Start the Post-test" },
    { label: "My Progress",      icon: TrendingUp,    page: "my-progress",      done: false,         action: "See My Progress" },
  ];
  const currentIndex = raw.findIndex((s) => !s.done);
  return raw.map((s, i) => ({ ...s, status: (s.done ? "done" : i === currentIndex ? "current" : "locked") as StepStatus, after: raw[i - 1]?.label }));
}

/* ── Pieces ── */

function Ring({ value, total, size = 176, stroke = 14, track, fill, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = total > 0 ? c * (1 - value / total) : c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {value > 0 && (
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={fill} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={offset}
            className={`motion-safe:transition-[stroke-dashoffset] ${fillReveal} motion-safe:starting:[stroke-dashoffset:var(--ring-c)]`}
            style={{ ["--ring-c" as string]: `${c}` }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

function Bar({ percent }) {
  return (
    <div className="h-2 rounded-full bg-[#E1E2E7] overflow-hidden" aria-hidden="true">
      <div
        className={`h-full rounded-full bg-[#00538A] origin-left motion-safe:transition-[scale] ${fillReveal} motion-safe:starting:[scale:0_1]`}
        style={{ scale: `${Math.max(0, Math.min(100, percent)) / 100} 1` }}
      />
    </div>
  );
}

function Skeleton({ className }) {
  return <div className={`rounded-lg bg-[#F2F1ED] motion-safe:animate-pulse ${className}`} aria-hidden="true" />;
}

/* ── Page ── */

export function LearnerDashboard({ navigate, user, onLogout }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError("");
    loadDashboard()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err, "Your progress could not be loaded. Please try again.")); });
    return () => { cancelled = true; };
  }, [attempt]);

  const firstName = user?.name?.split(" ")[0] || "Learner";
  const steps = data ? pipelineFor(data) : [];
  const current = steps.find((s) => s.status === "current");

  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="learner-dashboard">
      <div className="w-full max-w-[90rem] px-6 lg:px-8 py-10">
        <h2 className="mb-10 text-[3rem] leading-[1.1] text-[#1B1D26]" style={display}>Welcome, {firstName}!</h2>

        {error ? (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-5 text-[#7A1A12]">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-lg leading-snug" style={reading}>{error}</p>
              <button onClick={() => setAttempt((n) => n + 1)} className={`mt-3 h-11 px-5 rounded-xl border border-[#00538A] bg-white text-[0.9375rem] font-bold text-[#00538A] hover:bg-[#CFE4FF] transition-colors duration-150 ${focus}`}>
                Try again
              </button>
            </div>
          </div>
        ) : (
          /* One grid: at xl the readiness and Muse 2 cards share row 1, so they match in height.
             Below xl the aside cards drop under the main column, side by side. */
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_22rem]">
              {/* Readiness: the focal point. No readiness score exists yet, so it is an honest empty state. */}
              <section aria-labelledby="readiness-title" className={`${card} relative overflow-hidden order-1 lg:col-span-2 xl:col-span-1`}>
                <div className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[radial-gradient(closest-side,#FFDEB5,transparent)] opacity-50" aria-hidden="true" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-8">
                  <Ring value={0} total={1} track="#FFDEB5" fill="#FFAB2E">
                    <span className="text-[1.75rem] leading-none text-[#1B1D26]" style={display}>Not yet</span>
                    <span className={`${overline} mt-2 text-[#835500]`}>Readiness</span>
                  </Ring>
                  <div className="min-w-0">
                    <h3 id="readiness-title" className={cardTitle} style={display}>Your readiness profile</h3>
                    <p className="mt-3 max-w-[34rem] text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
                      Your readiness profile appears here after you finish the pre-test and your Muse 2 baseline recording at the learning center.
                    </p>
                    {current && (
                      <button
                        onClick={() => navigate(current.page)}
                        className={`mt-6 h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-[#00538A] text-white text-base font-bold tracking-[0.01em] hover:bg-[#004270] active:scale-[0.98] motion-reduce:active:scale-100 transition-[background-color,scale] duration-150 ${easeOut} ${focus}`}
                      >
                        {current.action} <ArrowRight className="w-5 h-5" aria-hidden="true" />
                      </button>
                    )}
                    {!data && <Skeleton className="mt-6 h-12 w-56 rounded-xl" />}
                  </div>
                </div>
              </section>

            {/* ── Main column, below the readiness card ── */}
            <div className="space-y-6 min-w-0 order-2 lg:col-span-2 xl:col-span-1 xl:order-3">
              {/* Pipeline: the single display of where the learner is. */}
              <section aria-labelledby="pipeline-title" className={card}>
                <h3 id="pipeline-title" className={`${cardTitle} mb-8`} style={display}>Your learning steps</h3>
                {!data ? (
                  <div className="grid grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
                ) : (
                  <ol className="grid grid-cols-4">
                    {steps.map((step, i) => {
                      const Icon = step.status === "done" ? Check : step.status === "locked" ? Lock : step.icon;
                      const circle = step.status === "done"
                        ? "bg-[#00538A] border-[#00538A] text-white"
                        : step.status === "current" ? "bg-[#FFAB2E] border-[#FFAB2E] text-[#1B1D26]" : "bg-white border-[#8A8F9C] text-[#4A4F5C]";
                      const statusText = step.status === "done" ? "Done" : step.status === "current" ? "You are here" : `After ${step.after}`;
                      return (
                        <li key={step.label} className="relative flex flex-col items-center text-center px-2">
                          {i < steps.length - 1 && (
                            <span className={`absolute top-5 left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] h-0.5 rounded-full ${step.status === "done" ? "bg-[#00538A]" : "bg-[#E1E2E7]"}`} aria-hidden="true" />
                          )}
                          <button
                            onClick={() => navigate(step.page)}
                            disabled={step.status === "locked"}
                            aria-current={step.status === "current" ? "step" : undefined}
                            aria-label={`${step.label}: ${statusText}`}
                            className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center enabled:active:scale-95 motion-reduce:enabled:active:scale-100 transition-[scale] duration-150 ${easeOut} disabled:cursor-not-allowed ${circle} ${focus}`}
                          >
                            <Icon className="w-5 h-5" strokeWidth={step.status === "done" ? 2.5 : 1.75} aria-hidden="true" />
                          </button>
                          <span className="mt-3 text-[1.0625rem] font-bold leading-snug text-[#1B1D26]">{step.label}</span>
                          <span className={`mt-1 text-base leading-snug ${step.status === "current" ? "font-bold text-[#835500]" : "text-[#4A4F5C]"}`} style={reading}>{statusText}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>

              {/* Learning strands: real progress per strand assigned to the learner's cohort. */}
              <section aria-labelledby="strands-title" className={card}>
                <div className="flex items-baseline justify-between gap-4 mb-6">
                  <h3 id="strands-title" className={cardTitle} style={display}>Your learning strands</h3>
                  {data?.strands?.length ? (
                    <button onClick={() => navigate("stimulus-content")} className={`shrink-0 rounded-md text-base font-bold text-[#00538A] hover:underline underline-offset-4 ${focus}`}>
                      Open Learning Content
                    </button>
                  ) : null}
                </div>
                {!data ? (
                  <div className="space-y-5">{[0, 1].map((i) => <Skeleton key={i} className="h-16" />)}</div>
                ) : !data.strands?.length ? (
                  <div className="py-6 text-center">
                    <BookOpen className="mx-auto mb-3 w-7 h-7 text-[#4A4F5C]" strokeWidth={1.5} aria-hidden="true" />
                    <p className="text-lg font-bold text-[#1B1D26]" style={reading}>No lessons yet</p>
                    <p className="mt-1 text-lg text-[#4A4F5C]" style={reading}>
                      {data.strands === null
                        ? "Your lessons appear here after your facilitator adds you to a cohort."
                        : "Your lessons will appear here once your facilitator adds them to your cohort."}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#E2E0DA]">
                    {(data.strands ?? []).map((s) => {
                      const pct = s.progress_percent ?? 0;
                      return (
                        <li key={s.strand_id} className="py-5 first:pt-0 last:pb-0">
                          <div className={`${overline} text-[#4D35BD]`}>{s.code}</div>
                          <div className="mt-1 flex items-baseline justify-between gap-4">
                            <span className="text-lg font-bold text-[#1B1D26]" style={reading}>{s.name}</span>
                            <span className="shrink-0 text-base tabular-nums text-[#4A4F5C]">
                              {s.total_lessons > 0 ? `${s.completed_lessons} of ${s.total_lessons} lessons` : "No lessons yet"}
                            </span>
                          </div>
                          {s.total_lessons > 0 && <div className="mt-3"><Bar percent={pct} /></div>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>

              {/* Sensor: navy is reserved for Muse 2. No live sensor feed reaches this page, so no status is claimed. */}
              <section aria-labelledby="sensor-title" className="rounded-2xl bg-[#1C1D33] p-8 text-white order-3 xl:order-2 lg:self-start xl:self-stretch">
                <h3 id="sensor-title" className="text-2xl leading-[1.25]" style={display}>Muse 2 headband</h3>
                <p className="mt-3 text-lg leading-relaxed text-[#D9DBEA]" style={reading}>
                  Your facilitator puts on the headband and records your baseline with you at the learning center.
                </p>
              </section>

              {/* Diagnostic progress: the parts of the pre-test, from the learner's real records. */}
              <section aria-labelledby="diagnostic-title" className={`${card} order-4 self-start`}>
                <h3 id="diagnostic-title" className={`${cardTitle} mb-6`} style={display}>Pre-test progress</h3>
                {!data ? (
                  <Skeleton className="h-64" />
                ) : (() => {
                  const parts = [
                    { label: "Participant Intake", done: data.intakeDone },
                    { label: "Readiness Inventory", done: data.lriDone },
                    ...data.pretestStrands.map((s) => ({ label: s.label, code: s.code, done: s.done })),
                  ];
                  const doneCount = parts.filter((p) => p.done).length;
                  return (
                    <>
                      <div className="flex justify-center mb-6">
                        <Ring value={doneCount} total={parts.length} size={136} stroke={12} track="#E1E2E7" fill="#00538A">
                          <span className="text-[2rem] leading-none tabular-nums text-[#1B1D26]" style={display}>{doneCount} of {parts.length}</span>
                          <span className="mt-1.5 text-base font-bold text-[#4A4F5C]">parts done</span>
                        </Ring>
                      </div>
                      <ul className="space-y-3">
                        {parts.map((p) => (
                          <li key={p.label} className="flex items-center gap-3">
                            {p.done
                              ? <CircleCheck className="w-5 h-5 shrink-0 text-[#00538A]" strokeWidth={2.25} aria-hidden="true" />
                              : <Clock className="w-5 h-5 shrink-0 text-[#4A4F5C]" strokeWidth={1.75} aria-hidden="true" />}
                            <span className="flex-1 min-w-0 text-base font-bold text-[#1B1D26]">
                              {"code" in p && <span className="mr-1.5 text-[#4D35BD]">{p.code}</span>}{p.label}
                            </span>
                            <span className="text-base text-[#4A4F5C]">{p.done ? "Done" : "Not yet"}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  );
                })()}
              </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
