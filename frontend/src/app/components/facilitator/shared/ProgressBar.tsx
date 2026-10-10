import { DASH, formatPercent } from "../../../../lib/labels";

export type ProgressTone = "orange" | "green" | "blue" | "red" | "gray";

// The fill carries the meaning (DESIGN.md): deep blue for progress and done, red for low.
// The old tone names are kept so callers do not change; every blue-ish name is deep blue.
const FILL: Record<ProgressTone, string> = {
  orange: "bg-[#00538A]",
  green: "bg-[#00538A]",
  blue: "bg-[#00538A]",
  red: "bg-[#BA1A1A]",
  gray: "bg-[#6B7080]",
};

interface ProgressBarProps {
  /** 0 to 100. Null or undefined means there is nothing to measure: a dash is shown, not an empty bar (FD8). */
  value: number | null | undefined;
  tone?: ProgressTone;
  /** "sm" is the thin in-table bar, "md" the thicker one used in cards. Default: "sm". */
  size?: "sm" | "md";
  /** Show the whole-number percentage beside the bar. Default: true. */
  showValue?: boolean;
  /** Tailwind width class for the track, e.g. "w-16" in a table cell. Default: fills its container. */
  widthClass?: string;
  /** What the bar measures, for screen readers. */
  label?: string;
}

/** A capsule on its own track with the percentage beside it. */
export function ProgressBar({
  value,
  tone = "orange",
  size = "sm",
  showValue = true,
  widthClass = "flex-1",
  label = "Progress",
}: ProgressBarProps) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className="text-[#4A4F5C] text-[0.9375rem]" aria-label={`${label}: none`}>{DASH}</span>;
  }

  const percent = Math.min(100, Math.max(0, value));

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${widthClass} ${size === "md" ? "h-3" : "h-2"} bg-[#E1E2E7] rounded-full overflow-hidden`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${FILL[tone]}`} style={{ width: `${percent}%` }} />
      </div>
      {showValue && <span className="text-[#1B1D26] text-[0.9375rem] font-bold tabular-nums">{formatPercent(percent)}</span>}
    </div>
  );
}
