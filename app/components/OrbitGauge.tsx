import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useCountUp } from "~/hooks/useCountUp";
import { EASE_OUT } from "~/lib/motion";
import { bigNumberSize, formatBroj } from "~/lib/ui";

export interface OrbitGaugeProps {
  value: number;
  target: number;
  /** Width and height in px. */
  size?: number;
  /** Shows the number in the ring's hole. Turn it off for a small ring with the number beside it. */
  showValue?: boolean;
  className?: string;
}

const RADIUS = 70;
const ORBIT_RADIUS = 92;

/** A ring gauge for a value against its target, with a slow outer orbit and a satellite dot. */
export const OrbitGauge = ({ value, target, size = 200, showValue = true, className = "" }: OrbitGaugeProps) => {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const reduceMotion = useReducedMotion();
  const count = useCountUp(value);
  const share = Math.min(value / target, 1);
  const spin = (seconds: number) =>
    reduceMotion ? {} : { animate: { rotate: 360 }, transition: { duration: seconds, repeat: Infinity, ease: "linear" as const } };

  return (
    <div aria-hidden className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full -rotate-90">
        <defs>
          <linearGradient id={`${id}-arc`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#3B9DF8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={RADIUS} fill="none" strokeWidth="10" className="stroke-[#e5eaf2] dark:stroke-slate-800" />
        <motion.circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke={`url(#${id}-arc)`}
          strokeWidth="10"
          strokeLinecap="round"
          className="drop-shadow-[0_0_8px_rgba(59,157,248,0.55)]"
          initial={{ pathLength: reduceMotion ? share : 0 }}
          animate={{ pathLength: share }}
          transition={{ duration: 1.6, delay: 0.4, ease: EASE_OUT }}
        />
      </svg>

      <motion.svg viewBox="0 0 200 200" className="absolute inset-0 size-full" {...spin(60)}>
        <circle cx="100" cy="100" r={ORBIT_RADIUS} fill="none" strokeWidth="1" strokeDasharray="2 7" className="stroke-[#3B9DF8]/50" />
      </motion.svg>

      <motion.div className="absolute inset-0" {...spin(9)}>
        <span className="absolute left-1/2 top-[4%] size-2 -translate-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_4px_rgba(103,232,249,0.6)]" />
      </motion.div>

      {showValue && (
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* The ring's hole fits about 3 big digits; longer numbers step down in size. */}
        <motion.span
          className={`font-bold tabular-nums text-amber-500 dark:text-amber-300 ${bigNumberSize(formatBroj(value), [3, 5], ["text-5xl", "text-3xl", "text-2xl"])}`}
        >
          {count}
        </motion.span>
        <span className="text-xs text-gray-500 dark:text-white/60">od {formatBroj(target)}</span>
      </div>
      )}
    </div>
  );
};
