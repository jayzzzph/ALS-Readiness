import type { ComponentType, ReactNode } from "react";

export type StatTone = "blue" | "teal" | "green" | "red" | "orange" | "purple";

const TONE: Record<StatTone, string> = {
  blue: "text-blue-600 bg-blue-50",
  teal: "text-teal-600 bg-teal-50",
  green: "text-green-600 bg-green-50",
  red: "text-red-600 bg-red-50",
  orange: "text-orange-600 bg-orange-50",
  purple: "text-purple-600 bg-purple-50",
};

interface StatTileProps {
  label: string;
  /** Already formatted (use lib/labels.ts); pass a dash for a missing value, never a placeholder number. */
  value: ReactNode;
  /** A lucide icon. Without one the tile is the plain number-and-label variant. */
  icon?: ComponentType<{ className?: string }>;
  tone?: StatTone;
  /** A quiet line under the label, e.g. "across 3 strands". */
  hint?: ReactNode;
  /** Makes the whole tile a button, with the hover lift the Dashboard tiles have. */
  onClick?: () => void;
}

/** One number with its label, as in the stat rows of the existing pages. */
export function StatTile({ label, value, icon: Icon, tone = "blue", hint, onClick }: StatTileProps) {
  const body = (
    <>
      {Icon && (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${TONE[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="text-gray-800 text-xl font-bold">{value}</div>
      <div className="text-gray-500 text-xs">{label}</div>
      {hint && <div className="text-gray-400 text-xs mt-1">{hint}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      >
        {body}
      </button>
    );
  }

  return <div className="bg-white rounded-2xl border border-gray-100 p-4">{body}</div>;
}
