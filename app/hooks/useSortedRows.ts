import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

export type SortValue = string | number;

const compare = (a: SortValue, b: SortValue) =>
  typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a).localeCompare(String(b), "bs");

/** The next sort after a click on a header: unsorted → ascending → descending → unsorted. */
const nextSort = (current: SortState | null, key: string): SortState | null => {
  if (current?.key !== key) return { key, direction: "asc" };
  return current.direction === "asc" ? { key, direction: "desc" } : null;
};

/**
 * Sorts `rows` by the column the user clicked. `getSortValue` reads the value to
 * sort by for a column key. With no column picked, the rows keep their own order.
 */
export function useSortedRows<T>(
  rows: T[],
  getSortValue: (row: T, key: string) => SortValue | undefined,
) {
  const [sort, setSort] = useState<SortState | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const sign = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort(
      (a, b) =>
        sign * compare(getSortValue(a, sort.key) ?? "", getSortValue(b, sort.key) ?? ""),
    );
  }, [rows, sort, getSortValue]);

  const toggleSort = (key: string) => setSort((current) => nextSort(current, key));

  return { sortedRows, sort, toggleSort };
}
