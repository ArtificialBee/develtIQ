import { useId, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useCardEntered } from "~/components/Card";
import { useElementSize } from "~/hooks/useElementSize";
import { EASE_OUT } from "~/lib/motion";
import { formatBroj } from "~/lib/ui";

/** The app's chart colors: the measured series in the accent blue, a target in gray. */
export const CHART_COLORS = { actual: "#3B9DF8", target: "#94a3b8" };

/** Colors for parts of a whole, such as donut slices: the accent first, then its neighbours. */
export const CHART_PALETTE = ["#3B9DF8", "#22c4d8", "#6366f1", "#a78bfa", "#14b8a6", "#94a3b8"];

export interface ChartSeries {
  key: string;
  label: string;
  /** One value per label. */
  values: number[];
  /** A line with points, bars, or a dashed reference line such as a target. */
  kind: "line" | "bar" | "target";
  color: string;
}

export interface ChartProps {
  /** The x-axis, such as month names. */
  labels: string[];
  series: ChartSeries[];
  /** Accessible summary of what the chart shows. */
  label: string;
  /** How values read on the y-axis and over the points, such as "+6%". Plain numbers by default. */
  formatValue?: (value: number) => string;
  className?: string;
}

// Room for the axis labels, in px.
const PAD = { top: 20, right: 16, bottom: 28, left: 44 };
// Below this many px per point, the values over the points and bars are left out.
const MIN_GAP_FOR_VALUES = 30;
const MAX_BAR_WIDTH = 48;
// The entrance: a line draws itself in this many seconds; bars rise one after another.
const DRAW = 0.9;
const BAR_RISE = 0.6;
const BAR_STEP = 0.06;

/** A round step that gives about four grid lines over `range`. */
const niceStep = (range: number) => {
  const raw = range / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power;
};

/**
 * The one chart of the app, filling its box: round grid lines with their values on
 * the y-axis, the labels under the x-axis, and the value over every point or bar
 * when there is room. Lines get a soft fill under them; targets are dashed. With
 * bars the y-axis includes zero, so bar heights compare honestly; with lines only
 * it spans the data with round margins, so changes of a few percent stay visible.
 * Once its card has risen in, lines draw from left to right and bars rise from
 * zero; new data moves to its place. With reduced motion the chart shows at once.
 */
export const Chart = ({ labels, series, label, formatValue = formatBroj, className = "" }: ChartProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(boxRef);
  const gradientId = useId();
  // `initial={false}` starts every part at its final place, with no entrance.
  const still = useReducedMotion() ?? false;
  // Every part waits at its start while the card around it still rises in.
  const go = useCardEntered() || still;
  const hasBars = series.some((line) => line.kind === "bar");

  const all = series.flatMap((line) => line.values);
  // Bars grow from zero, up or down, so zero is always on the axis with them.
  const step = niceStep(Math.max(1, Math.max(...all, hasBars ? 0 : -Infinity) - Math.min(...all, hasBars ? 0 : Infinity)));
  const low = hasBars
    ? Math.min(0, Math.floor(Math.min(...all) / step) * step)
    : Math.floor((Math.min(...all) - step / 2) / step) * step;
  const high = Math.ceil((Math.max(...all) + step / 4) / step) * step;
  const ticks: number[] = [];
  for (let tick = low; tick <= high + step / 1000; tick += step) ticks.push(tick);

  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = Math.max(0, height - PAD.top - PAD.bottom);
  // Bars sit in the middle of equal bands; lines run from edge to edge.
  const band = plotWidth / Math.max(1, labels.length);
  const x = hasBars
    ? (index: number) => PAD.left + band * (index + 0.5)
    : (index: number) => PAD.left + (labels.length <= 1 ? plotWidth / 2 : (index * plotWidth) / (labels.length - 1));
  const y = (value: number) => PAD.top + plotHeight - ((value - low) / (high - low)) * plotHeight;
  const gap = hasBars ? band : plotWidth / Math.max(1, labels.length - 1);
  const showValues = gap >= MIN_GAP_FOR_VALUES;
  const barWidth = Math.min(MAX_BAR_WIDTH, band * 0.55);

  return (
    <div ref={boxRef} className={`relative min-h-0 ${className}`}>
      {width > 0 && height > 0 && (
        <svg width={width} height={height} role="img" aria-label={label} className="block">
          <defs>
            {series.map((line) => (
              <linearGradient key={line.key} id={`${gradientId}-${line.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-gray-200" />
              <text x={PAD.left - 10} y={y(tick)} textAnchor="end" dominantBaseline="middle" className="fill-gray-400 text-[11px] tabular-nums">
                {formatValue(tick)}
              </text>
            </g>
          ))}
          {labels.map((name, index) => (
            <text key={name} x={x(index)} y={height - 8} textAnchor="middle" className="fill-gray-500 text-[11px]">
              {name}
            </text>
          ))}

          {series.map((line) => {
            if (line.kind === "bar") {
              return (
                <g key={line.key}>
                  {line.values.map((value, index) => {
                    const delay = index * BAR_STEP;
                    return (
                      <g key={labels[index]}>
                        {/* Each bar rises from the zero line, a moment after the one before it. */}
                        <motion.rect
                          x={x(index) - barWidth / 2}
                          width={barWidth}
                          rx={6}
                          fill={`url(#${gradientId}-${line.key}-bar)`}
                          stroke={line.color}
                          strokeWidth={1.5}
                          initial={still ? false : { y: y(0), height: 0 }}
                          animate={go ? { y: Math.min(y(value), y(0)), height: Math.abs(y(0) - y(value)) } : { y: y(0), height: 0 }}
                          transition={{ duration: BAR_RISE, ease: EASE_OUT, delay }}
                        >
                          <title>{`${labels[index]}: ${formatValue(value)}`}</title>
                        </motion.rect>
                        {showValues && (
                          <motion.text
                            x={x(index)}
                            y={value >= 0 ? y(value) - 8 : y(value) + 14}
                            textAnchor="middle"
                            className="fill-gray-700 text-[11px] font-medium tabular-nums"
                            initial={still ? false : { opacity: 0 }}
                            animate={{ opacity: go ? 1 : 0 }}
                            transition={{ duration: 0.3, delay: delay + BAR_RISE * 0.6 }}
                          >
                            {formatValue(value)}
                          </motion.text>
                        )}
                      </g>
                    );
                  })}
                  <defs>
                    <linearGradient id={`${gradientId}-${line.key}-bar`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={line.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={line.color} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                </g>
              );
            }
            const path = line.values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(value)}`).join(" ");
            if (line.kind === "target") {
              // The dashes would fight a drawn line, so the target fades in once the data is drawn.
              return (
                <motion.path
                  key={line.key}
                  d={path}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={1.5}
                  strokeDasharray="6 5"
                  initial={still ? false : { opacity: 0 }}
                  animate={{ opacity: go ? 1 : 0 }}
                  transition={{ duration: 0.4, delay: DRAW * 0.7 }}
                />
              );
            }
            const area = `${path} L${x(line.values.length - 1)},${y(low)} L${x(0)},${y(low)} Z`;
            // A point shows when the drawing line reaches it.
            const reach = (index: number) => (line.values.length <= 1 ? 0 : (index / (line.values.length - 1)) * DRAW);
            return (
              <g key={line.key}>
                <motion.path
                  d={area}
                  fill={`url(#${gradientId}-${line.key})`}
                  initial={still ? false : { opacity: 0 }}
                  animate={{ opacity: go ? 1 : 0 }}
                  transition={{ duration: 0.6, delay: DRAW * 0.4 }}
                />
                <motion.path
                  d={path}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  initial={still ? false : { pathLength: 0 }}
                  animate={{ pathLength: go ? 1 : 0 }}
                  transition={{ duration: DRAW, ease: "easeInOut" }}
                />
                {line.values.map((value, index) => (
                  <g key={labels[index]}>
                    <motion.circle
                      cx={x(index)}
                      cy={y(value)}
                      fill="white"
                      stroke={line.color}
                      strokeWidth={2}
                      initial={still ? false : { r: 0 }}
                      animate={{ r: go ? 4 : 0 }}
                      transition={{ duration: 0.25, delay: reach(index) }}
                    >
                      <title>{`${labels[index]}: ${formatValue(value)}`}</title>
                    </motion.circle>
                    {showValues && (
                      <motion.text
                        x={x(index)}
                        y={y(value) - 10}
                        textAnchor="middle"
                        className="fill-gray-700 text-[11px] font-medium tabular-nums"
                        initial={still ? false : { opacity: 0 }}
                        animate={{ opacity: go ? 1 : 0 }}
                        transition={{ duration: 0.3, delay: reach(index) + 0.1 }}
                      >
                        {formatValue(value)}
                      </motion.text>
                    )}
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};
