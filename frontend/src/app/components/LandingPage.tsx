import { ChevronRight } from "lucide-react";

// TEMPORARY: loads fonts from Google Fonts. Replace with @fontsource imports once `pnpm add` works.
const fontCss = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');";

const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const body = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

const steps = [
  { title: "Take the diagnostic test", desc: "Answer the preparatory equivalency exam and learner inventory questions." },
  { title: "See your readiness profile", desc: "Your results show how ready you are to start learning." },
  { title: "Study content that fits you", desc: "Get auditory, visual, or reading content matched to how you learn." },
];

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";

export function LandingPage({ navigate }) {
  return (
    <div
      className="min-h-screen bg-[#F8F6F2] text-[#1B1D26] selection:bg-[#FFAB2E]/50"
      style={body}
    >
      <style>{fontCss}</style>
      <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#E2E0DA]">
        <span className="text-[#00538A]" style={{ ...display, fontSize: "1.75rem" }}>ALSense</span>
        <button
          onClick={() => navigate("login")}
          className={`px-5 py-2 text-[#00538A] font-medium border border-[#00538A] hover:bg-[#00538A]/5 rounded-lg transition-colors duration-200 ${focus}`}
        >
          Sign In
        </button>
      </header>

      <main>
        {/* Hero */}
        <section className="px-8 pt-24 pb-20 text-center max-w-4xl mx-auto">
          <h1 className="mb-6 text-[#1B1D26]" style={{ ...display, fontSize: "3.5rem", lineHeight: 1.1 }}>
            Empowering adult learners in the Alternative Learning System
          </h1>
          <p className="text-[#4A4F5C] text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            A learning platform that profiles the readiness of ALS learners, delivers modality-matched content, and gives facilitators the analytics they need.
          </p>
          <button
            onClick={() => navigate("login")}
            className={`inline-flex items-center gap-2 px-8 py-4 bg-[#00538A] hover:bg-[#004270] text-white text-lg font-bold rounded-xl transition-colors duration-200 ${focus}`}
          >
            Sign In <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-it-works" className="px-8 pb-24 max-w-2xl mx-auto">
          <h2 id="how-it-works" className="mb-8 text-[#1B1D26]" style={{ ...display, fontSize: "2rem" }}>
            How it works
          </h2>
          <ol>
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-6 py-6 border-t border-[#E2E0DA]">
                <span className="shrink-0 w-10 text-[#00538A]" style={{ ...display, fontSize: "2.25rem", lineHeight: 1 }} aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3 className="mb-1 text-[#1B1D26]" style={{ ...display, fontSize: "1.375rem" }}>{step.title}</h3>
                  <p className="text-[#4A4F5C] text-lg leading-relaxed">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-[#4A4F5C] text-lg leading-relaxed border-t border-[#E2E0DA] pt-6">
            <span className="text-[#1B1D26] font-bold">Facilitators and AIS teachers:</span> manage your cohort, view analytics, and export results after you sign in.
          </p>
        </section>
      </main>

      <footer className="bg-white border-t border-[#E2E0DA] px-8 py-6 text-[#4A4F5C] text-sm">
        &copy; 2026 ALSense
      </footer>
    </div>
  );
}
