import { useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import { LuChevronDown, LuChevronUp, LuChevronsUpDown } from "react-icons/lu";
import { Card } from "~/components/Card";
import { FitListPager } from "~/components/FitList";
import { useFitList } from "~/hooks/useFitList";
import { Panel } from "~/components/Panel";
import {
  useSortedRows,
  type SortDirection,
  type SortValue,
} from "~/hooks/useSortedRows";

export interface TableColumn<T> {
  key: string;
  header: string;
  /** Numbers read best right-aligned. */
  align?: "left" | "right";
  render: (row: T) => ReactNode;
  /** The value to sort by. A column without it can not be sorted. */
  sortValue?: (row: T) => SortValue;
  className?: string;
  /** Classes for both the header and the cells, such as "hidden md:table-cell" to drop a column on small screens. */
  visibility?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  title?: string;
  description?: string;
  emptyText?: string;
  action?: ReactNode;
  /**
   * Fill a box of fixed height and never scroll: show the rows that fit, one line
   * each, and page through the rest with the buttons in the header.
   */
  fill?: boolean;
  className?: string;
}

// Header row and one body row in `fill` mode, in px.
const HEAD_HEIGHT = 40;
const ROW_HEIGHT = 44;

const alignClass = (align: TableColumn<unknown>["align"]) =>
  align === "right" ? "text-right" : "text-left";

const ariaSort = (direction: SortDirection | null) =>
  direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined;

interface SortButtonProps {
  header: string;
  direction: SortDirection | null;
  align?: "left" | "right";
  onToggle: () => void;
}

/** A column header button that shows the sort with a chevron: up, down, or both when unsorted. */
const SortButton = ({ header, direction, align, onToggle }: SortButtonProps) => {
  const Icon =
    direction === "asc" ? LuChevronUp : direction === "desc" ? LuChevronDown : LuChevronsUpDown;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`-mx-2 inline-flex items-center gap-1 rounded px-2 py-1 cursor-pointer transition-colors hover:bg-[#3B9DF8]/10 hover:text-[#3B9DF8] ${
        direction ? "font-semibold text-[#3B9DF8]" : ""
      } ${align === "right" ? "flex-row-reverse" : ""}`}
    >
      {header}
      <Icon aria-hidden className={direction ? "" : "opacity-50"} />
    </button>
  );
};

/** One cell. A cell cut short with "…" in `fill` mode shows its full text when pointed at. */
function Cell<T>({ column, row, fill }: { column: TableColumn<T>; row: T; fill: boolean }) {
  const content = column.render(row);
  return (
    <td
      title={fill && typeof content === "string" ? content : undefined}
      className={`px-3 align-middle ${fill ? "truncate" : "py-3"} ${alignClass(column.align)} ${column.className ?? ""} ${column.visibility ?? ""}`}
    >
      {content}
    </td>
  );
}

/** A table in a card, with sortable column headers. Rows slide to their new place when the sort changes. */
export function Table<T>({
  columns,
  rows,
  getRowKey,
  title,
  description,
  emptyText = "Nema podataka.",
  action,
  fill = false,
  className = "",
}: TableProps<T>) {
  const getSortValue = useCallback(
    (row: T, key: string) => columns.find((c) => c.key === key)?.sortValue?.(row),
    [columns],
  );
  const { sortedRows, sort, toggleSort } = useSortedRows(rows, getSortValue);
  const fit = useFitList(sortedRows, ROW_HEIGHT, HEAD_HEIGHT);
  const shownRows = fill ? fit.pageItems : sortedRows;

  const table = (
    <div ref={fill ? fit.boxRef : undefined} className={fill ? "h-full min-h-0 overflow-hidden" : "overflow-x-auto"}>
      <table className={`w-full text-sm ${fill ? "table-fixed" : ""}`}>
        <thead>
          <tr className="border-b border-[#e5eaf2] dark:border-slate-700">
            {columns.map((column) => {
              const direction = sort?.key === column.key ? sort.direction : null;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={ariaSort(direction)}
                  className={`h-10 px-3 align-middle text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 dark:text-white/60 ${alignClass(column.align)} ${column.visibility ?? ""}`}
                >
                  {column.sortValue ? (
                    <SortButton
                      header={column.header}
                      direction={direction}
                      align={column.align}
                      onToggle={() => toggleSort(column.key)}
                    />
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {shownRows.map((row) => (
            <motion.tr
              key={getRowKey(row)}
              layout="position"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={fill ? { height: ROW_HEIGHT } : undefined}
              className="border-b last:border-0 border-[#e5eaf2] dark:border-slate-700/60 transition-colors hover:bg-gray-50 dark:hover:bg-slate-900/40"
            >
              {columns.map((column) => (
                <Cell key={column.key} column={column} row={row} fill={fill} />
              ))}
            </motion.tr>
          ))}
          {sortedRows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-gray-500 dark:text-white/60"
              >
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return title ? (
    <Panel
      as="section"
      title={title}
      description={description}
      fill={fill}
      action={
        fill || action ? (
          <div className="flex shrink-0 items-center gap-1">
            {action}
            {fill && <FitListPager fit={fit} label={title} />}
          </div>
        ) : undefined
      }
      className={className}
    >
      {table}
    </Panel>
  ) : (
    <Card as="section" className={`p-5 ${fill ? "min-h-0" : ""} ${className}`}>
      {table}
      {fill && <FitListPager fit={fit} label="Tabela" />}
    </Card>
  );
}
