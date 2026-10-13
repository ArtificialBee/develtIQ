import type { IconType } from "react-icons";
import { LuClipboardList, LuGauge, LuLayoutGrid, LuListChecks, LuUser } from "react-icons/lu";
import { APPS, appForModul } from "~/lib/apps";
import { KPIS_BY_GAP } from "~/lib/kpi";
import { SNAPSHOT } from "~/lib/snapshot";
import { WORK_ITEMS } from "~/lib/work-items";

/**
 * Everything the top bar's search can find, in one shape: the apps and every
 * screen in them, the person's open items, the KPIs, the work orders and the
 * people of the unit. Built once from the snapshot.
 */

export type SearchKind = "zadatak" | "ekran" | "aplikacija" | "pokazatelj" | "nalog" | "zaposlenik";

export interface SearchEntry {
  key: string;
  kind: SearchKind;
  title: string;
  /** Where it sits, such as "Protokol › Arhiva" or "Potpiši · 04-13/26-0159". */
  context: string;
  url: string;
  icon: IconType;
}

/** The groups of results, in the order they show. */
export const SEARCH_GROUPS: { kind: SearchKind; label: string }[] = [
  { kind: "zadatak", label: "Moji zadaci" },
  { kind: "ekran", label: "Ekrani" },
  { kind: "aplikacija", label: "Aplikacije" },
  { kind: "nalog", label: "Radni nalozi" },
  { kind: "zaposlenik", label: "Zaposlenici" },
  { kind: "pokazatelj", label: "Pokazatelji" },
];

const zadaci: SearchEntry[] = WORK_ITEMS.map((item) => ({
  key: `zadatak:${item.id}`,
  kind: "zadatak",
  title: item.naslov,
  context: [appForModul(item.modul).label, item.akcija, item.broj].filter(Boolean).join(" · "),
  url: item.url,
  icon: LuListChecks,
}));

const aplikacije: SearchEntry[] = APPS.map((app) => ({
  key: `app:${app.key}`,
  kind: "aplikacija",
  title: app.label,
  context: `${app.sections.length} sekcija`,
  url: app.url,
  icon: app.icon ?? LuLayoutGrid,
}));

const ekrani: SearchEntry[] = APPS.flatMap((app) =>
  app.sections.flatMap((section) => [
    { key: `ekran:${section.url}`, kind: "ekran" as const, title: section.label, context: app.label, url: section.url, icon: section.icon },
    ...section.children.map((screen) => ({
      key: `ekran:${screen.url}`,
      kind: "ekran" as const,
      title: screen.label,
      context: [`${app.label} › ${section.label}`, screen.description].filter(Boolean).join(" · "),
      url: screen.url,
      icon: screen.icon,
    })),
  ]),
);

// Only the KPIs in percent are in the Pokazatelji table; the others are on the KPI page.
const pokazatelji: SearchEntry[] = KPIS_BY_GAP.map((kpi) => ({
  key: `kpi:${kpi.key}`,
  kind: "pokazatelj",
  title: kpi.metricLabel,
  context: kpi.module,
  url: kpi.unit === "%" ? "/home/pokazatelji" : "/home/kpi",
  icon: LuGauge,
}));

const nalozi: SearchEntry[] = SNAPSHOT.nalozi
  .filter((nalog) => nalog.broj)
  .map((nalog) => ({
    key: `nalog:${nalog.broj}`,
    kind: "nalog",
    title: `${nalog.broj} · ${nalog.predmetRada}`,
    context: [nalog.objekat, nalog.odgovorniServiser].filter(Boolean).join(" · "),
    url: "/app/nalozi/lista",
    icon: LuClipboardList,
  }));

const zaposlenici: SearchEntry[] = SNAPSHOT.tim.clanovi.map((clan) => ({
  key: `zaposlenik:${clan.id}`,
  kind: "zaposlenik",
  title: clan.ime,
  context: clan.radnoMjesto,
  url: "/app/hr/zaposlenici",
  icon: LuUser,
}));

export const SEARCH_INDEX: SearchEntry[] = [...zadaci, ...ekrani, ...aplikacije, ...nalozi, ...zaposlenici, ...pokazatelji];

/** Lower case without accents, so "cekam" finds "Čekam" and "dj" finds "đ". */
export const normalize = (text: string) =>
  text
    .toLocaleLowerCase("bs")
    .replaceAll("đ", "dj")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

// Results per group, so one big group does not push the others out.
const PER_GROUP = 4;

/** The entries that match `query`, best first in each group: title starts with it, title has it, then the context has it. */
export const searchAll = (query: string) => {
  const needle = normalize(query.trim());
  if (needle.length < 2) return [];
  const rank = (entry: SearchEntry) => {
    const title = normalize(entry.title);
    if (title.startsWith(needle)) return 0;
    if (title.includes(needle)) return 1;
    return normalize(entry.context).includes(needle) ? 2 : -1;
  };
  return SEARCH_GROUPS.map(({ kind, label }) => ({
    kind,
    label,
    entries: SEARCH_INDEX.filter((entry) => entry.kind === kind)
      .map((entry) => ({ entry, score: rank(entry) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, PER_GROUP)
      .map(({ entry }) => entry),
  })).filter((group) => group.entries.length > 0);
};
