import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "~/lib/motion";
import { sparklineArea, sparklinePath, sparklinePoints } from "~/lib/sparkline";

export interface AreaSparklineProps {
  values: number[];
  /** Seconds to wait before the line starts to draw. */
  delay?: number;
  className?: string;
}

// The drawing box. The SVG stretches it to the width of its container.
const WIDTH = 240;
const HEIGHT = 64;
const PAD = 4;
const DRAW_SECONDS = 1.4;

/** A glowing area chart that draws itself from left to right, with a live dot on the latest value. */
export const AreaSparkline = ({ values, delay = 0.3, className = "" }: AreaSparklineProps) => {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const reduceMotion = useReducedMotion();
  const points = sparklinePoints(values, WIDTH, HEIGHT, PAD);
  const [endX, endY] = points[points.length - 1];

  return (
    <div aria-hidden className={`relative h-16 ${className}`}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="size-full overflow-visible">
        <defs>
          <linearGradient id={`${id}-line`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#3B9DF8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3B9DF8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3B9DF8" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${id}-reveal`}>
            <motion.rect
              x="0"
              y="-8"
              height={HEIGHT + 16}
              initial={{ width: reduceMotion ? WIDTH : 0 }}
              animate={{ width: WIDTH }}
              transition={{ duration: DRAW_SECONDS, delay, ease: EASE_OUT }}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-reveal)`}>
          <path d={sparklineArea(values, WIDTH, HEIGHT, PAD)} fill={`url(#${id}-fill)`} />
          <path
            d={sparklinePath(values, WIDTH, HEIGHT, PAD)}
            fill="none"
            stroke={`url(#${id}-line)`}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
      <motion.span
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduceMotion ? 0 : delay + DRAW_SECONDS * 0.8, duration: 0.3 }}
        style={{ left: `${(endX / WIDTH) * 100}%`, top: `${(endY / HEIGHT) * 100}%` }}
        className="absolute -ml-1 -mt-1 flex size-2"
      >
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-400 opacity-75 motion-reduce:hidden" />
        <span className="relative inline-flex size-2 rounded-full bg-indigo-500 shadow-[0_0_10px_2px_rgba(99,102,241,0.6)]" />
      </motion.span>
    </div>
  );
};
