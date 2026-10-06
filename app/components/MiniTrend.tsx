import { sparklinePath } from "~/lib/sparkline";

export interface MiniTrendProps {
  values: number[];
  /** Green when the series moves toward plan, red when it moves away. */
  improving: boolean;
  width?: number;
  height?: number;
}

/** A tiny line chart for a table cell. It is decorative: the cells next to it carry the numbers. */
export const MiniTrend = ({
  values,
  improving,
  width = 64,
  height = 22,
}: MiniTrendProps) => (
  <svg
    viewBox={`0 0 ${width} ${height}`}
    width={width}
    height={height}
    aria-hidden="true"
    className={improving ? "text-emerald-500 dark:text-emerald-300" : "text-red-500 dark:text-red-400"}
  >
    <path
      d={sparklinePath(values, width, height)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinejoin="round"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);
