import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useCardEntered } from "~/components/Card";
import { useElementSize } from "~/hooks/useElementSize";
import { EASE_OUT } from "~/lib/motion";
import { formatBroj } from "~/lib/ui";

export interface DonutSlice {
  key: string;
  label: string;
  /** A second line in the legend, such as what is counted. */
  sublabel?: string;
  value: number;
  color: string;
  /** A short note at the right of the legend row, such as progress against a plan. */
  note?: { text: string; tone?: "good" | "warn" };
}

export interface DonutChartProps {
  slices: DonutSlice[];
  /** Under the total in the middle, such as "obrađeno ove godine". */
  centerLabel: string;
  /** Accessible summary of what the chart shows. */
  label: string;
  /** The slice picked, marked in the ring and the legend. */
  selectedKey?: string;
  /** Makes the slices and legend rows pickable. */
  onSelect?: (key: string) => void;
  className?: string;
}

// The ring's thickness and the gap between slices, as parts of the radius and of a turn.
const RING = 0.28;
const GAP = 0.006;
// The entrance: the ring sweeps round in this many seconds, slice after slice.
const SWEEP = 0.9;

/**
 * Parts of a whole as a ring, filling its box: the total in the middle and, beside
 * the ring, every part with its color, value, share and an optional note. With
 * `onSelect`, a part is picked by its slice or its legend row, and the others fade.
 * In the same type, grays and blues as the line and bar charts. Once its card has
 * risen in, the slices sweep round from twelve o'clock; with reduced motion they show at once.
 */
export const DonutChart = ({ slices, centerLabel, label, selectedKey, onSelect, className = "" }: DonutChartProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(boxRef);
  const still = useReducedMotion() ?? false;
  // The ring waits empty while the card around it still rises in.
  const go = useCardEntered() || still;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  // The ring takes the height, up to half the width, so the legend keeps its room.
  const size = Math.max(0, Math.min(height, width * 0.45, 360));
  const radius = (size / 2) * (1 - RING / 2);
  const stroke = (size / 2) * RING;
  const circumference = 2 * Math.PI * radius;

  let start = 0;
  const arcs = slices.map((slice) => {
    const share = total === 0 ? 0 : slice.value / total;
    const arc = { ...slice, share, offset: start };
    start += share;
    return arc;
  });

  return (
    <div ref={boxRef} className={`flex min-h-0 items-center gap-8 ${className}`}>
      {size > 0 && (
        <svg width={size} height={size} role="img" aria-label={label} className="shrink-0">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-gray-100" strokeWidth={stroke} />
          {arcs.map((arc) => (
            <motion.circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              // Each slice grows from its start when the sweep reaches it.
              initial={still ? false : { strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${go ? Math.max(0, arc.share - GAP) * circumference : 0} ${circumference}` }}
              transition={{ duration: Math.max(0.15, arc.share * SWEEP), ease: arc.offset + arc.share >= 0.999 ? EASE_OUT : "linear", delay: arc.offset * SWEEP }}
              strokeDashoffset={-arc.offset * circumference}
              // The first slice starts at twelve o'clock.
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              opacity={selectedKey && selectedKey !== arc.key ? 0.4 : 1}
              onClick={onSelect ? () => onSelect(arc.key) : undefined}
              className={`transition-opacity ${onSelect ? "cursor-pointer" : ""}`}
            >
              <title>{`${arc.label}: ${formatBroj(arc.value)} (${Math.round(arc.share * 100)}%)`}</title>
            </motion.circle>
          ))}
          <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-900 text-2xl font-semibold tabular-nums">
            {formatBroj(total)}
          </text>
          <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 text-xs">
            {centerLabel}
          </text>
        </svg>
      )}
      <ul className="min-w-0 max-w-2xl flex-1 space-y-1">
        {arcs.map((arc) => {
          const row = (
            <>
              <span aria-hidden className="size-3 shrink-0 rounded-[3px]" style={{ background: arc.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-900">{arc.label}</span>
                {arc.sublabel && <span className="block truncate text-xs text-gray-500">{arc.sublabel}</span>}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold tabular-nums text-gray-900">{formatBroj(arc.value)}</span>
                <span className="block text-xs tabular-nums text-gray-500">{Math.round(arc.share * 100)}% ukupnog</span>
              </span>
              {arc.note && (
                <span
                  className={`w-20 shrink-0 text-right text-xs tabular-nums ${arc.note.tone === "good" ? "text-emerald-600" : arc.note.tone === "warn" ? "text-amber-600" : "text-gray-500"}`}
                >
                  {arc.note.text}
                </span>
              )}
            </>
          );
          const rowClass = `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${arc.key === selectedKey ? "bg-[#3B9DF8]/10" : ""}`;
          return (
            <li key={arc.key}>
              {onSelect ? (
                <button
                  type="button"
                  aria-pressed={arc.key === selectedKey}
                  onClick={() => onSelect(arc.key)}
                  className={`${rowClass} hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]`}
                >
                  {row}
                </button>
              ) : (
                <div className={rowClass}>{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
