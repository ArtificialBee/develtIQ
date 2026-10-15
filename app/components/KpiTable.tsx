import { DataTable, type DataTableFilter, type SortField } from "~/components/DataTable";
import { MiniTrend } from "~/components/MiniTrend";
import { StatusBadge } from "~/components/StatusBadge";
import type { TableColumn } from "~/components/Table";
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

const numeric = "font-mono tabular-nums";
const statuses: KpiStatus[] = ["success", "warning", "danger"];

// One table holds one kind of number: this one holds only the KPIs measured in percent.
const PERCENT_KPIS = KPIS_BY_GAP.filter((kpi) => kpi.unit === "%");

const filters: DataTableFilter<ModuleKpi>[] = [
  {
    key: "status",
    legend: "Status",
    options: statuses.map((status) => ({ value: status, label: KPI_STATUS_LABELS[status], tone: status })),
    matches: (kpi, value) => kpiStatus(kpi) === value,
  },
  {
    key: "modul",
    legend: "Modul",
    options: [...new Set(PERCENT_KPIS.map((kpi) => kpi.module))]
      .sort((a, b) => a.localeCompare(b, "bs"))
      .map((name) => ({ value: name, label: name })),
    matches: (kpi, value) => kpi.module === value,
  },
];

const sortFields: SortField<ModuleKpi>[] = [
  { value: "module", label: "Modul", compare: (a, b) => a.module.localeCompare(b.module, "bs") },
  { value: "current", label: "Trenutno", compare: (a, b) => currentValue(a) - currentValue(b) },
  { value: "target", label: "Planirano", compare: (a, b) => a.target - b.target },
  { value: "gap", label: "Razlika", compare: (a, b) => gapPercent(a) - gapPercent(b) },
];

const searchText = (kpi: ModuleKpi) => [
  kpi.metricLabel,
  kpi.module,
  kpi.narrative,
  formatKpiValue(kpi),
  formatKpiValue(kpi, kpi.target),
  formatGap(kpi),
  KPI_STATUS_LABELS[kpiStatus(kpi)],
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

/** Every KPI measured in percent: current value, plan, gap, Jan–Sep trend and status. Biggest gap first. */
export const KpiTable = ({ className = "", fill = false }: { className?: string; fill?: boolean }) => (
  <DataTable
    title="Trenutno naspram planiranog i odstupanje"
    description="Pokazatelji u postotku, najveće odstupanje prvo."
    columns={columns}
    rows={PERCENT_KPIS}
    getRowKey={(kpi) => kpi.key}
    searchText={searchText}
    searchLabel="Pretraži pokazatelje"
    filters={filters}
    quick={{ label: "Filtriraj po statusu", allLabel: "Svi statusi", several: (count) => `${count} statusa` }}
    sortFields={sortFields}
    noun="pokazatelja"
    fill={fill}
    className={className}
  />
);
