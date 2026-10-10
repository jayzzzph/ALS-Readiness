import type { ReactNode } from "react";

interface FilterBarProps {
  /** What the controls filter, read out for the group: "Filter learners". */
  label: string;
  /**
   * For a bar with only a few chips and no search: the same region, but as
   * wide as its controls and slimmer, so three chips do not sit in a page-wide card.
   */
  compact?: boolean;
  children: ReactNode;
}

/**
 * The one place a page's filters live: a white hairline region directly above
 * the content it filters, holding search and chips on one line at laptop
 * widths. Every facilitator page with filters uses it, so they look and sit
 * the same everywhere (Common Region, Similarity).
 */
export function FilterBar({ label, compact = false, children }: FilterBarProps) {
  const size = compact ? "inline-flex max-w-full px-3 py-2" : "flex min-h-[4.5rem] px-4 py-3";
  return (
    <div role="group" aria-label={label} className={`${size} items-center gap-x-3 gap-y-3 flex-wrap bg-white rounded-2xl border border-[#E2E0DA]`}>
      {children}
    </div>
  );
}

/** A thin vertical rule between groups of controls in a FilterBar. */
export function FilterDivider() {
  return <span className="w-px h-7 bg-[#E2E0DA] flex-shrink-0" aria-hidden="true" />;
}
