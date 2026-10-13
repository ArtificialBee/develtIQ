import { useState } from "react";
import { LuChartPie } from "react-icons/lu";
import { CHART_COLORS, CHART_PALETTE, Chart, type ChartSeries } from "~/components/Chart";
import { ChartPanel } from "~/components/ChartPanel";
import { DonutChart } from "~/components/DonutChart";
import { MONTHS, PROCESSING_VOLUMES } from "~/lib/kpi";
import { VOLUMES } from "~/lib/kpi-page";
import { formatBroj } from "~/lib/ui";

// Every module's processing this year, as parts of the company's total; the total row is the whole.
const MODULES = VOLUMES.filter((row) => row.key !== "all");
const planToDate = (row: (typeof MODULES)[number]) => Math.round(row.annualTarget * row.expected);
const share = (done: number, plan: number) => Math.round((done / plan) * 100);
const totalYtd = MODULES.reduce((sum, row) => sum + row.ytd, 0);
const totalPlan = MODULES.reduce((sum, row) => sum + planToDate(row), 0);
const colorOf = (key: string) => CHART_PALETTE[MODULES.findIndex((row) => row.key === key) % CHART_PALETTE.length];

const slices = MODULES.map((row) => {
  const done = share(row.ytd, planToDate(row));
  return {
    key: row.key,
    label: row.module,
    sublabel: row.label,
    value: row.ytd,
    color: colorOf(row.key),
    note: { text: `${done}% plana`, tone: done >= 100 ? ("good" as const) : ("warn" as const) },
  };
});

// The biggest module is picked first.
const FIRST = [...MODULES].sort((a, b) => b.ytd - a.ytd)[0]?.key ?? "";

/**
 * Processing this year by module: the ring of shares with every module's count and
 * progress against plan, and beside it the picked module's month by month against
 * its monthly target. Picking a slice or a legend row changes the chart.
 */
export const VolumeBreakdown = ({ className = "" }: { className?: string }) => {
  const [selected, setSelected] = useState(FIRST);
  const row = MODULES.find((candidate) => candidate.key === selected) ?? MODULES[0];
  const volume = PROCESSING_VOLUMES.find((candidate) => candidate.moduleKey === row.key);
  const monthlyTarget = Math.round(row.annualTarget / 12);
  const series: ChartSeries[] = volume
    ? [
        { key: "stvarno", label: row.label, values: volume.monthly, kind: "line", color: colorOf(row.key) },
        { key: "cilj", label: "Cilj", values: volume.monthly.map(() => monthlyTarget), kind: "target", color: CHART_COLORS.target },
      ]
    : [];
  const done = share(row.ytd, planToDate(row));

  return (
    <ChartPanel
      icon={LuChartPie}
      title="Obim obrade po modulu"
      description={`${MONTHS[0]}–${MONTHS[MONTHS.length - 1]} 2026 · udio svakog modula u ukupnoj obradi`}
      summary={
        <>
          Ukupno <span className="font-semibold text-gray-900">{formatBroj(totalYtd)}</span> od plana {formatBroj(totalPlan)}{" "}
          <span className={totalYtd >= totalPlan ? "text-emerald-600" : "text-amber-600"}>({share(totalYtd, totalPlan)}%)</span>
        </>
      }
      className={className}
    >
      <div className="grid h-full min-h-0 grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <DonutChart
          slices={slices}
          selectedKey={selected}
          onSelect={setSelected}
          centerLabel="obrađeno ove godine"
          label="Obrada po modulu ove godine"
          className="h-full"
        />
        <div className="hidden min-h-0 flex-col border-l border-gray-100 pl-8 xl:flex">
          <p className="truncate text-sm font-semibold text-gray-900">
            {row.module} · {row.label.toLocaleLowerCase("bs")} po mjesecu
          </p>
          <p className="truncate text-xs text-gray-500">
            Cilj {formatBroj(monthlyTarget)} mjesečno · ove godine {formatBroj(row.ytd)} od plana {formatBroj(planToDate(row))}{" "}
            <span className={done >= 100 ? "text-emerald-600" : "text-amber-600"}>({done}%)</span>
          </p>
          <Chart
            label={`${row.label} po mjesecu naspram cilja od ${formatBroj(monthlyTarget)}`}
            labels={MONTHS.slice(0, volume?.monthly.length ?? 0)}
            series={series}
            className="mt-3 min-h-0 flex-1"
          />
        </div>
      </div>
    </ChartPanel>
  );
};
