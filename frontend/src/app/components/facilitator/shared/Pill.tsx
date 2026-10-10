import type { ReactNode } from "react";

export type PillTone = "neutral" | "success" | "warning" | "danger" | "muted";

// Colours follow DESIGN.md's readiness chips: blue wash = high / done, amber wash = medium
// or needs a look, low tint = low or a problem. "success" is blue, not green: done is blue
// on the learner side too. "neutral" is a plain outlined chip; "muted" is the sunken one.
const TONE: Record<PillTone, string> = {
  neutral: "text-[#1B1D26] bg-white border border-[#E2E0DA]",
  success: "text-[#00538A] bg-[#CFE4FF]",
  warning: "text-[#835500] bg-[#FFDEB5]",
  danger: "text-[#BA1A1A] bg-[#FFDAD7]",
  muted: "text-[#4A4F5C] bg-[#F2F1ED]",
};

interface PillProps {
  children: ReactNode;
  /** Default: "neutral". Use "muted" for "nothing yet" states such as "Not yet profiled" (FD8). */
  tone?: PillTone;
  className?: string;
}

/** A small fully rounded status label: Overline text on a tint. Always carries a word. */
export function Pill({ children, tone = "neutral", className = "" }: PillProps) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-[0.8125rem] font-bold uppercase tracking-[0.06em] leading-snug px-3 py-1 rounded-full ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}
