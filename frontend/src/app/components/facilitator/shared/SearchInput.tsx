import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Also used as the accessible name. */
  placeholder: string;
}

/** The search box of the filter rows: a magnifier inside a sunken field with no border until focused. */
export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative flex-1 min-w-40">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A4F5C]" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full min-h-11 bg-[#F2F1ED] border border-transparent rounded-xl py-2.5 pl-12 pr-4 text-base text-[#1B1D26] placeholder:text-[#6B7080] focus:outline-none focus:bg-white focus:border-[#00538A] focus:ring-2 focus:ring-[#00538A]/30"
      />
    </div>
  );
}
