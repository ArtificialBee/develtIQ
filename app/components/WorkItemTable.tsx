import { Link, useLocation, useSearchParams } from "react-router";
import { DataTable, type DataTableFilter, type SortField } from "~/components/DataTable";
import { StatusBadge } from "~/components/StatusBadge";
import type { TableColumn } from "~/components/Table";
import { appForModul } from "~/lib/apps";
import { kratkiDatum } from "~/lib/snapshot";
import { STANJA, STANJE_LABELS, STANJE_TONES, type WorkItem } from "~/lib/work-items";

const appLabel = (item: WorkItem) => appForModul(item.modul).label;

// Widths and visibility go on header and cells alike, so a fixed-layout table keeps its columns.
const columns: TableColumn<WorkItem>[] = [
  {
    key: "app",
    header: "Aplikacija",
    render: (item) => {
      const app = appForModul(item.modul);
      const Icon = app.icon;
      return (
        <span className="flex min-w-0 items-center gap-2">
          <Icon aria-hidden className="size-4 shrink-0 text-[#3B9DF8]" />
          <span className="truncate">{app.label}</span>
        </span>
      );
    },
    sortValue: (item) => appForModul(item.modul).label,
    className: "text-gray-600",
    visibility: "hidden w-[17%] md:table-cell",
  },
  {
    key: "akcija",
    header: "Akcija",
    render: (item) => item.akcija,
    sortValue: (item) => item.akcija,
    className: "text-gray-600",
    visibility: "hidden w-[12%] sm:table-cell",
  },
  {
    key: "naslov",
    header: "Naslov",
    render: (item) => (
      <Link to={item.url} title={item.naslov} className="font-medium text-gray-900 transition-colors hover:text-[#3B9DF8]">
        {item.naslov}
      </Link>
    ),
    sortValue: (item) => item.naslov,
    visibility: "w-[52%] sm:w-[37%]",
  },
  {
    key: "broj",
    header: "Broj",
    render: (item) => item.broj ?? "—",
    className: "font-mono tabular-nums text-gray-500",
    visibility: "hidden w-[14%] lg:table-cell",
  },
  {
    key: "rok",
    header: "Rok",
    align: "right",
    render: (item) => (item.rok ? kratkiDatum(item.rok) : "—"),
    // No deadline sorts after every date.
    sortValue: (item) => item.rok ?? "9999",
    className: "font-mono tabular-nums",
    visibility: "w-[20%] sm:w-[9%]",
  },
  {
    key: "stanje",
    header: "Stanje",
    render: (item) => <StatusBadge tone={STANJE_TONES[item.stanje]}>{STANJE_LABELS[item.stanje]}</StatusBadge>,
    sortValue: (item) => STANJA.indexOf(item.stanje),
    visibility: "w-[28%] sm:w-[11%]",
  },
];

const sortFields: SortField<WorkItem>[] = [
  { value: "rok", label: "Rok", compare: (a, b) => (a.rok ?? "").localeCompare(b.rok ?? ""), isEmpty: (item) => !item.rok },
  { value: "app", label: "Aplikacija", compare: (a, b) => appLabel(a).localeCompare(appLabel(b), "bs") },
  { value: "akcija", label: "Akcija", compare: (a, b) => a.akcija.localeCompare(b.akcija, "bs") },
  { value: "stanje", label: "Stanje", compare: (a, b) => STANJA.indexOf(a.stanje) - STANJA.indexOf(b.stanje) },
];

const searchText = (item: WorkItem) => [item.naslov, item.akcija, item.vrsta, item.broj ?? "", appLabel(item), STANJE_LABELS[item.stanje]];

/**
 * Every open item of the person in the app's one table with tools: the same
 * columns for every app, so a "Kasni" or "Protokol" view is this table with a
 * filter. A home card opens it filtered through the URL (`?stanje=kasni`, `?app=protocol`).
 */
export const WorkItemTable = ({ items, className = "" }: { items: WorkItem[]; className?: string }) => {
  const [params] = useSearchParams();
  const { search } = useLocation();
  const filters: DataTableFilter<WorkItem>[] = [
    {
      key: "stanje",
      legend: "Stanje",
      options: STANJA.map((value) => ({ value, label: STANJE_LABELS[value], tone: STANJE_TONES[value] })),
      matches: (item, value) => item.stanje === value,
    },
    {
      key: "app",
      legend: "Aplikacija",
      options: [...new Map(items.map((item) => [appForModul(item.modul).key, appForModul(item.modul)])).values()]
        .sort((a, b) => a.label.localeCompare(b.label, "bs"))
        .map((app) => ({ value: app.key, label: app.label })),
      matches: (item, value) => appForModul(item.modul).key === value,
    },
  ];
  const initialFilters = Object.fromEntries(
    filters.flatMap((filter) => {
      const value = params.get(filter.key);
      return value ? [[filter.key, [value]]] : [];
    }),
  );

  return (
    <DataTable
      // A new link from a home card opens the table with its own filters.
      key={search}
      title="Moji zadaci"
      description="Sve što traži tebe, iz svih aplikacija, najhitnije prvo."
      columns={columns}
      rows={items}
      getRowKey={(item) => item.id}
      getRowHref={(item) => item.url}
      searchText={searchText}
      searchLabel="Pretraži zadatke"
      filters={filters}
      quick={{ label: "Filtriraj po stanju", allLabel: "Sva stanja", several: (count) => `${count} stanja` }}
      sortFields={sortFields}
      initialFilters={initialFilters}
      noun="zadataka"
      fill
      className={className}
    />
  );
};
