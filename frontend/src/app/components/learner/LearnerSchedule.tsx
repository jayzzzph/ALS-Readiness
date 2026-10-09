import { CalendarDays } from "lucide-react";
import { AppLayout } from "../shared/AppLayout";

// There is no schedule data yet, so the page says so calmly instead of showing sample events.
// Type roles from DESIGN.md: serif headings, Atkinson Hyperlegible for the sentences a learner reads.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;

export function LearnerSchedule({ navigate, user, onLogout }) {
  return (
    <AppLayout navigate={navigate} user={user} onLogout={onLogout} currentPage="learner-schedule">
      <div className="w-full max-w-[90rem] px-6 lg:px-8 py-10">
        <h2 className="text-[3rem] leading-[1.1] text-[#1B1D26]" style={display}>Schedule</h2>
        <section aria-labelledby="schedule-empty-title" className="mt-8 max-w-[40rem] rounded-2xl border border-[#E2E0DA] bg-white p-8 text-center">
          <CalendarDays className="mx-auto mb-3 w-7 h-7 text-[#4A4F5C]" strokeWidth={1.5} aria-hidden="true" />
          <h3 id="schedule-empty-title" className="text-2xl leading-[1.25] text-[#1B1D26]" style={display}>Nothing scheduled yet</h3>
          <p className="mt-2 text-lg leading-relaxed text-[#4A4F5C]" style={reading}>Your facilitator will share your schedule here.</p>
        </section>
      </div>
    </AppLayout>
  );
}
