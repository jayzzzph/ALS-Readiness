import { createElement, useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, ChevronRight, ClipboardList, Headset, ListChecks } from "lucide-react";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";

// TEMPORARY: loads fonts from Google Fonts. Replace with @fontsource imports once `pnpm add` works.
const fontCss = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');";

// Motion, kept to what helps a first-time visitor see where to look: the hero text arrives in order (headline, description,
// button), the workbook's brainwave line draws itself once and the highlighter sweeps in after it, and the cards arrive as
// they scroll into view. Opacity, an 8px rise, a stroke draw and a sweep only, on the app's ease-out curve, nothing on hover,
// and all of it off under prefers-reduced-motion (the picture then simply shows).
const motionCss = `
@keyframes lp-rise { from { opacity: 0; translate: 0 8px; } }
.lp-rise { animation: lp-rise 300ms cubic-bezier(0.23, 1, 0.32, 1) backwards; animation-delay: var(--d, 0ms); }
.lp-reveal { opacity: 0; translate: 0 8px; transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1), translate 300ms cubic-bezier(0.23, 1, 0.32, 1); transition-delay: var(--d, 0ms); }
.lp-reveal[data-shown="true"] { opacity: 1; translate: 0 0; }
@keyframes lp-draw { 0% { stroke-dashoffset: 1; opacity: 0; } 1% { opacity: 1; } 100% { stroke-dashoffset: 0; } }
@keyframes lp-sweep { from { scale: 0 1; } }
.lp-wave { stroke-dasharray: 1 2; animation: lp-draw 1200ms cubic-bezier(0.23, 1, 0.32, 1) 200ms backwards; }
.lp-sweep { transform-box: fill-box; transform-origin: 0 50%; animation: lp-sweep 400ms cubic-bezier(0.23, 1, 0.32, 1) backwards; animation-delay: var(--d, 1400ms); }
@media (prefers-reduced-motion: reduce) {
  .lp-wave, .lp-sweep { animation: none; }
  .lp-rise { animation: none; }
  .lp-reveal { opacity: 1; translate: 0 0; transition: none; }
}`;

/** Shows once when the element first scrolls into view, then stops watching. Without IntersectionObserver it just shows. */
function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); observer.disconnect(); }
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, shown] as const;
}

/** A card that fades in and rises 8px when it scrolls into view; `index` staggers cards that arrive together by 60ms each. */
function Reveal({ as, index = 0, className, children }: { as: "div" | "li"; index?: number; className: string; children: ReactNode }) {
  const [ref, shown] = useRevealOnScroll<HTMLElement>();
  return createElement(as, { ref, className: `lp-reveal ${className}`, "data-shown": shown, style: { ["--d" as string]: `${index * 60}ms` } }, children);
}

// Type roles from DESIGN.md: serif headings, DM Sans chrome, Atkinson Hyperlegible for every sentence a learner reads.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const body = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const press = `active:scale-[0.97] motion-reduce:active:scale-100 transition-[background-color,color,scale] duration-150 ${easeOut}`;
const cardClass = "rounded-2xl border border-[#E2E0DA] bg-white";

// The four stops of the learner pipeline, in order, with a plain sentence each. Nothing here is a result, a count or a claim about outcomes.
const steps = [
  { title: "Pre-test", desc: "Tell us about yourself, then answer a set of questions for each learning strand.", icon: ClipboardList, sensor: false },
  { title: "Muse 2 baseline", desc: "Your facilitator helps you wear a headband for a short recording at the learning center.", icon: Headset, sensor: true },
  { title: "Learning content", desc: "Study lessons you can listen to, watch or read, chosen to fit how you learn.", icon: BookOpen, sensor: false },
  { title: "Post-test", desc: "After your lessons, answer the strand questions again.", icon: ListChecks, sensor: false },
];

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
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8F6F2] text-[#1B1D26] selection:bg-[#FFAB2E]/50" style={body}>
      <style>{fontCss + motionCss}</style>

      <header className="flex h-20 items-center justify-between px-8 bg-white border-b border-[#E2E0DA]">
        <span className="text-[#00538A]" style={{ ...display, fontSize: "1.75rem" }}>ALSense</span>
        <button
          onClick={() => navigate("login")}
          className={`h-12 px-6 rounded-xl border border-[#00538A] bg-white text-[0.9375rem] font-bold tracking-[0.01em] text-[#00538A] hover:bg-[#CFE4FF] ${press} ${focus}`}
        >
          Sign In
        </button>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-8">
          {/* Hero: the message and the one action on the left, the four steps as a quiet preview on the right. Stacks below 1024px. */}
          <section className="grid items-center gap-12 pt-16 pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div>
              <h1 className="lp-rise text-[3rem] leading-[1.1] text-[#1B1D26] xl:text-[3.5rem]" style={display}>
                Study the way that suits you
              </h1>
              <p className="lp-rise mt-6 max-w-[34rem] text-xl leading-relaxed text-[#4A4F5C]" style={{ ...reading, ["--d" as string]: "60ms" }}>
                ALSense is for adult learners in the Alternative Learning System. Take a short test, record a baseline with a headband, and study lessons that match how you learn.
              </p>
              <button
                onClick={() => navigate("login")}
                className={`lp-rise mt-10 inline-flex h-14 items-center gap-2 rounded-xl bg-[#00538A] px-8 text-lg font-bold text-white hover:bg-[#004270] ${press} ${focus}`}
                style={{ ["--d" as string]: "120ms" }}
              >
                Sign In <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <HeroIllustration />
          </section>

          {/* How it works: the same four steps with a sentence each. Two by two at laptop width, four across from 1280px. */}
          <section aria-labelledby="how-it-works" className="pt-8 pb-16">
            <h2 id="how-it-works" className="text-[2rem] leading-[1.2] text-[#1B1D26]" style={display}>How it works</h2>
            <ul className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
              {steps.map(({ title, desc, icon: Icon, sensor }, index) => (
                <Reveal as="li" key={title} index={index} className={`${cardClass} p-6`}>
                  {/* Navy is reserved for the sensor, so only the Muse 2 step carries it. */}
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${sensor ? "bg-[#1C1D33] text-white" : "bg-[#F2F1ED] text-[#1B1D26]"}`} aria-hidden="true">
                    <Icon className="w-6 h-6" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-2xl leading-[1.25] text-[#1B1D26]" style={display}>{title}</h3>
                  <p className="mt-2 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>{desc}</p>
                </Reveal>
              ))}
            </ul>
          </section>

          {/* Who it is for: two short notes, one per role. */}
          <section aria-label="For learners and facilitators" className="grid gap-6 pb-16 md:grid-cols-2">
            <Reveal as="div" index={0} className={`${cardClass} p-8`}>
              <h2 className="text-2xl leading-[1.25] text-[#1B1D26]" style={display}>For learners</h2>
              <p className="mt-3 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
                Take the pre-test at your learning center, then study lessons that match how you learn. Come back any time to see your progress and your schedule. Your facilitator gives you your ID number.
              </p>
            </Reveal>
            <Reveal as="div" index={1} className={`${cardClass} p-8`}>
              <h2 className="text-2xl leading-[1.25] text-[#1B1D26]" style={display}>For facilitators</h2>
              <p className="mt-3 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
                Run your sessions, manage your cohort, upload learning content for each strand, and read your cohort's analytics after you sign in.
              </p>
            </Reveal>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-[#E2E0DA] px-8 py-6 text-base text-[#4A4F5C]">
        ALSense · A capstone research project
      </footer>
    </div>
  );
}
