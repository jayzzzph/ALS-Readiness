import { EASE_OUT, FOCUS_RING } from "./tokens";

interface TabsProps<T extends string | number> {
  /** What the tabs choose between, read out for the tab list: "Learning strands". */
  label: string;
  tabs: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}

/** A row of underlined tabs above a block. The selected one is bold ink with a deep-blue underline. */
export function Tabs<T extends string | number>({ label, tabs, value, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-[#E2E0DA] overflow-x-auto">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`min-h-11 px-4 py-2 -mb-px border-b-[3px] text-[0.9375rem] whitespace-nowrap transition-colors duration-150 ${EASE_OUT} ${FOCUS_RING} ${selected ? "border-[#00538A] text-[#1B1D26] font-bold" : "border-transparent text-[#4A4F5C] font-medium hover:text-[#1B1D26]"}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
