import { Link } from "react-router";
import type { RecordView } from "~/components/RecordPage";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import type { TableColumn } from "~/components/Table";
import { listScreen, type Screen } from "~/lib/skladiste/ekrani";
import { datum, km } from "~/lib/skladiste/format";

/**
 * cicak's shared document list (`DokumentiLista`), used by every document register
 * of the warehouse: prijemnice, povratnice, izdatnice, otpremnice, prenosnice,
 * popisi, korekcije, otpisi and početna stanja. One row shape, seven fixed columns,
 * the status, warehouse, kind, value and date filters, newest first, in the app's one table.
 */

/** One document in a register, as cicak's `DokumentRedLista`. */
export interface DokumentRedLista {
  id: string;
  broj: string;
  /** yyyy-mm-dd. */
  datum: string;
  vrsta: string;
  /** "SK-01 · Centralno skladište". */
  skladiste: string;
  strana: string;
  stranaDetalj: string;
  vrijednost: number;
  privremeno: boolean;
  status: string;
  tone: StatusTone;
  statusDetalj: string;
  grupa: string;
  /** More text the search looks through. */
  pretraga: string;
  /** The details page in edvin. */
  path: string;
}

export interface DokumentiListaConfig {
  naslov: string;
  opis: string;
  /** The heading of the column for the other side, such as "Dobavljač". */
  stranaNaslov: string;
  redovi: DokumentRedLista[];
  /** The status groups, as cicak's StatusFilter options. */
  grupe: { value: string; label: string }[];
  /** The main button, such as "Nova prijemnica". */
  novo: string;
  prazno: string;
  /** The register's own note under the table. */
  napomena?: string;
  record?: (id: string) => RecordView | null;
}

const kolone = (stranaNaslov: string): TableColumn<DokumentRedLista>[] => [
  {
    key: "broj",
    header: "Broj",
    render: (red) => (
      <Link to={red.path} className="font-mono font-medium text-gray-900 hover:text-[#3B9DF8]">
        {red.broj}
      </Link>
    ),
    sortValue: (red) => red.broj,
    visibility: "w-[13%]",
  },
  { key: "datum", header: "Datum", render: (red) => datum(red.datum), sortValue: (red) => red.datum, className: "font-mono tabular-nums", visibility: "w-[9%]" },
  { key: "vrsta", header: "Vrsta", render: (red) => red.vrsta, sortValue: (red) => red.vrsta, className: "text-gray-600", visibility: "hidden w-[10%] lg:table-cell" },
  { key: "skladiste", header: "Skladište", render: (red) => red.skladiste, sortValue: (red) => red.skladiste, className: "text-gray-600", visibility: "hidden w-[15%] md:table-cell" },
  {
    key: "strana",
    header: stranaNaslov,
    render: (red) => (
      <span className="block min-w-0">
        <span className="block truncate">{red.strana}</span>
        {red.stranaDetalj && <span className="block truncate text-xs text-gray-500">{red.stranaDetalj}</span>}
      </span>
    ),
    sortValue: (red) => red.strana,
    visibility: "w-[18%]",
  },
  {
    key: "vrijednost",
    header: "Vrijednost",
    align: "right",
    render: (red) => (
      <span className="inline-flex items-center justify-end gap-2">
        {km(red.vrijednost)}
        {red.privremeno && <StatusBadge tone="neutral">privremeno</StatusBadge>}
      </span>
    ),
    sortValue: (red) => red.vrijednost,
    className: "font-mono tabular-nums",
    visibility: "hidden w-[16%] sm:table-cell",
  },
  {
    key: "status",
    header: "Status",
    render: (red) => (
      <span className="block min-w-0">
        <span title={red.status} className="block max-w-full truncate">
          <StatusBadge tone={red.tone}>{red.status}</StatusBadge>
        </span>
        {red.statusDetalj && <span className="mt-0.5 block truncate text-xs text-gray-500">{red.statusDetalj}</span>}
      </span>
    ),
    sortValue: (red) => red.status,
    visibility: "w-[19%]",
  },
];

/** The distinct values of a column, A to Ž, as the options of its filter. */
const opcije = (redovi: DokumentRedLista[], vrijednost: (red: DokumentRedLista) => string) =>
  [...new Set(redovi.map(vrijednost))].filter(Boolean).sort((a, b) => a.localeCompare(b, "bs")).map((v) => ({ value: v, label: v }));

/** A document register as a screen: cicak's columns, filters and order, in the app's one table. */
export function dokumentiLista(config: DokumentiListaConfig): Screen {
  // Newest first, and the higher number first on the same day, as in cicak.
  const redovi = [...config.redovi].sort((a, b) => b.datum.localeCompare(a.datum) || b.broj.localeCompare(a.broj));
  return listScreen<DokumentRedLista>({
    table: {
      title: config.naslov,
      description: [`${config.opis} · ${redovi.length}`, config.napomena].filter(Boolean).join(" · "),
      columns: kolone(config.stranaNaslov),
      rows: redovi,
      getRowKey: (red) => red.id,
      getRowHref: (red) => red.path,
      searchText: (red) => [red.broj, red.strana, red.stranaDetalj, red.vrsta, red.pretraga],
      searchLabel: `Pretraga: ${config.naslov}`,
      filters: [
        {
          key: "grupa",
          legend: "Status",
          options: config.grupe,
          matches: (red, value) => red.grupa === value,
        },
        { key: "skladiste", legend: "Skladište", options: opcije(redovi, (red) => red.skladiste), matches: (red, value) => red.skladiste === value },
        { key: "vrsta", legend: "Vrsta", options: opcije(redovi, (red) => red.vrsta), matches: (red, value) => red.vrsta === value },
      ],
      amountFilters: [{ key: "vrijednost", legend: "Vrijednost", value: (red) => red.vrijednost, unit: "KM" }],
      dateFilters: [{ key: "datum", legend: "Datum", value: (red) => red.datum }],
      quick: { label: "Filtriraj po statusu", allLabel: "Sve", several: (count) => `${count} statusa` },
      buttons: [config.novo, "Izvoz"],
      sortFields: [
        { value: "datum", label: "Datum", compare: (a, b) => a.datum.localeCompare(b.datum) },
        { value: "broj", label: "Broj", compare: (a, b) => a.broj.localeCompare(b.broj) },
        { value: "vrijednost", label: "Vrijednost", compare: (a, b) => a.vrijednost - b.vrijednost },
        { value: "status", label: "Status", compare: (a, b) => a.status.localeCompare(b.status, "bs") },
      ],
      noun: "dokumenata",
    },
    record: config.record,
  });
}
