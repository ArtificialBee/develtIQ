import { useMemo, useState, type ReactNode } from "react";
import { LuArrowDownUp, LuCheck, LuListFilter, LuSearch } from "react-icons/lu";
import { Modal } from "~/components/Modal";
import { ModalSelect } from "~/components/ModalSelect";
import { MiniTrend } from "~/components/MiniTrend";
import { Sheet } from "~/components/Sheet";
import { StatusBadge } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import { ToolbarSelect } from "~/components/ToolbarSelect";
import {
  KPI_STATUS_LABELS,
  KPIS_BY_GAP,
  currentValue,
  formatGap,
  formatKpiValue,
  gapPercent,
  improvementTrendPercent,
  kpiStatus,
  type ModuleKpi,
  type KpiStatus,
} from "~/lib/kpi";
import { formatBroj } from "~/lib/ui";

const numeric = "font-mono tabular-nums";
const MIN_SEARCH_LENGTH = 3;
const statuses: KpiStatus[] = ["success", "warning", "danger"];
const modules = [...new Set(KPIS_BY_GAP.map((kpi) => kpi.module))].sort((a, b) => a.localeCompare(b, "bs"));

const statusOptions = statuses.map((status) => ({
  value: status,
  label: <StatusBadge tone={status}>{KPI_STATUS_LABELS[status]}</StatusBadge>,
  count: KPIS_BY_GAP.filter((kpi) => kpiStatus(kpi) === status).length,
}));
const statusDots: Record<KpiStatus, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};
// The header's quick pick: one status or all. The sheet can tick several.
const quickStatusOptions = [
  { value: "all", label: "Svi statusi" },
  ...statuses.map((status) => ({
    value: status,
    label: (
      <>
        <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${statusDots[status]}`} />
        {KPI_STATUS_LABELS[status]}
      </>
    ),
  })),
];
const moduleOptions = modules.map((name) => ({
  value: name,
  label: name,
  count: KPIS_BY_GAP.filter((kpi) => kpi.module === name).length,
}));

/** A copy of `set` with `value` added, or removed when it was there. */
const toggled = <T,>(set: Set<T>, value: T) => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

interface FilterGroupProps<T extends string> {
  legend: string;
  options: { value: T; label: ReactNode; count: number }[];
  selected: Set<T>;
  onToggle: (value: T) => void;
}

/** A titled list of checkboxes, each with how many KPIs it holds. None checked means all. */
const FilterGroup = <T extends string>({ legend, options, selected, onToggle }: FilterGroupProps<T>) => (
  <fieldset className="mb-6 last:mb-0">
    <legend className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-gray-500">{legend}</legend>
    <div className="space-y-0.5">
      {options.map((option) => (
        <label
          key={option.value}
          className="-mx-2 flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-gray-800 transition-colors hover:bg-gray-50"
        >
          {/* A drawn checkbox: the browser's own picks a dark tick on this blue. */}
          <span className="relative flex size-5 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={selected.has(option.value)}
              onChange={() => onToggle(option.value)}
              className="peer size-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-white transition-colors checked:border-[#3B9DF8] checked:bg-[#3B9DF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]/40"
            />
            <LuCheck
              aria-hidden
              strokeWidth={3}
              className="pointer-events-none absolute size-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
            />
          </span>
          <span className="min-w-0 flex-1 truncate">{option.label}</span>
          <span className="shrink-0 text-xs tabular-nums text-gray-400">{formatBroj(option.count)}</span>
        </label>
      ))}
    </div>
  </fieldset>
);

type SortField = "module" | "current" | "target" | "gap";
type SortDirection = "asc" | "desc";

const sortFieldOptions: { value: SortField; label: string }[] = [
  { value: "module", label: "Modul" },
  { value: "current", label: "Trenutno" },
  { value: "target", label: "Planirano" },
  { value: "gap", label: "Razlika" },
];
const sortDirectionOptions = [
  { value: "asc", label: "Ascending (low to high / A–Z)" },
  { value: "desc", label: "Descending (high to low / Z–A)" },
];

// Widths and visibility go on header and cells alike, so a fixed-layout table keeps its columns.
const columns: TableColumn<ModuleKpi>[] = [
  {
    key: "metric",
    header: "Pokazatelj",
    render: (kpi) => <span title={kpi.narrative}>{kpi.metricLabel}</span>,
    sortValue: (kpi) => kpi.metricLabel,
    className: "font-medium dark:text-white",
    visibility: "w-[46%] sm:w-[34%]",
  },
  {
    key: "module",
    header: "Modul",
    render: (kpi) => kpi.module,
    sortValue: (kpi) => kpi.module,
    className: "text-gray-500 dark:text-white/60",
    visibility: "hidden w-[14%] md:table-cell",
  },
  {
    key: "current",
    header: "Trenutno",
    align: "right",
    render: (kpi) => formatKpiValue(kpi),
    sortValue: currentValue,
    className: `${numeric} dark:text-white`,
    visibility: "w-[24%] sm:w-[13%]",
  },
  {
    key: "target",
    header: "Planirano",
    align: "right",
    render: (kpi) => formatKpiValue(kpi, kpi.target),
    sortValue: (kpi) => kpi.target,
    className: `${numeric} text-gray-500 dark:text-white/60`,
    visibility: "hidden w-[13%] lg:table-cell",
  },
  {
    key: "gap",
    header: "Razlika",
    align: "right",
    render: formatGap,
    sortValue: gapPercent,
    className: `${numeric} dark:text-white`,
    visibility: "hidden w-[13%] sm:table-cell",
  },
  {
    key: "trend",
    header: "Trend",
    render: (kpi) => <MiniTrend values={kpi.actual} improving={improvementTrendPercent(kpi) >= 0} />,
    visibility: "hidden w-[10%] xl:table-cell",
  },
  {
    key: "status",
    header: "Status",
    render: (kpi) => <StatusBadge tone={kpiStatus(kpi)}>{KPI_STATUS_LABELS[kpiStatus(kpi)]}</StatusBadge>,
    sortValue: gapPercent,
    visibility: "w-[30%] sm:w-[14%]",
  },
];

/** Every tracked KPI: current value, plan, gap, Jan–Sep trend and status. Biggest gap first. */
export const KpiTable = ({ className = "", fill = false }: { className?: string; fill?: boolean }) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Filters apply as soon as they are ticked. An empty set lets every value through.
  const [statusFilter, setStatusFilter] = useState<Set<KpiStatus>>(() => new Set());
  const [moduleFilter, setModuleFilter] = useState<Set<string>>(() => new Set());
  const filterCount = statusFilter.size + moduleFilter.size;
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection } | null>(null);
  const [draftSortField, setDraftSortField] = useState<SortField>("module");
  const [draftSortDirection, setDraftSortDirection] = useState<SortDirection>("asc");
  const rows = useMemo(() => {
    const trimmedSearch = search.trim();
    const query =
      trimmedSearch.length >= MIN_SEARCH_LENGTH
        ? trimmedSearch.toLocaleLowerCase("bs")
        : "";
    const filteredBySheet = KPIS_BY_GAP.filter(
      (kpi) =>
        (statusFilter.size === 0 || statusFilter.has(kpiStatus(kpi))) &&
        (moduleFilter.size === 0 || moduleFilter.has(kpi.module)),
    );
    const filtered = query
      ? filteredBySheet.filter((kpi) =>
          [
            kpi.metricLabel,
            kpi.module,
            kpi.narrative,
            formatKpiValue(kpi),
            formatKpiValue(kpi, kpi.target),
            formatGap(kpi),
            KPI_STATUS_LABELS[kpiStatus(kpi)],
          ].some((value) => value.toLocaleLowerCase("bs").includes(query)),
        )
      : filteredBySheet;
    if (!sort) return filtered;

    const multiplier = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sort.field === "module") return multiplier * a.module.localeCompare(b.module, "bs");
      const aValue =
        sort.field === "current" ? currentValue(a) :
        sort.field === "target" ? a.target :
        gapPercent(a);
      const bValue =
        sort.field === "current" ? currentValue(b) :
        sort.field === "target" ? b.target :
        gapPercent(b);
      return multiplier * (aValue - bValue);
    });
  }, [search, sort, statusFilter, moduleFilter]);

  const clearFilters = () => {
    setStatusFilter(new Set());
    setModuleFilter(new Set());
  };
  const openSorting = () => {
    setDraftSortField(sort?.field ?? "module");
    setDraftSortDirection(sort?.direction ?? "asc");
    setSortOpen(true);
  };
  const applySort = () => {
    setSort({ field: draftSortField, direction: draftSortDirection });
    setSortOpen(false);
  };
  const cancelSort = () => setSortOpen(false);
  const modalActions = (cancelLabel: string, submitLabel: string, onCancel: () => void, onSubmit: () => void) => (
    <div className="flex w-full items-center justify-between gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="rounded-lg bg-[#3B9DF8] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      >
        {submitLabel}
      </button>
    </div>
  );

  return (
    <>
      <Table
        title="Trenutno naspram planiranog i odstupanje"
        description="Svaki praćeni KPI, najveće odstupanje prvo."
        columns={columns}
        rows={rows}
        getRowKey={(kpi) => kpi.key}
        emptyText={
          search.trim().length >= MIN_SEARCH_LENGTH
            ? "Nema pokazatelja koji odgovaraju pretrazi."
            : filterCount > 0
              ? "Nema pokazatelja za odabrane filtere."
              : "Nema podataka."
        }
        fill={fill}
        className={className}
        key={`${sort?.field ?? "default"}-${sort?.direction ?? ""}`}
        action={
          <>
            <label className="relative flex h-8 w-36 items-center sm:w-44">
              <LuSearch
                aria-hidden
                className="pointer-events-none absolute left-2.5 size-4 text-gray-400 dark:text-slate-500"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                aria-label="Pretraži pokazatelje"
                placeholder="Pretraži (min. 3 znaka)"
                className="h-full w-full rounded-lg border border-slate-200 bg-white/70 pl-8 pr-2 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#3B9DF8] focus:ring-2 focus:ring-[#3B9DF8]/15 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-500"
              />
            </label>
            <ToolbarSelect
              label="Filtriraj po statusu"
              value={statusFilter.size === 0 ? "all" : statusFilter.size === 1 ? [...statusFilter][0] : "several"}
              options={quickStatusOptions}
              fallback={`${statusFilter.size} statusa`}
              active={statusFilter.size > 0}
              onChange={(value) => setStatusFilter(new Set(statuses.filter((status) => status === value)))}
            />
            <button
              type="button"
              onClick={openSorting}
              aria-label="Sortiraj pokazatelje"
              title="Sortiraj pokazatelje"
              className={`flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-[#3B9DF8]/10 hover:text-[#3B9DF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] ${
                sort ? "text-[#3B9DF8]" : "text-gray-500 dark:text-white/60"
              }`}
            >
              <LuArrowDownUp aria-hidden className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-label={filterCount > 0 ? `Filteri, ${filterCount} odabrano` : "Filteri"}
              title="Filteri"
              className={`relative flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-[#3B9DF8]/10 hover:text-[#3B9DF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] ${
                filterCount > 0 ? "text-[#3B9DF8]" : "text-gray-500"
              }`}
            >
              <LuListFilter aria-hidden className="size-4" />
              {filterCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#3B9DF8] text-[10px] font-semibold text-white ring-2 ring-white"
                >
                  {filterCount}
                </span>
              )}
            </button>
          </>
        }
      />
      <Sheet
        open={filterOpen}
        title="Filteri"
        description={`Prikazano ${formatBroj(rows.length)} od ${formatBroj(KPIS_BY_GAP.length)} pokazatelja`}
        onClose={() => setFilterOpen(false)}
        footer={
          <button
            type="button"
            onClick={clearFilters}
            disabled={filterCount === 0}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] disabled:pointer-events-none disabled:opacity-40"
          >
            Očisti filtere
          </button>
        }
      >
        <FilterGroup
          legend="Status"
          options={statusOptions}
          selected={statusFilter}
          onToggle={(status) => setStatusFilter((current) => toggled(current, status))}
        />
        <FilterGroup
          legend="Modul"
          options={moduleOptions}
          selected={moduleFilter}
          onToggle={(name) => setModuleFilter((current) => toggled(current, name))}
        />
      </Sheet>
      <Modal
        open={sortOpen}
        title="Sortiraj pokazatelje"
        onClose={cancelSort}
        actions={modalActions("Cancel", "Submit filters", cancelSort, applySort)}
      >
        <div className="space-y-4">
          <ModalSelect
            id="kpi-sort-field"
            label="Field"
            value={draftSortField}
            options={sortFieldOptions}
            onChange={(value) => {
              const selected = sortFieldOptions.find((option) => option.value === value);
              if (selected) setDraftSortField(selected.value);
            }}
          />
          <ModalSelect
            id="kpi-sort-direction"
            label="Sorting technique"
            value={draftSortDirection}
            options={sortDirectionOptions}
            onChange={(value) => {
              if (value === "asc" || value === "desc") setDraftSortDirection(value);
            }}
          />
        </div>
      </Modal>
    </>
  );
};
