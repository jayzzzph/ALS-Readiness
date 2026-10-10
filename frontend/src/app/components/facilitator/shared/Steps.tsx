import { Check } from "lucide-react";

interface StepsProps {
  /** The steps' names, in order. */
  labels: readonly string[];
  /** The step in progress (0-based), or null when none is. */
  active: number | null;
  /** How many steps, from the first, are finished. */
  done: number;
}

/** A row of numbered steps for a multi-step action: finished ones ticked in blue, the current one on the amber fill. */
export function Steps({ labels, active, done }: StepsProps) {
  return (
    <ol className="flex items-center gap-2">
      {labels.map((label, index) => {
        const isDone = index < done;
        const isActive = index === active;
        // Done is blue with a check, the step you are on is the amber "you are here" fill with ink on it.
        const circle = isDone ? "bg-[#00538A] text-white" : isActive ? "bg-[#FFAB2E] text-[#1B1D26]" : "bg-[#F2F1ED] text-[#4A4F5C]";
        return (
          <li key={label} className="flex items-center gap-2 flex-1 min-w-0" aria-current={isActive ? "step" : undefined}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.9375rem] font-bold flex-shrink-0 ${circle}`}>
              {isDone ? <Check className="w-4 h-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className={`text-[0.9375rem] truncate ${isActive ? "text-[#1B1D26] font-bold" : "text-[#4A4F5C]"}`}>
              {label}
              {isDone && <span className="sr-only"> (done)</span>}
            </span>
            {index < labels.length - 1 && <span className="flex-1 h-px bg-[#E2E0DA]" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
