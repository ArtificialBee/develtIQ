import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { ICON_CHIP } from "~/lib/ui";

export type RowTone = "accent" | "danger" | "warning" | "success";

export interface ListRowProps {
  title: string;
  meta?: string;
  icon?: IconType;
  /** Text before the icon, such as a time, in a fixed-width column so rows line up. */
  leading?: string;
  /** Something at the end, such as a status badge. */
  trailing?: ReactNode;
  /** A colored bar on the left, for a row that needs attention. */
  tone?: RowTone;
  /** Dims the row, for something already behind you. */
  muted?: boolean;
}

// Full class names keep Tailwind able to find them.
const bars: Record<RowTone, string> = {
  accent: "bg-[#3B9DF8]",
  danger: "bg-red-400",
  warning: "bg-amber-400",
  success: "bg-emerald-400",
};
const metaTones: Record<RowTone, string> = {
  accent: "text-gray-500 dark:text-white/50",
  danger: "text-red-500 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-300",
  success: "text-gray-500 dark:text-white/50",
};

/**
 * The one list row of the app: an optional time, an icon chip, a title and a meta
 * line, each kept to one line, and an optional badge at the end. It fills the
 * height its list gives it.
 */
export const ListRow = ({ title, meta, icon: Icon, leading, trailing, tone, muted = false }: ListRowProps) => (
  <div
    className={`relative flex h-full items-center gap-3 rounded-xl px-2 transition-colors hover:bg-[#3B9DF8]/10 ${muted ? "opacity-55" : ""}`}
  >
    {tone && <span aria-hidden className={`absolute bottom-2 left-0 top-2 w-[3px] rounded-full ${bars[tone]}`} />}
    {leading !== undefined && (
      <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-gray-500 dark:text-white/60">{leading}</span>
    )}
    {Icon && (
      <span className={`size-7 ${ICON_CHIP}`}>
        <Icon aria-hidden className="text-sm" />
      </span>
    )}
    <div className="min-w-0 flex-1">
      <p title={title} className="truncate text-sm text-gray-800 dark:text-white/90">
        {title}
      </p>
      {meta && (
        <p title={meta} className={`truncate text-xs ${tone ? metaTones[tone] : metaTones.accent}`}>
          {meta}
        </p>
      )}
    </div>
    {trailing}
  </div>
);
