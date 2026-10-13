import type { IconType } from "react-icons";
import { CHART_COLORS, Chart, type ChartSeries } from "~/components/Chart";
import { ChartPanel } from "~/components/ChartPanel";
import { MONTHS, type ProcessingVolume } from "~/lib/kpi";
import { formatBroj } from "~/lib/ui";

export interface VolumeTrendProps {
  /** A monthly count, such as one app's completed work orders, with its yearly target. */
  volume: ProcessingVolume;
  icon: IconType;
  title: string;
  /** Where the count comes from, such as the app. */
  link?: { label: string; url: string };
  className?: string;
}

/**
 * A monthly output as a line against the pace its yearly target needs (a twelfth
 * of it each month), with the year so far against the plan so far.
 */
export const VolumeTrend = ({ volume, icon, title, link, className = "" }: VolumeTrendProps) => {
  const monthlyTarget = Math.round(volume.annualTarget / 12);
  const total = volume.monthly.reduce((sum, value) => sum + value, 0);
  const plan = Math.round((volume.annualTarget * volume.monthly.length) / 12);
  const share = Math.round((total / plan) * 100);
  const series: ChartSeries[] = [
    { key: "stvarno", label: volume.label, values: volume.monthly, kind: "line", color: CHART_COLORS.actual },
    { key: "cilj", label: "Cilj", values: volume.monthly.map(() => monthlyTarget), kind: "target", color: CHART_COLORS.target },
  ];

  return (
    <ChartPanel
      icon={icon}
      title={title}
      description={`${MONTHS[0]}–${MONTHS[volume.monthly.length - 1]} 2026 · cilj ${formatBroj(monthlyTarget)} mjesečno`}
      series={series}
      summary={
        <>
          Ove godine <span className="font-semibold text-gray-900">{formatBroj(total)}</span> od plana {formatBroj(plan)}{" "}
          <span className={share >= 100 ? "text-emerald-600" : "text-amber-600"}>({share}%)</span>
        </>
      }
      link={link}
      className={className}
    >
      <Chart
        label={`${volume.label} po mjesecu naspram cilja od ${formatBroj(monthlyTarget)}`}
        labels={MONTHS.slice(0, volume.monthly.length)}
        series={series}
        className="h-full"
      />
    </ChartPanel>
  );
};
