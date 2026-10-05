import { Clock, ListChecks } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { formatCountdown } from "./testTiming";

// Type roles from DESIGN.md: serif title, Atkinson Hyperlegible for what learners read.
const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;
const chrome = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
const buttonBase = `h-12 min-w-32 px-6 inline-flex items-center justify-center rounded-xl text-[0.9375rem] font-bold tracking-[0.01em] active:scale-[0.97] motion-reduce:active:scale-100 transition-[background-color,color,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${focus}`;

// Instructions/overview modal shown before any test (strand pretest, LRI, and
// - reused as-is - posttest in Phase 3). The actual test only starts once
// "Start" is clicked; closing/cancelling never begins an attempt.

export function TestOverviewModal({
  title,
  description,
  timeLimitSeconds,
  itemCount,
  onStart,
  onCancel,
}: {
  title: string;
  description: string;
  /** Null means untimed - no "time limit" line is shown. */
  timeLimitSeconds: number | null;
  /** Omit while still loading; shown once known. */
  itemCount?: number;
  onStart: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent
        className="sm:max-w-lg gap-6 rounded-2xl border border-[#E2E0DA] bg-white p-8 text-[#1B1D26] shadow-[0_8px_24px_rgba(27,29,38,0.08)]"
        style={chrome}
      >
        <DialogHeader className="gap-3">
          <DialogTitle className="text-[1.5rem] leading-[1.25]" style={display}>{title}</DialogTitle>
          <DialogDescription className="whitespace-pre-line text-left text-[1.125rem] leading-[1.6] text-[#1B1D26]" style={reading}>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-[1.125rem] leading-[1.6] text-[#1B1D26]" style={reading}>
          {typeof itemCount === "number" && (
            <div className="flex items-center gap-3"><ListChecks className="w-5 h-5 shrink-0 text-[#4D35BD]" aria-hidden="true" /> {itemCount} question{itemCount === 1 ? "" : "s"}</div>
          )}
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 shrink-0 text-[#4D35BD]" aria-hidden="true" />
            {timeLimitSeconds === null ? "No time limit" : `Time limit: ${formatCountdown(timeLimitSeconds)}`}
          </div>
          <p className="font-bold">Once you submit, this attempt cannot be retaken.</p>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <button onClick={onCancel} className={`${buttonBase} border border-[#00538A] bg-white text-[#00538A] hover:bg-[#CFE4FF]`}>Not now</button>
          <button onClick={onStart} className={`${buttonBase} bg-[#00538A] text-white hover:bg-[#004270]`}>Start</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
