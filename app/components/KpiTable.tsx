import { MiniTrend } from "~/components/MiniTrend";
import { StatusBadge } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
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
} from "~/lib/kpi";

const numeric = "font-mono tabular-nums";

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
export const KpiTable = ({ className = "", fill = false }: { className?: string; fill?: boolean }) => (
  <Table
    title="Trenutno naspram planiranog i odstupanje"
    description="Svaki praćeni KPI, najveće odstupanje prvo."
    columns={columns}
    rows={KPIS_BY_GAP}
    getRowKey={(kpi) => kpi.key}
    fill={fill}
    className={className}
  />
);
