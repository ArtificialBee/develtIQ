import data from "~/data/kpi-2026-09.json";

/**
 * The tracked KPIs, the business index and the processing volumes, exported live
 * from the divetiq-cicak demo (`home/kpi-data.ts`) for Jan–Sep 2026. Everything
 * on the KPI page is counted from these records.
 */

export type KpiDirection = "higher-is-better" | "lower-is-better";
export type KpiStatus = "success" | "warning" | "danger";
export type DriverImpact = "blocking" | "contributing" | "positive";

export interface KpiDriver {
  label: string;
  detail: string;
  impact: DriverImpact;
  owner?: string;
}

export interface ModuleKpi {
  key: string;
  moduleKey: string;
  /** The module's display name, such as "Skladište". */
  module: string;
  metricLabel: string;
  unit: string;
  direction: KpiDirection;
  target: number;
  decimals: number;
  /** Jan–Sep actuals. */
  actual: number[];
  /** One sentence tying the gap to its main cause. */
  narrative: string;
  /** What drives the number, blocking first. */
  drivers: KpiDriver[];
}

export interface ProcessingVolume {
  moduleKey: string;
  label: string;
  /** Jan–Sep counts. */
  monthly: number[];
  annualTarget: number;
}

type RawKpi = Omit<ModuleKpi, "module">;

/** Jan–Sep. September is the latest closed month. */
export const MONTHS: string[] = data.months;

const CURRENT_MONTH_INDEX = MONTHS.length - 1;

export const MODULE_NAMES: Record<string, string> = data.moduleNames;
export const MONITORED_MODULES: string[] = data.monitoredModules;

export const MODULE_KPIS: ModuleKpi[] = (data.kpis as RawKpi[]).map((kpi) => ({
  ...kpi,
  module: MODULE_NAMES[kpi.moduleKey] ?? kpi.moduleKey,
}));

/** The composite business index, 100 = exactly on plan, Jan–Sep. */
export const BUSINESS_INDEX = { values: data.businessIndex, target: data.target, notes: data.pulseNotes };

export const PROCESSING_VOLUMES: ProcessingVolume[] = data.volumes;
export const TOTAL_PROCESSING_VOLUME: ProcessingVolume = data.totalVolume;

const round = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/** The latest-month value. */
export const currentValue = (kpi: ModuleKpi) => kpi.actual[CURRENT_MONTH_INDEX];

/** Signed gap to the target. Positive always means "behind plan". */
export const gap = (kpi: ModuleKpi) => {
  const current = currentValue(kpi);
  const raw = kpi.direction === "lower-is-better" ? current - kpi.target : kpi.target - current;
  return round(raw, kpi.decimals);
};

/** Gap as a percentage of the target, for ranking KPIs by how far off plan they are. */
export const gapPercent = (kpi: ModuleKpi) =>
  kpi.target === 0 ? 0 : Math.round((gap(kpi) / kpi.target) * 100);

/** Every KPI, the one furthest behind plan first. */
export const KPIS_BY_GAP: ModuleKpi[] = [...MODULE_KPIS].sort(
  (a, b) => gapPercent(b) - gapPercent(a),
);

/** success = at or ahead of plan, warning = a miss up to 15%, danger = a bigger miss. */
export const kpiStatus = (kpi: ModuleKpi): KpiStatus => {
  const pct = gapPercent(kpi);
  if (pct <= 0) return "success";
  return pct <= 15 ? "warning" : "danger";
};

export const KPI_STATUS_LABELS: Record<KpiStatus, string> = {
  success: "U planu",
  warning: "Prati se",
  danger: "Kasni",
};

/** Percent change Jan → now, signed so positive always means "moving toward plan". */
export const improvementTrendPercent = (kpi: ModuleKpi) => {
  const start = kpi.actual[0];
  if (start === 0) return 0;
  const rawChange = ((currentValue(kpi) - start) / Math.abs(start)) * 100;
  return Math.round(kpi.direction === "higher-is-better" ? rawChange : -rawChange);
};

const formatNumber = (value: number, decimals: number) =>
  value.toLocaleString("hr-HR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** e.g. "85,0%" or "6,1 dana". */
export const formatKpiValue = (kpi: ModuleKpi, value = currentValue(kpi)) => {
  const n = formatNumber(value, kpi.decimals);
  return kpi.unit === "%" ? `${n}%` : `${n} ${kpi.unit}`;
};

/** e.g. "+1,1 dana" or "−0,4%". */
export const formatGap = (kpi: ModuleKpi) => {
  const g = gap(kpi);
  if (g === 0) return "U planu";
  const magnitude = formatNumber(Math.abs(g), kpi.decimals);
  const unit = kpi.unit === "%" ? "%" : ` ${kpi.unit}`;
  return `${g > 0 ? "+" : "−"}${magnitude}${unit}`;
};

/** The first blocking cause of a KPI, if it has one. */
export const mainBlocker = (kpi: ModuleKpi) => kpi.drivers.find((d) => d.impact === "blocking");

// Processing volumes.

export const volumeCurrent = (pv: ProcessingVolume) => pv.monthly[CURRENT_MONTH_INDEX];
export const volumePrevious = (pv: ProcessingVolume) => pv.monthly[CURRENT_MONTH_INDEX - 1];
export const volumeYtd = (pv: ProcessingVolume) => pv.monthly.reduce((a, b) => a + b, 0);

/** Month-over-month change in percent; positive means more was processed. */
export const volumeChangePercent = (pv: ProcessingVolume) => {
  const previous = volumePrevious(pv);
  return previous === 0 ? 0 : Math.round(((volumeCurrent(pv) - previous) / previous) * 100);
};
