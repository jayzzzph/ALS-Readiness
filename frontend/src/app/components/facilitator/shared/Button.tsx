import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "accent" | "secondary" | "outline" | "link";

// The button looks the mockup dialogs and tables already use.
const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-[#0B1F3A] hover:bg-[#152e56] text-white",
  accent: "bg-orange-500 hover:bg-orange-600 text-white font-medium",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
  // The small white bordered button on a row ("+ Assign", "Unassign").
  outline: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
  // The inline text action used in table rows ("View", "Assign").
  link: "text-orange-500 hover:text-orange-700 font-medium",
};

const SIZE = { sm: "px-3 py-1.5 text-xs rounded-lg", md: "px-4 py-2.5 text-sm rounded-xl" } as const;

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
  const shape = variant === "link" ? "text-xs" : SIZE[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${shape} ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
