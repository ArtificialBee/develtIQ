import { LuCircleCheck, LuGauge, LuTrendingDown, LuTriangleAlert } from "react-icons/lu";
import type { Insight } from "~/components/InsightList";
import type { VolumeRow } from "~/components/VolumeList";
import type { Stat } from "~/components/StatCard";
import {
  BUSINESS_INDEX,
  KPIS_BY_GAP,
  MODULE_KPIS,
  MONITORED_MODULES,
  MODULE_NAMES,
  MONTHS,
  PROCESSING_VOLUMES,
  TOTAL_PROCESSING_VOLUME,
  currentValue,
  formatGap,
  formatKpiValue,
  gapPercent,
  kpiStatus,
  mainBlocker,
  volumeChangePercent,
  volumeCurrent,
  volumePrevious,
  volumeYtd,
  type ModuleKpi,
} from "~/lib/kpi";

/**
 * What the KPI page shows, counted from the exported records. Pure functions:
 * no React here. The executive read follows cicak's `executiveHighlights()`.
 */

const { values: index, target } = BUSINESS_INDEX;
const now = index[index.length - 1];
const trendSinceJan = Math.round(((now - index[0]) / index[0]) * 100);
const zoneTone: "success" | "warning" | "danger" = now >= target ? "success" : now >= target * 0.85 ? "warning" : "danger";
const zoneName = now >= target ? "zoni cilja" : now >= target * 0.85 ? "zoni upozorenja" : "kritičnoj zoni";

const onPlan = MODULE_KPIS.filter((k) => gapPercent(k) <= 0);
const behind = MODULE_KPIS.filter((k) => gapPercent(k) > 0);
const total = MODULE_KPIS.length;
const share = (n: number) => `${Math.round((n / total) * 100)}%`;
const byStatus = (status: ReturnType<typeof kpiStatus>) => MODULE_KPIS.filter((k) => kpiStatus(k) === status).length;

const kpisOf = (moduleKey: string) => MODULE_KPIS.filter((k) => k.moduleKey === moduleKey);
const modulesFullyBehind = MONITORED_MODULES.filter((m) => kpisOf(m).every((k) => gapPercent(k) > 0));
const modulesAhead = MONITORED_MODULES.filter((m) => kpisOf(m).every((k) => gapPercent(k) <= 0));
const names = (keys: string[], joiner = ", ") => keys.map((m) => MODULE_NAMES[m] ?? m).join(joiner);

const best = [...MODULE_KPIS].sort((a, b) => gapPercent(a) - gapPercent(b))[0];
const worst = KPIS_BY_GAP[0];
const worstBlocker = mainBlocker(worst);
const kpiName = (k: ModuleKpi) => `${k.module} · ${k.metricLabel}`;

const monthOf = (value: number) => MONTHS[index.indexOf(value)];
const bestMonth = Math.max(...index);
const worstMonth = Math.min(...index);

/** The 4 headline cards. */
export const KPI_STATS: Stat[] = [
  {
    key: "index",
    label: "Indeks poslovnih performansi",
    value: now,
    icon: LuGauge,
    tone: zoneTone,
    direction: trendSinceJan >= 0 ? "up" : "down",
    trend: index,
    badge: { label: now >= target ? "U planu" : "Ispod plana", tone: zoneTone },
    breakdown: [
      { label: `Najbolji · ${monthOf(bestMonth)}`, value: bestMonth },
      { label: `Najslabiji · ${monthOf(worstMonth)}`, value: worstMonth },
    ],
    highlight: worstBlocker && {
      label: "Glavna kočnica",
      title: worstBlocker.label,
      meta: [kpiName(worst), worstBlocker.owner].filter(Boolean).join(" · "),
    },
    fact: { label: `Cilj ${target} · od januara`, value: `${trendSinceJan >= 0 ? "+" : "−"}${Math.abs(trendSinceJan)}%` },
  },
  {
    key: "on-plan",
    label: "KPI-jevi u planu",
    value: onPlan.length,
    suffix: `/${total}`,
    icon: LuCircleCheck,
    tone: "success",
    breakdown: modulesAhead.map((m) => ({ label: MODULE_NAMES[m] ?? m, value: kpisOf(m).length })),
    highlight: {
      label: "Ide odlično",
      title: kpiName(best),
      meta: `${formatKpiValue(best)} · cilj ${formatKpiValue(best, best.target)} · ${formatGap(best)}`,
    },
    fact: { label: "Udio", value: share(onPlan.length) },
  },
  {
    key: "behind",
    label: "KPI-jevi iza plana",
    value: behind.length,
    suffix: `/${total}`,
    icon: LuTrendingDown,
    tone: "warning",
    breakdown: [
      { label: "Prati se", value: byStatus("warning") },
      { label: "Kasni", value: byStatus("danger") },
    ],
    highlight:
      modulesFullyBehind.length > 0
        ? { label: "Svi pokazatelji ispod cilja", title: names(modulesFullyBehind), meta: "Vrijedi razmotriti dodatne resurse prije kraja kvartala." }
        : undefined,
    fact: { label: "Udio", value: share(behind.length) },
  },
  {
    key: "biggest-gap",
    label: "Najveće odstupanje",
    value: gapPercent(worst),
    suffix: "%",
    icon: LuTriangleAlert,
    tone: "danger",
    highlight: {
      label: worst.module,
      title: worst.metricLabel,
      meta: worstBlocker ? `Uzrok: ${worstBlocker.label}` : worst.narrative,
    },
    fact: { label: "Trenutno / cilj", value: `${formatKpiValue(worst, currentValue(worst))} / ${formatKpiValue(worst, worst.target)}` },
  },
];

/** The executive read: momentum, what goes well, what needs attention, a pattern, and a target to rethink. */
export const EXECUTIVE_READ: Insight[] = [
  {
    key: "momentum",
    tone: zoneTone,
    lead: "Zamah",
    text: `Poslovni indeks je na ${now} od ${target} i ${trendSinceJan >= 0 ? "porastao" : "pao"} je ${Math.abs(trendSinceJan)}% od januara — trenutno u ${zoneName}, uz ${behind.length} od ${total} pokazatelja iza plana.`,
  },
  {
    key: "well",
    tone: "success",
    lead: "Ide odlično",
    text: `${best.module} vodi sa ${best.metricLabel.toLowerCase()} na ${formatKpiValue(best)} — ${formatGap(best)} u odnosu na cilj od ${formatKpiValue(best, best.target)}.`,
  },
  {
    key: "attention",
    tone: "danger",
    lead: "Obratiti pažnju",
    text: `${worst.module} kasni ${formatGap(worst)} za planom kod ${worst.metricLabel.toLowerCase()}${worstBlocker ? ` — glavni uzrok je „${worstBlocker.label.toLowerCase()}"` : ""}.`,
  },
  {
    key: "pattern",
    tone: modulesFullyBehind.length >= 2 ? "warning" : "info",
    lead: "Obrazac kroz module",
    text:
      modulesFullyBehind.length >= 2
        ? `${names(modulesFullyBehind)} imaju svaki praćeni pokazatelj ispod cilja — vrijedi razmotriti dodatne resurse prije kraja kvartala.${modulesAhead.length > 0 ? ` ${names(modulesAhead, " i ")} su u potpunosti u planu.` : ""}`
        : "Odstupanja su raspoređena pojedinačno, bez modula kod kojeg bi svi pokazatelji kasnili.",
  },
  {
    key: "rebalance",
    tone: "info",
    lead: "Razmisliti o rebalansiranju",
    text:
      gapPercent(best) <= -5
        ? `${best.module} (${best.metricLabel.toLowerCase()}) je ${Math.abs(gapPercent(best))}% iznad cilja od ${formatKpiValue(best, best.target)} — ako trend potraje, vrijedi podići cilj na sljedećem pregledu plana.`
        : "Nijedan pokazatelj ne premašuje cilj dovoljno da bi zahtijevao reviziju plana — pratiti trend do kraja kvartala.",
  },
];

/** Processing volume per module, the company total last. */
export const VOLUMES: VolumeRow[] = [...PROCESSING_VOLUMES, TOTAL_PROCESSING_VOLUME].map((pv) => ({
  key: pv.moduleKey,
  label: pv.label,
  module: MODULE_NAMES[pv.moduleKey] ?? "Cijela kompanija",
  current: volumeCurrent(pv),
  previous: volumePrevious(pv),
  changePercent: volumeChangePercent(pv),
  ytd: volumeYtd(pv),
  annualTarget: pv.annualTarget,
  progress: volumeYtd(pv) / pv.annualTarget,
  expected: MONTHS.length / 12,
}));

/** The business index as one bar series for the chart. */
export const PULSE = {
  categories: MONTHS,
  series: [{ label: "2026", values: index }],
  target,
  notes: BUSINESS_INDEX.notes,
};
