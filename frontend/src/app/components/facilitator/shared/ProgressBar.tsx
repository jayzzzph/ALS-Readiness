import { DASH, formatPercent } from "../../../../lib/labels";

export type ProgressTone = "orange" | "green" | "blue" | "red" | "gray";

const FILL: Record<ProgressTone, string> = {
  orange: "bg-orange-400",
  green: "bg-green-500",
  blue: "bg-blue-500",
  red: "bg-red-400",
  gray: "bg-gray-400",
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

/** A horizontal progress bar, as hand-drawn in the existing tables and cards. */
export function ProgressBar({
  value,
  tone = "orange",
  size = "sm",
  showValue = true,
  widthClass = "flex-1",
  label = "Progress",
}: ProgressBarProps) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className="text-gray-400 text-sm" aria-label={`${label}: none`}>{DASH}</span>;
  }

  const percent = Math.min(100, Math.max(0, value));

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${widthClass} ${size === "md" ? "h-2.5" : "h-1.5"} bg-gray-100 rounded-full overflow-hidden`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className={`h-full rounded-full ${FILL[tone]}`} style={{ width: `${percent}%` }} />
      </div>
      {showValue && <span className="text-gray-600 text-xs font-semibold tabular-nums">{formatPercent(percent)}</span>}
    </div>
  );
}
