import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string;
  /** Right-hand slot beside the title (a count, a link, a small button). */
  action?: ReactNode;
  /** "none" for content that runs edge to edge, such as a table. Default: "md". */
  padding?: "none" | "sm" | "md";
  className?: string;
}

const PADDING = { none: "", sm: "p-4", md: "p-5" } as const;

/** The white rounded panel every facilitator block sits in. */
export function Card({ children, title, action, padding = "md", className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 ${PADDING[padding]} ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between mb-4 ${padding === "none" ? "px-5 pt-5" : ""}`}>
          {title && <h3 className="text-gray-800 font-semibold text-sm">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
