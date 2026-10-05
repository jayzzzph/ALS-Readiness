import { BookOpen, ChevronRight, ClipboardList, Headset, ListChecks } from "lucide-react";
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

// The four stops of the learner pipeline, in order. `short` is the line in the hero preview; `desc` is the fuller sentence
// in the cards. Nothing here is a result, a count or a claim about outcomes.
const steps = [
  { title: "Pre-test", short: "Questions about you and each strand", desc: "Tell us about yourself, then answer a set of questions for each learning strand.", icon: ClipboardList, sensor: false },
  { title: "Muse 2 baseline", short: "A short headband recording", desc: "Your facilitator helps you wear a headband for a short recording at the learning center.", icon: Headset, sensor: true },
  { title: "Learning content", short: "Lessons matched to how you learn", desc: "Study lessons you can listen to, watch or read, chosen to fit how you learn.", icon: BookOpen, sensor: false },
  { title: "Post-test", short: "The strand questions again", desc: "After your lessons, answer the strand questions again.", icon: ListChecks, sensor: false },
];

export function LandingPage({ navigate }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8F6F2] text-[#1B1D26] selection:bg-[#FFAB2E]/50" style={body}>
      <style>{fontCss}</style>

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
              <h1 className="text-[3rem] leading-[1.1] text-[#1B1D26] xl:text-[3.5rem]" style={display}>
                Study the way that suits you
              </h1>
              <p className="mt-6 max-w-[34rem] text-xl leading-relaxed text-[#4A4F5C]" style={reading}>
                ALSense is for adult learners in the Alternative Learning System. Take a short test, record a baseline with a headband, and study lessons that match how you learn.
              </p>
              <button
                onClick={() => navigate("login")}
                className={`mt-10 inline-flex h-14 items-center gap-2 rounded-xl bg-[#00538A] px-8 text-lg font-bold text-white hover:bg-[#004270] ${press} ${focus}`}
              >
                Sign In <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <section aria-labelledby="preview-title" className={`${cardClass} p-8`}>
              <h2 id="preview-title" className="text-2xl leading-[1.25] text-[#1B1D26]" style={display}>Your four steps</h2>
              <ol className="mt-6">
                {steps.map((step, index) => (
                  <li key={step.title} className={`relative pl-16 ${index === steps.length - 1 ? "" : "pb-6"}`}>
                    {index < steps.length - 1 && <span className="absolute left-[19px] top-11 bottom-0 w-0.5 rounded-full bg-[#E1E2E7]" aria-hidden="true" />}
                    <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#8A8F9C] bg-white text-[1.0625rem] font-bold tabular-nums text-[#4A4F5C]" aria-hidden="true">{index + 1}</span>
                    <p className="text-lg font-bold leading-snug text-[#1B1D26]" style={reading}>{step.title}</p>
                    <p className="text-lg leading-snug text-[#4A4F5C]" style={reading}>{step.short}</p>
                  </li>
                ))}
              </ol>
            </section>
          </section>

          {/* How it works: the same four steps with a sentence each. Two by two at laptop width, four across from 1280px. */}
          <section aria-labelledby="how-it-works" className="pt-8 pb-16">
            <h2 id="how-it-works" className="text-[2rem] leading-[1.2] text-[#1B1D26]" style={display}>How it works</h2>
            <ul className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
              {steps.map(({ title, desc, icon: Icon, sensor }) => (
                <li key={title} className={`${cardClass} p-6`}>
                  {/* Navy is reserved for the sensor, so only the Muse 2 step carries it. */}
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${sensor ? "bg-[#1C1D33] text-white" : "bg-[#F2F1ED] text-[#1B1D26]"}`} aria-hidden="true">
                    <Icon className="w-6 h-6" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-2xl leading-[1.25] text-[#1B1D26]" style={display}>{title}</h3>
                  <p className="mt-2 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>{desc}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Who it is for: two short notes, one per role. */}
          <section aria-label="For learners and facilitators" className="grid gap-6 pb-16 md:grid-cols-2">
            <div className={`${cardClass} p-8`}>
              <h2 className="text-2xl leading-[1.25] text-[#1B1D26]" style={display}>For learners</h2>
              <p className="mt-3 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
                Take the pre-test at your learning center, then study lessons that match how you learn. Come back any time to see your progress and your schedule. Your facilitator gives you your ID number.
              </p>
            </div>
            <div className={`${cardClass} p-8`}>
              <h2 className="text-2xl leading-[1.25] text-[#1B1D26]" style={display}>For facilitators</h2>
              <p className="mt-3 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>
                Run your sessions, manage your cohort, upload learning content for each strand, and read your cohort's analytics after you sign in.
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-[#E2E0DA] px-8 py-6 text-base text-[#4A4F5C]">
        ALSense · A capstone research project
      </footer>
    </div>
  );
}
