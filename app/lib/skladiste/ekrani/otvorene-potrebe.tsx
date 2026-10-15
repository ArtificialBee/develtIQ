import { Link } from "react-router";
import { StatusBadge } from "~/components/StatusBadge";
import type { TableColumn } from "~/components/Table";
import otvorenePotrebeData from "~/data/skladiste/otvorene-potrebe.json";
import { MALO_SEKUNDARNO, zahtjevUrl } from "~/lib/skladiste/ekrani/zahtjevi";
import { listScreen, type Screen } from "~/lib/skladiste/ekrani";
import { kol, plural } from "~/lib/skladiste/format";
import { NAPOMENE, POJMOVI, SKLADISTA, artikl, oznaka, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { OtvorenaPotreba, PolozajGranice } from "~/lib/skladiste/types";
import { ArtiklCelija } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Nabavka › Otvorene potrebe, from cicak's `OtvorenePotrebePage`:
 * every item × warehouse whose available stock fell below its signal threshold,
 * the lowest against its threshold first, with the open request that already
 * covers it — or a "Predloži" button that puts it on the draft request of
 * proposals. The rows do not open a page of their own.
 */

const POTREBE = otvorenePotrebeData as unknown as OtvorenaPotreba[];
const POLOZAJ_LABELS = oznaka<Record<PolozajGranice, string>>("skladiste/granice.ts", "POLOZAJ_LABELS");

/** The `bezZahtjeva` filter's one value: needs no open request covers yet. */
const BEZ = "bez";

const kljuc = (p: OtvorenaPotreba) => `${p.artikl}-${p.skladiste}`;

const kolone: TableColumn<OtvorenaPotreba>[] = [
  {
    key: "artikl",
    header: "Artikl",
    render: (p) => <ArtiklCelija sifra={p.artikl} naziv={artikl(p.artikl)?.naziv ?? ""} />,
    sortValue: (p) => p.artikl,
    visibility: "w-[28%]",
  },
  { key: "skladiste", header: "Skladište", render: (p) => skladisteNaziv(p.skladiste), sortValue: (p) => p.skladiste, className: "text-gray-600", visibility: "hidden w-[22%] md:table-cell" },
  {
    key: "raspolozivo",
    header: "Raspoloživo",
    align: "right",
    render: (p) => `${kol(p.raspolozivo)} ${artikl(p.artikl)?.jm ?? ""}`,
    sortValue: (p) => p.raspolozivo,
    className: "font-mono font-medium tabular-nums text-gray-900",
    visibility: "w-[11%]",
  },
  {
    key: "granica",
    header: "Signalna · min",
    align: "right",
    render: (p) => `${kol(p.granica.signalna)} · ${kol(p.granica.min)}`,
    sortValue: (p) => p.granica.signalna,
    className: "font-mono tabular-nums",
    visibility: "hidden w-[11%] sm:table-cell",
  },
  {
    key: "polozaj",
    header: "Položaj",
    render: (p) => <StatusBadge tone={p.polozaj === "ISPOD_MINIMUMA" ? "danger" : "warning"}>{POLOZAJ_LABELS[p.polozaj]}</StatusBadge>,
    sortValue: (p) => p.polozaj,
    visibility: "w-[13%]",
  },
  {
    key: "zahtjev",
    header: "Zahtjev",
    render: (p) =>
      p.uZahtjevu ? (
        <Link to={zahtjevUrl(p.uZahtjevu)} className="font-mono font-medium text-[#3B9DF8] hover:underline">
          {p.uZahtjevu.broj}
        </Link>
      ) : (
        <span className="text-gray-500">nijedan otvoren</span>
      ),
    sortValue: (p) => p.uZahtjevu?.broj ?? "",
    visibility: "w-[15%]",
  },
  {
    // "Predloži" adds a line to the draft request of proposals; a covered need has nothing to propose.
    key: "predlozi",
    header: "",
    align: "right",
    render: (p) =>
      p.uZahtjevu ? null : (
        <button type="button" className={MALO_SEKUNDARNO}>
          Predloži
        </button>
      ),
    visibility: "w-[10%]",
  },
];

export const OTVORENE_POTREBE_EKRAN: Screen = listScreen<OtvorenaPotreba>({
  table: {
    title: "Otvorene potrebe",
    description: [
      `${POTREBE.length} ${plural(POTREBE.length, "artikl", "artikla", "artikala")} ispod signalne granice · Predloži kreira stavku nacrta na zahtjevu prijedloga`,
      "Obično: referent skladišta. Prijedlog nije nabavka — količina ostaje prazna dok se ne odluči na zahtjevu.",
      POJMOVI.signalna,
      NAPOMENE.filteriUrl,
    ].join(" · "),
    columns: kolone,
    // Already in cicak's order: the lowest available against its signal threshold first.
    rows: POTREBE,
    getRowKey: kljuc,
    searchText: (p) => [p.artikl, artikl(p.artikl)?.naziv ?? "", p.skladiste, skladisteNaziv(p.skladiste)],
    searchLabel: "Pretraga otvorenih potreba",
    filters: [
      {
        key: "pokrivenost",
        legend: "Pokrivenost",
        options: [{ value: BEZ, label: "Bez zahtjeva" }],
        matches: (p, value) => value === BEZ && p.uZahtjevu === null,
      },
      {
        key: "skladiste",
        legend: "Skladište",
        options: SKLADISTA.map((s) => ({ value: s.sifra, label: `${s.sifra} · ${s.naziv}` })),
        matches: (p, value) => p.skladiste === value,
      },
    ],
    quick: { label: "Filtriraj po pokrivenosti", allLabel: "Sve", several: (count) => `${count} odabrano` },
    sortFields: [
      {
        value: "omjer",
        label: "Raspoloživo / signalna",
        compare: (a, b) => a.raspolozivo / a.granica.signalna - b.raspolozivo / b.granica.signalna,
      },
      { value: "artikl", label: "Artikl", compare: (a, b) => a.artikl.localeCompare(b.artikl) },
      { value: "skladiste", label: "Skladište", compare: (a, b) => a.skladiste.localeCompare(b.skladiste) },
      { value: "raspolozivo", label: "Raspoloživo", compare: (a, b) => a.raspolozivo - b.raspolozivo },
    ],
    noun: "potreba",
  },
});
