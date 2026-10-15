import type { IconType } from "react-icons";
import {
  LuAlarmClock,
  LuCalendarClock,
  LuHourglass,
  LuInbox,
  LuMail,
  LuMailOpen,
  LuPackage,
  LuUser,
  LuUsers,
  LuWrench,
} from "react-icons/lu";
import type { CardDetailRow } from "~/components/CardDetails";
import type { StatusTone } from "~/components/StatusBadge";
import {
  MODUL_ICONS,
  MODUL_LABELS,
  danaIzmedju,
  kratkiDatum,
  vrijemeIz,
  type Hitnost,
  type Snapshot,
} from "~/lib/snapshot";
import { formatBroj } from "~/lib/ui";

/**
 * The data behind each /home card's details page. One builder per card returns a
 * ready-to-render `CardDetailsData`; `karticaDetails` picks the right builder for
 * a card key. The shared `CardDetails` component renders the result.
 */

export interface CardDetailsData {
  title: string;
  description: string;
  icon: IconType;
  topStatus: string;
  alert?: string;
  rows: CardDetailRow[];
}

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

const ODSUSTVO_LABELS: Record<string, string> = {
  BOLOVANJE: "bolovanje",
  GODISNJI: "godišnji odmor",
  PLACENO: "plaćeno odsustvo",
  NEPLACENO: "neplaćeno odsustvo",
};

const modulLabel = (key: string) =>
  MODUL_LABELS[key] ??
  key.replaceAll("-", " ").replace(/^\w/, (letter) => letter.toUpperCase());

const rowToneFor = (hitnost: Hitnost) =>
  hitnost === "KASNI" ? ("danger" as const) : hitnost === "DANAS" ? ("warning" as const) : undefined;

const OTVORENI_NALOZI = new Set(["KREIRAN", "ODOBREN", "U_RADU"]);

// --- Row 1: Moj dan ---

const cekaNaMeneDetails = (s: Snapshot): CardDetailsData => {
  const akcije = s.akcije.filter((a) => a.kada <= s.meta.sada);
  const kasne = akcije.filter((a) => a.hitnost === "KASNI");
  const danas = akcije.filter((a) => a.hitnost === "DANAS");
  const uskoro = akcije.filter((a) => a.hitnost === "USKORO");

  const parts = [
    `${formatBroj(akcije.length)} čeka`,
    kasne.length > 0 && `${formatBroj(kasne.length)} kasni`,
    danas.length > 0 && `${formatBroj(danas.length)} danas`,
    uskoro.length > 0 && `${formatBroj(uskoro.length)} uskoro`,
  ].filter((p): p is string => Boolean(p));

  const rows: CardDetailRow[] = akcije.map((a) => ({
    key: a.id,
    leading: a.datum ? kratkiDatum(a.datum) : "Bez roka",
    icon: MODUL_ICONS[a.modul] ?? LuInbox,
    title: a.naslov,
    meta: [modulLabel(a.modul), a.vrsta, a.broj, a.detalj].filter(Boolean).join(" · "),
    tone: rowToneFor(a.hitnost),
    action: a.akcija,
    badge: { label: HITNOST_LABEL[a.hitnost], tone: HITNOST_TONE[a.hitnost] },
    href: `/home/ceka-na-mene/${encodeURIComponent(a.id)}`,
  }));

  return {
    title: "Čeka na mene",
    description: "Sve što traži tvoju odluku ili potpis, novije na vrhu.",
    icon: LuInbox,
    topStatus: parts.join(" · "),
    rows,
  };
};

const kasniDetails = (s: Snapshot): CardDetailsData => {
  const danas = s.meta.danas;
  const sada = s.meta.sada;

  const kasneStavke = s.stavke
    .filter((st) => st.hitnost === "KASNI" && st.vrsta !== "SMJENA")
    .map((st) => ({ id: st.id, modul: st.modul, vrsta: st.vrsta, naslov: st.naslov, broj: st.broj, datum: st.datum }));

  const kasneAkcije = s.akcije
    .filter((a) => a.kada <= sada && a.hitnost === "KASNI")
    .map((a) => ({ id: a.id, modul: a.modul, vrsta: a.vrsta, naslov: a.naslov, broj: a.broj, datum: a.datum ?? a.kada }));

  const sve = [...kasneStavke, ...kasneAkcije].sort((a, b) => a.datum.localeCompare(b.datum));

  const rows: CardDetailRow[] = sve.map((e) => {
    const dana = Math.max(0, danaIzmedju(e.datum, danas));
    return {
      key: e.id,
      leading: dana > 0 ? `${formatBroj(dana)} d` : "danas",
      icon: MODUL_ICONS[e.modul] ?? LuAlarmClock,
      title: e.broj ? `${e.broj} · ${e.naslov}` : e.naslov,
      meta: `${e.vrsta} · ${modulLabel(e.modul)} · rok ${kratkiDatum(e.datum)}`,
      tone: "danger",
      badge: { label: "Kasni", tone: "danger" },
    };
  });

  return {
    title: "Kasni",
    description: "Rokovi su prošli. Najstarije na vrhu.",
    icon: LuAlarmClock,
    topStatus: `${formatBroj(sve.length)} kasni`,
    alert: sve.length > 0 ? `${formatBroj(sve.length)} stavki kasni` : undefined,
    rows,
  };
};

const danasDetails = (s: Snapshot): CardDetailsData => {
  const danas = s.meta.danas;
  const sadaVrijeme = vrijemeIz(s.meta.sada);

  const stavke = s.stavke
    .filter(
      (st) =>
        st.hitnost !== "ZAVRSENO" &&
        st.vrsta !== "SMJENA" &&
        st.datum.slice(0, 10) <= danas &&
        (st.datumDo ?? st.datum).slice(0, 10) >= danas,
    )
    .sort((a, b) => ((a.vrijeme ?? vrijemeIz(a.datum)) || "99").localeCompare((b.vrijeme ?? vrijemeIz(b.datum)) || "99"));

  const next = stavke.find((st) => {
    const t = st.vrijeme ?? vrijemeIz(st.datum);
    return t !== "" && t >= sadaVrijeme;
  });

  const rows: CardDetailRow[] = stavke.map((st) => {
    const vrijeme = st.vrijeme ?? vrijemeIz(st.datum);
    return {
      key: st.id,
      leading: vrijeme || "Dan",
      icon: MODUL_ICONS[st.modul] ?? LuCalendarClock,
      title: st.broj ? `${st.broj} · ${st.naslov}` : st.naslov,
      meta: `${st.vrsta} · ${modulLabel(st.modul)}`,
      tone: rowToneFor(st.hitnost),
      badge: { label: HITNOST_LABEL[st.hitnost], tone: HITNOST_TONE[st.hitnost] },
    };
  });

  const parts = [
    `${formatBroj(stavke.length)} na rasporedu`,
    next && `sljedeće ${next.vrijeme ?? vrijemeIz(next.datum)}`,
  ].filter((p): p is string => Boolean(p));

  return {
    title: "Danas",
    description: "Današnji raspored, po satima.",
    icon: LuCalendarClock,
    topStatus: parts.join(" · "),
    rows,
  };
};

const novoDetails = (s: Snapshot): CardDetailsData => {
  const inbox = s.email.inbox.filter((m) => m.primljeno <= s.meta.sada);
  const total = s.email.odSinoc.ukupno;

  const rows: CardDetailRow[] = inbox.map((m, index) => ({
    key: `${m.primljeno}-${index}`,
    leading: vrijemeIz(m.primljeno),
    icon: LuMail,
    title: m.sazetak,
    meta: [m.od, m.vip ? "VIP" : undefined, m.kategorija ?? undefined].filter(Boolean).join(" · "),
    tone: m.hitnost === "HITNO" ? "danger" : m.hitnost === "VAZNO" ? "warning" : undefined,
    badge: m.hitnost
      ? { label: m.hitnost === "HITNO" ? "Hitno" : "Važno", tone: m.hitnost === "HITNO" ? "danger" : "warning" }
      : undefined,
  }));

  return {
    title: "Novo od sinoć",
    description: `Mailovi stigli od ${vrijemeIz(s.email.odSinoc.od)}.`,
    icon: LuMailOpen,
    topStatus: `${formatBroj(total)} ukupno · ${formatBroj(inbox.length)} već stiglo`,
    rows,
  };
};

// --- Row 2: Moja služba ---

const radniNaloziDetails = (s: Snapshot): CardDetailsData => {
  const danas = s.meta.danas;
  const kasne = s.nalozi
    .filter((n) => OTVORENI_NALOZI.has(n.status) && n.broj && n.rok && n.rok < danas)
    .sort((a, b) => Number(b.tip === "HITNI") - Number(a.tip === "HITNI") || (a.rok ?? "").localeCompare(b.rok ?? ""));

  const hitne = kasne.filter((n) => n.tip === "HITNI");
  const tipLabel: Record<string, string> = { HITNI: "Hitni", KOREKTIVNI: "Korektivni", PREVENTIVNI: "Preventivni" };

  const rows: CardDetailRow[] = kasne.map((n) => ({
    key: n.broj ?? `${n.predmetRada}-${n.rok ?? ""}`,
    leading: n.rok ? kratkiDatum(n.rok) : undefined,
    icon: MODUL_ICONS["radni-nalozi"] ?? LuWrench,
    title: n.broj ? `${n.broj} · ${n.predmetRada}` : n.predmetRada,
    meta: [n.objekat, n.status, n.odgovorniServiser].filter(Boolean).join(" · "),
    tone: n.tip === "HITNI" ? "danger" : "warning",
    badge: {
      label: tipLabel[n.tip] ?? n.tip,
      tone: n.tip === "HITNI" ? "danger" : "warning",
    },
  }));

  return {
    title: "Radni nalozi · kasne",
    description: "Otvoreni nalozi kojima je rok prošao, hitni prvi.",
    icon: LuWrench,
    topStatus: `${formatBroj(kasne.length)} kasni · ${formatBroj(hitne.length)} hitnih`,
    alert: hitne.length > 0 ? `${formatBroj(hitne.length)} hitnih naloga kasni` : undefined,
    rows,
  };
};

const timDetails = (s: Snapshot): CardDetailsData => {
  const danas = s.meta.danas;
  const { clanovi, odsustva } = s.tim;
  const odsutni = odsustva.filter((o) => o.datumOd <= danas && o.datumDo >= danas);
  const absentBy = new Map(odsutni.map((o) => [o.zaposlenik, o]));

  const rows: CardDetailRow[] = clanovi.map((c) => {
    const o = absentBy.get(c.id);
    const absentNote = o
      ? `${ODSUSTVO_LABELS[o.vrsta] ?? o.vrsta} do ${kratkiDatum(o.datumDo)}${o.status === "PODNESEN" ? " (čeka odluku)" : ""}`
      : undefined;
    return {
      key: c.id,
      icon: LuUser,
      title: c.ime,
      meta: absentNote ? `${c.radnoMjesto} · ${absentNote}` : c.radnoMjesto,
      tone: o ? "warning" : undefined,
      badge: o
        ? { label: o.status === "PODNESEN" ? "Čeka odluku" : "Odsutan", tone: "warning" }
        : { label: "Na poslu", tone: "success" },
    };
  });

  return {
    title: "Tim danas",
    description: "Ko je na poslu, a ko odsutan.",
    icon: LuUsers,
    topStatus: `${formatBroj(clanovi.length - odsutni.length)}/${formatBroj(clanovi.length)} na poslu · ${formatBroj(odsutni.length)} odsutno`,
    rows,
  };
};

const skladisteDetails = (s: Snapshot): CardDetailsData => {
  const items = [...s.skladiste.ispodGranica].sort(
    (a, b) =>
      Number(b.polozaj === "ISPOD_MINIMUMA") - Number(a.polozaj === "ISPOD_MINIMUMA") ||
      a.raspolozivo / a.min - b.raspolozivo / b.min,
  );
  const podMin = items.filter((i) => i.polozaj === "ISPOD_MINIMUMA");

  const rows: CardDetailRow[] = items.map((it) => ({
    key: it.artikl,
    leading: formatBroj(it.raspolozivo),
    icon: LuPackage,
    title: it.naziv,
    meta: `min ${formatBroj(it.min)} · signalna ${formatBroj(it.signalna)} · ${it.skladiste}`,
    tone: it.polozaj === "ISPOD_MINIMUMA" ? "danger" : "warning",
    badge: {
      label: it.polozaj === "ISPOD_MINIMUMA" ? "Ispod min" : "Ispod signalne",
      tone: it.polozaj === "ISPOD_MINIMUMA" ? "danger" : "warning",
    },
  }));

  return {
    title: "Skladište · ispod granice",
    description: "Artikli ispod signalne ili minimuma, najgori prvo.",
    icon: LuPackage,
    topStatus: `${formatBroj(items.length)} ispod granice · ${formatBroj(podMin.length)} ispod minimuma`,
    alert: podMin.length > 0 ? `${formatBroj(podMin.length)} artikala ispod minimuma` : undefined,
    rows,
  };
};

const cekamOdDrugihDetails = (s: Snapshot): CardDetailsData => {
  const sada = s.meta.sada;
  const delegacije = s.akcije
    .filter((a) => a.kada <= sada && a.vrsta === "Delegacija")
    .sort((a, b) => b.kada.localeCompare(a.kada));
  const probijen = delegacije.filter((a) => a.hitnost === "KASNI");

  const rows: CardDetailRow[] = delegacije.map((a) => ({
    key: a.id,
    leading: a.datum ? kratkiDatum(a.datum) : undefined,
    icon: MODUL_ICONS[a.modul] ?? LuHourglass,
    title: a.naslov,
    meta: [a.broj, a.detalj].filter(Boolean).join(" · "),
    tone: rowToneFor(a.hitnost),
    action: a.akcija,
    badge: { label: HITNOST_LABEL[a.hitnost], tone: HITNOST_TONE[a.hitnost] },
  }));

  return {
    title: "Čekam od drugih",
    description: "Delegacije i stvari koje si proslijedio drugima.",
    icon: LuHourglass,
    topStatus: `${formatBroj(delegacije.length)} čeka${probijen.length > 0 ? ` · ${formatBroj(probijen.length)} probijen rok` : ""}`,
    alert: probijen.length > 0 ? `${formatBroj(probijen.length)} delegacija je probilo rok` : undefined,
    rows,
  };
};

/** Builds details data for the card with the given key, or null when unknown. */
export const karticaDetails = (s: Snapshot, kljuc: string): CardDetailsData | null => {
  switch (kljuc) {
    case "ceka-na-mene":
      return cekaNaMeneDetails(s);
    case "kasni":
      return kasniDetails(s);
    case "danas":
      return danasDetails(s);
    case "novo":
      return novoDetails(s);
    case "radni-nalozi":
      return radniNaloziDetails(s);
    case "tim":
      return timDetails(s);
    case "skladiste":
      return skladisteDetails(s);
    case "cekam-od":
      return cekamOdDrugihDetails(s);
    default:
      return null;
  }
};
