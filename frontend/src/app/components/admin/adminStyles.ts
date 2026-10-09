// Class strings for the admin area's purple accent, as AdminUsers.tsx writes
// them by hand. Shared by the Cohorts page and its member picker.

/** The header's primary action ("+ New Cohort"). */
export const ADMIN_HEADER_BUTTON =
  "flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50";

/** A dialog's confirming button. */
export const ADMIN_PRIMARY_BUTTON =
  "flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50";

/** A dialog's cancelling button. */
export const ADMIN_CANCEL_BUTTON = "flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition-colors disabled:opacity-50";

/** A small purple button on a row or a section heading. */
export const ADMIN_SMALL_BUTTON =
  "inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

/** A text-sized action in a table row ("End", "Reactivate"). */
export const ADMIN_LINK_BUTTON = "text-purple-500 hover:text-purple-700 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

/** A text input, date input, or select in an admin dialog. */
export const ADMIN_FIELD =
  "w-full border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 bg-gray-50 focus:outline-none focus:border-purple-400 text-sm disabled:opacity-60";

/** A field's label. */
export const ADMIN_LABEL = "text-gray-600 text-sm font-medium mb-1.5 block";

/** A filter chip: purple when selected. */
export function adminChipClass(selected: boolean): string {
  return `px-3 py-1.5 rounded-lg text-xs transition-colors ${selected ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`;
}
