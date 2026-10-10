import { EASE_OUT, FOCUS_RING } from "./tokens";

interface TabsProps<T extends string | number> {
  /** What the tabs choose between, read out for the tab list: "Learning strands". */
  label: string;
  /**
   * `title`, when given, is the tab's full name: shown on hover and used as its
   * accessible name, so a short visible label ("LS1-EN") can stand for a long
   * one ("LS1-EN · Communication Skills (English)").
   */
  tabs: readonly { value: T; label: string; title?: string }[];
  value: T | null;
  onChange: (value: T) => void;
}

/** A row of underlined tabs above a block. The selected one is bold ink with a deep-blue underline. */
export function Tabs<T extends string | number>({ label, tabs, value, onChange }: TabsProps<T>) {
  return (
    // Long labels can overflow at laptop widths; the row scrolls sideways on a thin bar in the
    // palette, not the browser's default. The tabs overlap the border by 1px, so the y axis is clipped,
    // or that pixel would add a vertical scrollbar.
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-[#E2E0DA] overflow-x-auto overflow-y-hidden [scrollbar-width:thin] [scrollbar-color:#8A8F9C_transparent]">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            title={tab.title}
            aria-label={tab.title}
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
