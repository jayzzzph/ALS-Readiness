import { AlertCircle } from "lucide-react";

const reading = { fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif" } as const;
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00538A]";

/** Calm inline error for one section: icon, message and a small secondary button on one line (wraps on narrow cards). */
export function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#B42318]" aria-hidden="true" />
        <p className="text-base leading-snug text-[#1B1D26]" style={reading}>{message}</p>
      </div>
      <button onClick={onRetry} className={`h-9 px-4 rounded-lg border border-[#8A8F9C] bg-white text-[0.9375rem] font-bold text-[#00538A] hover:bg-[#CFE4FF] transition-colors duration-150 ${focus}`}>
        Try again
      </button>
    </div>
  );
}
