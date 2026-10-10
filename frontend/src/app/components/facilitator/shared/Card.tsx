import type { ReactNode } from "react";
import { DISPLAY_FONT } from "./tokens";

interface CardProps {
  children: ReactNode;
  title?: string;
  /** Right-hand slot beside the title (a count, a link, a small button). */
  action?: ReactNode;
  /** "none" for content that runs edge to edge, such as a table. Default: "md". */
  padding?: "none" | "sm" | "md";
  className?: string;
}

// 24px is the dense facilitator padding DESIGN.md allows (32px on learner cards).
const PADDING = { none: "", sm: "p-4", md: "p-6" } as const;

/** The white panel every facilitator block sits in: 16px corners, 1px hairline, no shadow. */
export function Card({ children, title, action, padding = "md", className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E2E0DA] ${PADDING[padding]} ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between gap-3 mb-4 ${padding === "none" ? "px-6 pt-6" : ""}`}>
          {title && <h3 className="text-[1.5rem] leading-[1.25] text-[#1B1D26]" style={DISPLAY_FONT}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
