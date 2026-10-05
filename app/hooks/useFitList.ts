import { useRef } from "react";
import { useElementSize } from "~/hooks/useElementSize";
import { usePagedList } from "~/hooks/usePagedList";

/**
 * Pages a list so each page is exactly what fits its box. Put `boxRef` on the box
 * with the fixed height; every row must be `rowHeight` px tall. `reserve` is room
 * in the box that is not rows, such as a table's header row. With `minColumnWidth`
 * a wide box holds several columns of rows, filled top to bottom, left to right.
 */
export function useFitList<T>(items: T[], rowHeight: number, reserve = 0, minColumnWidth?: number) {
  const boxRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(boxRef);
  // Before the box is measured (server render), show one row instead of nothing.
  const rows = height > 0 ? Math.max(1, Math.floor((height - reserve) / rowHeight)) : 1;
  const columns = minColumnWidth && width > 0 ? Math.max(1, Math.floor(width / minColumnWidth)) : 1;
  const perPage = rows * columns;
  const paged = usePagedList(items, perPage);
  return { boxRef, perPage, rows, columns, total: items.length, ...paged };
}

export type FitListState<T> = ReturnType<typeof useFitList<T>>;
