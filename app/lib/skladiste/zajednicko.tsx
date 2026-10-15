import type { ReactNode } from "react";
import { Link } from "react-router";
import { LuInfo } from "react-icons/lu";
import type { TimelineStep } from "~/components/DetailPage";
import type { StatusTone } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import { vrijeme } from "~/lib/skladiste/format";

/**
 * Parts every warehouse document shares, in the app's design: its way through its
 * steps, its signatures, and its history.
 */

/** A person's signature on a document step. */
export interface Potpis {
  ko: string;
  uloga: string;
  /** ISO time. */
  kad: string;
}

/** One line of a document's history, newest first. */
export interface HistorijaUnos {
  id: string;
  kad: string;
  ko: string;
  radnja: string;
  napomena: string;
}

/** The words for where a step stands, as in cicak's process strip. */
export const TOK_STATUS = { done: "završeno", current: "trenutni korak", next: "predstoji", late: "prekinuto" } as const;

/**
 * A document's way through its steps (cicak's `koraciToka`): steps before `faza`
 * done, the one at `faza` current (or stopped, when `prekinuto`), the rest still to
 * come. A `faza` past the last step means every step is done.
 */
export function tokKoraci(koraci: string[], faza: number, prekinuto = false): TimelineStep[] {
  return koraci.map((naziv, index) => {
    const state: TimelineStep["state"] = index < faza ? "done" : index > faza ? "next" : prekinuto ? "late" : "current";
    return { key: naziv, title: naziv, note: TOK_STATUS[state], state };
  });
}

/** A signature slot of a document: its label, its signature if signed, and who usually signs it. */
export interface PotpisMjesto {
  label: string;
  potpis: Potpis | null;
  /** Who usually takes the step, shown on the first unsigned one. */
  hint?: string;
}

/**
 * The signatures as a line of steps (cicak's `koraciPotpisa`): signed ones done with
 * when and who, the first unsigned one current with who usually signs it (or, when
 * the document was stopped, ending there under `krajLabel`), the rest still to come.
 */
export function potpisiKoraci(mjesta: PotpisMjesto[], prekinuto = false, krajLabel = "Zatvoreno"): TimelineStep[] {
  const prvoPrazno = mjesta.findIndex((mjesto) => !mjesto.potpis);
  return mjesta.map((mjesto, index) => {
    if (mjesto.potpis) {
      return {
        key: mjesto.label,
        title: mjesto.label,
        date: vrijeme(mjesto.potpis.kad),
        note: `${mjesto.potpis.ko} · ${mjesto.potpis.uloga}`,
        state: "done" as const,
      };
    }
    if (index === prvoPrazno) {
      return prekinuto
        ? { key: mjesto.label, title: krajLabel, note: mjesto.hint, state: "late" as const }
        : { key: mjesto.label, title: mjesto.label, note: mjesto.hint, state: "current" as const };
    }
    return { key: mjesto.label, title: mjesto.label, state: "next" as const };
  });
}

/** "4 od 5": how many of the steps are done. */
export const brojac = (koraci: TimelineStep[]) => `${koraci.filter((korak) => korak.state === "done").length} od ${koraci.length}`;

const historijaKolone: TableColumn<HistorijaUnos>[] = [
  { key: "kad", header: "Vrijeme", render: (unos) => vrijeme(unos.kad), className: "whitespace-nowrap font-mono tabular-nums text-gray-500" },
  { key: "ko", header: "Ko", render: (unos) => unos.ko, className: "whitespace-nowrap" },
  { key: "radnja", header: "Radnja", render: (unos) => unos.radnja, className: "font-medium text-gray-900" },
  { key: "napomena", header: "Napomena", render: (unos) => unos.napomena || "—", className: "text-gray-500" },
];

/** A document's history as a tab: when, who, what and the note, newest first. */
export function historijaTab(unosi: HistorijaUnos[]) {
  return {
    key: "historija",
    label: "Historija",
    count: unosi.length,
    content: <Table bare columns={historijaKolone} rows={unosi} getRowKey={(unos) => unos.id} emptyText="Nema zapisa u historiji." />,
  };
}

/** A storno pair's fields on a document (cicak's `StornoPolja`). */
export interface StornoPolja {
  stornoOd?: string;
  razlogStorna?: string;
  storniranBrojem?: string;
}

/** The header badge of a storno pair: "storno · broj" or "Storniran · broj" (cicak's `StornoBadge`). */
export function stornoBadge(dokument: StornoPolja): { label: string; tone: StatusTone } | null {
  if (dokument.stornoOd) return { label: `storno · ${dokument.stornoOd}`, tone: "neutral" };
  if (dokument.storniranBrojem) return { label: `Storniran · ${dokument.storniranBrojem}`, tone: "neutral" };
  return null;
}

/** The notice of a storno pair (cicak's `StornoCallout`); `vrsta` is the kind in the genitive, such as "prijemnice". */
export function stornoCallout(
  dokument: StornoPolja,
  vrsta: string,
  par: { broj: string; path: string } | null,
): { tone: StatusTone; title: string; text: ReactNode } | null {
  const veza = (broj: string) =>
    par ? (
      <Link to={par.path} className="font-mono font-medium underline">
        {par.broj}
      </Link>
    ) : (
      broj
    );
  if (dokument.stornoOd) {
    return {
      tone: "info",
      title: `Storno ${vrsta} ${dokument.stornoOd}`,
      text: (
        <>
          Poništava {veza(dokument.stornoOd)} suprotnim knjiženjem istih količina po istoj vrijednosti · razlog:{" "}
          {dokument.razlogStorna || "—"}. Dokument je samo za čitanje; storno se ne stornira.
        </>
      ),
    };
  }
  if (dokument.storniranBrojem) {
    return {
      tone: "info",
      title: `Stornirana · ${dokument.storniranBrojem}`,
      text: (
        <>
          Storno {veza(dokument.storniranBrojem)} je poništio ovo knjiženje — zaliha, kartica i outbox nose oba reda.
          Dokument je samo za čitanje; ako je potreban ispravan unos, pravi se novi dokument.
        </>
      ),
    };
  }
  return null;
}

/** cicak's closing line while a document can still change. */
export const SLJEDECI_KORAK_NAPOMENA =
  "Tamno dugme je sljedeći korak · ostala dugmad su druge radnje sada · administrator može pritisnuti svaki korak.";

/** The item cell of every line table (cicak's `ArtiklCelija`): the code linking to the item, its name, and a muted second line. */
export const ArtiklCelija = ({ sifra, naziv, detalj }: { sifra: string; naziv: string; detalj?: ReactNode }) => (
  <span className="block min-w-0">
    <span className="block truncate">
      <Link to={`/app/skladiste/zalihe/artikli/${sifra}`} className="font-mono font-medium text-[#3B9DF8] hover:underline">
        {sifra}
      </Link>
      {naziv && <span className="text-gray-900"> · {naziv}</span>}
    </span>
    {detalj && <span className="block truncate text-xs text-gray-500">{detalj}</span>}
  </span>
);

/**
 * cicak's `Napomene`: short explanations, one per line, under a table or a tab. `uRedu` lays
 * them out side by side under a whole page, hidden on short screens where the rows need the room.
 */
export const Napomene = ({ stavke, uRedu = false }: { stavke: ReactNode[]; uRedu?: boolean }) => (
  <ul
    className={
      uRedu
        ? "flex shrink-0 flex-wrap gap-x-5 gap-y-1 px-1 text-xs text-gray-500 [@media(max-height:820px)]:hidden"
        : "shrink-0 space-y-1 text-xs text-gray-500"
    }
  >
    {stavke.map((stavka, index) => (
      <li key={index} className="flex min-w-0 items-start gap-1.5">
        <LuInfo aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        <span>{stavka}</span>
      </li>
    ))}
  </ul>
);
