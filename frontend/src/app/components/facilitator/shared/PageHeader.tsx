import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

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

/** The navy banner at the top of every facilitator page. */
export function PageHeader({ title, subtitle, eyebrow, action, backLabel, onBack }: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1a3a5c] rounded-2xl p-5 text-white flex items-center justify-between gap-4">
      <div className="min-w-0">
        {backLabel && onBack && (
          <button type="button" onClick={onBack} className="flex items-center gap-1.5 mb-2 text-blue-200 hover:text-white text-xs transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
          </button>
        )}
        {eyebrow && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-white/15 px-2 py-0.5 rounded font-mono">M05</span>
            <span className="text-blue-300 text-xs">{eyebrow}</span>
          </div>
        )}
        <h2 className="mb-1" style={{ fontSize: "1.25rem", fontWeight: 700 }}>{title}</h2>
        {subtitle && <p className="text-blue-200/70 text-sm">{subtitle}</p>}
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

/** The orange button the existing pages put in the header's action slot. */
export function HeaderButton({ children, onClick, disabled, title }: HeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:hover:bg-orange-500"
    >
      {children}
    </button>
  );
}
