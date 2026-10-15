import {
  LuAlarmClock,
  LuCalendarClock,
  LuHourglass,
  LuInbox,
  LuMailOpen,
  LuPackage,
  LuUsers,
  LuWrench,
} from "react-icons/lu";
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
import type { Day, DayItem } from "~/lib/day";
import { formatBroj } from "~/lib/ui";

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

const ODSUSTVO_LABELS: Record<string, string> = {
  BOLOVANJE: "bolovanje",
  GODISNJI: "godišnji odmor",
  PLACENO: "plaćeno odsustvo",
  NEPLACENO: "neplaćeno odsustvo",
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
  /** What waits on the person and had reached them by "now". */
  akcije: Snapshot["akcije"];
  /** Calendar items still open. */
  zive: Stavka[];
}

const kontekst = (s: Snapshot): Kontekst => ({
  s,
  danas: s.meta.danas,
  sada: s.meta.sada,
  sutra: new Date(Date.parse(s.meta.danas) + 86_400_000).toISOString().slice(0, 10),
  akcije: s.akcije.filter((a) => a.kada <= s.meta.sada),
  zive: s.stavke.filter((st) => st.hitnost !== "ZAVRSENO" && st.vrsta !== "SMJENA"),
});

const naDan = (s: Stavka, dan: string) =>
  s.datum.slice(0, 10) <= dan && (s.datumDo ?? s.datum).slice(0, 10) >= dan;

const vrijemeStavke = (s: Stavka) => s.vrijeme ?? vrijemeIz(s.datum);

/** Today's items: timed ones by time first, then the all-day ones. */
const danasnjeStavke = (k: Kontekst) =>
  k.zive
    .filter((s) => naDan(s, k.danas))
    .sort((a, b) => (vrijemeStavke(a) || "99").localeCompare(vrijemeStavke(b) || "99"));

/** Late calendar items, the oldest first. */
const kasneStavke = (k: Kontekst) =>
  k.zive.filter((s) => s.hitnost === "KASNI").sort((a, b) => a.datum.localeCompare(b.datum));

// ROW 1 — the person's own day.

const cekaNaMene = ({ akcije }: Kontekst): Stat => {
  const kasne = akcije.filter((a) => a.hitnost === "KASNI");
  const prva = akcije[0];
  return {
    key: "ceka-na-mene",
    label: "Čeka na mene",
    value: akcije.length,
    icon: LuInbox,
    href: "/home/ceka-na-mene",
    badge: kasne.length > 0 ? { label: `${formatBroj(kasne.length)} kasni`, tone: "danger" } : undefined,
    highlight: prva && { label: "Prvo na redu", title: `${prva.akcija}: ${prva.naslov}` },
  };
};

const kasni = (k: Kontekst): Stat => {
  const sve = [
    ...kasneStavke(k).map((s) => ({ modul: s.modul, datum: s.datum, naslov: s.naslov, broj: s.broj })),
    ...k.akcije
      .filter((a) => a.hitnost === "KASNI")
      .map((a) => ({ modul: a.modul, datum: a.datum ?? a.kada, naslov: a.naslov, broj: a.broj })),
  ];
  const najstarija = [...sve].sort((a, b) => a.datum.localeCompare(b.datum))[0];
  return {
    key: "kasni",
    label: "Kasni",
    value: sve.length,
    icon: LuAlarmClock,
    tone: "danger",
    href: "/home/kartica/kasni",
    highlight: najstarija && {
      label: "Najstarije",
      title: najstarija.broj ? `${najstarija.broj} · ${najstarija.naslov}` : najstarija.naslov,
    },
  };
};

const danas = (k: Kontekst): Stat => {
  const lista = danasnjeStavke(k);
  const sadaVrijeme = vrijemeIz(k.sada);
  const sljedeca =
    lista.find((s) => vrijemeStavke(s) !== "" && vrijemeStavke(s) >= sadaVrijeme) ??
    lista.find((s) => vrijemeStavke(s) === "");
  return {
    key: "danas",
    label: "Danas",
    value: lista.length,
    icon: LuCalendarClock,
    href: "/home/kartica/danas",
    highlight: sljedeca && {
      label: "Sljedeće",
      title: [vrijemeStavke(sljedeca), sljedeca.naslov].filter(Boolean).join(" · "),
    },
  };
};

const noviMailovi = ({ s, sada }: Kontekst): Stat => {
  const { odSinoc, inbox } = s.email;
  const prvi = inbox.find((m) => m.primljeno <= sada);
  return {
    key: "novo",
    label: `Novo od sinoć ${vrijemeIz(odSinoc.od)}`,
    value: odSinoc.ukupno,
    icon: LuMailOpen,
    href: "/home/kartica/novo",
    highlight: prvi && { label: prvi.hitnost === "HITNO" ? "Hitno" : "Najvažnije", title: prvi.sazetak },
  };
};

// ROW 2 — the person's unit.

const OTVORENI_NALOZI = new Set(["KREIRAN", "ODOBREN", "U_RADU"]);

// Drafts have no number yet and are not real orders.
const otvoreniNalozi = ({ s }: Kontekst) => s.nalozi.filter((n) => OTVORENI_NALOZI.has(n.status) && n.broj);

type Nalog = Snapshot["nalozi"][number];
type Artikl = Snapshot["skladiste"]["ispodGranica"][number];

// An urgent work order first, then the one longest past its deadline.
const hitniPaNajstariji = (a: Nalog, b: Nalog) =>
  Number(b.tip === "HITNI") - Number(a.tip === "HITNI") || (a.rok ?? "").localeCompare(b.rok ?? "");

// Items under their minimum first, then the emptiest against its minimum.
const najkriticniji = (a: Artikl, b: Artikl) =>
  Number(b.polozaj === "ISPOD_MINIMUMA") - Number(a.polozaj === "ISPOD_MINIMUMA") || a.raspolozivo / a.min - b.raspolozivo / b.min;

const radniNalozi = (k: Kontekst): Stat => {
  const kasne = otvoreniNalozi(k).filter((n) => n.rok && n.rok < k.danas);
  const hitne = kasne.filter((n) => n.tip === "HITNI");
  const najgori = [...kasne].sort(hitniPaNajstariji)[0];
  return {
    key: "radni-nalozi",
    label: "Radni nalozi · kasne",
    value: kasne.length,
    icon: LuWrench,
    tone: "danger",
    href: "/home/kartica/radni-nalozi",
    badge: hitne.length > 0 ? { label: `${formatBroj(hitne.length)} hitna`, tone: "danger" } : undefined,
    highlight: najgori && {
      label: najgori.tip === "HITNI" ? "Hitni nalog kasni" : "Najstariji",
      title: `${najgori.broj} · ${najgori.predmetRada}`,
    },
  };
};

const timDanas = (k: Kontekst): Stat => {
  const { clanovi, odsustva } = k.s.tim;
  const odsutni = odsustva.filter((o) => o.datumOd <= k.danas && o.datumDo >= k.danas);
  const ime = (id: string) => clanovi.find((c) => c.id === id)?.ime ?? id;
  const opis = (o: (typeof odsutni)[number]) =>
    `${ime(o.zaposlenik)}: ${ODSUSTVO_LABELS[o.vrsta] ?? o.vrsta} do ${kratkiDatum(o.datumDo)}${o.status === "PODNESEN" ? " (čeka odluku)" : ""}`;
  return {
    key: "tim",
    label: "Tim danas · na poslu",
    value: clanovi.length - odsutni.length,
    suffix: `/${formatBroj(clanovi.length)}`,
    icon: LuUsers,
    tone: "success",
    href: "/home/kartica/tim",
    badge: odsutni.length > 0 ? { label: `${formatBroj(odsutni.length)} odsutno`, tone: "warning" } : undefined,
    highlight: odsutni.length > 0 ? { label: "Odsutni", title: odsutni.map(opis).join(" · ") } : undefined,
  };
};

const skladiste = ({ s }: Kontekst): Stat => {
  const { pokazatelji, ispodGranica } = s.skladiste;
  const prvi = [...ispodGranica].sort(najkriticniji)[0];
  return {
    key: "skladiste",
    label: "Skladište · ispod granice",
    value: pokazatelji.ispodSignalne,
    icon: LuPackage,
    tone: "warning",
    href: "/home/kartica/skladiste",
    highlight: prvi && {
      label: prvi.polozaj === "ISPOD_MINIMUMA" ? "Ispod minimuma" : "Ispod signalne",
      title: `${prvi.naziv} · na stanju ${prvi.raspolozivo}, minimum ${prvi.min}`,
    },
  };
};

const cekamOdDrugih = ({ s, akcije }: Kontekst): Stat => {
  const { cekamOd, probijenRok } = s.email.odSinoc;
  const prva = akcije.find((a) => a.vrsta === "Delegacija");
  return {
    key: "cekam-od",
    label: "Čekam od drugih",
    value: cekamOd,
    icon: LuHourglass,
    tone: "warning",
    href: "/home/kartica/cekam-od",
    badge: probijenRok > 0 ? { label: `${formatBroj(probijenRok)} probijen rok`, tone: "danger" } : undefined,
    highlight: prva && {
      label: prva.hitnost === "KASNI" ? "Probijen rok" : "Sljedeće",
      title: `${prva.broj}: ${prva.naslov}`,
    },
  };
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

/** Notifications that had arrived by now, newest first. */
const obavjestenja = ({ s, sada }: Kontekst): FeedItem[] =>
  s.obavijesti
    .filter((o) => o.kada <= sada)
    .map((o) => ({
      id: o.id,
      icon: MODUL_ICONS[o.modul] ?? LuInbox,
      text: o.poruka ? `${o.naslov} — ${o.poruka}` : o.naslov,
      tone: o.traziAkciju ? "warning" : "info",
      tag: o.traziAkciju ? "Traži akciju" : "Info",
    }));

/**
 * What the top bar's buttons can show, title only, most pressing first: notifications
 * that have arrived, the newest actions waiting on the person, the worst late work
 * order and the stock item furthest under its limit. The bar takes one per app.
 */
const najnovije = (k: Kontekst) => {
  const { s, sada, akcije } = k;
  const nalog = otvoreniNalozi(k).filter((n) => n.rok && n.rok < k.danas).sort(hitniPaNajstariji)[0];
  const artikl = [...s.skladiste.ispodGranica].sort(najkriticniji)[0];
  return [
    ...s.obavijesti
      .filter((o) => o.kada <= sada)
      .map((o) => ({ id: o.id, modul: o.modul, naslov: o.naslov, traziAkciju: o.traziAkciju })),
    ...[...akcije]
      .sort((a, b) => b.kada.localeCompare(a.kada))
      .map((a) => ({ id: a.id, modul: a.modul, naslov: `${a.vrsta}: ${a.naslov}`, traziAkciju: true })),
    ...(nalog
      ? [{
          id: `nalog:${nalog.broj}`,
          modul: "radni-nalozi",
          naslov: `${nalog.tip === "HITNI" ? "Hitni nalog kasni" : "Nalog kasni"}: ${nalog.broj} · ${nalog.predmetRada}`,
          traziAkciju: true,
        }]
      : []),
    ...(artikl
      ? [{
          id: `artikl:${artikl.artikl}`,
          modul: "skladiste",
          naslov: `${artikl.polozaj === "ISPOD_MINIMUMA" ? "Ispod minimuma" : "Ispod signalne"}: ${artikl.naziv}`,
          traziAkciju: artikl.polozaj === "ISPOD_MINIMUMA",
        }]
      : []),
  ];
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
  return {
    osoba: osoba(k),
    /** Mailboxes that stopped syncing: the user must reconnect them, or mail goes missing. */
    prekinut: s.email.sanducici.find((m) => m.zdravlje === "PREKINUTO"),
    mojDan: [cekaNaMene(k), kasni(k), danas(k), noviMailovi(k)],
    mojaSluzba: [radniNalozi(k), timDanas(k), skladiste(k), cekamOdDrugih(k)],
    danas: dayOf(k, k.danas, "Danas"),
    sutra: dayOf(k, k.sutra, "Sutra"),
    obavjestenja: obavjestenja(k),
    najnovije: najnovije(k),
    podsjetnici: podsjetnici(k),
  };
};

export type HomeView = ReturnType<typeof homeView>;
