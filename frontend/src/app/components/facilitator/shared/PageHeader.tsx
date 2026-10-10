import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { DISPLAY_FONT, EASE_OUT, FOCUS_RING, LABEL } from "./tokens";

interface PageHeaderProps {
  title: string;
  /**
   * The one meta line under the title: what the page is scoped to and how
   * much is in it, joined with " · " (e.g. "Cohort 1 · 12 learners").
   */
  subtitle?: ReactNode;
  /** A quiet status after the meta line, e.g. <StatusText> for a cohort that is not active. */
  status?: ReactNode;
  /** A second quiet line for context that asks nothing of the reader (who assigns cohorts, why a page is view only). */
  note?: ReactNode;
  /**
   * No longer shown. Every facilitator page title stands on its own, as on the
   * learner side; the prop stays so pages not yet updated still compile.
   * @deprecated
   */
  eyebrow?: string;
  /** Right-hand slot: the page's actions (Upload, Download CSV, Add Module). */
  action?: ReactNode;
  /** With `onBack`, shows a back link above the title, e.g. "Back to Learners". */
  backLabel?: string;
  onBack?: () => void;
}

/**
 * The one header every facilitator page uses: back link, a Headline-size serif
 * title, one muted meta line with an optional status, an optional context line,
 * and the page actions on the right. Same structure as the learner pages'
 * title-then-sentence header, at the facilitator's denser size.
 */
export function PageHeader({ title, subtitle, status, note, action, backLabel, onBack }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-x-6 gap-y-4 flex-wrap pb-2">
      <div className="min-w-0">
        {backLabel && onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`flex items-center gap-2 mb-2 min-h-9 -ml-2 px-2 rounded-lg text-[#00538A] hover:text-[#004270] hover:bg-[#CFE4FF] ${LABEL} transition-colors duration-150 ${EASE_OUT} ${FOCUS_RING}`}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {backLabel}
          </button>
        )}
        <h2 className="text-[2rem] leading-[1.2] text-[#1B1D26]" style={DISPLAY_FONT}>{title}</h2>
        {(subtitle || status) && (
          <div className="mt-2 flex items-center gap-x-3 gap-y-1 flex-wrap text-base leading-[1.55] text-[#4A4F5C] tabular-nums">
            {subtitle && <span>{subtitle}</span>}
            {status}
          </div>
        )}
        {note && <p className="mt-1 text-[0.9375rem] leading-[1.55] text-[#4A4F5C] max-w-[70ch]">{note}</p>}
      </div>
      {action && <div className="flex items-center gap-3 flex-shrink-0">{action}</div>}
    </header>
  );
}

interface HeaderButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

/** The primary button the pages put in the header's action slot: deep blue, white label. */
export function HeaderButton({ children, onClick, disabled, title }: HeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-2 min-h-11 px-5 py-2.5 bg-[#00538A] hover:bg-[#004270] text-white rounded-xl ${LABEL} transition-[background-color,scale] duration-150 ${EASE_OUT} active:scale-[0.98] motion-reduce:active:scale-100 ${FOCUS_RING} disabled:opacity-40 disabled:hover:bg-[#00538A] disabled:cursor-not-allowed disabled:active:scale-100`}
    >
      {children}
    </button>
  );
}
