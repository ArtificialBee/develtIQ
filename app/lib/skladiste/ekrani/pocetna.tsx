import { useState } from "react";
import type { IconType } from "react-icons";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router";
import { LuArrowRight, LuArrowUpRight, LuClipboardCheck, LuHourglass, LuInfo, LuTriangleAlert, LuUserCheck } from "react-icons/lu";
import { Card, useCardEntered } from "~/components/Card";
import { CHART_COLORS } from "~/components/Chart";
import { StatusBadge } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import { Tabs } from "~/components/Tabs";
import pocetnaData from "~/data/skladiste/pocetna.json";
import { useCountUp } from "~/hooks/useCountUp";
import { EASE_OUT, stagger } from "~/lib/motion";
import { ekranUrl } from "~/lib/skladiste/ekrani";
import { putanja } from "~/lib/skladiste/podaci";
import type { PlocicaPocetne, PocetnaExport } from "~/lib/skladiste/types";

/**
 * Skladište › Početna, from cicak's `SkladistePocetnaPage`: the four cards of what
 * the warehouse owes (below the signal threshold, steps waiting on me, uncovered
 * needs, open counts), the steps waiting on me and the documents of the last seven
 * days, with the numbers, texts and notes cicak computes (`pocetna.json`), in the
 * app's cards and table. It fits the screen: the cards, then the two lanes in one
 * card that pages its rows.
 */

const POCETNA = pocetnaData as unknown as PocetnaExport;

/** cicak's page subtitle, "Danas 13.10.2026. · pogled administratora": the top bar's status line. */
export const POCETNA_PODNASLOV = POCETNA.podnaslov;

type Zadatak = PocetnaExport["zadaci"][number];
type NedavniDokument = PocetnaExport["nedavniDokumenti"][number];
type Traka = "zadaci" | "nedavni";

// Built once, so the tables keep their page between renders.
const ZADACI = [...POCETNA.zadaci];
const NEDAVNI = [...POCETNA.nedavniDokumenti];

// cicak's lucide icons, by the name the export keeps.
const IKONE: Record<string, IconType> = {
  TriangleAlert: LuTriangleAlert,
  UserCheck: LuUserCheck,
  Hourglass: LuHourglass,
  ClipboardCheck: LuClipboardCheck,
};

// The screen buttons in cicak's order, the first the main one; forms are not built, so each opens its list.
const RADNJE = [
  { label: "Prijemnica", to: ekranUrl("prijem", "prijemnice") },
  { label: "Izdatnica", to: ekranUrl("izdavanje", "izdatnice") },
  { label: "Trebovanje", to: ekranUrl("izdavanje", "trebovanja") },
];

// The same button styles as the app's table header buttons.
const DUGME = "inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]";
const GLAVNO_DUGME = `${DUGME} bg-[#3B9DF8] text-white hover:bg-blue-500`;
const DRUGO_DUGME = `${DUGME} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;

const BROJ_LINK = "font-mono font-medium text-gray-900 hover:text-[#3B9DF8]";

/** cicak's bar chart of a card: the value over each bar, the bar that matters in the accent, the rest muted. */
const Stupci = ({ values, highlightedIndex }: { values: readonly number[]; highlightedIndex: number }) => {
  const still = useReducedMotion() ?? false;
  // The chart waits at its start while its card still rises in.
  const go = useCardEntered() || still;
  const max = Math.max(...values, 1);
  return (
    <div aria-hidden className="flex h-full items-end justify-center gap-3 border-b border-[#e5eaf2] dark:border-slate-700/70">
      {values.map((value, index) => {
        const istaknut = index === highlightedIndex;
        const boja = istaknut ? CHART_COLORS.actual : CHART_COLORS.target;
        return (
          <div key={index} className="flex h-full min-w-0 max-w-16 flex-1 flex-col items-center gap-1">
            <span className={`font-mono text-[11px] leading-none tabular-nums ${istaknut ? "font-semibold text-gray-900 dark:text-white" : "text-gray-500"}`}>
              {value}
            </span>
            <div className="flex min-h-0 w-full flex-1 items-end">
              {/* A zero still shows as a floor tick, as in cicak: it is a value, not missing data. */}
              <motion.div
                className="w-full rounded-t-md border border-b-0"
                style={{ borderColor: boja, background: `${boja}40` }}
                initial={still ? false : { height: "0%" }}
                animate={{ height: go ? `${Math.max(5, (value / max) * 100)}%` : "0%" }}
                transition={{ duration: 0.6, ease: EASE_OUT, delay: index * 0.06 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** cicak's scale bar of a card: how far a share has got, with the percent over the point it reached. */
const Udio = ({ percent }: { percent: number }) => {
  const still = useReducedMotion() ?? false;
  // The chart waits at its start while its card still rises in.
  const go = useCardEntered() || still;
  const udio = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div aria-hidden className="relative flex h-full flex-col justify-center">
      <span
        className="absolute top-1 -translate-x-1/2 font-mono text-[11px] font-semibold tabular-nums text-gray-900 dark:text-white"
        style={{ left: `${Math.min(94, Math.max(6, udio))}%` }}
      >
        {udio}%
      </span>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-cyan-400 to-[#3B9DF8]"
          initial={still ? false : { width: "0%" }}
          animate={{ width: go ? `${udio}%` : "0%" }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        />
      </div>
    </div>
  );
};

/** One card: what it counts and its badge, the number and what it means, the small chart, and three fact lines. */
const Plocica = ({ plocica }: { plocica: PlocicaPocetne }) => {
  const count = useCountUp(plocica.vrijednost);
  const Ikona = IKONE[plocica.icon] ?? LuInfo;
  return (
    <Link
      to={putanja(plocica.path)}
      aria-label={`${plocica.naslov} — otvori`}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]"
    >
      <Card className="h-full p-4">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2.5">
            <Ikona aria-hidden className="size-[18px] shrink-0 text-[#3B9DF8]" />
            <h2 title={plocica.naslov} className="min-w-0 flex-1 truncate text-sm text-gray-600 dark:text-[#abc2d3]">
              {plocica.naslov}
            </h2>
            <StatusBadge tone={plocica.badge.tone} className="shrink-0">
              {plocica.badge.label}
            </StatusBadge>
            <LuArrowUpRight aria-hidden className="size-4 shrink-0 text-gray-400 transition-colors group-hover:text-[#3B9DF8]" />
          </div>
          <p className="mt-2 text-4xl font-bold leading-none tabular-nums text-[#3B9DF8]">
            <motion.span aria-hidden>{count}</motion.span>
            <span className="sr-only">{plocica.vrijednost}</span>
          </p>
          <p title={plocica.opis} className="mt-1.5 line-clamp-2 text-sm text-gray-500 dark:text-white/60">
            {plocica.opis}
          </p>
          {/* On short screens the lanes under the cards need this band more; the facts carry the same numbers. */}
          <div className="mt-3 h-14 shrink-0 [@media(max-height:860px)]:hidden">
            {plocica.chart.kind === "bars" ? (
              <Stupci values={plocica.chart.values} highlightedIndex={plocica.chart.highlightedIndex} />
            ) : (
              <Udio percent={plocica.chart.percent} />
            )}
          </div>
          <div className="flex-1" />
          <ul className="mt-2">
            {plocica.facts.map((fact) => (
              <li
                key={fact.label}
                className="flex items-baseline justify-between gap-3 border-t border-[#e5eaf2] py-1.5 text-sm last:pb-0 dark:border-slate-700/70"
              >
                <span title={fact.label} className="min-w-0 truncate text-gray-500 dark:text-white/60">
                  {fact.label}
                </span>
                <span className="shrink-0 font-mono tabular-nums text-gray-900 dark:text-white">{fact.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </Link>
  );
};

const zadaciKolone: TableColumn<Zadatak>[] = [
  { key: "radnja", header: "Zadatak", render: (z) => z.radnja, sortValue: (z) => z.radnja, className: "font-medium text-gray-900", visibility: "w-[19%]" },
  {
    key: "dokument",
    header: "Dokument",
    render: (z) => (
      <Link to={putanja(z.dokument.path)} className={BROJ_LINK}>
        {z.dokument.broj}
      </Link>
    ),
    sortValue: (z) => z.dokument.broj,
    visibility: "w-[16%]",
  },
  { key: "vrsta", header: "Vrsta", render: (z) => z.dokument.vrsta, sortValue: (z) => z.dokument.vrsta, className: "text-gray-600", visibility: "hidden w-[14%] md:table-cell" },
  {
    key: "skladiste",
    header: "Skladište",
    render: (z) => `${z.dokument.skladiste} · ${z.skladisteNaziv}`,
    sortValue: (z) => z.dokument.skladiste,
    className: "whitespace-nowrap text-gray-600",
    visibility: "hidden w-[18%] lg:table-cell",
  },
  { key: "kontekst", header: "Kontekst", render: (z) => z.dokument.kontekst, className: "text-gray-500", visibility: "hidden w-[16%] sm:table-cell" },
  {
    key: "cekaOd",
    header: "Čeka od",
    render: (z) => (
      <span className="whitespace-nowrap">
        <span className="font-medium text-gray-900">{z.trajanje}</span>
        <span className="text-gray-500"> · od {z.odDatum}</span>
      </span>
    ),
    sortValue: (z) => z.cekaOd,
    visibility: "w-[17%]",
  },
];

const nedavniKolone: TableColumn<NedavniDokument>[] = [
  {
    key: "broj",
    header: "Broj",
    render: (d) => (
      <Link to={putanja(d.path)} className={BROJ_LINK}>
        {d.broj}
      </Link>
    ),
    sortValue: (d) => d.broj,
    visibility: "w-[16%]",
  },
  { key: "vrsta", header: "Vrsta", render: (d) => d.vrsta, sortValue: (d) => d.vrsta, className: "text-gray-600", visibility: "hidden w-[14%] md:table-cell" },
  {
    key: "skladiste",
    header: "Skladište",
    render: (d) => `${d.skladiste} · ${d.skladisteNaziv}`,
    sortValue: (d) => d.skladiste,
    className: "whitespace-nowrap text-gray-600",
    visibility: "hidden w-[19%] lg:table-cell",
  },
  { key: "kontekst", header: "Kontekst", render: (d) => d.kontekst, className: "text-gray-500", visibility: "hidden w-[20%] sm:table-cell" },
  { key: "datum", header: "Datum", render: (d) => d.datumPrikaz, sortValue: (d) => d.datum, className: "whitespace-nowrap font-mono tabular-nums", visibility: "w-[12%]" },
  {
    key: "status",
    header: "Status",
    render: (d) => (
      <span title={d.status} className="block max-w-full truncate">
        <StatusBadge tone={d.tone}>{d.status}</StatusBadge>
      </span>
    ),
    sortValue: (d) => d.status,
    visibility: "w-[19%]",
  },
];

/** cicak's muted helper lines under a lane. */
const Napomene = ({ stavke }: { stavke: readonly string[] }) => (
  <ul className="mt-3 shrink-0 space-y-1 border-t border-[#e5eaf2] pt-3 text-xs text-gray-500 dark:border-slate-700/70 [@media(max-height:760px)]:hidden">
    {stavke.map((stavka) => (
      <li key={stavka} className="flex items-start gap-2">
        <LuInfo aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        {stavka}
      </li>
    ))}
  </ul>
);

/**
 * The warehouse's home under the route's top bar: the four cards, then one card
 * with the two lanes, the screen's buttons and the way to every document. From
 * `lg` it fits the screen and the lane's rows page; below it, the area scrolls.
 */
export const SkladistePocetnaView = () => {
  const [traka, setTraka] = useState<Traka>("zadaci");

  return (
    <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 pb-1 lg:gap-4 lg:overflow-hidden">
      <motion.section
        aria-label="Ključni pokazatelji"
        variants={stagger(0.08)}
        className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4"
      >
        {POCETNA.plocice.map((plocica) => (
          <Plocica key={plocica.key} plocica={plocica} />
        ))}
      </motion.section>

      {/* The two lanes share one card: the step queue first, the week's documents behind it. */}
      <Card as="section" className="flex h-[36rem] shrink-0 flex-col p-4 lg:h-auto lg:min-h-0 lg:flex-1">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 items-stretch">
            <Tabs<Traka>
              label="Dokumenti skladišta"
              value={traka}
              onChange={setTraka}
              tabs={[
                { key: "zadaci", label: "Čeka moju radnju", count: ZADACI.length },
                { key: "nedavni", label: "Nedavni dokumenti", count: NEDAVNI.length },
              ]}
              className="min-w-0 flex-1"
            />
            <div className="flex shrink-0 items-center gap-2 border-b border-[#e5eaf2] pl-3 dark:border-slate-700">
              {RADNJE.map((radnja, index) => (
                <Link key={radnja.label} to={radnja.to} className={`hidden xl:inline-flex ${index === 0 ? GLAVNO_DUGME : DRUGO_DUGME}`}>
                  {radnja.label}
                </Link>
              ))}
              <Link
                to={ekranUrl("prijem", "prijemnice")}
                className="ml-1 inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-[#3B9DF8] hover:underline"
              >
                Svi dokumenti
                <LuArrowRight aria-hidden className="size-3.5" />
              </Link>
            </div>
          </div>

          {traka === "zadaci" ? (
            <>
              <Table
                bare
                fill
                title="Čeka moju radnju"
                columns={zadaciKolone}
                rows={ZADACI}
                getRowKey={(z) => z.id}
                getRowHref={(z) => putanja(z.dokument.path)}
                emptyText="Ništa ne čeka vaš korak."
                className="mt-2 flex min-h-0 flex-1 flex-col"
              />
              <Napomene stavke={POCETNA.napomeneZadaci} />
            </>
          ) : (
            <>
              <Table
                bare
                fill
                title="Nedavni dokumenti"
                columns={nedavniKolone}
                rows={NEDAVNI}
                getRowKey={(d) => d.broj}
                getRowHref={(d) => putanja(d.path)}
                emptyText="Nijedan dokument u zadnjih 7 dana."
                className="mt-2 flex min-h-0 flex-1 flex-col"
              />
              <Napomene stavke={POCETNA.napomeneNedavni} />
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
