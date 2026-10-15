import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { DataTable, type DataTableFilter, type SortField } from "~/components/DataTable";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import type { TableColumn } from "~/components/Table";
import izvjestajiData from "~/data/skladiste/izvjestaji.json";
import type { Screen } from "~/lib/skladiste/ekrani";
import { Plocice, Uvod } from "~/lib/skladiste/ekrani/plocice";
import { datum, kol, km } from "~/lib/skladiste/format";
import { NAPOMENE, POJMOVI, artikl, putanja, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { Celija, IzvjestajDef, IzvjestajKljuc, IzvjestajiExport, KolonaIzvjestaja, RedIzvjestaja } from "~/lib/skladiste/types";
import { ArtiklCelija, Napomene } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Izvještaji, from cicak's `IzvjestajPage` (with `TabelaIzvjestaja`,
 * `CelijaIzvjestaja` and `plocice`): one screen for every report. A report is plain
 * data, exported for every Skladište and Period choice, so the screen only picks the
 * instance those two switches name (sva skladišta and 30 days, as in cicak) and
 * draws its three tiles and its table, cell by cell as cicak draws them.
 */

const PODACI = izvjestajiData as unknown as IzvjestajiExport;

/** The `Skladište` choice for every warehouse, as cicak's `SVA` sentinel. */
const SVA = "__sva";

type Instanca = IzvjestajiExport["izvjestaji"][number];

/** The report as computed for a warehouse filter and a period. */
function instanca(kljuc: IzvjestajKljuc, skladiste: string, periodDana: number): Instanca | undefined {
  return PODACI.izvjestaji.find(
    (izv) => izv.kljuc === kljuc && izv.filter.skladiste === skladiste && izv.filter.periodDana === periodDana,
  );
}

/** cicak's `citajPeriod`: one of the offered periods, else the default window. */
function citajPeriod(v: string | null): number {
  const n = Number(v);
  return PODACI.periodiDana.includes(n) ? n : PODACI.zadaniFilter.periodDana;
}

/** The muted second line under a cell's main value; nothing when there is none. */
const Detalj = ({ children }: { children?: string }) =>
  children ? <span className="block truncate text-xs text-gray-500">{children}</span> : null;

/** One report cell, drawn by its kind (cicak's `CelijaIzvjestaja`). */
function CelijaIzvjestaja({ c }: { c: Celija }) {
  switch (c.vrsta) {
    case "artikl":
      // The item's code opens the item, not the row (cicak stops the click at the link).
      return (
        <span className="block min-w-0" onClick={(event) => (event.target as HTMLElement).closest("a") && event.stopPropagation()}>
          <ArtiklCelija sifra={c.sifra} naziv={artikl(c.sifra)?.naziv ?? ""} detalj={c.detalj} />
        </span>
      );
    case "skladiste":
      return <span className="whitespace-nowrap">{skladisteNaziv(c.sifra)}</span>;
    case "kolicina":
      return (
        <span className="font-mono">
          {kol(c.n)}
          {c.jm ? ` ${c.jm}` : ""}
        </span>
      );
    case "iznos":
      return <span className="font-mono">{km(c.n)}</span>;
    case "tekst":
      return (
        <span className="block min-w-0">
          <span className={`block truncate ${c.mono ? "font-mono text-sm" : ""}`}>{c.tekst}</span>
          <Detalj>{c.detalj}</Detalj>
        </span>
      );
    case "datum":
      return (
        <span className="block min-w-0">
          <span className="block whitespace-nowrap">{datum(c.datum)}</span>
          <Detalj>{c.detalj}</Detalj>
        </span>
      );
    case "oznaka":
      return <StatusBadge tone={c.ton}>{c.tekst}</StatusBadge>;
    case "broj":
      return (
        <span className="block min-w-0">
          {c.path ? (
            <Link to={putanja(c.path)} onClick={(event) => event.stopPropagation()} className="font-mono font-medium text-gray-900 hover:text-[#3B9DF8]">
              {c.broj}
            </Link>
          ) : (
            <span className="font-mono text-sm">{c.broj}</span>
          )}
          <Detalj>{c.detalj}</Detalj>
        </span>
      );
    case "na":
      return (
        <span className="block min-w-0">
          <span className="text-gray-500">N/A</span>
          <Detalj>{c.razlog}</Detalj>
        </span>
      );
  }
}

/** What a cell sorts by: its number, else its text; N/A has no value. */
function sortVrijednost(c: Celija | undefined): number | string | null {
  if (!c) return null;
  switch (c.vrsta) {
    case "kolicina":
    case "iznos":
      return c.n;
    case "artikl":
    case "skladiste":
      return c.sifra;
    case "tekst":
    case "oznaka":
      return c.tekst;
    case "datum":
      return c.datum;
    case "broj":
      return c.broj;
    case "na":
      return null;
  }
}

const usporedi = (a: number | string | null, b: number | string | null) =>
  typeof a === "number" && typeof b === "number" ? a - b : String(a ?? "").localeCompare(String(b ?? ""), "bs");

// The wider columns, by what the first row holds in them; the rest share what is left.
const SIRINE: Partial<Record<Celija["vrsta"], string>> = { artikl: "w-[22%]", broj: "w-[15%]", skladiste: "w-[15%]", oznaka: "w-[13%]" };

/** The table's columns from the report's columns, each cell drawn by its kind, plus the row's follow-up link where a row has one. */
function kolone(kolone: readonly KolonaIzvjestaja[], primjer: RedIzvjestaja | undefined, saRadnjama: boolean): TableColumn<RedIzvjestaja>[] {
  const stupci: TableColumn<RedIzvjestaja>[] = kolone.map((kolona, index) => {
    const vrsta = primjer?.celije[index]?.vrsta;
    return {
      key: `k${index}`,
      header: kolona.naslov,
      align: kolona.desno ? "right" : "left",
      render: (red) => {
        const celija = red.celije[index];
        return celija ? <CelijaIzvjestaja c={celija} /> : null;
      },
      sortValue: (red) => sortVrijednost(red.celije[index]) ?? "",
      className: kolona.desno ? "whitespace-nowrap" : "",
      visibility: vrsta ? SIRINE[vrsta] : undefined,
    };
  });
  if (!saRadnjama) return stupci;
  return [
    ...stupci,
    {
      key: "radnje",
      header: "",
      align: "right",
      render: (red) => (
        <span className="inline-flex justify-end gap-3">
          {(red.radnje ?? []).map((radnja) => (
            <Link
              key={radnja.label}
              to={putanja(radnja.path)}
              onClick={(event) => event.stopPropagation()}
              className="whitespace-nowrap text-xs font-medium text-[#3B9DF8] hover:underline"
            >
              {radnja.label}
            </Link>
          ))}
        </span>
      ),
      visibility: "w-[10%]",
    },
  ];
}

/** Everything a report's screen draws that is the same for each of its instances. */
interface Sablon {
  def: IzvjestajDef;
  instance: Instanca[];
  columns: TableColumn<RedIzvjestaja>[];
  filters: DataTableFilter<RedIzvjestaja>[];
  sortFields: SortField<RedIzvjestaja>[];
}

function sablon(kljuc: IzvjestajKljuc): Sablon {
  const def = PODACI.definicije.find((d) => d.kljuc === kljuc);
  if (!def) throw new Error(`Nepoznat izvještaj: ${kljuc}`);
  const instance = PODACI.izvjestaji.filter((izv) => izv.kljuc === kljuc);
  const [prva] = instance;
  const sviRedovi = instance.flatMap((izv) => izv.izvjestaj.redovi);
  const saRadnjama = sviRedovi.some((red) => (red.radnje ?? []).length > 0);
  const naslovi = prva.izvjestaj.kolone;
  // A badge column (Položaj, Status, Signal) filters by its badges, over every instance, so the choice outlives a switch.
  const filters: DataTableFilter<RedIzvjestaja>[] = naslovi.flatMap((kolona, index) => {
    const oznake = new Map<string, StatusTone>();
    for (const red of sviRedovi) {
      const celija = red.celije[index];
      if (celija?.vrsta === "oznaka" && !oznake.has(celija.tekst)) oznake.set(celija.tekst, celija.ton);
    }
    if (oznake.size === 0) return [];
    return [
      {
        key: `k${index}`,
        legend: kolona.naslov,
        options: [...oznake].map(([tekst, ton]) => ({ value: tekst, label: tekst, tone: ton })),
        matches: (red: RedIzvjestaja, value: string) => {
          const celija = red.celije[index];
          return celija?.vrsta === "oznaka" && celija.tekst === value;
        },
      },
    ];
  });
  const sortFields: SortField<RedIzvjestaja>[] = naslovi.map((kolona, index) => ({
    value: `k${index}`,
    label: kolona.naslov,
    compare: (a, b) => usporedi(sortVrijednost(a.celije[index]), sortVrijednost(b.celije[index])),
    isEmpty: (red) => sortVrijednost(red.celije[index]) === null,
  }));
  return { def, instance, columns: kolone(naslovi, sviRedovi[0], saRadnjama), filters, sortFields };
}

/** One report's screen: the note and the two switches, the tiles, the table and the notes. */
function IzvjestajLista({ s }: { s: Sablon }) {
  const { def } = s;
  const [params, setParams] = useSearchParams();
  const skladiste = params.get("skladiste") ?? PODACI.zadaniFilter.skladiste;
  const periodDana = def.period ? citajPeriod(params.get("period")) : PODACI.zadaniFilter.periodDana;
  const izv = instanca(def.kljuc, skladiste, periodDana) ?? instanca(def.kljuc, PODACI.zadaniFilter.skladiste, periodDana) ?? s.instance[0];
  const { izvjestaj } = izv;
  // The same array for the same instance, so the table keeps its page between renders.
  const redovi = useMemo(() => [...izvjestaj.redovi], [izvjestaj]);

  /** Writes the changed keys into the URL, as cicak; an empty value drops the key. */
  const postavi = (izmjene: Record<string, string>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(izmjene)) {
          if (v === "") next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: true },
    );

  // cicak's Skladište and Period switches pick the report's instance; they sit in the table's filter sheet.
  const choices = [
    {
      key: "skladiste",
      legend: "Skladište",
      options: PODACI.skladista.map((sifra) => ({ value: sifra === "" ? SVA : sifra, label: sifra === "" ? "sva skladišta" : skladisteNaziv(sifra) })),
      value: izv.filter.skladiste === "" ? SVA : izv.filter.skladiste,
      onChange: (v: string) => postavi({ skladiste: v === SVA ? "" : v }),
    },
    ...(def.period
      ? [
          {
            key: "period",
            legend: "Period",
            options: PODACI.periodiDana.map((d) => ({ value: String(d), label: `zadnjih ${d} dana` })),
            value: String(periodDana),
            onChange: (v: string) => postavi({ period: Number(v) === PODACI.zadaniFilter.periodDana ? "" : v }),
          },
        ]
      : []),
  ];
  const obuhvat = [
    izv.filter.skladiste === "" ? "sva skladišta" : skladisteNaziv(izv.filter.skladiste),
    def.period ? `od ${datum(izv.periodOd)} do danas` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <Uvod napomena={`${POJMOVI[def.pojam]} ${NAPOMENE.izvjestajSamoCita}`} />
      <Plocice label={`${def.naslov}: pločice`} plocice={izvjestaj.plocice} />
      <DataTable
        title={def.naslov}
        description={[`${def.opis} · ${izvjestaj.redovi.length}`, obuhvat, izvjestaj.redovi.length === 0 ? izvjestaj.prazno : ""].filter(Boolean).join(" · ")}
        columns={s.columns}
        rows={redovi}
        getRowKey={(red) => red.kljuc}
        getRowHref={(red) => putanja(red.path)}
        searchText={(red) => [red.pretraga]}
        searchLabel={`Pretraga: ${def.naslov.toLowerCase()}`}
        filters={s.filters}
        choices={choices}
        quick={s.filters.length > 0 ? { label: `Filtriraj po: ${s.filters[0].legend}`, allLabel: "Sve", several: (n) => `${n} odabrano` } : undefined}
        buttons={["Izvoz"]}
        sortFields={s.sortFields}
        noun="redova"
        fill
        className="min-h-0 flex-1"
      />
      <Napomene uRedu stavke={[NAPOMENE.plociceKomponente, NAPOMENE.naNeIzracunato, ...izvjestaj.napomene, "Red otvara ekran koji radi s tim podatkom"]} />
    </>
  );
}

/** A report's screen, from its key: the generic builder every report uses. */
function izvjestajEkran(kljuc: IzvjestajKljuc): Screen {
  const s = sablon(kljuc);
  const List = () => <IzvjestajLista s={s} />;
  return { List };
}

/** Every report, keyed "izvjestaji/{kljuc}" as in the URL. */
export const IZVJESTAJI_EKRANI: Record<string, Screen> = Object.fromEntries(
  PODACI.definicije.map((def) => [`izvjestaji/${def.kljuc}`, izvjestajEkran(def.kljuc)]),
);
