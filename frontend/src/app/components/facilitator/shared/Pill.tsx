import type { ReactNode } from "react";

export type PillTone = "neutral" | "success" | "warning" | "danger" | "muted";

// For a small tag that is not a status (a status uses StatusText: icon plus word).
// "success" is blue, not green: done is blue on the learner side too.
const TONE: Record<PillTone, string> = {
  neutral: "text-[#1B1D26] bg-white border border-[#E2E0DA]",
  success: "text-[#00538A] bg-[#CFE4FF]",
  warning: "text-[#835500] bg-[#FFDEB5]",
  danger: "text-[#BA1A1A] bg-[#FFDAD7]",
  muted: "text-[#4A4F5C] bg-[#F2F1ED]",
};

interface PillProps {
  children: ReactNode;
  /** Default: "neutral". */
  tone?: PillTone;
  className?: string;
}

/**
 * A small rounded tag in sentence case. The learner side keeps all-caps for
 * strand codes only, so tags are not shouted either.
 */
export function Pill({ children, tone = "neutral", className = "" }: PillProps) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-[0.875rem] font-semibold leading-snug px-2.5 py-0.5 rounded-full ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}
