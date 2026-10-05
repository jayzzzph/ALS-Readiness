import { createElement, useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, ChevronRight, ClipboardList, Headset, ListChecks } from "lucide-react";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";

// TEMPORARY: loads fonts from Google Fonts. Replace with @fontsource imports once `pnpm add` works.
const fontCss = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');";

// Motion, kept to what helps a first-time visitor see where to look: the hero text arrives in order (headline, description,
// button) and the cards arrive as they scroll into view. Opacity and an 8px rise only, 300ms on the app's ease-out curve,
// nothing on hover, and all of it off under prefers-reduced-motion.
const motionCss = `
@keyframes lp-rise { from { opacity: 0; translate: 0 8px; } }
.lp-rise { animation: lp-rise 300ms cubic-bezier(0.23, 1, 0.32, 1) backwards; animation-delay: var(--d, 0ms); }
.lp-reveal { opacity: 0; translate: 0 8px; transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1), translate 300ms cubic-bezier(0.23, 1, 0.32, 1); transition-delay: var(--d, 0ms); }
.lp-reveal[data-shown="true"] { opacity: 1; translate: 0 0; }
@media (prefers-reduced-motion: reduce) {
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
 * The hero picture. The box holds its 4:3 shape from the first paint (and its tone, if the file is slow or missing), so
 * nothing below moves when the picture arrives; the picture itself fades in once it has loaded.
 * Alt is empty on purpose until the picture has a real description: the headline carries the message.
 */
function HeroImage() {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  // A cached picture can finish before React attaches onLoad.
  useEffect(() => { if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true); }, []);
  return (
    <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-[#F2F1ED] lg:aspect-[4/3]">
      <img
        ref={ref}
        src="/images/landing-hero.jpg"
        alt=""
        width={1200}
        height={900}
        loading="eager"
        fetchPriority="high"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${easeOut} motion-reduce:transition-none ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
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

            <HeroImage />
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
