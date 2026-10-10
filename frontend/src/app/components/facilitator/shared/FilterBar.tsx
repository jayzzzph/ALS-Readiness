import type { ReactNode } from "react";

interface FilterBarProps {
  /** What the controls filter, read out for the group: "Filter learners". */
  label: string;
  children: ReactNode;
}

/**
 * The one place a page's filters live: a white hairline region directly above
 * the content it filters, holding search and chips on one line at laptop
 * widths. Every facilitator page with filters uses it, so they look and sit
 * the same everywhere (Common Region, Similarity).
 */
export function FilterBar({ label, children }: FilterBarProps) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-x-4 gap-y-3 flex-wrap bg-white rounded-2xl border border-[#E2E0DA] px-4 py-3">
      {children}
    </div>
  );
}

/** A thin vertical rule between groups of controls in a FilterBar. */
export function FilterDivider() {
  return <span className="w-px h-7 bg-[#E2E0DA] flex-shrink-0" aria-hidden="true" />;
}
