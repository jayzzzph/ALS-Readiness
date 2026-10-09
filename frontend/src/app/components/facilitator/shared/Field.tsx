import type { ReactNode } from "react";

/** The look of a text input, textarea, or select inside a facilitator dialog. */
export const FIELD_CLASS =
  "w-full border border-gray-200 rounded-xl py-2 px-3 text-gray-700 focus:outline-none focus:border-orange-400 text-sm bg-white disabled:opacity-60";

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

/** A labelled form row: the small grey label the dialogs use, the control, then a hint or an error. */
export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-gray-600 text-xs font-medium mb-1.5 block">{label}</label>
      ) : (
        <div className="text-gray-600 text-xs font-medium mb-1.5">{label}</div>
      )}
      {children}
      {error ? (
        <p className="text-red-600 text-xs mt-1.5" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-gray-400 text-xs mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}
