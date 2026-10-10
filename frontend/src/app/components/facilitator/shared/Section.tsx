import type { ReactNode } from "react";
import { SECTION_TITLE } from "./tokens";

interface SectionProps {
  /** The section's heading; also labels the region. */
  title: string;
  /** A unique id for the heading. */
  titleId: string;
  /** Quiet lines right under the title: an empty state, or why something is missing. Spaced as a DataTable's titleNote. */
  note?: ReactNode;
  /** Right-hand slot beside the title. */
  action?: ReactNode;
  children?: ReactNode;
}

/**
 * A section that is not a table: one white region with its title inside, the
 * learner pages' card pattern. Built to match a titled DataTable exactly
 * (same padding, title, and note spacing), so the two kinds of section read
 * as one family. An empty section is just the title and a quiet note.
 */
export function Section({ title, titleId, note, action, children }: SectionProps) {
  return (
    <section aria-labelledby={titleId} className="bg-white rounded-2xl border border-[#E2E0DA] px-6 pt-5 pb-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={titleId} className={SECTION_TITLE}>{title}</h3>
          {note && <div className="mt-1 space-y-1 text-[0.9375rem] text-[#4A4F5C]">{note}</div>}
        </div>
        {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}
