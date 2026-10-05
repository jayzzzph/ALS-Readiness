import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Check, ChevronRight, Headphones, Video } from "lucide-react";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";

// TEMPORARY: loads fonts from Google Fonts. Replace with @fontsource imports once `pnpm add` works.
const fontCss = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');";

// Type roles from DESIGN.md: serif headings, DM Sans chrome, Atkinson Hyperlegible for every sentence a learner reads.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const body = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const press = `active:scale-[0.97] motion-reduce:active:scale-100 transition-[background-color,color,scale] duration-150 ${easeOut}`;
const cardClass = "rounded-2xl border border-[#E2E0DA] bg-white";

// Motion. The page is a scroll story: each section plays once when it scrolls into view (IntersectionObserver), its parts
// arriving one after another. Everything uses the app's ease-out curve and stays between 150 and 600ms, except the two
// drawn lines (the hero wave draws once, the baseline wave scrolls slowly like a live trace). Nothing moves on hover, and
// under prefers-reduced-motion every mock is shown in its final state with no movement. A section plays when about a fifth
// of it is on screen, so it is already moving as it enters.
const motionCss = `
@keyframes lp-rise { from { opacity: 0; translate: 0 8px; } }
.lp-rise { animation: lp-rise 300ms cubic-bezier(0.23, 1, 0.32, 1) backwards; animation-delay: var(--d, 0ms); }
.st { opacity: 0; translate: 0 8px; transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1), translate 300ms cubic-bezier(0.23, 1, 0.32, 1); transition-delay: var(--d, 0ms); }
[data-shown="true"] .st { opacity: 1; translate: 0 0; }
.lp-line { transform-origin: top; scale: 1 0; transition: scale 600ms cubic-bezier(0.23, 1, 0.32, 1); }
[data-shown="true"] .lp-line { scale: 1 1; }
@keyframes lp-draw { 0% { stroke-dashoffset: 1; opacity: 0; } 1% { opacity: 1; } 100% { stroke-dashoffset: 0; } }
@keyframes lp-sweep { from { scale: 0 1; } }
.lp-wave { stroke-dasharray: 1 2; animation: lp-draw 1200ms cubic-bezier(0.23, 1, 0.32, 1) 200ms backwards; }
.lp-sweep { transform-box: fill-box; transform-origin: 0 50%; animation: lp-sweep 400ms cubic-bezier(0.23, 1, 0.32, 1) backwards; animation-delay: var(--d, 1400ms); }
@keyframes lp-scroll { to { translate: -600px 0; } }
.lp-trace { animation: lp-scroll 6s linear infinite; animation-play-state: paused; }
[data-shown="true"] .lp-trace { animation-play-state: running; }
@media (prefers-reduced-motion: reduce) {
  .lp-rise, .lp-wave, .lp-sweep, .lp-trace { animation: none; }
  .st { opacity: 1; translate: 0 0; transition: none; }
  .lp-line { scale: 1 1; transition: none; }
}`;

// One seamless EEG-like trace (600 units wide, drawn twice) shared by the baseline panel and the small reading in the core-idea mock.
const museWave = "M0.0 94.9 C2.1 95.9 8.3 101.8 12.5 101.3 C16.7 100.9 20.8 94.2 25.0 92.2 C29.2 90.2 33.3 89.6 37.5 89.3 C41.7 89.1 45.8 89.4 50.0 90.8 C54.2 92.2 58.3 97.7 62.5 97.8 C66.7 97.8 70.8 91.3 75.0 90.9 C79.2 90.6 83.3 94.5 87.5 95.6 C91.7 96.7 95.8 101.9 100.0 97.6 C104.2 93.4 108.3 77.4 112.5 70.2 C116.7 62.9 120.8 57.1 125.0 54.0 C129.2 51.0 133.3 50.8 137.5 51.6 C141.7 52.5 145.8 56.9 150.0 59.3 C154.2 61.7 158.3 64.3 162.5 65.9 C166.7 67.5 170.8 65.4 175.0 68.9 C179.2 72.5 183.3 84.7 187.5 87.0 C191.7 89.3 195.8 85.3 200.0 82.8 C204.2 80.2 208.3 71.5 212.5 71.8 C216.7 72.0 220.8 79.9 225.0 84.2 C229.2 88.6 233.3 93.7 237.5 97.7 C241.7 101.8 245.8 107.5 250.0 108.5 C254.2 109.4 258.3 104.9 262.5 103.6 C266.7 102.2 270.8 101.9 275.0 100.4 C279.2 98.9 283.3 100.2 287.5 94.4 C291.7 88.5 295.8 71.1 300.0 65.1 C304.2 59.2 308.3 58.2 312.5 58.7 C316.7 59.1 320.8 65.8 325.0 67.8 C329.2 69.8 333.3 70.4 337.5 70.7 C341.7 70.9 345.8 70.6 350.0 69.2 C354.2 67.8 358.3 62.3 362.5 62.2 C366.7 62.2 370.8 68.7 375.0 69.1 C379.2 69.4 383.3 65.5 387.5 64.4 C391.7 63.3 395.8 58.1 400.0 62.4 C404.2 66.6 408.3 82.6 412.5 89.8 C416.7 97.1 420.8 102.9 425.0 106.0 C429.2 109.0 433.3 109.2 437.5 108.4 C441.7 107.5 445.8 103.1 450.0 100.7 C454.2 98.3 458.3 95.7 462.5 94.1 C466.7 92.5 470.8 94.6 475.0 91.1 C479.2 87.5 483.3 75.3 487.5 73.0 C491.7 70.7 495.8 74.7 500.0 77.2 C504.2 79.8 508.3 88.5 512.5 88.2 C516.7 88.0 520.8 80.1 525.0 75.8 C529.2 71.4 533.3 66.3 537.5 62.3 C541.7 58.2 545.8 52.5 550.0 51.5 C554.2 50.6 558.3 55.1 562.5 56.4 C566.7 57.8 570.8 58.1 575.0 59.6 C579.2 61.1 583.3 59.8 587.5 65.6 C591.7 71.5 595.8 88.9 600.0 94.9 C604.2 100.8 608.3 101.8 612.5 101.3 C616.7 100.9 620.8 94.2 625.0 92.2 C629.2 90.2 633.3 89.6 637.5 89.3 C641.7 89.1 645.8 89.4 650.0 90.8 C654.2 92.2 658.3 97.7 662.5 97.8 C666.7 97.8 670.8 91.3 675.0 90.9 C679.2 90.6 683.3 94.5 687.5 95.6 C691.7 96.7 695.8 101.9 700.0 97.6 C704.2 93.4 708.3 77.4 712.5 70.2 C716.7 62.9 720.8 57.1 725.0 54.0 C729.2 51.0 733.3 50.8 737.5 51.6 C741.7 52.5 745.8 56.9 750.0 59.3 C754.2 61.7 758.3 64.3 762.5 65.9 C766.7 67.5 770.8 65.4 775.0 68.9 C779.2 72.5 783.3 84.7 787.5 87.0 C791.7 89.3 795.8 85.3 800.0 82.8 C804.2 80.2 808.3 71.5 812.5 71.8 C816.7 72.0 820.8 79.9 825.0 84.2 C829.2 88.6 833.3 93.7 837.5 97.7 C841.7 101.8 845.8 107.5 850.0 108.5 C854.2 109.4 858.3 104.9 862.5 103.6 C866.7 102.2 870.8 101.9 875.0 100.4 C879.2 98.9 883.3 100.2 887.5 94.4 C891.7 88.5 895.8 71.1 900.0 65.1 C904.2 59.2 908.3 58.2 912.5 58.7 C916.7 59.1 920.8 65.8 925.0 67.8 C929.2 69.8 933.3 70.4 937.5 70.7 C941.7 70.9 945.8 70.6 950.0 69.2 C954.2 67.8 958.3 62.3 962.5 62.2 C966.7 62.2 970.8 68.7 975.0 69.1 C979.2 69.4 983.3 65.5 987.5 64.4 C991.7 63.3 995.8 58.1 1000.0 62.4 C1004.2 66.6 1008.3 82.6 1012.5 89.8 C1016.7 97.1 1020.8 102.9 1025.0 106.0 C1029.2 109.0 1033.3 109.2 1037.5 108.4 C1041.7 107.5 1045.8 103.1 1050.0 100.7 C1054.2 98.3 1058.3 95.7 1062.5 94.1 C1066.7 92.5 1070.8 94.6 1075.0 91.1 C1079.2 87.5 1083.3 75.3 1087.5 73.0 C1091.7 70.7 1095.8 74.7 1100.0 77.2 C1104.2 79.8 1108.3 88.5 1112.5 88.2 C1116.7 88.0 1120.8 80.1 1125.0 75.8 C1129.2 71.4 1133.3 66.3 1137.5 62.3 C1141.7 58.2 1145.8 52.5 1150.0 51.5 C1154.2 50.6 1158.3 55.1 1162.5 56.4 C1166.7 57.8 1170.8 58.1 1175.0 59.6 C1179.2 61.1 1183.3 59.8 1187.5 65.6 C1191.7 71.5 1197.9 90.0 1200.0 94.9";

const reducedQuery = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(reducedQuery).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(reducedQuery);
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Turns true once, the first time a fifth of the element is in view. Without IntersectionObserver it is true at once. */
function useShown<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); observer.disconnect(); }
    }, { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, shown] as const;
}

/** A later beat in a mock's sequence: true `ms` after the section is shown. Under reduced motion it is true from the start, so the mock rests in its final state. */
function useBeat(shown: boolean, ms: number) {
  const reduced = usePrefersReducedMotion();
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => setOn(true), ms);
    return () => clearTimeout(timer);
  }, [shown, ms]);
  return reduced || on;
}

const delay = (ms: number) => ({ ["--d" as string]: `${ms}ms` });

/** The numbered marker and the line down to the next one, like the pre-test hub's timeline. Drawn by the section's own animation. */
function StepRail({ number, first = false, last = false }: { number?: number; first?: boolean; last?: boolean }) {
  // Marker centers sit 20px under the section's top padding (64px, 96px from 1024px); the line runs through the padding in between.
  const span = first ? "top-[calc(4rem+20px)] bottom-0 lg:top-[calc(6rem+20px)]" : last ? "top-0 h-[calc(4rem+20px)] lg:h-[calc(6rem+20px)]" : "inset-y-0";
  return (
    <>
      <span className={`absolute left-[19px] w-0.5 overflow-hidden rounded-full bg-[#E1E2E7] ${span}`} aria-hidden="true">
        <span className="lp-line block h-full w-full bg-[#00538A]" />
      </span>
      {number !== undefined && (
        <span className="absolute left-0 top-16 z-[1] flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#8A8F9C] bg-white text-[1.0625rem] font-bold tabular-nums text-[#4A4F5C] lg:top-24" aria-hidden="true">{number}</span>
      )}
    </>
  );
}

/**
 * One chapter of the story: the words on one side and a mock of the real screen on the other, alternating sides. A numbered
 * step sits on the rail down the left edge; a chapter without `step` (the facilitators) is its own white band, off the rail.
 * It takes its natural height, so the next chapter always peeks in. It plays once when it scrolls into view; `mock` gets that
 * moment as `shown`.
 */
function Chapter({ id, title, children, mock, flip = false, step, last = false }: { id: string; title: string; children: ReactNode; mock: (shown: boolean) => ReactNode; flip?: boolean; step?: number; last?: boolean }) {
  const [ref, shown] = useShown<HTMLElement>();
  const onRail = step !== undefined;
  return (
    <section ref={ref} data-shown={shown} aria-labelledby={id} className={onRail ? "" : "border-t border-[#E2E0DA] bg-white"}>
      <div className="mx-auto w-full max-w-6xl px-8">
        <div className={`relative grid items-start gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24 ${onRail ? "pl-16 lg:pl-20" : ""}`}>
          {onRail && <StepRail number={step} first={step === 1} last={last} />}
          <div className={`max-w-[32rem] ${flip ? "lg:order-2" : ""}`}>
            {onRail && <p className="st mb-3 text-[0.8125rem] font-bold uppercase leading-snug tracking-[0.06em] text-[#4A4F5C]">Step {step} of 4</p>}
            <h2 id={id} className="st text-[2rem] leading-[1.2] text-[#1B1D26] lg:text-[2.5rem]" style={{ ...display, ...delay(onRail ? 40 : 0) }}>{title}</h2>
            <div className="st mt-5 space-y-4 text-xl leading-relaxed text-[#4A4F5C]" style={{ ...reading, ...delay(onRail ? 100 : 60) }}>{children}</div>
          </div>
          {/* The mocks only illustrate; the words beside them say everything, so they are hidden from screen readers. */}
          <div aria-hidden="true" className={`st ${flip ? "lg:order-1" : ""}`} style={delay(160)}>{mock(shown)}</div>
        </div>
      </div>
    </section>
  );
}

// ── Mocks: built from the real screens' styles (DESIGN.md), with invented sample content only ───────────────────────

/** Pre-test: a sample question card. Once shown, one answer gets selected and the progress bar advances. */
function PretestMock({ shown }: { shown: boolean }) {
  const picked = useBeat(shown, 900);
  const options = ["Kilometers", "Liters", "Kilograms"];
  return (
    <div className={`${cardClass} p-6 sm:p-8`}>
      <p className="text-[0.9375rem] font-bold uppercase tracking-[0.06em] text-[#4D35BD]">Sample question</p>
      <div className="mt-3 flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E1E2E7]">
          <div className={`h-full w-full rounded-full bg-[#4D35BD] transition-[translate] duration-[600ms] motion-reduce:transition-none ${easeOut}`} style={{ translate: picked ? "-70% 0" : "-80% 0" }} />
        </div>
        <p className="shrink-0 text-[0.9375rem] tabular-nums text-[#4A4F5C]" style={reading}>{picked ? "3" : "2"} of 10 answered</p>
      </div>
      <p className="mt-6 text-2xl leading-[1.25] text-[#1B1D26]" style={display}>Which unit is best for measuring the distance between two towns?</p>
      <div className="mt-6 space-y-3">
        {options.map((option, index) => {
          const selected = picked && index === 0;
          return (
            <div key={option} className={`flex min-h-16 items-center gap-4 rounded-xl border px-6 py-3 transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none ${easeOut} ${selected ? "border-[#00538A] bg-[#CFE4FF] shadow-[inset_0_0_0_1px_#00538A]" : "border-[#8A8F9C] bg-white"}`}>
              <span className="flex-1 text-lg text-[#1B1D26]" style={reading}>{option}</span>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 bg-white transition-colors duration-200 motion-reduce:transition-none ${easeOut} ${selected ? "border-[#00538A]" : "border-[#8A8F9C]"}`}>
                <span className={`h-3 w-3 rounded-full bg-[#00538A] transition-[opacity,scale] duration-200 motion-reduce:transition-none ${easeOut} ${selected ? "opacity-100 scale-100" : "opacity-0 scale-50"}`} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Muse 2 baseline: a navy sensor panel with a trace that keeps scrolling like a live signal. */
function MuseMock() {
  return (
    <div className="rounded-2xl bg-[#1C1D33] p-6 text-white sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-2xl leading-[1.25]" style={display}>Resting recording</p>
        <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-[#CFE4FF]">
          <span className="h-2 w-2 rounded-full bg-[#CFE4FF]" aria-hidden="true" /> Connected
        </p>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl bg-[#191A2E]">
        <svg viewBox="0 0 600 160" className="block h-auto w-full" preserveAspectRatio="none">
          <g stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1">
            <path d="M0 40H600M0 80H600M0 120H600" />
          </g>
          <g className="lp-trace">
            <path d={museWave} fill="none" stroke="#CFE4FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
      </div>
      <p className="mt-5 text-lg leading-snug text-[#D9DBEA]" style={reading}>Nothing to answer. Sit comfortably and stay still.</p>
    </div>
  );
}

const lessons = [
  { title: "Listen", line: "A short audio lesson", icon: Headphones },
  { title: "Watch", line: "A short video lesson", icon: Video },
  { title: "Read", line: "A short reading lesson", icon: BookOpen },
];

/** Learning content: three lesson cards arrive one by one, then one is marked as matched. */
function LessonsMock({ shown }: { shown: boolean }) {
  const matched = useBeat(shown, 1100);
  return (
    <div className="space-y-4">
      {lessons.map(({ title, line, icon: Icon }, index) => {
        const isMatch = matched && index === 1;
        return (
          <div key={title} className="st" style={delay(200 + index * 120)}>
            <div className={`flex items-center gap-4 rounded-2xl border px-6 py-5 transition-[background-color,border-color] duration-300 motion-reduce:transition-none ${easeOut} ${isMatch ? "border-[#00538A] bg-[#CFE4FF]" : "border-[#E2E0DA] bg-white"}`}>
              <Icon className="h-6 w-6 shrink-0 text-[#1B1D26]" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold leading-snug text-[#1B1D26]" style={reading}>{title}</p>
                <p className="text-lg leading-snug text-[#4A4F5C]" style={reading}>{line}</p>
              </div>
              <p className={`shrink-0 rounded-full bg-white px-3 py-1 text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-[#00538A] transition-opacity duration-300 motion-reduce:transition-none ${easeOut} ${isMatch ? "opacity-100" : "opacity-0"}`}>Matched to how you learn</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Post-test and progress: a ring that fills once it is shown. It counts steps, not scores. */
function ProgressMock({ shown }: { shown: boolean }) {
  const filled = useBeat(shown, 300);
  const size = 168;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={`${cardClass} flex flex-col items-center p-8 text-center`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E1E2E7" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#00538A" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={filled ? c * 0.25 : c}
            className={`transition-[stroke-dashoffset] duration-[600ms] motion-reduce:transition-none ${easeOut}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[2rem] leading-none tabular-nums text-[#1B1D26]" style={display}>3 of 4</span>
          <span className="mt-1.5 text-base font-bold text-[#4A4F5C]" style={reading}>steps done</span>
        </div>
      </div>
      <p className="mt-6 text-2xl leading-[1.25] text-[#1B1D26]" style={display}>See how far you've come.</p>
    </div>
  );
}

const cohort = [
  { initials: "A.R.", strand: "LS1-EN", next: "Pre-test" },
  { initials: "J.S.", strand: "LS1-FIL", next: "Baseline recording" },
  { initials: "M.D.", strand: "LS3", next: "Lessons" },
  { initials: "K.L.", strand: "LS1-EN", next: "Post-test" },
];

/** For facilitators: a small cohort table whose rows arrive one by one. Initials only, no names. */
function CohortMock() {
  return (
    <div className={`${cardClass} p-6 sm:p-8`}>
      <p className="text-2xl leading-[1.25] text-[#1B1D26]" style={display}>Cohort overview</p>
      <table className="mt-5 w-full border-collapse text-left">
        <thead>
          <tr className="bg-[#F2F1ED]">
            <th className="rounded-l-lg px-4 py-3 text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-[#4A4F5C]">Learner</th>
            <th className="px-4 py-3 text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-[#4A4F5C]">Strand</th>
            <th className="rounded-r-lg px-4 py-3 text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-[#4A4F5C]">Next step</th>
          </tr>
        </thead>
        <tbody>
          {cohort.map((row, index) => (
            <tr key={row.initials} className="st border-b border-[#E2E0DA] last:border-b-0" style={delay(240 + index * 120)}>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-3 text-lg font-bold text-[#1B1D26]" style={reading}>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F2F1ED] text-[0.8125rem] font-bold">{row.initials}</span>
                </span>
              </td>
              <td className="px-4 py-3 text-[0.9375rem] font-bold uppercase tracking-[0.06em] text-[#4D35BD]">{row.strand}</td>
              <td className="px-4 py-3 text-lg text-[#4A4F5C]" style={reading}>{row.next}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const levels = ["Low readiness", "Moderate readiness", "High readiness"];

/**
 * The core idea as a small flow: three inputs, lines into a readiness estimate with three readiness levels (one lights up in amber),
 * then a line into one lesson. It plays in order once shown: inputs appear, lines draw, the readiness level lights up, the lesson appears.
 * Sample content only; it is not anyone's result.
 */
function CoreIdeaMock({ shown }: { shown: boolean }) {
  const linesDrawn = useBeat(shown, 700);
  const lit = useBeat(shown, 1300);
  const outDrawn = useBeat(shown, 1500);
  const lesson = useBeat(shown, 1800);
  const draw = (on: boolean) => ({ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1 });
  const lineClass = `transition-[stroke-dashoffset] duration-[500ms] motion-reduce:transition-none ${easeOut}`;
  const inputCard = "flex h-[88px] items-center justify-between gap-3 rounded-xl border border-[#E2E0DA] bg-white px-5";
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[13.5rem_4rem_12.5rem_3rem_minmax(0,1fr)] lg:gap-0">
      <div className="grid gap-4">
        <div className={`st ${inputCard}`} style={delay(0)}>
          <p className="text-lg font-bold leading-snug text-[#1B1D26]" style={reading}>Test answers</p>
          <Check className="h-6 w-6 shrink-0 text-[#00538A]" strokeWidth={2.5} />
        </div>
        <div className={`st ${inputCard}`} style={delay(120)}>
          <p className="text-lg font-bold leading-snug text-[#1B1D26]" style={reading}>Readiness survey</p>
          <Check className="h-6 w-6 shrink-0 text-[#00538A]" strokeWidth={2.5} />
        </div>
        <div className={`st ${inputCard}`} style={delay(240)}>
          <p className="text-lg font-bold leading-snug text-[#1B1D26]" style={reading}>Brainwave reading</p>
          <svg viewBox="0 0 600 160" preserveAspectRatio="none" className="h-8 w-14 shrink-0 overflow-hidden">
            <g className="lp-trace"><path d={museWave} fill="none" stroke="#00538A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></g>
          </svg>
        </div>
      </div>

      <svg viewBox="0 0 64 296" preserveAspectRatio="none" className="hidden h-[296px] w-full lg:block" fill="none" stroke="#8A8F9C" strokeWidth="2" strokeLinecap="round">
        {[44, 148, 252].map((y) => <path key={y} d={`M0 ${y} C32 ${y} 32 148 64 148`} pathLength={1} vectorEffect="non-scaling-stroke" className={lineClass} style={draw(linesDrawn)} />)}
      </svg>

      <div className={`${cardClass} p-5`}>
        <p className="text-[0.8125rem] font-bold uppercase leading-snug tracking-[0.06em] text-[#4A4F5C]">Readiness level</p>
        <div className="mt-3 grid gap-2">
          {levels.map((level, index) => {
            const on = lit && index === 1;
            return (
              <p key={level} className={`flex h-12 items-center rounded-lg border px-4 text-lg font-bold transition-[background-color,border-color] duration-300 motion-reduce:transition-none ${easeOut} ${on ? "border-[#FFAB2E] bg-[#FFAB2E] text-[#1B1D26]" : "border-[#E2E0DA] bg-white text-[#4A4F5C]"}`} style={reading}>{level}</p>
            );
          })}
        </div>
      </div>

      <svg viewBox="0 0 48 4" preserveAspectRatio="none" className="hidden h-1 w-full lg:block" fill="none" stroke="#8A8F9C" strokeWidth="2" strokeLinecap="round">
        <path d="M0 2H48" pathLength={1} vectorEffect="non-scaling-stroke" className={lineClass} style={draw(outDrawn)} />
      </svg>

      <div className={`${cardClass} flex items-center gap-3 p-5 transition-[opacity,translate] duration-300 motion-reduce:transition-none ${easeOut} ${lesson ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <Video className="h-6 w-6 shrink-0 text-[#1B1D26]" strokeWidth={1.75} />
        <p className="text-lg font-bold leading-snug text-[#1B1D26]" style={reading}>Short video lesson · Moderate level</p>
      </div>
    </div>
  );
}

/** The core idea, set off from the numbered steps: a white panel the step line passes beside. */
function CoreIdea() {
  const [ref, shown] = useShown<HTMLElement>();
  return (
    <section ref={ref} data-shown={shown} aria-labelledby="core-idea">
      <div className="mx-auto w-full max-w-6xl px-8">
        <div className="relative py-16 pl-16 lg:py-24 lg:pl-20">
          <StepRail />
          <div className={`${cardClass} p-8 lg:p-12`}>
            <h2 id="core-idea" className="st text-[2rem] leading-[1.2] text-[#1B1D26] lg:text-[2.5rem]" style={display}>How ALSense picks your lessons</h2>
            <div className="st mt-5 max-w-[42rem] space-y-4 text-xl leading-relaxed text-[#4A4F5C]" style={{ ...reading, ...delay(60) }}>
              <p>ALSense combines three things: your pre-test answers, your readiness survey, and a short brainwave reading. Together they estimate how ready you are to learn right now.</p>
              <p>Then it picks lessons with a pace and format that aim to fit you.</p>
            </div>
            <div aria-hidden="true" className="mt-10">
              <CoreIdeaMock shown={shown} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The hero illustration, drawn inline from DESIGN.md colors only: an open workbook (white pages, hairline edges, track-grey
 * text lines), an amber highlighter across two lines, indigo strand tabs on the page edge, and a soft deep blue brainwave
 * line crossing both pages. No people, no text. The shape is fixed by the viewBox, so nothing below it moves.
 * The wave draws itself once (1.2s), then the highlighter sweeps in; under reduced motion it all just shows.
 */
function HeroIllustration() {
  const lines = [124, 148, 172, 196, 220, 244, 268, 292];
  return (
    <svg
      role="img"
      aria-label="An open workbook with a highlighted passage and colored strand tabs on its edge, and a soft blue brainwave line crossing both pages."
      viewBox="0 0 560 420"
      className="h-auto w-full"
    >
      {/* Strand tabs: behind the pages so they stick out of the right edge. */}
      <g fill="#4D35BD">
        <rect x="508" y="92" width="32" height="44" rx="8" />
        <rect x="508" y="148" width="32" height="44" rx="8" />
        <rect x="508" y="204" width="32" height="44" rx="8" />
      </g>

      {/* Page stack under the book, then the two pages. */}
      <g fill="none" stroke="#E2E0DA" strokeWidth="1.5" strokeLinecap="round">
        <path d="M60 376H500" />
        <path d="M76 384H484" />
      </g>
      <g fill="#FFFFFF" stroke="#E2E0DA" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M280 52H56Q40 52 40 68V352Q40 368 56 368H280Z" />
        <path d="M280 52H504Q520 52 520 68V352Q520 368 504 368H280Z" />
      </g>
      <path d="M280 52V368" stroke="#E2E0DA" strokeWidth="1.5" />

      {/* Text lines, as bars. Left page: a title bar and eight lines. Right page: the same, shorter. */}
      <g fill="#E1E2E7">
        {lines.map((y, i) => <rect key={`l${y}`} x="72" y={y} width={[176, 160, 176, 128, 168, 152, 176, 96][i]} height="8" rx="4" />)}
        {lines.map((y, i) => <rect key={`r${y}`} x="312" y={y} width={[168, 176, 136, 176, 120, 168, 152, 88][i]} height="8" rx="4" />)}
      </g>
      <rect x="72" y="84" width="104" height="14" rx="7" fill="#4A4F5C" />
      <rect x="312" y="84" width="88" height="14" rx="7" fill="#4A4F5C" />

      {/* Highlighter: two strokes over the left page, sweeping in left to right after the wave has drawn. */}
      <g fill="none" stroke="#FFAB2E" strokeOpacity="0.6" strokeWidth="18" strokeLinecap="round">
        <path className="lp-sweep" d="M70 152H252" style={{ ["--d" as string]: "1400ms" }} />
        <path className="lp-sweep" d="M70 176H224" style={{ ["--d" as string]: "1550ms" }} />
      </g>

      {/* The brainwave line across both pages. pathLength=1 lets the draw animation work in 0 to 1 units. */}
      <path
        className="lp-wave"
        pathLength={1}
        d="M44.0 204.6 C45.8 204.7 51.3 204.9 55.0 205.5 C58.7 206.1 62.3 207.8 66.0 208.1 C69.7 208.5 73.3 204.8 77.0 207.8 C80.7 210.8 84.3 223.5 88.0 226.0 C91.7 228.6 95.3 225.8 99.0 223.3 C102.7 220.9 106.3 213.7 110.0 211.3 C113.7 209.0 117.3 213.3 121.0 209.4 C124.7 205.5 128.3 189.5 132.0 187.9 C135.7 186.3 139.3 193.2 143.0 199.8 C146.7 206.5 150.3 223.4 154.0 227.8 C157.7 232.2 161.3 224.4 165.0 226.1 C168.7 227.8 172.3 240.5 176.0 238.1 C179.7 235.8 183.3 222.6 187.0 212.1 C190.7 201.5 194.3 177.5 198.0 174.7 C201.7 171.8 205.3 190.4 209.0 195.0 C212.7 199.7 216.3 196.5 220.0 202.5 C223.7 208.5 227.3 221.6 231.0 231.0 C234.7 240.3 238.3 261.6 242.0 258.7 C245.7 255.8 249.3 224.0 253.0 213.6 C256.7 203.2 260.3 200.7 264.0 196.2 C267.7 191.6 271.3 189.5 275.0 186.4 C278.7 183.3 282.3 170.2 286.0 177.7 C289.7 185.2 293.3 221.0 297.0 231.5 C300.7 242.1 304.3 241.9 308.0 241.0 C311.7 240.1 315.3 228.5 319.0 226.0 C322.7 223.5 326.3 232.8 330.0 225.8 C333.7 218.8 337.3 190.4 341.0 183.9 C344.7 177.3 348.3 181.7 352.0 186.6 C355.7 191.5 359.3 209.4 363.0 213.5 C366.7 217.6 370.3 207.5 374.0 211.2 C377.7 214.8 381.3 232.7 385.0 235.6 C388.7 238.5 392.3 234.2 396.0 228.6 C399.7 223.0 403.3 205.7 407.0 202.2 C410.7 198.7 414.3 208.6 418.0 207.6 C421.7 206.6 425.3 196.9 429.0 196.1 C432.7 195.3 436.3 198.1 440.0 202.9 C443.7 207.7 447.3 222.1 451.0 224.7 C454.7 227.3 458.3 219.2 462.0 218.5 C465.7 217.8 469.3 221.3 473.0 220.6 C476.7 219.9 480.3 218.0 484.0 214.4 C487.7 210.8 491.3 200.2 495.0 198.9 C498.7 197.5 504.2 205.0 506.0 206.3"
        fill="none"
        stroke="#00538A"
        strokeOpacity="0.85"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingPage({ navigate }) {
  const [closingRef, closingShown] = useShown<HTMLElement>(0.4);
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8F6F2] text-[#1B1D26] selection:bg-[#FFAB2E]/50" style={body}>
      <style>{fontCss + motionCss}</style>

      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#E2E0DA] bg-white px-8">
        <span className="text-[#00538A]" style={{ ...display, fontSize: "1.75rem" }}>ALSense</span>
        <button
          onClick={() => navigate("login")}
          className={`h-12 px-6 rounded-xl border border-[#00538A] bg-white text-[0.9375rem] font-bold tracking-[0.01em] text-[#00538A] hover:bg-[#CFE4FF] ${press} ${focus}`}
        >
          Sign In
        </button>
      </header>

      <main className="flex-1">
        {/* Hero: the message and the one action on the left, the workbook illustration on the right. Stacks below 1024px. */}
        <div className="mx-auto w-full max-w-6xl px-8">
          <section className="grid items-center gap-12 pt-8 pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:pt-10 lg:pb-24">
            <div>
              <h1 className="lp-rise text-[3rem] leading-[1.1] text-[#1B1D26] xl:text-[3.5rem]" style={display}>
                Study the way that suits you
              </h1>
              <p className="lp-rise mt-6 max-w-[34rem] text-xl leading-relaxed text-[#4A4F5C]" style={{ ...reading, ...delay(60) }}>
                ALSense is for adult learners in the Alternative Learning System. Take a short test, record a baseline with a headband, and study lessons that match how you learn.
              </p>
              <button
                onClick={() => navigate("login")}
                className={`lp-rise mt-10 inline-flex h-14 items-center gap-2 rounded-xl bg-[#00538A] px-8 text-lg font-bold text-white hover:bg-[#004270] ${press} ${focus}`}
                style={delay(120)}
              >
                Sign In <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <HeroIllustration />
          </section>
        </div>

        {/* The four learner steps run down one rail; the core idea sits between steps 2 and 3, and the facilitators are off the rail. */}
        <Chapter id="story-pretest" step={1} title="Start with a short pre-test" mock={(shown) => <PretestMock shown={shown} />}>
          <p>Answer questions about you and your learning, one at a time. Each learning strand has its own set.</p>
          <p>You can save your answers and come back to finish later.</p>
        </Chapter>

        <Chapter id="story-baseline" step={2} title="Then a short recording" flip mock={() => <MuseMock />}>
          <p>Your facilitator helps you wear a Muse 2 headband at the learning center. It records your resting brain activity for a few minutes.</p>
          <p>There is nothing to answer. You just sit comfortably and stay still.</p>
        </Chapter>

        <CoreIdea />

        <Chapter id="story-content" step={3} title="Study in the way that fits you" mock={(shown) => <LessonsMock shown={shown} />}>
          <p>Lessons come as audio you listen to, video you watch, or text you read.</p>
          <p>You get the kind that matches how you learn.</p>
        </Chapter>

        <Chapter id="story-progress" step={4} last flip title="Then see how far you have come" mock={(shown) => <ProgressMock shown={shown} />}>
          <p>After your lessons, take the strand questions again. Your progress page shows where you started and where you are now.</p>
        </Chapter>

        <Chapter id="story-facilitators" title="For facilitators" mock={() => <CohortMock />}>
          <p>See your whole cohort in one place. Upload learning content for each strand, read cohort analytics, and export results when you need them.</p>
        </Chapter>

        {/* Closing: one more way in. */}
        <section ref={closingRef} data-shown={closingShown} aria-labelledby="closing-title" className="border-t border-[#E2E0DA] bg-white">
          <div className="mx-auto flex max-w-2xl flex-col items-center px-8 py-16 text-center lg:py-24">
            <h2 id="closing-title" className="st text-[2rem] leading-[1.2] text-[#1B1D26] lg:text-[2.5rem]" style={display}>Ready to start?</h2>
            <p className="st mt-4 text-xl leading-relaxed text-[#4A4F5C]" style={{ ...reading, ...delay(60) }}>Sign in with the ID number your facilitator gave you.</p>
            <div className="st mt-10" style={delay(120)}>
              <button
                onClick={() => navigate("login")}
                className={`inline-flex h-14 items-center gap-2 rounded-xl bg-[#00538A] px-8 text-lg font-bold text-white hover:bg-[#004270] ${press} ${focus}`}
              >
                Sign In <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E2E0DA] bg-white px-8 py-6 text-base text-[#4A4F5C]">
        ALSense · A capstone research project
      </footer>
    </div>
  );
}
