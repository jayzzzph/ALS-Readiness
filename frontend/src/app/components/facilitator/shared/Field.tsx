import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { LABEL } from "./tokens";

/** The look of a text input, textarea, or select inside a facilitator dialog. */
export const FIELD_CLASS =
  "w-full min-h-12 border border-[#8A8F9C] rounded-xl py-3 px-4 text-base leading-[1.55] text-[#1B1D26] bg-white placeholder:text-[#6B7080] focus:outline-none focus:border-[#00538A] focus:ring-2 focus:ring-[#00538A]/30 disabled:opacity-60";

interface FieldProps {
  label: string;
  /** The id of the control this labels. Leave out for a group of controls (radios, a drop zone). */
  htmlFor?: string;
  /** A quiet line under the control. */
  hint?: ReactNode;
  /** Shown in red under the control, in place of the hint. */
  error?: ReactNode;
  children: ReactNode;
}

/** A labelled form row: the label above the control, then a hint or an error. */
export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  const labelClass = `text-[#1B1D26] ${LABEL} mb-2 block`;
  return (
    <div>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClass}>{label}</label>
      ) : (
        <div className={labelClass}>{label}</div>
      )}
      {children}
      {error ? (
        <p className="flex items-start gap-2 text-[#7A1A12] text-[0.9375rem] mt-2" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-1 text-[#B42318]" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-[#4A4F5C] text-[0.9375rem] mt-2">{hint}</p>
      ) : null}
    </div>
  );
}
