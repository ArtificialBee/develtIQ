import type { IconType } from "react-icons";
import { motion, useReducedMotion } from "framer-motion";
import { LuInfo } from "react-icons/lu";
import { Card, useCardEntered } from "~/components/Card";
import { StatusBadge } from "~/components/StatusBadge";
import metaData from "~/data/skladiste/meta.json";
import type { CinjenicaPlocice, ExportMeta, GrafPlocice } from "~/lib/skladiste/types";
import { EASE_OUT, stagger } from "~/lib/motion";
import { sparklinePath } from "~/lib/sparkline";
import { bigNumberSize } from "~/lib/ui";

/**
 * The parts the warehouse's reports and settings screens share, from cicak's list
 * pages: the line over the tiles (cicak's `Napomena`, with the page's summary) and
 * the three tiles (cicak's compact `KpiMetricCard`: a title, one value, a line, a
 * small chart and three facts). All on the app's one card.
 */

const META = metaData as unknown as ExportMeta;

/** The moment the data was exported at, as cicak's `Date.now()` on the screens. */
export const SADA = Date.parse(META.zamrznutoUtc);

/** "Today" of the data, `yyyy-mm-dd`, as cicak's `isoDatum(new Date())`. */
export const DANAS = META.danas;

/** One tile: already formatted texts, as cicak's report tile (`PlocicaIzvjestaja`). */
export interface Plocica {
  naslov: string;
  vrijednost: string;
  opis: string;
  graf?: GrafPlocice;
  cinjenice?: readonly CinjenicaPlocice[];
  icon?: IconType;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// As in cicak: up to 12 bars carry their value, while each value is short enough.
const BAR_LABELS_MAX = 12;
const BAR_LABEL_CHARS = 4;
// The bars' height in px, under their value line.
const BAR_HEIGHT = 32;

const barLabel = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/** Bars, the highlighted one in full color; an empty slot is a gap, a real 0 a floor tick. */
const Stupci = ({ vrijednosti, istaknut }: { vrijednosti: readonly (number | null)[]; istaknut?: number }) => {
  const still = useReducedMotion() ?? false;
  // The chart waits at its start while its card still rises in.
  const go = useCardEntered() || still;
  const max = Math.max(...vrijednosti.filter((v): v is number => v !== null), 1);
  const labelled = vrijednosti.length <= BAR_LABELS_MAX && vrijednosti.every((v) => v === null || barLabel(v).length <= BAR_LABEL_CHARS);
  const sparse = vrijednosti.length <= 3;
  return (
    <div aria-hidden className={`flex h-12 items-end border-b border-[#e5eaf2] dark:border-slate-700 ${sparse ? "justify-center gap-3" : "gap-1"}`}>
      {vrijednosti.map((v, index) => (
        <div key={index} className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 ${sparse ? "max-w-16" : ""}`}>
          {labelled && (
            <span
              className={`font-mono text-[11px] leading-none tabular-nums ${
                v === null ? "invisible" : index === istaknut ? "font-semibold text-gray-900 dark:text-white" : "text-gray-500 dark:text-white/60"
              }`}
            >
              {v === null ? "0" : barLabel(v)}
            </span>
          )}
          {/* The bars rise one after another, as the app's charts do. */}
          <motion.span
            className={`block w-full rounded-t-sm ${index === istaknut ? "bg-[#3B9DF8]" : "bg-[#3B9DF8]/40"}`}
            initial={still ? false : { height: 0 }}
            animate={{ height: go && v !== null ? Math.max(2, (v / max) * BAR_HEIGHT) : 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: index * 0.05 }}
          />
        </div>
      ))}
    </div>
  );
};

/** A scale filled up to the share, with the share over its end (cicak's gradient bar). */
const Skala = ({ postotak }: { postotak: number }) => {
  const still = useReducedMotion() ?? false;
  // The chart waits at its start while its card still rises in.
  const go = useCardEntered() || still;
  return (
    <div className="relative flex h-12 flex-col justify-end pb-2">
      <span
        className="absolute top-3 -translate-x-1/2 font-mono text-[11px] font-semibold tabular-nums text-gray-900 dark:text-white"
        style={{ left: `${clamp(Math.round(postotak), 6, 94)}%` }}
      >
        {clamp(Math.round(postotak), 0, 100)}%
      </span>
      <div aria-hidden className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-800">
        <motion.div
          className="h-full rounded-full bg-[#3B9DF8]"
          initial={still ? false : { width: 0 }}
          animate={{ width: go ? `${clamp(postotak, 0, 100)}%` : 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        />
      </div>
    </div>
  );
};

/** A line over the weeks and, when there is a base, last week against the one before. */
const Linija = ({ vrijednosti, trend }: { vrijednosti: readonly number[]; trend?: number }) => {
  const still = useReducedMotion() ?? false;
  // The chart waits at its start while its card still rises in.
  const go = useCardEntered() || still;
  return (
    <div className="flex h-12 items-center gap-2">
      {/* The line shows from left to right; a stretched line keeps its stroke, so it is uncovered, not drawn. */}
      <motion.svg
        aria-hidden
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="h-10 min-w-0 flex-1 text-[#3B9DF8]"
        initial={still ? false : { clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: go ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      >
        <path
          d={sparklinePath([...vrijednosti], 100, 40, 3)}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </motion.svg>
      {trend !== undefined && (
        <StatusBadge tone={trend >= 0 ? "success" : "danger"} className="shrink-0 tabular-nums">
          {`${trend >= 0 ? "↑" : "↓"} ${Math.abs(trend)}%`}
        </StatusBadge>
      )}
    </div>
  );
};

const Graf = ({ graf }: { graf: GrafPlocice }) => {
  if (graf.vrsta === "stupci") return <Stupci vrijednosti={graf.vrijednosti} istaknut={graf.istaknut} />;
  if (graf.vrsta === "skala") return <Skala postotak={graf.postotak} />;
  return <Linija vrijednosti={graf.vrijednosti} trend={graf.trend} />;
};

/**
 * One tile: its title and value on one line, as the app's minimal stat card, the
 * line under them, then the chart and the three facts. On short screens the chart
 * goes first; on narrow ones the facts go too.
 */
const PlocicaKartica = ({ plocica }: { plocica: Plocica }) => {
  const { naslov, vrijednost, opis, graf, cinjenice = [], icon: Icon } = plocica;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon aria-hidden className="size-[18px] shrink-0 text-[#3B9DF8]" />}
        <h2 title={naslov} className="min-w-0 flex-1 truncate text-sm text-gray-600 dark:text-[#abc2d3]">
          {naslov}
        </h2>
        <span
          className={`shrink-0 whitespace-nowrap font-bold leading-none tabular-nums text-[#3B9DF8] ${bigNumberSize(vrijednost, [5, 9], ["text-3xl", "text-2xl", "text-xl"])}`}
        >
          {vrijednost}
        </span>
      </div>
      <p title={opis} className="mt-1.5 truncate text-xs text-gray-500 dark:text-white/60">
        {opis}
      </p>
      {graf && (
        <div className="mt-2 hidden md:block [@media(max-height:820px)]:hidden">
          <Graf graf={graf} />
        </div>
      )}
      {cinjenice.length > 0 && (
        <dl className="mt-3 hidden grid-cols-3 gap-3 border-t border-[#e5eaf2] pt-2 dark:border-slate-700/70 md:grid">
          {cinjenice.map((cinjenica, index) => (
            <div key={`${cinjenica.label}-${index}`} className="min-w-0">
              <dt title={cinjenica.label} className="truncate text-xs text-gray-500 dark:text-white/60">
                {cinjenica.label}
              </dt>
              <dd title={cinjenica.value} className="truncate font-mono text-sm tabular-nums text-gray-900 dark:text-white">
                {cinjenica.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
};

/** cicak's row of three tiles over a table; they rise in one after another. */
export const Plocice = ({ plocice, label }: { plocice: readonly Plocica[]; label: string }) => (
  <motion.section aria-label={label} variants={stagger(0.08)} className="grid shrink-0 grid-cols-1 gap-3 md:grid-cols-3 lg:gap-4">
    {plocice.map((plocica) => (
      <PlocicaKartica key={plocica.naslov} plocica={plocica} />
    ))}
  </motion.section>
);

export interface UvodProps {
  /** The page's summary line (cicak's header subtitle), in front of the note. */
  sazetak?: string;
  /** cicak's `Napomena` over the tiles. */
  napomena: string;
}

/** The line over the tiles: the summary and the note. Switches that pick what the screen shows go in the table's filter sheet. */
export const Uvod = ({ sazetak, napomena }: UvodProps) => (
  <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
    <p title={[sazetak, napomena].filter(Boolean).join(" · ")} className="flex min-w-0 flex-1 items-center gap-2 text-sm text-gray-500 dark:text-white/60">
      <LuInfo aria-hidden className="size-4 shrink-0 text-[#3B9DF8]" />
      <span className="min-w-0 truncate">
        {sazetak && <span className="font-medium text-gray-900 dark:text-white">{sazetak} · </span>}
        {napomena}
      </span>
    </p>
  </div>
);

