import type { ReactNode } from "react";

export type PillTone = "neutral" | "success" | "warning" | "danger" | "muted";

// The colour pairs the existing pages use for their status pills.
const TONE: Record<PillTone, string> = {
  neutral: "text-blue-600 bg-blue-50",
  success: "text-green-600 bg-green-50",
  warning: "text-yellow-600 bg-yellow-50",
  danger: "text-red-600 bg-red-50",
  muted: "text-gray-500 bg-gray-100",
};

interface PillProps {
  children: ReactNode;
  /** Default: "neutral". Use "muted" for "nothing yet" states such as "Not yet profiled" (FD8). */
  tone?: PillTone;
  className?: string;
}

/** A small rounded status label. */
export function Pill({ children, tone = "neutral", className = "" }: PillProps) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}
