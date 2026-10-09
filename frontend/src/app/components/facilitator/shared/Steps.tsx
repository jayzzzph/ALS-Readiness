import { Check } from "lucide-react";

interface StepsProps {
  /** The steps' names, in order. */
  labels: readonly string[];
  /** The step in progress (0-based), or null when none is. */
  active: number | null;
  /** How many steps, from the first, are finished. */
  done: number;
}

/** A row of numbered steps for a multi-step action: finished ones ticked, the current one in the app's orange. */
export function Steps({ labels, active, done }: StepsProps) {
  return (
    <ol className="flex items-center gap-2">
      {labels.map((label, index) => {
        const isDone = index < done;
        const isActive = index === active;
        const circle = isDone ? "bg-green-500 text-white" : isActive ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400";
        return (
          <li key={label} className="flex items-center gap-2 flex-1 min-w-0" aria-current={isActive ? "step" : undefined}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${circle}`}>
              {isDone ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : index + 1}
            </span>
            <span className={`text-xs truncate ${isActive ? "text-gray-800 font-semibold" : isDone ? "text-gray-600" : "text-gray-400"}`}>
              {label}
              {isDone && <span className="sr-only"> (done)</span>}
            </span>
            {index < labels.length - 1 && <span className="flex-1 h-px bg-gray-200" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
