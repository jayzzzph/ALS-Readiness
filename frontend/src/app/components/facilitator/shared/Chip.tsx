import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
}

/** One filter chip from the mockups' filter rows: orange when selected, grey otherwise. */
export function Chip({ children, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${selected ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
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
    <div className="flex items-center gap-1.5" role="group" aria-label={label}>
      <span className="text-gray-500 text-xs">{label}:</span>
      {options.map((option) => (
        <Chip key={option.value} selected={option.value === value} onClick={() => onChange(option.value)}>
          {option.label}
        </Chip>
      ))}
    </div>
  );
}
