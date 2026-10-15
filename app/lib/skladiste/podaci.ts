import artikliData from "~/data/skladiste/artikli.json";
import dokumentiIzvedenoData from "~/data/skladiste/dokumenti-izvedeno.json";
import oznakeData from "~/data/skladiste/oznake.json";
import pojmoviData from "~/data/skladiste/pojmovi.json";
import skladistaData from "~/data/skladiste/skladista.json";
import type { Artikl, DokumentiIzvedenoExport, Skladiste } from "~/lib/skladiste/types";

/**
 * The warehouse data exported from divetiq-cicak (`app/data/skladiste`, frozen at
 * 13.10.2026. 08:00), with the lookups every screen needs: items, warehouses,
 * cicak's labels and tones, and the per-document views cicak computes.
 */

export const ARTIKLI = artikliData as unknown as Artikl[];
export const SKLADISTA = skladistaData as unknown as Skladiste[];
export const IZVEDENO = dokumentiIzvedenoData as unknown as DokumentiIzvedenoExport;

const artikliPoSifri = new Map(ARTIKLI.map((artikl) => [artikl.sifra, artikl]));
const skladistaPoSifri = new Map(SKLADISTA.map((skladiste) => [skladiste.sifra, skladiste]));

export const artikl = (sifra: string) => artikliPoSifri.get(sifra);

/** "ART-5120 · Mast EP-2 400 g", as cicak's item cell names an item. */
export const artiklNaziv = (sifra: string) => {
  const nadjen = artikl(sifra);
  return nadjen ? `${sifra} · ${nadjen.naziv}` : sifra;
};

/** "SK-02 · Terensko skladište". */
export const skladisteNaziv = (sifra: string) => {
  const nadjeno = skladistaPoSifri.get(sifra);
  return nadjeno ? `${sifra} · ${nadjeno.naziv}` : sifra;
};

type Oznake = Record<string, Record<string, unknown>>;

/** One of cicak's exported constants, such as `oznaka("skladiste/prijemnice.ts", "PRIJEMNICA_STATUS_LABELS")`. */
export function oznaka<T = Record<string, string>>(modul: string, kljuc: string): T {
  return (oznakeData as unknown as Oznake)[modul]?.[kljuc] as T;
}

const pojmovi = pojmoviData as unknown as { POJMOVI: Record<string, string>; NAPOMENE: Record<string, string> };

/** cicak's glossary (`POJMOVI`), by key: what a term means. */
export const POJMOVI = pojmovi.POJMOVI;

/** cicak's recurring helper lines (`NAPOMENE`), by key. */
export const NAPOMENE = pojmovi.NAPOMENE;

/** cicak's `/skladiste/...` path as edvin's `/app/skladiste/...`. */
export const putanja = (cicakPath: string) => cicakPath.replace(/^\/skladiste\//, "/app/skladiste/");
