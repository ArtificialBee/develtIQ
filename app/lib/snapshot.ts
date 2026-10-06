import type { IconType } from "react-icons";
import {
  LuBanknote,
  LuBookOpen,
  LuCar,
  LuClipboardList,
  LuLandmark,
  LuMail,
  LuUser,
  LuUsers,
  LuWallet,
  LuWarehouse,
} from "react-icons/lu";
import data from "~/data/mirza-2026-09-24.json";

/**
 * One person's day, exported live from the divetiq-cicak demo (its `useMojProstor()`
 * and module stores) for Mirza Alić, Šef servisa, on Thursday 24.09.2026. Every
 * number on the home page is counted from these records, against one "today".
 */

export type Hitnost = "KASNI" | "DANAS" | "USKORO" | "KASNIJE" | "BEZ_ROKA" | "ZAVRSENO";

export interface Stavka {
  id: string;
  modul: string;
  vrsta: string;
  /** yyyy-mm-dd, sometimes with a time. */
  datum: string;
  datumDo?: string;
  vrijeme?: string;
  naslov: string;
  broj?: string;
  opis?: string;
  hitnost: Hitnost;
}

export interface Akcija {
  id: string;
  modul: string;
  vrsta: string;
  broj?: string;
  naslov: string;
  detalj?: string;
  datum?: string;
  /** When the item reached the person. */
  kada: string;
  /** The button verb, such as "Potpiši". */
  akcija: string;
  hitnost: Hitnost;
}

export interface Obavijest {
  id: string;
  modul: string;
  naslov: string;
  poruka?: string;
  kada: string;
  traziAkciju: boolean;
}

export interface Mail {
  od: string;
  primljeno: string;
  vip: boolean;
  kategorija: string | null;
  hitnost: string | null;
  rok: string | null;
  sazetak: string;
}

export interface RadniNalog {
  broj?: string;
  tip: "PREVENTIVNI" | "KOREKTIVNI" | "HITNI";
  status: string;
  rok?: string;
  predmetRada: string;
  objekat: string;
  odgovorniServiser?: string;
}

export interface ArtiklIspodGranice {
  artikl: string;
  naziv: string;
  skladiste: string;
  raspolozivo: number;
  min: number;
  signalna: number;
  polozaj: "ISPOD_MINIMUMA" | "ISPOD_SIGNALNE";
}

export interface Odsustvo {
  zaposlenik: string;
  vrsta: string;
  datumOd: string;
  datumDo: string;
  status: string;
}

export interface Snapshot {
  meta: {
    danas: string;
    sada: string;
    sedmica: number;
    osoba: { id: string; ime: string; radnoMjesto: string; sektor: string };
    zadaciSedmice: { otvoreni: number; zavrseni: number };
  };
  stavke: Stavka[];
  akcije: Akcija[];
  obavijesti: Obavijest[];
  neprocitanihObavijesti: number;
  email: {
    odSinoc: {
      od: string;
      ukupno: number;
      traziOdgovor: number;
      odobrenja: number;
      sastanci: number;
      zaZnanje: number;
      cekamOd: number;
      probijenRok: number;
    };
    cekaOdluku: number;
    inbox: Mail[];
    sanducici: { adresa: string; zdravlje: string; vrsta: string }[];
  };
  nalozi: RadniNalog[];
  skladiste: {
    pokazatelji: {
      ispodSignalne: number;
      ispodMinimuma: number;
      naNuli?: number;
      uZahtjevu: number;
      uGranicama: number;
    };
    ispodGranica: ArtiklIspodGranice[];
  };
  tim: {
    clanovi: { id: string; ime: string; radnoMjesto: string }[];
    odsustva: Odsustvo[];
  };
}

export const SNAPSHOT = data as Snapshot;

export const MODUL_LABELS: Record<string, string> = {
  protokol: "Protokol",
  "radni-nalozi": "Radni nalozi",
  licno: "Lično",
  email: "E-mail",
  hr: "Kadrovska",
  "vozni-park": "Vozni park",
  plate: "Plate",
  finansije: "Finansije",
  skladiste: "Skladište",
  "stalna-sredstva": "Stalna sredstva",
};

export const MODUL_ICONS: Record<string, IconType> = {
  protokol: LuBookOpen,
  "radni-nalozi": LuClipboardList,
  licno: LuUser,
  email: LuMail,
  hr: LuUsers,
  "vozni-park": LuCar,
  plate: LuWallet,
  finansije: LuBanknote,
  skladiste: LuWarehouse,
  "stalna-sredstva": LuLandmark,
};

/** "24.09." from an ISO date or date-time. */
export const kratkiDatum = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;

/** "10:00" from an ISO date-time, or "" when there is no time. */
export const vrijemeIz = (iso: string) => (iso.length > 10 ? iso.slice(11, 16) : "");

/** Whole days from `od` to `do` (both yyyy-mm-dd at the start). */
export const danaIzmedju = (od: string, doDana: string) =>
  Math.round((Date.parse(doDana.slice(0, 10)) - Date.parse(od.slice(0, 10))) / 86_400_000);

/** The labels and counts of a list, most frequent first. */
export const prebroji = (kljucevi: string[]) =>
  [...kljucevi.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map<string, number>())]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
