import type { KeyboardEvent, ReactNode } from "react";

export interface DataTableColumn<T> {
  /** Unique within the table; used as the React key. */
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Default: "left". */
  align?: "left" | "right" | "center";
  /** Extra classes for this column's cells, e.g. "w-40" or "text-gray-500 text-xs". */
  className?: string;
  /**
   * A shared heading over this column and its neighbours with the same group,
   * e.g. a strand code over Progress, Pretest and Posttest. Columns of one
   * group must be next to each other. Columns without a group span both header rows.
   */
  group?: string;
  /** Keeps the column in view while a wide table scrolls sideways. Meant for the first column. */
  pinned?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  /** Makes rows clickable (and reachable by keyboard: Enter or Space opens the row). */
  onRowClick?: (row: T) => void;
  loading?: boolean;
  loadingLabel?: string;
  /** Shown in place of the rows when the load failed. */
  error?: string | null;
  /** Shown when there are no rows. */
  emptyMessage?: ReactNode;
  /** Rendered under the table inside the same panel - normally a <Pagination />. */
  footer?: ReactNode;
  /** The tint of the row hover: "orange" on facilitator pages (the default), "purple" in the admin area. */
  accent?: "orange" | "purple";
}

// The hover on any row, and the keyboard-focus tint on a clickable one.
const ROW_ACCENT = {
  orange: { hover: "hover:bg-orange-50/30", focus: "focus-visible:bg-orange-50/60" },
  purple: { hover: "hover:bg-purple-50/20", focus: "focus-visible:bg-purple-50/50" },
} as const;

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

/**
 * The table the existing pages hand-write: white rounded panel, grey header
 * row, hairline row dividers, a soft orange row hover. Loading, error and
 * empty are shown as one full-width row, as AdminUsers does.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading = false,
  loadingLabel = "Loading…",
  error = null,
  emptyMessage = "Nothing to show.",
  footer,
  accent = "orange",
}: DataTableProps<T>) {
  const message = (text: ReactNode, tone: string) => (
    <tr>
      <td colSpan={columns.length} className={`px-4 py-10 text-center text-sm ${tone}`}>{text}</td>
    </tr>
  );

  const grouped = columns.some((column) => column.group !== undefined);
  const startsGroup = (index: number) => columns[index].group !== undefined && columns[index - 1]?.group !== columns[index].group;
  // A pinned cell needs its own background so the cells scrolling under it do not show through;
  // the first cell of a group gets a hairline on its left. Nothing is added to a plain column.
  const edgeClass = (index: number, background: string) => {
    const column = columns[index];
    if (column.pinned) return `sticky left-0 z-10 ${background} border-r border-gray-100`;
    return startsGroup(index) || (grouped && column.group === undefined && columns[index - 1]?.group !== undefined) ? "border-l border-gray-100" : "";
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (event.target !== event.currentTarget) return; // a button inside the row handles its own keys
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick?.(row);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            {grouped ? (
              <>
                <tr>
                  {columns.map((column, index) => {
                    if (column.group === undefined) {
                      return (
                        <th key={column.key} scope="col" rowSpan={2} className={`${ALIGN[column.align ?? "left"]} px-4 py-3 text-xs text-gray-500 font-semibold ${edgeClass(index, "bg-gray-50")}`}>
                          {column.header}
                        </th>
                      );
                    }
                    if (!startsGroup(index)) return null;
                    const span = columns.filter((other) => other.group === column.group).length;
                    return (
                      <th key={`group-${column.group}`} scope="colgroup" colSpan={span} className="text-center px-4 pt-3 pb-1 text-xs text-gray-700 font-semibold border-l border-gray-100">
                        {column.group}
                      </th>
                    );
                  })}
                </tr>
                <tr>
                  {columns.map((column, index) =>
                    column.group === undefined ? null : (
                      <th key={column.key} scope="col" className={`${ALIGN[column.align ?? "left"]} px-4 pt-1 pb-3 text-xs text-gray-500 font-semibold whitespace-nowrap ${edgeClass(index, "bg-gray-50")}`}>
                        {column.header}
                      </th>
                    ),
                  )}
                </tr>
              </>
            ) : (
              <tr>
                {columns.map((column, index) => (
                  <th key={column.key} scope="col" className={`${ALIGN[column.align ?? "left"]} px-4 py-3 text-xs text-gray-500 font-semibold ${edgeClass(index, "bg-gray-50")}`}>
                    {column.header}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-50" aria-busy={loading}>
            {loading && message(loadingLabel, "text-gray-400")}
            {!loading && error && message(error, "text-red-500")}
            {!loading && !error && rows.length === 0 && message(emptyMessage, "text-gray-400")}
            {!loading && !error && rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={onRowClick ? `${ROW_ACCENT[accent].hover} transition-colors cursor-pointer focus:outline-none ${ROW_ACCENT[accent].focus}` : `${ROW_ACCENT[accent].hover} transition-colors`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (event) => onRowKeyDown(event, row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((column, index) => (
                  <td key={column.key} className={`px-4 py-3 text-sm text-gray-700 ${ALIGN[column.align ?? "left"]} ${column.className ?? ""} ${edgeClass(index, "bg-white")}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
