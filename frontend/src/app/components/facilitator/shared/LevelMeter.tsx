const STEPS = { low: 1, medium: 2, high: 3 } as const;

interface LevelMeterProps {
  level: keyof typeof STEPS;
  /** The level as words, e.g. "Medium". */
  label: string;
  /** Read out before the label, e.g. "Stimulus level". */
  srPrefix?: string;
}

/**
 * A three-step level (low, medium, high) in one neutral hue with its word.
 * A level is not good or bad, so it takes no traffic-light colour: red stays
 * for errors and at-risk, and blue for "act" and "done".
 */
export function LevelMeter({ level, label, srPrefix }: LevelMeterProps) {
  const filled = STEPS[level] ?? 0;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[0.9375rem] text-[#1B1D26]">
      <span className="inline-flex items-end gap-[3px]" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={`w-1.5 rounded-sm ${step <= filled ? "bg-[#4A4F5C]" : "bg-[#E1E2E7]"}`}
            style={{ height: `${6 + step * 4}px` }}
          />
        ))}
      </span>
      {srPrefix && <span className="sr-only">{srPrefix} </span>}
      {label}
    </span>
  );
}
