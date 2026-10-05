import { useEffect, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, LoaderCircle, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { getStrandAttemptResult } from "../../../lib/api/diagnostic";
import { getErrorMessage } from "../../../lib/api/errors";
import type { StrandAttemptResult } from "../../../lib/api/types";

// "Show Score" reveal, used by the post-test hub only (the pre-test page never shows
// scores). Only ever mounted once both halves are already known complete - a
// separate, deliberate, learner-initiated action, not the submission-time flow
// (which stays score-free per that locked decision).
//
// Type roles from DESIGN.md: serif title, Atkinson Hyperlegible for the sentences
// and numbers a learner reads. Deep blue for a gain, amber for a dip (words always
// say which), never green or orange.

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; pre: StrandAttemptResult; post: StrandAttemptResult };

const display = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;
const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;

export function ScoreCompareModal({
  strandLabel,
  pretestTestId,
  posttestTestId,
  onClose,
}: {
  strandLabel: string;
  pretestTestId: number;
  posttestTestId: number;
  onClose: () => void;
}) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    Promise.all([getStrandAttemptResult(pretestTestId), getStrandAttemptResult(posttestTestId)])
      .then(([pre, post]) => { if (!cancelled) setState({ status: "ready", pre, post }); })
      .catch((err) => { if (!cancelled) setState({ status: "error", message: getErrorMessage(err, "Your scores could not be loaded.") }); });
    return () => { cancelled = true; };
  }, [pretestTestId, posttestTestId]);

  const improved = state.status === "ready" && state.post.mps >= state.pre.mps;
  const change = state.status === "ready" ? Math.abs(Math.round((state.post.mps - state.pre.mps) * 100) / 100) : 0;
  const changeWords = change === 0 ? "No change" : `${improved ? "Up" : "Down"} ${change} ${change === 1 ? "point" : "points"}`;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg rounded-2xl border-[#E2E0DA] bg-white p-8 gap-6">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-2xl leading-[1.25] font-normal text-[#1B1D26]" style={display}>{strandLabel}: your score before and after the lessons</DialogTitle>
          <DialogDescription className="text-lg leading-relaxed text-[#4A4F5C]" style={reading}>How you did on the pre-test, and how you did on the post-test.</DialogDescription>
        </DialogHeader>

        {state.status === "loading" && (
          <div role="status" className="py-8 flex items-center justify-center gap-3 text-lg text-[#4A4F5C]" style={reading}>
            <LoaderCircle className="w-6 h-6 text-[#00538A] motion-safe:animate-spin" aria-hidden="true" /> Loading your scores...
          </div>
        )}
        {state.status === "error" && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#B42318] bg-[#FDECEA] p-4 text-[#7A1A12]">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-lg leading-snug" style={reading}>{state.message}</p>
          </div>
        )}
        {state.status === "ready" && (
          <div className="space-y-4" style={reading}>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-[#F2F1ED] p-5 text-center">
                <p className="text-lg font-bold text-[#4A4F5C]">Before the lessons</p>
                <p className="mt-1 text-[2.5rem] leading-none tabular-nums text-[#1B1D26]" style={display}>{state.pre.mps}%</p>
                <p className="mt-2 text-base text-[#4A4F5C]">{state.pre.total_score} of {state.pre.item_count} correct</p>
              </div>
              <div className={`rounded-xl p-5 text-center ${improved ? "bg-[#CFE4FF]" : "bg-[#FFDEB5]"}`}>
                <p className="text-lg font-bold text-[#1B1D26]">After the lessons</p>
                <p className="mt-1 text-[2.5rem] leading-none tabular-nums text-[#1B1D26]" style={display}>{state.post.mps}%</p>
                <p className="mt-2 text-base text-[#1B1D26]">{state.post.total_score} of {state.post.item_count} correct</p>
              </div>
            </div>
            <p className={`flex items-center justify-center gap-2 text-lg font-bold ${improved ? "text-[#00538A]" : "text-[#835500]"}`}>
              {change === 0 ? <Minus className="w-5 h-5" aria-hidden="true" /> : improved ? <ArrowUp className="w-5 h-5" aria-hidden="true" /> : <ArrowDown className="w-5 h-5" aria-hidden="true" />}
              {changeWords}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
