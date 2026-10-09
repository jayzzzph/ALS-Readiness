import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Also used as the accessible name. */
  placeholder: string;
}

/** The search box from the mockups' filter rows: a magnifier inside a soft grey field. */
export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative flex-1 min-w-48">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-gray-700 focus:outline-none focus:border-orange-400 text-sm"
      />
    </div>
  );
}
