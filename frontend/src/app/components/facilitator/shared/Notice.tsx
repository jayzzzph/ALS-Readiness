import type { ReactNode } from "react";
import { AlertCircle, Info } from "lucide-react";

export type NoticeTone = "warning" | "muted";

const TONE: Record<NoticeTone, { box: string; icon: string }> = {
  // The amber wash for "needs attention". Text stays ink: amber is a fill, never text on light.
  warning: { box: "bg-[#FFDEB5] border-[#835500]/40 text-[#1B1D26]", icon: "text-[#835500]" },
  muted: { box: "bg-[#F2F1ED] border-[#E2E0DA] text-[#4A4F5C]", icon: "text-[#4A4F5C]" },
};

interface NoticeProps {
  /** Default: "muted". */
  tone?: NoticeTone;
  /** Shown in bold before the rest. */
  title?: string;
  children?: ReactNode;
}

/** A strip above a block: an amber alert, or a quiet explanatory note (e.g. why a page is read-only, FD12). */
export function Notice({ tone = "muted", title, children }: NoticeProps) {
  const Icon = tone === "warning" ? AlertCircle : Info;
  return (
    <div className={`flex items-start gap-3 p-4 border rounded-xl text-[0.9375rem] leading-[1.55] ${TONE[tone].box}`} role={tone === "warning" ? "status" : undefined}>
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${TONE[tone].icon}`} aria-hidden="true" />
      <p>
        {title && <strong className="font-bold">{title}</strong>}
        {title && children ? " " : null}
        {children}
      </p>
    </div>
  );
}
