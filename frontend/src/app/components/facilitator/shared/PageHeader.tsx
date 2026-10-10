import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { DISPLAY_FONT, EASE_OUT, FOCUS_RING, LABEL, OVERLINE } from "./tokens";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** The small line above the title, e.g. "Content Management". */
  eyebrow?: string;
  /** Right-hand slot, usually the page's primary button. */
  action?: ReactNode;
  /** With `onBack`, shows a back link above the title, e.g. "Back to Learners". */
  backLabel?: string;
  onBack?: () => void;
}

/** The heading block at the top of every facilitator page: a Headline-size serif title on the paper ground. */
export function PageHeader({ title, subtitle, eyebrow, action, backLabel, onBack }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        {backLabel && onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`flex items-center gap-2 mb-3 min-h-9 -ml-2 px-2 rounded-lg text-[#00538A] hover:text-[#004270] hover:bg-[#CFE4FF] ${LABEL} transition-colors duration-150 ${EASE_OUT} ${FOCUS_RING}`}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {backLabel}
          </button>
        )}
        {eyebrow && <div className={`${OVERLINE} text-[#4A4F5C] mb-2`}>{eyebrow}</div>}
        <h2 className="text-[2rem] leading-[1.2] text-[#1B1D26]" style={DISPLAY_FONT}>{title}</h2>
        {subtitle && <p className="text-base leading-[1.55] text-[#4A4F5C] mt-2 max-w-[70ch]">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3 flex-shrink-0">{action}</div>}
    </div>
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
      className={`flex items-center gap-2 min-h-11 px-5 py-2.5 bg-[#00538A] hover:bg-[#004270] text-white rounded-xl ${LABEL} transition-colors duration-150 ${EASE_OUT} ${FOCUS_RING} disabled:opacity-40 disabled:hover:bg-[#00538A] disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
