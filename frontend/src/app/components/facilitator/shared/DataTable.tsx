import type { KeyboardEvent, ReactNode } from "react";
import { OVERLINE, SECTION_TITLE } from "./tokens";

export interface DataTableColumn<T> {
  /** Unique within the table; used as the React key. */
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Default: "left". */
  align?: "left" | "right" | "center";
  /** Extra classes for this column's cells, e.g. "w-40" or "text-[#4A4F5C]". */
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
  /**
   * The section's title, drawn inside the panel above the table exactly as a
   * Card draws its title, so the table and its heading are one region.
   */
  title?: ReactNode;
  /** The id for the title, for a surrounding section's aria-labelledby. */
  titleId?: string;
  /** Beside the title: quiet supporting lines under it, or actions on the right. */
  titleNote?: ReactNode;
  titleAction?: ReactNode;
  /** The tint of the row hover: "orange" on facilitator pages (the default; now a paper tint), "purple" in the admin area. */
  accent?: "orange" | "purple";
}

// The hover on any row, and the keyboard-focus tint on a clickable one.
const ROW_ACCENT = {
  orange: { hover: "hover:bg-[#F8F6F2]", focus: "focus-visible:bg-[#CFE4FF]/40" },
  purple: { hover: "hover:bg-purple-50/20", focus: "focus-visible:bg-purple-50/50" },
} as const;

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

/**
 * The table the existing pages hand-write: white rounded panel, sunken header
 * row, hairline row dividers, a paper row hover. Loading, error and
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
  title,
  titleId,
  titleNote,
  titleAction,
  accent = "orange",
}: DataTableProps<T>) {
  const message = (text: ReactNode, tone: string) => (
    <tr>
      <td colSpan={columns.length} className={`px-4 py-10 text-center text-[0.9375rem] ${tone}`}>{text}</td>
    </tr>
  );

  const grouped = columns.some((column) => column.group !== undefined);
  const startsGroup = (index: number) => columns[index].group !== undefined && columns[index - 1]?.group !== columns[index].group;
  // A pinned cell needs its own background so the cells scrolling under it do not show through;
  // the first cell of a group gets a hairline on its left. Nothing is added to a plain column.
  const edgeClass = (index: number, background: string) => {
    const column = columns[index];
    if (column.pinned) return `sticky left-0 z-10 ${background} border-r border-[#E2E0DA]`;
    return startsGroup(index) || (grouped && column.group === undefined && columns[index - 1]?.group !== undefined) ? "border-l border-[#E2E0DA]" : "";
  };

  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (event.target !== event.currentTarget) return; // a button inside the row handles its own keys
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick?.(row);
    }
  };

  const headerCell = `${OVERLINE} text-[#4A4F5C]`;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E0DA] overflow-hidden">
      {(title || titleAction) && (
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
          <div className="min-w-0">
            {title && <h3 id={titleId} className={SECTION_TITLE}>{title}</h3>}
            {titleNote && <div className="mt-1 space-y-1 text-[0.9375rem] text-[#4A4F5C]">{titleNote}</div>}
          </div>
          {titleAction && <div className="flex items-center gap-2 flex-shrink-0">{titleAction}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F2F1ED] border-b border-[#E2E0DA]">
            {grouped ? (
              <>
                <tr>
                  {columns.map((column, index) => {
                    if (column.group === undefined) {
                      return (
                        <th key={column.key} scope="col" rowSpan={2} className={`${ALIGN[column.align ?? "left"]} px-4 py-3 ${headerCell} ${edgeClass(index, "bg-[#F2F1ED]")}`}>
                          {column.header}
                        </th>
                      );
                    }
                    if (!startsGroup(index)) return null;
                    const span = columns.filter((other) => other.group === column.group).length;
                    return (
                      <th key={`group-${column.group}`} scope="colgroup" colSpan={span} className={`text-center px-4 pt-3 pb-1 ${OVERLINE} text-[#1B1D26] border-l border-[#E2E0DA]`}>
                        {column.group}
                      </th>
                    );
                  })}
                </tr>
                <tr>
                  {columns.map((column, index) =>
                    column.group === undefined ? null : (
                      <th key={column.key} scope="col" className={`${ALIGN[column.align ?? "left"]} px-4 pt-1 pb-3 ${headerCell} whitespace-nowrap ${edgeClass(index, "bg-[#F2F1ED]")}`}>
                        {column.header}
                      </th>
                    ),
                  )}
                </tr>
              </>
            ) : (
              <tr>
                {columns.map((column, index) => (
                  <th key={column.key} scope="col" className={`${ALIGN[column.align ?? "left"]} px-4 py-3 ${headerCell} ${edgeClass(index, "bg-[#F2F1ED]")}`}>
                    {column.header}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-[#E2E0DA]" aria-busy={loading}>
            {loading && message(loadingLabel, "text-[#4A4F5C]")}
            {!loading && error && message(error, "text-[#7A1A12]")}
            {!loading && !error && rows.length === 0 && message(emptyMessage, "text-[#4A4F5C]")}
            {!loading && !error && rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={onRowClick ? `${ROW_ACCENT[accent].hover} transition-colors cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#00538A] ${ROW_ACCENT[accent].focus}` : `${ROW_ACCENT[accent].hover} transition-colors`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (event) => onRowKeyDown(event, row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((column, index) => (
                  <td key={column.key} className={`px-4 py-3 text-[0.9375rem] leading-[1.45] text-[#1B1D26] ${ALIGN[column.align ?? "left"]} ${column.className ?? ""} ${edgeClass(index, "bg-white")}`}>
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
