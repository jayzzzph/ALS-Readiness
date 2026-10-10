import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CircleCheck, Clock, Lock } from "lucide-react";

/**
 * What a status means, not what colour it is:
 * - done: finished, evaluated, active membership ("Done" on the learner side)
 * - attention: needs a look, e.g. an open flag or an upcoming cohort
 * - risk: an at-risk learner (red is kept for risk and errors only)
 * - locked: can no longer change
 * - pending: not started yet ("Not yet" on the learner side)
 * - quiet: an empty or ended state that needs nothing
 */
export type StatusTone = "done" | "attention" | "risk" | "locked" | "pending" | "quiet";

const ICON = { done: CircleCheck, attention: AlertCircle, risk: AlertTriangle, locked: Lock, pending: Clock, quiet: null } as const;

const ICON_COLOUR: Record<StatusTone, string> = {
  done: "text-[#00538A]",
  attention: "text-[#835500]",
  risk: "text-[#BA1A1A]",
  locked: "text-[#4A4F5C]",
  pending: "text-[#4A4F5C]",
  quiet: "",
};

// States that ask for a look read in bold ink; the rest stay quiet.
const TEXT: Record<StatusTone, string> = {
  done: "text-[#1B1D26] font-bold",
  attention: "text-[#1B1D26] font-bold",
  risk: "text-[#1B1D26] font-bold",
  locked: "text-[#1B1D26] font-bold",
  pending: "text-[#4A4F5C]",
  quiet: "text-[#4A4F5C]",
};

// Each kind of status reads the same on every page.

/** Cohort status: only an active cohort is "done" setting up; upcoming is not started; the rest are over. */
export const COHORT_STATUS_TONE: Record<"active" | "upcoming" | "completed" | "archived", StatusTone> = {
  active: "done",
  upcoming: "pending",
  completed: "quiet",
  archived: "quiet",
};

/** A learner's membership in a cohort. */
export const MEMBER_STATUS_TONE: Record<"active" | "ended", StatusTone> = { active: "done", ended: "quiet" };

/** An at-risk flag: open asks for a look, reviewed is still being watched, resolved is done. */
export const FLAG_STATUS_TONE: Record<"open" | "reviewed" | "dismissed" | "resolved", StatusTone> = {
  open: "attention",
  reviewed: "pending",
  dismissed: "quiet",
  resolved: "done",
};

interface StatusTextProps {
  tone: StatusTone;
  children: ReactNode;
  /** A longer explanation, shown on hover. */
  title?: string;
}

/**
 * A status as an icon and a sentence-case word, the way the learner pages show
 * "Done" and "Not yet". Never all-caps, never colour alone: the word carries
 * the meaning and the icon backs it up.
 */
export function StatusText({ tone, children, title }: StatusTextProps) {
  const Icon = ICON[tone];
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[0.9375rem] ${TEXT[tone]}`}>
      {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${ICON_COLOUR[tone]}`} strokeWidth={2} aria-hidden="true" />}
      {children}
    </span>
  );
}
