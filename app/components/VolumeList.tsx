import { LuChartColumn } from "react-icons/lu";
import { FitList, FitListPager } from "~/components/FitList";
import { Panel } from "~/components/Panel";
import { useFitList } from "~/hooks/useFitList";
import { formatBroj } from "~/lib/ui";

export interface VolumeRow {
  key: string;
  label: string;
  module: string;
  current: number;
  previous: number;
  changePercent: number;
  ytd: number;
  annualTarget: number;
  /** YTD as a share of the annual goal, 0–1. */
  progress: number;
  /** Where the year should be by now if spread evenly, 0–1. */
  expected: number;
}

export interface VolumeListProps {
  title: string;
  description?: string;
  rows: VolumeRow[];
  className?: string;
}

const ROW_HEIGHT = 54;

const percent = (share: number) => `${Math.round(Math.min(share, 1) * 100)}%`;

/**
 * How much each module processed: this month against last month, and the year so
 * far against the annual goal, with a tick where the year should be by now.
 */
export const VolumeList = ({ title, description, rows, className }: VolumeListProps) => {
  const fit = useFitList(rows, ROW_HEIGHT);
  return (
    <Panel
      title={title}
      description={description}
      icon={LuChartColumn}
      className={className}
      fill
      action={<FitListPager fit={fit} label={title} />}
    >
      <FitList
        fit={fit}
        getKey={(row) => row.key}
        rowHeight={ROW_HEIGHT}
        renderItem={(row) => {
          const behind = row.progress < row.expected;
          return (
            <div className="flex h-full flex-col justify-center gap-1.5 pr-1">
              <div className="flex items-baseline gap-2 text-sm">
                <span title={`${row.label} · ${row.module}`} className="min-w-0 flex-1 truncate text-gray-800 dark:text-white/90">
                  {row.label}
                </span>
                <span className="shrink-0 font-mono font-semibold tabular-nums text-gray-900 dark:text-white">
                  {formatBroj(row.current)}
                </span>
                <span
                  title={`Prošli mjesec: ${formatBroj(row.previous)}`}
                  className={`w-10 shrink-0 text-right text-xs tabular-nums ${row.changePercent >= 0 ? "text-emerald-500 dark:text-emerald-300" : "text-red-500 dark:text-red-400"}`}
                >
                  {row.changePercent >= 0 ? "+" : "−"}
                  {Math.abs(row.changePercent)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800"
                  title={`Godina: ${formatBroj(row.ytd)} od ${formatBroj(row.annualTarget)}`}
                >
                  <div
                    className={`h-full rounded-full ${behind ? "bg-amber-400" : "bg-linear-to-r from-cyan-400 to-[#3B9DF8]"}`}
                    style={{ width: percent(row.progress) }}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-y-0 w-px bg-gray-500 dark:bg-white/70"
                    style={{ left: percent(row.expected) }}
                  />
                </div>
                <span className="w-24 shrink-0 truncate text-right text-xs tabular-nums text-gray-500 dark:text-white/50">
                  {formatBroj(row.ytd)} / {formatBroj(row.annualTarget)}
                </span>
              </div>
            </div>
          );
        }}
      />
    </Panel>
  );
};
