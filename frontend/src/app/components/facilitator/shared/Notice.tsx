import type { ReactNode } from "react";
import { AlertCircle, Info } from "lucide-react";

export type NoticeTone = "warning" | "muted";

const TONE: Record<NoticeTone, string> = {
  // The amber strip the mockups use for "needs attention".
  warning: "bg-orange-50 border-orange-200 text-orange-700",
  muted: "bg-gray-50 border-gray-200 text-gray-500",
};

interface NoticeProps {
  /** Default: "muted". */
  tone?: NoticeTone;
  /** Shown in bold before the rest. */
  title?: string;
  children?: ReactNode;
}

/** A one-line strip above a block: an amber alert, or a quiet explanatory note (e.g. why a page is read-only, FD12). */
export function Notice({ tone = "muted", title, children }: NoticeProps) {
  const Icon = tone === "warning" ? AlertCircle : Info;
  return (
    <div className={`flex items-start gap-2 p-3 border rounded-xl text-sm ${TONE[tone]}`} role={tone === "warning" ? "status" : undefined}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <p>
        {title && <strong className="font-semibold">{title}</strong>}
        {title && children ? " " : null}
        {children}
      </p>
    </div>
  );
}
