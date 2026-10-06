import type { ReactNode } from "react";
import { Pager } from "~/components/Pager";
import type { FitListState } from "~/hooks/useFitList";

export interface FitListProps<T> {
  /** The page state from `useFitList`. */
  fit: FitListState<T>;
  getKey: (item: T) => string;
  /** Every row is exactly this many px tall, the same number given to `useFitList`. */
  rowHeight: number;
  /** Renders one row; `index` counts across all pages. */
  renderItem: (item: T, index: number) => ReactNode;
  emptyText?: string;
  listClassName?: string;
  /** Drawn inside the list behind the rows, such as a timeline's line. */
  backdrop?: ReactNode;
}

/**
 * A list that fills its box and never scrolls: it shows the rows that fit, in one
 * column or, when `useFitList` was given a column width, in as many as fit side by
 * side. `FitListPager` moves through the rest. Give it a parent with a fixed height.
 */
export function FitList<T>({ fit, getKey, rowHeight, renderItem, emptyText = "Nema stavki.", listClassName = "", backdrop }: FitListProps<T>) {
  return (
    <div ref={fit.boxRef} className="h-full min-h-0 overflow-hidden">
      {fit.total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-white/60">{emptyText}</p>
      ) : (
        <ul
          className={`relative ${fit.columns > 1 ? "grid grid-flow-col gap-x-4" : ""} ${listClassName}`}
          style={
            fit.columns > 1
              ? { gridTemplateRows: `repeat(${fit.rows}, ${rowHeight}px)`, gridAutoColumns: "minmax(0, 1fr)" }
              : undefined
          }
        >
          {backdrop}
          {fit.pageItems.map((item, index) => (
            <li key={getKey(item)} style={{ height: rowHeight }} className="relative overflow-hidden">
              {renderItem(item, fit.page * fit.perPage + index)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The page buttons of a `FitList`, for its panel's header. Shows nothing when one page holds everything. */
export function FitListPager<T>({ fit, label }: { fit: FitListState<T>; label: string }) {
  if (fit.pages <= 1) return null;
  return (
    <Pager
      page={fit.page}
      pages={fit.pages}
      total={fit.total}
      onPrevious={fit.previous}
      onNext={fit.next}
      label={label}
    />
  );
}
