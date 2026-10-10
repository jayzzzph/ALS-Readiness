import type { ReactNode } from "react";
import { EASE_OUT, FOCUS_RING, LABEL } from "./tokens";

export type ButtonVariant = "primary" | "accent" | "secondary" | "outline" | "link";

// Deep blue means "act here" (DESIGN.md). "accent" used to be the orange call to action;
// it keeps its name so callers do not change, and is the same blue as "primary".
const PRIMARY = "bg-[#00538A] hover:bg-[#004270] text-white";
const VARIANT: Record<ButtonVariant, string> = {
  primary: PRIMARY,
  accent: PRIMARY,
  // White, deep-blue border and text.
  secondary: "bg-white hover:bg-[#CFE4FF] text-[#00538A] border border-[#00538A]",
  // The quiet neutral button on a row ("View", "Unassign").
  outline: "bg-white hover:bg-[#F2F1ED] text-[#1B1D26] border border-[#8A8F9C]",
  // The inline text action used in table rows ("Review", "Assign").
  link: "text-[#00538A] hover:text-[#004270] hover:underline underline-offset-2",
};

// 44px is the compact toolbar height DESIGN.md allows; "sm" is the in-row button.
const SIZE = { sm: "min-h-9 px-3 py-1.5 rounded-lg", md: "min-h-11 px-5 py-2.5 rounded-xl" } as const;

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** Default: "secondary". */
  variant?: ButtonVariant;
  /** Default: "md". Ignored by the "link" variant, which is always text-sized. */
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = "secondary",
  size = "md",
  disabled = false,
  type = "button",
  title,
  className = "",
}: ButtonProps) {
  const shape = variant === "link" ? "rounded-md" : SIZE[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-2 ${LABEL} transition-colors duration-150 ${EASE_OUT} ${FOCUS_RING} disabled:opacity-40 disabled:cursor-not-allowed ${shape} ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
