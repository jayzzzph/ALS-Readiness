import type { ReactNode } from "react";

/** A figure that leads a summary cell: large DM Sans, tabular so digits line up. */
export const SUMMARY_NUMBER = "text-[2rem] leading-none font-bold tracking-[-0.02em] tabular-nums text-[#1B1D26]";

const COLUMNS = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" } as const;

interface SummaryStripProps {
  /** How many cells sit side by side. Default: 3. */
  columns?: keyof typeof COLUMNS;
  children: ReactNode;
}

/**
 * The row of headline figures at the top of a facilitator page: one hairline
 * panel split by dividers, not a row of separate cards. Put SummaryCells in it.
 */
export function SummaryStrip({ columns = 3, children }: SummaryStripProps) {
  return (
    <dl className={`grid ${COLUMNS[columns]} bg-white rounded-2xl border border-[#E2E0DA] divide-x divide-[#E2E0DA]`}>
      {children}
    </dl>
  );
}

interface SummaryCellProps {
  label: string;
  /** The figure. Use SUMMARY_NUMBER for a number, or SummaryEmpty when there is none yet. */
  children: ReactNode;
  /** The line under the figure that explains it. */
  hint?: ReactNode;
}

/** One cell of a SummaryStrip: label, figure, and the line that explains it. */
export function SummaryCell({ label, children, hint }: SummaryCellProps) {
  return (
    <div className="px-6 py-5 min-w-0">
      <dt className="text-[0.9375rem] text-[#4A4F5C]">{label}</dt>
      <dd className="mt-2">
        <div className="min-h-8 flex items-end">{children}</div>
        {hint && <p className="text-[0.9375rem] text-[#4A4F5C] mt-2">{hint}</p>}
      </dd>
    </div>
  );
}

/** The figure slot when there is nothing to show yet: a quiet line, never a badge. */
export function SummaryEmpty({ children }: { children: ReactNode }) {
  return <span className="text-base text-[#4A4F5C]">{children}</span>;
}
