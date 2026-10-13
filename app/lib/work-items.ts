import type { StatusTone } from "~/components/StatusBadge";
import { SNAPSHOT, danaIzmedju, type Akcija, type Snapshot } from "~/lib/snapshot";

/**
 * One shape for everything the person has to do, whichever app it comes from: the
 * actions waiting on them (sign, assign, decide, rate, …) and their own open tasks.
 * The home page counts these, the dock badges count these and one table lists
 * these, so every number on the home page means the same kind of thing.
 */

/** Where a deadline stands, by one rule (`stanjeRoka`). */
export type Stanje = "kasni" | "danas" | "sedmica" | "kasnije" | "bez-roka";

export interface WorkItem {
  id: string;
  /** The snapshot module it comes from, such as "protokol"; the app follows from it. */
  modul: string;
  /** What the person has to do, as a verb: "Potpiši", "Odluči", "Završi". */
  akcija: string;
  /** What kind of record it is, such as "Potpis" or "Zadatak". */
  vrsta: string;
  naslov: string;
  /** One line about the record, such as who prepared it. */
  detalj?: string;
  /** The record's number, such as "04-13/26-0159". */
  broj?: string;
  /** The deadline, yyyy-mm-dd. */
  rok?: string;
  stanje: Stanje;
  /** When it reached the person, as an ISO date-time. Own tasks have none. */
  primljeno?: string;
  /** Whom the person stands in for, when it came to them as a substitute. */
  umjesto?: string;
  /** Its details page. */
  url: string;
}

/** Most pressing first. */
export const STANJA: Stanje[] = ["kasni", "danas", "sedmica", "kasnije", "bez-roka"];

export const STANJE_LABELS: Record<Stanje, string> = {
  kasni: "Kasni",
  danas: "Danas",
  sedmica: "Ove sedmice",
  kasnije: "Kasnije",
  "bez-roka": "Bez roka",
};

export const STANJE_TONES: Record<Stanje, StatusTone> = {
  kasni: "danger",
  danas: "warning",
  sedmica: "info",
  kasnije: "neutral",
  "bez-roka": "neutral",
};

/** The one rule for every item: past the deadline is late, then today, the next 7 days, later, or no deadline. */
export const stanjeRoka = (rok: string | undefined, danas: string): Stanje => {
  if (!rok) return "bez-roka";
  const dana = danaIzmedju(danas, rok);
  if (dana < 0) return "kasni";
  if (dana === 0) return "danas";
  return dana <= 7 ? "sedmica" : "kasnije";
};

export const zadatakUrl = (id: string) => `/home/zadaci/${encodeURIComponent(id)}`;

/** The action's record number. Mail has none: its number field holds the sender or the person it went to. */
export const brojAkcije = (akcija: Akcija) => (akcija.modul === "email" ? undefined : akcija.broj);

/** Every open item of the person, the most pressing first and, within that, the nearest deadline first. */
export const workItems = (s: Snapshot): WorkItem[] => {
  const { danas, sada } = s.meta;
  const akcije = s.akcije
    .filter((a) => a.kada <= sada)
    .map((a) => ({
      id: a.id,
      modul: a.modul,
      akcija: a.akcija,
      vrsta: a.vrsta,
      naslov: a.naslov,
      detalj: a.detalj,
      broj: brojAkcije(a),
      rok: a.datum?.slice(0, 10),
      stanje: stanjeRoka(a.datum, danas),
      primljeno: a.kada,
      umjesto: a.zamjenaZa,
      url: zadatakUrl(a.id),
    }));
  // The person's own tasks, from Moj planer.
  const zadaci = s.stavke
    .filter((st) => st.vrsta === "ZADATAK" && st.hitnost !== "ZAVRSENO")
    .map((st) => ({
      id: st.id,
      modul: st.modul,
      akcija: "Završi",
      vrsta: "Zadatak",
      naslov: st.naslov,
      detalj: st.opis,
      broj: st.broj,
      rok: st.datum.slice(0, 10),
      stanje: stanjeRoka(st.datum, danas),
      url: zadatakUrl(st.id),
    }));
  return [...akcije, ...zadaci].sort(
    (a, b) => STANJA.indexOf(a.stanje) - STANJA.indexOf(b.stanje) || (a.rok ?? "").localeCompare(b.rok ?? ""),
  );
};

/** The items of the one snapshot edvin shows. */
export const WORK_ITEMS = workItems(SNAPSHOT);
