import type { IconType } from "react-icons";
import { LuFile, LuFileImage, LuFileSpreadsheet, LuFileText, LuFileType, LuMail, LuPaperclip, LuScrollText, LuUpload } from "react-icons/lu";
import type { RecordView } from "~/components/RecordPage";
import priloziData from "~/data/skladiste/prilozi.json";

/**
 * cicak's attachments card (`PriloziBiblioteke`, "Dokumenti i fotografije (n)") on a
 * warehouse record: every Biblioteka document linked to the record, newest first,
 * each with its name and "datum · status · vN". cicak shows it on Prijemnica and
 * Artikl details; here it is a section after the record's tabs.
 */

/** The file kinds of a library document (cicak `FormatDokumenta`). */
export type FormatPriloga = "PDF" | "SLIKA" | "WORD" | "EXCEL" | "TEKST" | "EMAIL" | "PAPIR" | "OSTALO";

/** One library document linked to a warehouse record (`prilozi.json`). */
export interface PrilogBiblioteke {
  readonly id: string;
  readonly naziv: string;
  /** cicak `VrstaDokumenta`, such as OTPREMNICA or FOTOGRAFIJA. */
  readonly vrsta: string;
  readonly format: FormatPriloga;
  /** cicak `StatusDokumenta`. */
  readonly status: string;
  /** `STATUSI[status]`, such as "Obrađen". */
  readonly statusNaziv: string;
  /** ISO local time, such as `2026-09-19T09:12:00`. */
  readonly kreirano: string;
  /** How many versions the document has. */
  readonly verzija: number;
  readonly kontekst: string;
  readonly autor: { readonly ime: string; readonly uloga: string };
  /** The document's page in cicak's Upravljanje dokumentima (not built here). */
  readonly putanja: string;
  /** The card's line under the name: `19.09.2026. · obrađen · v1`. */
  readonly linija: string;
}

/** `prilozi.json`: the documents of each warehouse record, by the record's own number (PRJ-2026-00014, ART-1001). */
export type PriloziExport = Readonly<Record<string, readonly PrilogBiblioteke[]>>;

const PRILOZI = priloziData as unknown as PriloziExport;

/** The card's description, per record kind, as each cicak details page passes it. */
export const OPIS_PRILOGA = {
  prijemnica: "Otpremnica dobavljača, fotografije robe pri prijemu i zapisnik o oštećenju.",
  artikl: "Tehnički list, certifikati i fotografije artikla.",
} as const;

// The icon cicak's thumbnail shows for a document without a picture (`IKONE_FORMATA`).
const IKONE: Record<FormatPriloga, IconType> = {
  PDF: LuFileText,
  SLIKA: LuFileImage,
  WORD: LuFileType,
  EXCEL: LuFileSpreadsheet,
  TEKST: LuScrollText,
  EMAIL: LuMail,
  PAPIR: LuFile,
  OSTALO: LuFile,
};

/** The documents linked to one record, newest first. */
export const priloziZapisa = (vlasnik: string): readonly PrilogBiblioteke[] => PRILOZI[vlasnik] ?? [];

const Prilozi = ({ dokumenti }: { dokumenti: readonly PrilogBiblioteke[] }) =>
  dokumenti.length === 0 ? (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-[#e5eaf2] px-4 py-6 text-center text-sm text-gray-500">
      <LuUpload aria-hidden className="size-5" />
      Prevucite fotografije ili dokumente ovdje, ili kliknite za izbor.
    </div>
  ) : (
    <ul className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
      {dokumenti.map((d) => {
        const Ikona = IKONE[d.format] ?? LuFile;
        return (
          <li key={d.id} title={d.kontekst} className="flex min-w-0 flex-col gap-1">
            <span className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-[#e5eaf2] bg-gray-50">
              <Ikona aria-hidden className="size-10 text-gray-400" strokeWidth={1.5} />
            </span>
            <span className="truncate text-xs font-medium text-gray-900">{d.naziv}</span>
            <span className="truncate text-xs text-gray-500">{d.linija}</span>
          </li>
        );
      })}
    </ul>
  );

/**
 * The attachments section of a warehouse record: "Dokumenti i fotografije (n)" with
 * the card's description and the documents, or cicak's empty drop zone text.
 * `vlasnik` is the record's own number, as cicak links it: a receipt's `broj`
 * (PRJ-2026-00014) or an item's `sifra` (ART-1001).
 */
export function priloziSekcija(vlasnik: string, opis?: string): NonNullable<RecordView["sections"]>[number] {
  const dokumenti = priloziZapisa(vlasnik);
  return {
    icon: LuPaperclip,
    title: "Dokumenti i fotografije",
    // cicak prints the count only when there is something.
    count: dokumenti.length > 0 ? dokumenti.length : undefined,
    description: opis ?? (vlasnik.startsWith("ART-") ? OPIS_PRILOGA.artikl : vlasnik.startsWith("PRJ-") ? OPIS_PRILOGA.prijemnica : undefined),
    content: <Prilozi dokumenti={dokumenti} />,
  };
}
