import { LuAlarmClock, LuCalendarClock, LuCalendarRange, LuListChecks } from "react-icons/lu";
import type { FeedItem } from "~/components/NotificationsDropdown";
import type { Stat } from "~/components/StatCard";
import {
  MODUL_ICONS,
  MODUL_LABELS,
  kratkiDatum,
  vrijemeIz,
  type Snapshot,
  type Stavka,
} from "~/lib/snapshot";
import { appForModul } from "~/lib/apps";
import type { Day, DayItem } from "~/lib/day";
import { formatBroj } from "~/lib/ui";
import { STANJE_LABELS, workItems, type Stanje, type WorkItem } from "~/lib/work-items";

/**
 * Everything the home page shows, counted from one snapshot's records against
 * its one "today" and one "now". Pure functions: no React here.
 */

const VRSTA_LABELS: Record<string, string> = {
  ROK: "Rok",
  ZADATAK: "Zadatak",
  DOGADJAJ: "Događaj",
  PODSJETNIK: "Podsjetnik",
  ISTEK: "Ističe",
  ODSUSTVO: "Odsustvo",
  ISPLATA: "Isplata",
  SMJENA: "Smjena",
};

/** A module's label; an unknown key reads as words ("upravljanje-dokumentima" → "Upravljanje dokumentima"). */
const modul = (kljuc: string) => {
  const rijeci = kljuc.replaceAll("-", " ");
  return MODUL_LABELS[kljuc] ?? rijeci.charAt(0).toUpperCase() + rijeci.slice(1);
};
const vrsta = (kljuc: string) => VRSTA_LABELS[kljuc] ?? kljuc;

/** The snapshot plus what every card needs from it: the day, the time and the live items. */
interface Kontekst {
  s: Snapshot;
  danas: string;
  sada: string;
  sutra: string;
  /** Calendar items still open. */
  zive: Stavka[];
}

const kontekst = (s: Snapshot): Kontekst => ({
  s,
  danas: s.meta.danas,
  sada: s.meta.sada,
  sutra: new Date(Date.parse(s.meta.danas) + 86_400_000).toISOString().slice(0, 10),
  zive: s.stavke.filter((st) => st.hitnost !== "ZAVRSENO" && st.vrsta !== "SMJENA"),
});

const naDan = (s: Stavka, dan: string) =>
  s.datum.slice(0, 10) <= dan && (s.datumDo ?? s.datum).slice(0, 10) >= dan;

const vrijemeStavke = (s: Stavka) => s.vrijeme ?? vrijemeIz(s.datum);

// The two rows of cards: the person's open items, one kind of thing, counted two ways.

/** Row 1: the open items by where their deadline stands. Four cards of the same kind. */
const poStanju = (items: WorkItem[]): Stat[] => {
  const broj = (stanje: Stanje) => items.filter((item) => item.stanje === stanje).length;
  return [
    { key: "otvoreno", label: "Otvoreno", value: items.length, icon: LuListChecks, href: "/home/zadaci" },
    { key: "kasni", label: STANJE_LABELS.kasni, value: broj("kasni"), icon: LuAlarmClock, tone: "danger", href: "/home/zadaci?stanje=kasni" },
    { key: "danas", label: STANJE_LABELS.danas, value: broj("danas"), icon: LuCalendarClock, tone: "warning", href: "/home/zadaci?stanje=danas" },
    { key: "sedmica", label: STANJE_LABELS.sedmica, value: broj("sedmica"), icon: LuCalendarRange, href: "/home/zadaci?stanje=sedmica" },
  ];
};

// Row 2 has four places.
const MAX_APPS = 4;

/** Row 2: the same open items per app, the busiest app first, each with how many are late or due today. */
const poAplikaciji = (items: WorkItem[]): Stat[] => {
  const poApp = new Map<string, WorkItem[]>();
  for (const item of items) {
    const key = appForModul(item.modul).key;
    poApp.set(key, [...(poApp.get(key) ?? []), item]);
  }
  return [...poApp.values()]
    .sort((a, b) => b.length - a.length)
    .slice(0, MAX_APPS)
    .map((lista) => {
      const app = appForModul(lista[0].modul);
      const kasni = lista.filter((item) => item.stanje === "kasni").length;
      const danas = lista.filter((item) => item.stanje === "danas").length;
      return {
        key: app.key,
        label: app.label,
        value: lista.length,
        icon: app.icon,
        href: `/home/zadaci?app=${app.key}`,
        highlight: { label: "Rokovi", title: `${formatBroj(kasni)} kasni · ${formatBroj(danas)} danas` },
      };
    });
};

// HERO and ROW 3.

const osoba = ({ s }: Kontekst) => ({
  ime: s.meta.osoba.ime.split(" ")[0],
  uloga: `${s.meta.osoba.radnoMjesto}, ${s.meta.osoba.sektor}`,
  sektor: s.meta.osoba.sektor,
  sedmica: s.meta.sedmica,
  sada: s.meta.sada,
  zadaci: {
    zavrseni: s.meta.zadaciSedmice.zavrseni,
    ukupno: s.meta.zadaciSedmice.otvoreni + s.meta.zadaciSedmice.zavrseni,
  },
});

const dayItem = (s: Stavka): DayItem => ({
  key: s.id,
  time: vrijemeStavke(s) || undefined,
  title: s.broj ? `${s.broj} · ${s.naslov}` : s.naslov,
  meta: `${vrsta(s.vrsta)} · ${modul(s.modul)}`,
  icon: MODUL_ICONS[s.modul] ?? LuCalendarClock,
});

/** One day's schedule for the day timeline: its timed and all-day items, and now when it is today. */
const dayOf = (k: Kontekst, dan: string, label: string): Day => {
  const items = k.zive.filter((s) => naDan(s, dan)).map(dayItem);
  return {
    label,
    timed: items.filter((item) => item.time),
    allDay: items.filter((item) => !item.time),
    now: dan === k.danas ? vrijemeIz(k.sada) : undefined,
  };
};

/** How many notifications the bell holds. The top bar shows the first four of the same list. */
const OBAVJESTENJA = 5;

/** One notification of the bell and the top bar: something that arrived, or an open item. */
export interface Obavjestenje {
  id: string;
  modul: string;
  naslov: string;
  /** The message under the title, when a notification has one. */
  poruka?: string;
  traziAkciju: boolean;
  /** An open item opens its own page; a notification opens its app. */
  url?: string;
}

/**
 * The person's notifications, newest first: what has arrived, then the open items.
 * One per app comes first, then a second per app, and so on, so the bar's four show
 * as many apps as there are. The bell holds the first five.
 */
const obavjestenja = ({ s, sada }: Kontekst, items: WorkItem[]): Obavjestenje[] => {
  const sve: Obavjestenje[] = [
    ...s.obavijesti
      .filter((o) => o.kada <= sada)
      .map((o) => ({ id: o.id, modul: o.modul, naslov: o.naslov, poruka: o.poruka || undefined, traziAkciju: o.traziAkciju })),
    ...items.map((item) => ({
      id: item.id,
      modul: item.modul,
      naslov: `${item.akcija}: ${item.naslov}`,
      traziAkciju: item.stanje === "kasni" || item.stanje === "danas",
      url: item.url,
    })),
  ];
  // Each app's notifications in order; the app with the newest one first.
  const poAppu = new Map<string, Obavjestenje[]>();
  for (const obavjestenje of sve) {
    const kljuc = appForModul(obavjestenje.modul).key;
    poAppu.set(kljuc, [...(poAppu.get(kljuc) ?? []), obavjestenje]);
  }
  const redom: Obavjestenje[] = [];
  for (let krug = 0; redom.length < OBAVJESTENJA && [...poAppu.values()].some((lista) => lista.length > krug); krug++) {
    for (const lista of poAppu.values()) if (lista[krug]) redom.push(lista[krug]);
  }
  return redom.slice(0, OBAVJESTENJA);
};

/** Active personal reminders, ordered by their next due date and time. */
const podsjetnici = ({ s, danas }: Kontekst): FeedItem[] =>
  s.stavke
    .filter(
      (stavka) =>
        stavka.vrsta === "PODSJETNIK" &&
        stavka.hitnost !== "ZAVRSENO" &&
        stavka.datum.slice(0, 10) >= danas,
    )
    .sort((a, b) =>
      `${a.datum.slice(0, 10)}T${vrijemeStavke(a) || "23:59"}`.localeCompare(
        `${b.datum.slice(0, 10)}T${vrijemeStavke(b) || "23:59"}`,
      ),
    )
    .map((stavka) => ({
      id: stavka.id,
      icon: LuAlarmClock,
      text: stavka.naslov,
      meta: [
        stavka.datum.slice(0, 10) === danas ? "Danas" : kratkiDatum(stavka.datum),
        vrijemeStavke(stavka),
        stavka.opis,
      ]
        .filter(Boolean)
        .join(" · "),
      tone:
        stavka.hitnost === "KASNI"
          ? "danger"
          : stavka.hitnost === "DANAS"
            ? "warning"
            : "info",
      tag: stavka.hitnost === "DANAS" ? "Danas" : "Podsjetnik",
    }));

/** Everything the home page shows for one snapshot. */
export const homeView = (s: Snapshot) => {
  const k = kontekst(s);
  const items = workItems(s);
  return {
    osoba: osoba(k),
    /** Mailboxes that stopped syncing: the user must reconnect them, or mail goes missing. */
    prekinut: s.email.sanducici.find((m) => m.zdravlje === "PREKINUTO"),
    zadaci: poStanju(items),
    poAplikaciji: poAplikaciji(items),
    danas: dayOf(k, k.danas, "Danas"),
    sutra: dayOf(k, k.sutra, "Sutra"),
    obavjestenja: obavjestenja(k, items),
    podsjetnici: podsjetnici(k),
  };
};

export type HomeView = ReturnType<typeof homeView>;
