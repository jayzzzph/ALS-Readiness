import type { ReactNode } from "react";
import { EASE_OUT, FOCUS_RING } from "./tokens";

interface ChipProps {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
}

/** One filter chip: blue wash with a blue border when selected, sunken otherwise. */
export function Chip({ children, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 min-h-9 px-4 py-1.5 rounded-full border text-[0.9375rem] transition-colors duration-150 ${EASE_OUT} ${FOCUS_RING} ${selected ? "bg-[#CFE4FF] border-[#00538A] text-[#00538A] font-bold" : "bg-[#F2F1ED] border-transparent text-[#1B1D26] font-medium hover:bg-[#E2E0DA]"}`}
    >
      {children}
    </button>
  );
}

interface ChipGroupProps<T extends string> {
  /** Shown before the chips, e.g. "Membership:". */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of chips where exactly one is selected. */
export function ChipGroup<T extends string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  return (
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={label}>
      <span className="text-[#4A4F5C] text-[0.9375rem]">{label}:</span>
      {options.map((option) => (
        <Chip key={option.value} selected={option.value === value} onClick={() => onChange(option.value)}>
          {option.label}
        </Chip>
      ))}
    </div>
  );
}
