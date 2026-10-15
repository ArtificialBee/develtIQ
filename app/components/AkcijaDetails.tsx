import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  LuArrowLeft,
  LuCalendarClock,
  LuClock,
  LuExternalLink,
  LuHash,
  LuInbox,
  LuTag,
  LuUserCheck,
  LuZap,
} from "react-icons/lu";
import { Panel } from "~/components/Panel";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import {
  MODUL_ICONS,
  MODUL_LABELS,
  kratkiDatum,
  vrijemeIz,
  type Akcija,
  type Hitnost,
} from "~/lib/snapshot";

const HITNOST_TONE: Record<Hitnost, StatusTone> = {
  KASNI: "danger",
  DANAS: "warning",
  USKORO: "info",
  KASNIJE: "neutral",
  BEZ_ROKA: "neutral",
  ZAVRSENO: "success",
};

const HITNOST_LABEL: Record<Hitnost, string> = {
  KASNI: "Kasni",
  DANAS: "Danas",
  USKORO: "Uskoro",
  KASNIJE: "Kasnije",
  BEZ_ROKA: "Bez roka",
  ZAVRSENO: "Završeno",
};

const modulLabel = (key: string) =>
  MODUL_LABELS[key] ??
  key.replaceAll("-", " ").replace(/^\w/, (letter) => letter.toUpperCase());

const kadaLabel = (iso: string) => {
  const vrijeme = vrijemeIz(iso);
  return vrijeme ? `${kratkiDatum(iso)} ${vrijeme}` : kratkiDatum(iso);
};

const rokLabel = (datum?: string) => (datum ? kadaLabel(datum) : "Bez roka");

const Field = ({ icon: Icon, label, children }: { icon: typeof LuTag; label: string; children: ReactNode }) => (
  <div className="flex items-start gap-3 rounded-xl border border-[#e5eaf2] bg-white/60 p-3 dark:border-slate-700/70 dark:bg-slate-900/40">
    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#3B9DF8]/10 text-[#3B9DF8] ring-1 ring-[#3B9DF8]/25">
      <Icon aria-hidden className="size-3.5" />
    </span>
    <div className="min-w-0 flex-1">
      <dt className="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-white/50">{label}</dt>
      <dd className="mt-0.5 min-w-0 break-words text-sm text-gray-900 dark:text-white">{children}</dd>
    </div>
  </div>
);

export interface AkcijaDetailsProps {
  akcija: Akcija;
  /** Where the back link points. */
  backTo: string;
  /** Label of the back link. */
  backLabel?: string;
}

/**
 * One action laid out as a details page: module icon with full title at the top, a
 * grid of all its fields, and the primary verb as a CTA. The same component renders
 * every "Čeka na mene" row — only the `akcija` prop changes.
 */
export function AkcijaDetails({ akcija, backTo, backLabel = "Natrag" }: AkcijaDetailsProps) {
  const Icon = MODUL_ICONS[akcija.modul] ?? LuInbox;
  const tone = HITNOST_TONE[akcija.hitnost];

  return (
    <Panel
      fill
      icon={Icon}
      title={akcija.naslov}
      description={akcija.detalj}
      action={
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#3B9DF8] transition-colors hover:bg-[#3B9DF8]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]"
        >
          <LuArrowLeft aria-hidden className="size-4" />
          {backLabel}
        </Link>
      }
      className="flex-1"
    >
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto pr-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={tone}>{HITNOST_LABEL[akcija.hitnost]}</StatusBadge>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-700 dark:bg-slate-800 dark:text-white/80">
            {modulLabel(akcija.modul)}
          </span>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-700 dark:bg-slate-800 dark:text-white/80">
            {akcija.vrsta}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field icon={LuTag} label="Vrsta">
            {akcija.vrsta}
          </Field>
          <Field icon={LuInbox} label="Modul">
            {modulLabel(akcija.modul)}
          </Field>
          {akcija.broj && (
            <Field icon={LuHash} label="Broj">
              <span className="font-mono tabular-nums">{akcija.broj}</span>
            </Field>
          )}
          <Field icon={LuCalendarClock} label="Rok">
            {rokLabel(akcija.datum)}
          </Field>
          <Field icon={LuClock} label="Primljeno">
            {kadaLabel(akcija.kada)}
          </Field>
          <Field icon={LuZap} label="Status">
            <StatusBadge tone={tone}>{HITNOST_LABEL[akcija.hitnost]}</StatusBadge>
          </Field>
          {akcija.detalj && (
            <div className="sm:col-span-2">
              <Field icon={LuExternalLink} label="Detalj">
                {akcija.detalj}
              </Field>
            </div>
          )}
          {akcija.zamjenaZa && (
            <div className="sm:col-span-2">
              <Field icon={LuUserCheck} label="Zamjena za">
                {akcija.zamjenaZa}
              </Field>
            </div>
          )}
        </dl>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-[#e5eaf2] pt-4 dark:border-slate-700/70">
          <Link
            to={backTo}
            className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Odustani
          </Link>
          <button
            type="button"
            className="rounded-lg bg-[#3B9DF8] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            {akcija.akcija}
          </button>
        </div>
      </div>
    </Panel>
  );
}
