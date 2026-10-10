// DESIGN.md values the facilitator pages share. The learner pages repeat these as local
// consts; the facilitator side has many more files, so they live here once.

/** Serif for page, card, and dialog titles. Apply as `style`. */
export const DISPLAY_FONT = { fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 400 } as const;

/** 2px deep-blue outline, offset by 2px, on every interactive element. */
export const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";

/** The curve every state change on the facilitator side shares (DESIGN.md, Common Fate). */
export const EASE_OUT = "ease-[cubic-bezier(0.23,1,0.32,1)]";

/** Column headers: Overline, 13px bold uppercase. */
export const OVERLINE = "text-[0.8125rem] font-bold uppercase tracking-[0.06em] leading-snug";

/**
 * The body of every facilitator page: the learner pages' width and gutters,
 * with sections 24px apart (DESIGN.md's dashboard gap).
 */
export const PAGE_BODY = "w-full max-w-[90rem] px-6 lg:px-8 py-8 space-y-6";

/** Section headings under the page title. The serif is kept for the page title only. */
export const SECTION_TITLE = "text-[1.125rem] leading-snug font-bold text-[#1B1D26]";

/** Supporting text: meta lines, hints, quiet empty states. */
export const MUTED = "text-[0.9375rem] text-[#4A4F5C]";

/** Label: buttons, nav items, form labels. */
export const LABEL = "text-[0.9375rem] font-bold tracking-[0.01em] leading-snug";
