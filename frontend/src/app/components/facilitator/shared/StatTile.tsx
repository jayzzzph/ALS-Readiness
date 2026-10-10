import type { ComponentType, ReactNode } from "react";
import { DISPLAY_FONT, EASE_OUT, FOCUS_RING } from "./tokens";

export type StatTone = "blue" | "teal" | "green" | "red" | "orange" | "purple";

// An icon chip takes the colour of the job it does (DESIGN.md, One Job Rule): blue wash for
// progress and done, amber wash for attention, low tint for a problem, sunken for the rest.
// The old tone names are kept so callers do not change.
const TONE: Record<StatTone, string> = {
  blue: "text-[#00538A] bg-[#CFE4FF]",
  green: "text-[#00538A] bg-[#CFE4FF]",
  orange: "text-[#835500] bg-[#FFDEB5]",
  red: "text-[#BA1A1A] bg-[#FFDAD7]",
  teal: "text-[#4A4F5C] bg-[#F2F1ED]",
  purple: "text-[#4A4F5C] bg-[#F2F1ED]",
};

interface StatTileProps {
  label: string;
  /** Already formatted (use lib/labels.ts); pass a dash for a missing value, never a placeholder number. */
  value: ReactNode;
  /** A lucide icon. Without one the tile is the plain number-and-label variant. */
  icon?: ComponentType<{ className?: string }>;
  tone?: StatTone;
  /** A quiet line under the label, e.g. "across 3 strands". */
  hint?: ReactNode;
  /** Makes the whole tile a button. */
  onClick?: () => void;
}

/** One number with its label, as in the stat rows of the existing pages. */
export function StatTile({ label, value, icon: Icon, tone = "blue", hint, onClick }: StatTileProps) {
  const body = (
    <>
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${TONE[tone]}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      )}
      <div className="text-[1.5rem] leading-[1.25] text-[#1B1D26] tabular-nums" style={DISPLAY_FONT}>{value}</div>
      <div className="text-[#4A4F5C] text-[0.9375rem] mt-1">{label}</div>
      {hint && <div className="text-[#4A4F5C] text-[0.9375rem] mt-1">{hint}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`bg-white rounded-2xl border border-[#E2E0DA] p-5 text-left hover:border-[#00538A] transition-colors duration-150 ${EASE_OUT} ${FOCUS_RING}`}
      >
        {body}
      </button>
    );
  }

  return <div className="bg-white rounded-2xl border border-[#E2E0DA] p-5">{body}</div>;
}
