import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";
import { AreaSparkline } from "~/components/AreaSparkline";
import { Card } from "~/components/Card";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { useCountUp } from "~/hooks/useCountUp";
import { stagger } from "~/lib/motion";
import {
  CARD_DESCRIPTION,
  CARD_TITLE,
  WRAP_ANYWHERE,
  bigNumberSize,
  formatBroj,
} from "~/lib/ui";

/** Chips shown before the rest fold into a "+N" chip. */
const MAX_CHIPS = 4;

export type StatTone = "accent" | "success" | "warning" | "danger";

export interface Stat {
  key: string;
  label: string;
  value: number;
  /** Text right after the number, such as "/20". */
  suffix?: string;
  icon?: IconType;
  /** Color of the number. Defaults to the blue accent. */
  tone?: StatTone;
  /** An arrow next to the number. */
  direction?: "up" | "down";
  /** A short series, oldest first, drawn as a glowing trend line. */
  trend?: number[];
  /** What the number is made of, such as "Protokol 6", shown as small chips. */
  breakdown?: { label: string; value: number }[];
  /** The one record behind the number that matters most, so the card says what to do. */
  highlight?: { label: string; title: string; meta?: string };
  fact?: { label: string; value: string };
  badge?: { label: string; tone: StatusTone };
}

// Full class names keep Tailwind able to find them.
const tones: Record<StatTone, string> = {
  accent: "text-[#3B9DF8]",
  success: "text-emerald-500 dark:text-emerald-300",
  warning: "text-amber-500 dark:text-amber-300",
  danger: "text-red-500 dark:text-red-400",
};

const highlightAccents: Record<StatTone, string> = {
  accent: "border-l-[#3B9DF8]",
  success: "border-l-emerald-400",
  warning: "border-l-amber-400",
  danger: "border-l-red-400",
};

/**
 * How each part of the card behaves. A card that grows with its content shows
 * everything. A card in a box of fixed height (`fill`) measures its own height
 * and drops parts in this order as the box gets shorter: chips, the record's
 * second line, the record's detail line, the fact, the record. The label and the
 * number always stay. The record outlasts the fact because it says what to do.
 */
const layouts = {
  grow: {
    root: "flex h-full flex-col",
    label: WRAP_ANYWHERE,
    inlineNumber: "hidden",
    bigNumber: "mt-4 flex",
    number: ["text-5xl", "text-4xl", "text-3xl"],
    chips: "mt-3 flex flex-wrap",
    trend: "mt-4 block",
    highlight: "mt-4 block",
    highlightLabel: "block",
    title: "line-clamp-2",
    meta: "line-clamp-2",
    fact: "mt-4 flex",
  },
  // Limits come from measured heights (header 32px, number 44–60px, record 40–77px,
  // fact 37px, chips 28px). Each class sets one value under one condition, so no two
  // container rules ever compete for the same property.
  fill: {
    root: "flex h-full flex-col overflow-hidden [container-type:size]",
    label: "truncate",
    // Under 8rem the number moves up beside the label, which saves a whole line.
    inlineNumber: "hidden text-2xl [@container(max-height:7.99rem)]:inline",
    bigNumber: "mt-1 hidden [@container(min-height:8rem)]:flex [@container(min-height:12rem)]:mt-3",
    number: [
      "text-4xl [@container(min-height:12rem)]:text-5xl",
      "text-3xl [@container(min-height:12rem)]:text-4xl",
      "text-2xl [@container(min-height:12rem)]:text-3xl",
    ],
    chips: "mt-2 hidden flex-nowrap overflow-hidden [@container(min-height:16rem)]:flex",
    // The trend line (80px) is the first thing to go: the record says more.
    trend: "hidden [@container(min-height:18rem)]:mt-3 [@container(min-height:18rem)]:block",
    highlight: "mt-2 hidden [@container(min-height:4.5rem)]:block",
    highlightLabel: "hidden [@container(min-height:8rem)]:block",
    title: "line-clamp-1 [@container(min-height:14.25rem)]:line-clamp-2",
    meta: "hidden truncate [@container(min-height:6rem)_and_(max-height:7.99rem)]:block [@container(min-height:9.75rem)]:block",
    fact: "mt-2 hidden [@container(min-height:13rem)]:flex",
  },
} as const;

export interface StatCardProps {
  stat: Stat;
  level?: 2 | 3;
  /** Fit a box of fixed height, dropping details that do not fit. */
  fill?: boolean;
}

/** One headline number: it counts up, with optional chips, the most important record and one fact under it. */
export const StatCard = ({ stat, level = 2, fill = false }: StatCardProps) => {
  const count = useCountUp(stat.value);
  const Icon = stat.icon;
  const Arrow = stat.direction === "up" ? LuArrowUp : LuArrowDown;
  const Heading = `h${level}` as const;
  const tone = stat.tone ?? "accent";
  const finalText = `${formatBroj(stat.value)}${stat.suffix ?? ""}`;
  const chips = stat.breakdown ?? [];
  const hiddenChips = chips.length - MAX_CHIPS;
  const l = fill ? layouts.fill : layouts.grow;

  return (
    <Card className={fill ? "min-h-0 p-4" : "p-5"}>
      <div className={l.root}>
        <div className={`flex items-center justify-between gap-2 ${fill ? "" : "flex-wrap"}`}>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {Icon && (
              <Icon aria-hidden className="size-[18px] shrink-0 text-[#3B9DF8]" />
            )}
            <Heading title={stat.label} className={`min-w-0 text-sm text-gray-600 dark:text-[#abc2d3] ${l.label}`}>
              {stat.label}
            </Heading>
          </div>
          {stat.badge && (
            <StatusBadge tone={stat.badge.tone} className={fill ? "max-w-[50%] shrink-0" : ""}>
              {stat.badge.label}
            </StatusBadge>
          )}
          <span
            aria-hidden
            className={`shrink-0 whitespace-nowrap font-bold leading-none tabular-nums ${tones[tone]} ${l.inlineNumber}`}
          >
            <motion.span>{count}</motion.span>
            {stat.suffix}
          </span>
          <span className="sr-only">{finalText}</span>
        </div>

        <p
          aria-hidden
          className={`shrink-0 items-center gap-2 font-bold tabular-nums [text-shadow:0_0_28px_color-mix(in_srgb,currentColor_35%,transparent)] ${l.bigNumber} ${bigNumberSize(finalText, [5, 8], l.number)} ${tones[tone]}`}
        >
          <span className="whitespace-nowrap">
            <motion.span>{count}</motion.span>
            {stat.suffix}
          </span>
          {stat.direction && <Arrow className="shrink-0 text-[0.6em]" />}
        </p>

        {chips.length > 0 && (
          <ul className={`gap-1.5 ${l.chips}`}>
            {chips.slice(0, MAX_CHIPS).map(({ label, value }) => (
              <li
                key={label}
                title={`${label}: ${formatBroj(value)}`}
                className="flex min-w-0 max-w-full items-baseline gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-slate-800 dark:text-[#abc2d3]"
              >
                <span className="truncate">{label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-white">{formatBroj(value)}</span>
              </li>
            ))}
            {hiddenChips > 0 && (
              <li
                title={chips.slice(MAX_CHIPS).map((c) => `${c.label}: ${formatBroj(c.value)}`).join("\n")}
                className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-[#abc2d3]"
              >
                +{hiddenChips}
              </li>
            )}
          </ul>
        )}

        {stat.trend && <AreaSparkline values={stat.trend} className={`shrink-0 ${l.trend}`} />}

        {stat.highlight && (
          <div className={`flex shrink-0 items-start gap-2.5 rounded-lg border-l-2 bg-gray-50 px-3 py-2 dark:bg-slate-800/60 ${highlightAccents[tone]} ${l.highlight}`}>
            <span
              aria-label={`Status: ${stat.badge?.label ?? tone}`}
              className={`mt-1 size-2.5 shrink-0 rounded-full bg-current ${tones[tone]}`}
            />
            <div className="min-w-0 flex-1">
              <p
                title={stat.highlight.title}
                className={`text-sm font-semibold text-gray-900 dark:text-white ${WRAP_ANYWHERE} ${l.title}`}
              >
                {stat.highlight.title}
              </p>
              {stat.highlight.meta && (
                <p
                  title={stat.highlight.meta}
                  className={`mt-0.5 text-xs text-gray-500 dark:text-white/60 ${WRAP_ANYWHERE} ${l.meta}`}
                >
                  {stat.highlight.meta}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pushes the fact to the bottom, so facts line up across a row of cards. */}
        <div className="flex-1" />

        {stat.fact && (
          <div
            className={`shrink-0 items-center justify-between gap-3 border-t border-[#e5eaf2] pt-2 text-sm dark:border-slate-700/70 ${l.fact}`}
          >
            <span title={stat.fact.label} className="min-w-[30%] truncate text-gray-500 dark:text-white/60">
              {stat.fact.label}
            </span>
            <span title={stat.fact.value} className="min-w-0 truncate text-right font-mono tabular-nums dark:text-white">
              {stat.fact.value}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export interface StatGridProps {
  stats: Stat[];
  /** Accessible name of the row. Shown as its heading when `title` is left out. */
  label: string;
  /** A visible heading over the row. */
  title?: string;
  description?: string;
  /** Fill a box of fixed height: 2 × 2 cards on narrow screens, 4 in a row from `lg`. */
  fill?: boolean;
  className?: string;
}

/** A row of stat cards that rise in one after another. */
export const StatGrid = ({ stats, label, title, description, fill = false, className = "" }: StatGridProps) => (
  <motion.section
    aria-label={label}
    variants={stagger(0.08)}
    className={`flex flex-col ${fill ? "min-h-0 gap-2" : "gap-3"} ${className}`}
  >
    {title && (
      // On short screens the cards need these 30px more than the heading.
      // Below lg the tabs already name the section; on short screens the cards need the room.
      <div className={`min-w-0 shrink-0 items-baseline gap-x-3 ${fill ? "hidden lg:flex [@media(max-height:960px)]:lg:hidden" : "flex"}`}>
        <h2 title={title} className={`${CARD_TITLE} ${fill ? "truncate" : WRAP_ANYWHERE}`}>
          {title}
        </h2>
        {description && (
          <p title={description} className={`${CARD_DESCRIPTION} ${fill ? "hidden min-w-0 truncate xl:block" : ""}`}>
            {description}
          </p>
        )}
      </div>
    )}
    <div
      className={
        fill
          ? "grid min-h-0 flex-1 grid-cols-1 grid-rows-4 gap-3 sm:grid-cols-2 sm:grid-rows-2 lg:grid-cols-4 lg:grid-rows-1 lg:gap-4"
          : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      }
    >
      {stats.map((stat) => (
        <StatCard key={stat.key} stat={stat} level={title ? 3 : 2} fill={fill} />
      ))}
    </div>
  </motion.section>
);
