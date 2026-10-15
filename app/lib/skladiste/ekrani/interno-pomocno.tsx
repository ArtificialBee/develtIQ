import numeracijaData from "~/data/skladiste/numeracija.json";
import zaliheData from "~/data/skladiste/zalihe.json";
import { IZVEDENO, oznaka, putanja } from "~/lib/skladiste/podaci";
import type { DokumentiIzvedenoExport, NumeracijaExport, StanjeRed, ZaliheExport } from "~/lib/skladiste/types";

/**
 * Small pieces the "Unutar skladišta" screens (prenosnice, popisi, korekcije,
 * otpisi) and Početna stanja share, ported from cicak: reading a warehouse
 * document number into the record it names, and the stock row a line stands on.
 */

const NUMERACIJA = numeracijaData as unknown as NumeracijaExport;
const DOKUMENTI_SKLADISTA = oznaka<Record<string, { vrsta: string; naziv: string; lista: string }>>("skladiste/sken.ts", "DOKUMENTI_SKLADISTA");

// Where each kind's records live in the derived export, by the numbering series' subject.
const IZVEDENO_PO_PREDMETU: Record<string, Exclude<keyof DokumentiIzvedenoExport, "rezervacije">> = {
  PRIJEMNICA: "prijemnice",
  IZDATNICA: "izdatnice",
  POVRATNICA: "povratnice",
  OTPREMNICA: "otpremnice",
  PRENOSNICA: "prenosnice",
  KOREKCIJA_ZALIHA: "korekcije",
  POPIS_ZALIHA: "popisi",
  TREBOVANJE: "zahtjevi",
  OTPIS_ZALIHA: "otpisi",
  POCETNO_STANJE_ZALIHA: "pocetnaStanja",
};

/** A warehouse document number read with the numbering series (cicak's `BrojDokumenta`). */
export interface BrojDokumenta {
  predmet: string;
  naziv: string;
  broj: string;
  /** The record that carries the number, in edvin; null when none does. */
  path: string | null;
}

/**
 * cicak's `brojDokumenta(tekst)`: `INV-2026-00002` → the count it names. The
 * prefix picks the warehouse series, the number is read as its `{GGGG}-{NNNNN}`
 * form, and the record is the one that carries that number. Null when the text
 * is no warehouse document number (`Stanje zaliha`, `Mrtva zaliha`, `''`).
 */
export function brojDokumenta(tekst: string): BrojDokumenta | null {
  const upisan = tekst.trim().toUpperCase();
  const dijelovi = /^([A-Z]+)-(\d{4})-(\d+)$/.exec(upisan);
  if (!dijelovi) return null;
  const serija = NUMERACIJA.serije.find((s) => s.aplikacija === NUMERACIJA.aplikacija && s.oznaka === dijelovi[1]);
  const opis = serija ? DOKUMENTI_SKLADISTA[serija.predmet] : undefined;
  if (!serija || !opis) return null;
  const broj = `${dijelovi[1]}-${dijelovi[2]}-${dijelovi[3].padStart(5, "0")}`;
  const zapisi: Record<string, { red: { broj: string } }> = IZVEDENO[IZVEDENO_PO_PREDMETU[serija.predmet]];
  const id = Object.keys(zapisi).find((kljuc) => zapisi[kljuc].red.broj === broj || zapisi[kljuc].red.broj.toUpperCase() === upisan);
  return { predmet: serija.predmet, naziv: opis.naziv, broj, path: id ? putanja(`${opis.lista}/${id}`) : null };
}

const POZICIJE = (zaliheData as unknown as ZaliheExport).pozicije;

/** The stock row an item stands on in a warehouse, location and lot — custody rows left out — as it is today. */
export const pozicijaZaliha = (artikl: string, skladiste: string, lokacija: string, lot: string): StanjeRed | undefined =>
  POZICIJE.find((red) => red.artikl === artikl && red.skladiste === skladiste && red.lokacija === lokacija && red.lot === lot && !red.bezStanja);

