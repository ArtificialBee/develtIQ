import type { ReactNode } from "react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusBadgeProps {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}

// Full class names keep Tailwind able to find them.
const tones: Record<StatusTone, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-400",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  neutral: "bg-[#d1d1d180] text-[#424242] dark:bg-slate-700 dark:text-white/80",
};

/** A rounded chip colored by status: green on plan, amber to watch, red late. */
export const StatusBadge = ({ tone, children, className = "" }: StatusBadgeProps) => (
  <span
    className={`inline-flex max-w-full items-center gap-1.5 px-3 py-0.5 rounded-full text-[0.8rem] font-medium whitespace-nowrap ${tones[tone]} ${className}`}
  >
    <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
    <span className="truncate">{children}</span>
  </span>
);
