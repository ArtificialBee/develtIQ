import type { ReactElement } from "react";
import { DataTable, type DataTableProps } from "~/components/DataTable";
import type { RecordView } from "~/components/RecordPage";
import { StatGrid, type Stat } from "~/components/StatCard";

/**
 * The warehouse's screens, one entry per menu item, keyed "section/screen" as in
 * the URL (`/app/skladiste/prijem/prijemnice`). Each says what its list shows and,
 * when its rows open, how one record's details page reads. A screen without an
 * entry shows that it is not connected yet.
 */

export interface Screen {
  /** The list under the top bar: cards, then the app's one table. */
  List: () => ReactElement;
  /** One row's details page, by its id; null when there is no such row. */
  record?: (id: string) => RecordView | null;
}

export interface ListConfig<T> {
  /** Cards over the table, counting what it holds. */
  stats?: Stat[];
  table: Omit<DataTableProps<T>, "fill" | "className">;
  record?: (id: string) => RecordView | null;
}

/** A list screen from its cards, its table and its details pages, typed by its row. */
export function listScreen<T>({ stats, table, record }: ListConfig<T>): Screen {
  const List = () => (
    <>
      {stats && stats.length > 0 && (
        <div className="flex min-h-0 shrink-0 flex-col">
          <StatGrid fill minimal label={`${table.title}: sažetak`} stats={stats} />
        </div>
      )}
      <DataTable {...table} fill className="min-h-0 flex-1" />
    </>
  );
  return { List, record };
}

/** The base of every warehouse URL. */
export const SKLADISTE = "/app/skladiste";

/** The URL of a screen, or of one of its records. */
export const ekranUrl = (sekcija: string, ekran: string, id?: string) =>
  `${SKLADISTE}/${sekcija}/${ekran}${id ? `/${encodeURIComponent(id)}` : ""}`;
