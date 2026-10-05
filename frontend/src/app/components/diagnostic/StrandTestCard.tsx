import { CircleCheck, Clock, Lock } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { STRAND_SHORT_LABEL } from "../../../lib/api/diagnostic";
import type { StrandTestListItem } from "../../../lib/api/types";

// Shared strand attempt card, used by both the pretest hub and the posttest hub:
// same three strands, same look, only the "why is this locked" reason differs
// between the two callers. Type roles and colors follow DESIGN.md: indigo for the
// strand label, deep blue for the one action, Atkinson Hyperlegible for sentences.

const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";
const easeOut = "ease-[cubic-bezier(0.23,1,0.32,1)]";
const buttonBase = `h-12 min-w-40 px-6 inline-flex items-center justify-center rounded-xl text-[0.9375rem] font-bold tracking-[0.01em] whitespace-nowrap disabled:cursor-not-allowed active:scale-[0.97] motion-reduce:active:scale-100 disabled:active:scale-100 transition-[background-color,border-color,color,scale] duration-150 ${easeOut} ${focus}`;
/** Deep blue means "act here". A locked one stays readable: a muted fill, not near-invisible grey. */
export const primaryButton = `${buttonBase} bg-[#00538A] text-white hover:bg-[#004270] disabled:bg-[#E1E2E7] disabled:text-[#4A4F5C]`;
export const secondaryButton = `${buttonBase} border border-[#00538A] bg-white text-[#00538A] hover:bg-[#CFE4FF]`;

export function StrandTestCard({
  test,
  canAttempt,
  disabledReason,
  attemptLabel = "Attempt test",
  onAttempt,
  canShowScore = false,
  onShowScore,
  variant = "card",
  emphasis = "primary",
}: {
  test: StrandTestListItem;
  /** Whether the precondition for starting an attempt is met (e.g. intake done, or pretest done). */
  canAttempt: boolean;
  /** Why the test is locked. Shown on the card; in a row it is read out to screen readers only, because the part's header already says it. */
  disabledReason: string;
  attemptLabel?: string;
  onAttempt: () => void;
  /** True once both this strand's pretest AND posttest are completed - a deliberate, learner-initiated reveal, not shown on submission. */
  canShowScore?: boolean;
  onShowScore?: () => void;
  /** "card" stands alone; "row" sits in a divided list inside a part's card, so cards are never nested. */
  variant?: "card" | "row";
  /** Which unfinished test is the one to do next gets "primary"; the others are outlined. A locked test is always the muted look. */
  emphasis?: "primary" | "secondary";
}) {
  const done = test.attempt_status === "completed";
  const row = variant === "row";

  const identity = (
    <div className="min-w-0 flex-1">
      <p className="text-[0.9375rem] font-bold uppercase tracking-[0.06em] leading-snug text-[#4D35BD]">{test.strand_code}</p>
      <h4 className="mt-1 text-lg font-bold leading-snug text-[#1B1D26]" style={reading}>{STRAND_SHORT_LABEL[test.strand_code]}</h4>
      {/* In a row the strand name and code already say it, so the test title (which repeats them) is left out. */}
      {!row && <p className="mt-0.5 text-base leading-snug text-[#4A4F5C]" style={reading}>{test.title}</p>}
    </div>
  );

  // Completed, no score shown by default - only a deliberate "Show Score" click reveals it, and only once both halves exist.
  const status = done
    ? <p className="inline-flex items-center gap-2 text-base font-bold text-[#00538A]"><CircleCheck className="w-5 h-5 shrink-0" strokeWidth={2.25} aria-hidden="true" /> Done</p>
    : <p className="inline-flex items-center gap-2 text-base text-[#4A4F5C]"><Clock className="w-5 h-5 shrink-0" strokeWidth={1.75} aria-hidden="true" /> Not yet</p>;

  const action = done ? (
    canShowScore && onShowScore ? <button onClick={onShowScore} className={secondaryButton}>Show Score</button> : null
  ) : (
    <button onClick={onAttempt} disabled={!canAttempt} className={canAttempt && emphasis === "secondary" ? secondaryButton : primaryButton}>{attemptLabel}</button>
  );

  const lockNote = !done && !canAttempt && (
    row
      ? <span className="sr-only">{disabledReason}</span>
      : <p className="flex items-start gap-2 text-base leading-snug text-[#4A4F5C]" style={reading}><Lock className="w-5 h-5 shrink-0" strokeWidth={1.75} aria-hidden="true" /> {disabledReason}</p>
  );

  if (row) {
    return (
      <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:gap-6">
        {/* image_url is optional - most tests don't have one. */}
        {test.image_url && <ImageWithFallback src={test.image_url} alt={`${STRAND_SHORT_LABEL[test.strand_code]} test`} className="h-16 w-24 shrink-0 rounded-lg object-cover" />}
        {identity}
        <div className="sm:w-28 shrink-0">{status}</div>
        <div className="sm:w-44 shrink-0 sm:flex sm:justify-end">{action}{lockNote}</div>
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E2E0DA] bg-white">
      {test.image_url && <ImageWithFallback src={test.image_url} alt={`${STRAND_SHORT_LABEL[test.strand_code]} test`} className="h-28 w-full object-cover" />}
      <div className="p-6 space-y-4">
        {identity}
        {status}
        {lockNote}
        {action}
      </div>
    </article>
  );
}
