interface TabsProps<T extends string | number> {
  /** What the tabs choose between, read out for the tab list: "Learning strands". */
  label: string;
  tabs: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}

/** A row of underlined tabs above a block, in the app's orange accent. */
export function Tabs<T extends string | number>({ label, tabs, value, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-gray-200 overflow-x-auto">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`px-4 py-2 -mb-px border-b-2 text-sm whitespace-nowrap transition-colors ${selected ? "border-orange-500 text-gray-800 font-semibold" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
