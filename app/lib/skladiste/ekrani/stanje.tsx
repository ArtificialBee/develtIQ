import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { DataTable } from "~/components/DataTable";
import { StatusBadge } from "~/components/StatusBadge";
import type { TableColumn } from "~/components/Table";
import zaliheData from "~/data/skladiste/zalihe.json";
import type { Screen } from "~/lib/skladiste/ekrani";
import { km, kol, plural } from "~/lib/skladiste/format";
import { NAPOMENE, SKLADISTA, artikl, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { PolozajGranice, StanjeRed, ZaliheExport, ZbirArtikla } from "~/lib/skladiste/types";
import { ArtiklCelija, Napomene } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Zalihe › Stanje zaliha, from cicak's `StanjeZalihaPage`: stock per
 * item, warehouse, location and lot (or summed per item), the Granice chips, the
 * Skladište and Lokacija filters, the result count and the value shown. As in
 * cicak every filter lives in the URL (`skladiste`, `lokacija`, `artikl`,
 * `granice`, `prikaz`), so a card or a row elsewhere can open an already filtered
 * list, such as the home card's `?granice=ispod-signalne`. A row opens the item.
 */

const ZALIHE = zaliheData as unknown as ZaliheExport;
const STANJE = ZALIHE.pozicije;

/** A row of a warehouse without locations; kept in the URL as-is. */
const BEZ_LOKACIJE = "—";

/** The `granice` query value: which side of the thresholds the rows must be on. */
type Granice = "sve" | "ispod-signalne" | "ispod-minimuma";
const GRANICE: { key: Granice; label: string }[] = [
  { key: "sve", label: "Sve" },
  { key: "ispod-signalne", label: "Ispod signalne" },
  { key: "ispod-minimuma", label: "Ispod minimuma" },
];
const citajGranice = (v: string | null): Granice => (v === "ispod-signalne" || v === "ispod-minimuma" ? v : "sve");

/** The `prikaz` query value: every position, or one line per item summed over the filter. */
type Prikaz = "pozicije" | "artikli";

/** Whether a position against the thresholds satisfies the chip. */
function uGranicama(p: PolozajGranice | null | undefined, granice: Granice): boolean {
  if (granice === "sve") return true;
  if (!p) return false;
  if (granice === "ispod-minimuma") return p === "ISPOD_MINIMUMA";
  return p === "ISPOD_MINIMUMA" || p === "ISPOD_SIGNALNE";
}

// Where every item × warehouse aggregate stands against its thresholds.
const POLOZAJI = new Map(ZALIHE.poArtikluISkladistu.map((a) => [`${a.artikl}|${a.skladiste}`, a.polozaj]));

const r2 = (n: number) => Math.round(n * 100) / 100;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** Sums the rows into one line per item — the company-wide figure the catalogue shows (cicak's `grupisiPoArtiklu`). */
function grupisiPoArtiklu(redovi: readonly StanjeRed[]): ZbirArtikla[] {
  const mapa = new Map<
    string,
    { naStanju: number; blokirano: number; rezervisano: number; raspolozivo: number; vrijednost: number; privremeno: boolean; pozicija: number; poSkladistu: Map<string, number> }
  >();
  for (const r of redovi) {
    const g = mapa.get(r.artikl) ?? {
      naStanju: 0,
      blokirano: 0,
      rezervisano: 0,
      raspolozivo: 0,
      vrijednost: 0,
      privremeno: false,
      pozicija: 0,
      poSkladistu: new Map<string, number>(),
    };
    if (!r.bezStanja) {
      g.naStanju += r.naStanju;
      g.poSkladistu.set(r.skladiste, (g.poSkladistu.get(r.skladiste) ?? 0) + r.naStanju);
    }
    g.blokirano += r.blokirano;
    g.rezervisano += r.rezervisano;
    g.raspolozivo += r.raspolozivo;
    g.vrijednost += r.vrijednost;
    g.privremeno = g.privremeno || r.privremeno;
    g.pozicija += 1;
    mapa.set(r.artikl, g);
  }
  return [...mapa.entries()]
    .map(([sifra, g]) => ({
      artikl: sifra,
      naStanju: r3(g.naStanju),
      blokirano: r3(g.blokirano),
      rezervisano: r3(g.rezervisano),
      raspolozivo: r3(g.raspolozivo),
      vrijednost: r2(g.vrijednost),
      privremeno: g.privremeno,
      pozicija: g.pozicija,
      poSkladistu: [...g.poSkladistu.entries()]
        .map(([skladiste, naStanju]) => ({ skladiste, naStanju: r3(naStanju) }))
        .sort((a, b) => a.skladiste.localeCompare(b.skladiste)),
    }))
    .sort((a, b) => a.artikl.localeCompare(b.artikl));
}

const NAPOMENA_ZAMRZNUTO = "Zamrznuta pozicija (popis u toku) ne prima korekciju — razlika se knjiži kroz popis.";
const NAPOMENA_PO_ARTIKLU =
  "Po artiklu: jedan red je zbir svih skladišta, lokacija i lotova u filteru — ukupna zaliha firme za taj artikl. „Prikaži pozicije“ otvara redove iza njega.";

const artiklUrl = (sifra: string) => `/app/skladiste/zalihe/artikli/${sifra}`;
const NUM = "font-mono tabular-nums";

/** The value cell: the amount with a "privremeno" badge, or "bez stanja" for a row that holds goods but bears no stock. */
const Vrijednost = ({ iznos, privremeno, bezStanja = false }: { iznos: number; privremeno: boolean; bezStanja?: boolean }) =>
  bezStanja ? (
    <span className="text-gray-500">bez stanja</span>
  ) : (
    <span className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
      <span className="font-mono tabular-nums">{km(iznos)}</span>
      {privremeno && <StatusBadge tone="neutral">privremeno</StatusBadge>}
    </span>
  );

const koloneDijeljene = <T extends { naStanju: number; blokirano: number; rezervisano: number; raspolozivo: number; vrijednost: number }>(
  blokirano: TableColumn<T>["render"],
): TableColumn<T>[] => [
  { key: "naStanju", header: "Na stanju", align: "right", render: (r) => kol(r.naStanju), sortValue: (r) => r.naStanju, className: NUM, visibility: "hidden w-[8%] md:table-cell" },
  { key: "blokirano", header: "Blokirano", align: "right", render: blokirano, sortValue: (r) => r.blokirano, className: NUM, visibility: "hidden w-[8%] lg:table-cell" },
  { key: "rezervisano", header: "Rezervisano", align: "right", render: (r) => kol(r.rezervisano), sortValue: (r) => r.rezervisano, className: NUM, visibility: "hidden w-[9%] lg:table-cell" },
  { key: "raspolozivo", header: "Raspoloživo", align: "right", render: (r) => kol(r.raspolozivo), sortValue: (r) => r.raspolozivo, className: `${NUM} font-medium text-gray-900`, visibility: "w-[9%]" },
];

const kolonePozicija: TableColumn<StanjeRed>[] = [
  {
    key: "artikl",
    header: "Artikl",
    render: (r) => <ArtiklCelija sifra={r.artikl} naziv={artikl(r.artikl)?.naziv ?? ""} detalj={r.napomena || (r.lot ? `lot ${r.lot}` : "bez praćenja")} />,
    sortValue: (r) => r.artikl,
    visibility: "w-[26%]",
  },
  { key: "skladiste", header: "Skladište", render: (r) => skladisteNaziv(r.skladiste), sortValue: (r) => r.skladiste, className: "text-gray-600", visibility: "hidden w-[16%] md:table-cell" },
  {
    key: "lokacija",
    header: "Lokacija",
    render: (r) => (r.lokacija ? <span className="font-mono">{r.lokacija}</span> : <span className="text-gray-500">— bez lokacija</span>),
    sortValue: (r) => r.lokacija,
    visibility: "hidden w-[10%] sm:table-cell",
  },
  ...koloneDijeljene<StanjeRed>((r) =>
    // The note says why the quantity is held: a running count, a quality check, transit or a return's custody.
    r.napomena !== "" && (r.blokirano > 0 || r.bezStanja) ? (
      <span title={r.napomena} className="cursor-help underline decoration-dotted underline-offset-4">
        {kol(r.blokirano)}
      </span>
    ) : (
      kol(r.blokirano)
    ),
  ),
  {
    key: "vrijednost",
    header: "Vrijednost",
    align: "right",
    render: (r) => <Vrijednost iznos={r.vrijednost} privremeno={r.privremeno} bezStanja={r.bezStanja} />,
    sortValue: (r) => r.vrijednost,
    visibility: "hidden w-[14%] sm:table-cell",
  },
];

const sortPozicija = [
  { value: "artikl", label: "Artikl", compare: (a: StanjeRed, b: StanjeRed) => a.artikl.localeCompare(b.artikl) },
  { value: "skladiste", label: "Skladište", compare: (a: StanjeRed, b: StanjeRed) => a.skladiste.localeCompare(b.skladiste) },
  { value: "lokacija", label: "Lokacija", compare: (a: StanjeRed, b: StanjeRed) => a.lokacija.localeCompare(b.lokacija) },
  { value: "naStanju", label: "Na stanju", compare: (a: StanjeRed, b: StanjeRed) => a.naStanju - b.naStanju },
  { value: "raspolozivo", label: "Raspoloživo", compare: (a: StanjeRed, b: StanjeRed) => a.raspolozivo - b.raspolozivo },
  { value: "vrijednost", label: "Vrijednost", compare: (a: StanjeRed, b: StanjeRed) => a.vrijednost - b.vrijednost },
];

const sortGrupa = [
  { value: "artikl", label: "Artikl", compare: (a: ZbirArtikla, b: ZbirArtikla) => a.artikl.localeCompare(b.artikl) },
  { value: "pozicija", label: "Pozicija", compare: (a: ZbirArtikla, b: ZbirArtikla) => a.pozicija - b.pozicija },
  { value: "naStanju", label: "Na stanju", compare: (a: ZbirArtikla, b: ZbirArtikla) => a.naStanju - b.naStanju },
  { value: "raspolozivo", label: "Raspoloživo", compare: (a: ZbirArtikla, b: ZbirArtikla) => a.raspolozivo - b.raspolozivo },
  { value: "vrijednost", label: "Vrijednost", compare: (a: ZbirArtikla, b: ZbirArtikla) => a.vrijednost - b.vrijednost },
];

/** The filters of the list, all on the positions, so "Po artiklu" sums only what they leave. */
type Kljuc = "granice" | "skladiste" | "lokacija" | "artikl";
const KLJUCEVI: Kljuc[] = ["granice", "skladiste", "lokacija", "artikl"];

/** Whether a position holds one ticked value of a filter. */
function odgovara(r: StanjeRed, kljuc: Kljuc, vrijednost: string): boolean {
  if (kljuc === "granice") return uGranicama(POLOZAJI.get(`${r.artikl}|${r.skladiste}`), citajGranice(vrijednost));
  if (kljuc === "skladiste") return r.skladiste === vrijednost;
  if (kljuc === "lokacija") return (r.lokacija || BEZ_LOKACIJE) === vrijednost;
  return r.artikl === vrijednost;
}

/** The positions every filter lets through: any ticked value of a filter, and every filter. */
const filtriraj = (odabrano: Record<Kljuc, string[]>) =>
  STANJE.filter((r) => KLJUCEVI.every((k) => odabrano[k].length === 0 || odabrano[k].some((v) => odgovara(r, k, v))));

/** "Sva skladišta", one name, or how many are ticked. */
const opisOdabira = (vrijednosti: string[], sve: string | null, jedan: (v: string) => string, vise: string) =>
  vrijednosti.length === 0 ? sve : vrijednosti.length === 1 ? jedan(vrijednosti[0]) : `${vrijednosti.length} ${vise}`;

/**
 * The Stanje zaliha screen: cicak's view switch and filters in the app's one table.
 * The filters and "Prikaz" sit in its filter sheet, Granice also in its quick dropdown;
 * all of them stay in the URL as in cicak.
 */
function StanjeZaliha() {
  const [params, setParams] = useSearchParams();
  const procitaj = (k: string) => (params.get(k) ?? "").split(",").filter(Boolean);
  const odabrano: Record<Kljuc, string[]> = {
    granice: procitaj("granice").filter((v) => citajGranice(v) !== "sve"),
    skladiste: procitaj("skladiste"),
    lokacija: procitaj("lokacija"),
    artikl: procitaj("artikl"),
  };
  const prikaz: Prikaz = params.get("prikaz") === "artikli" ? "artikli" : "pozicije";
  const kljucUrla = params.toString();

  /** Writes the changed keys into the URL; an empty value drops the key. */
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

  // Re-read only when the URL changes, so the table keeps its page between renders.
  const redovi = useMemo(() => filtriraj(odabrano), [kljucUrla]);
  const grupe = useMemo(() => grupisiPoArtiklu(redovi), [redovi]);

  // Locations of the ticked warehouses, as cicak's Lokacija list follows the Skladište choice.
  const lokacije = [
    ...new Set(STANJE.filter((r) => odabrano.skladiste.length === 0 || odabrano.skladiste.includes(r.skladiste)).map((r) => r.lokacija || BEZ_LOKACIJE)),
  ].sort();
  const artikliNaStanju = [...new Set(STANJE.map((r) => r.artikl))].sort();

  // How many rows each value holds in the view shown: positions, or items in "Po artiklu".
  const broj = (kljuc: Kljuc, vrijednost: string) => {
    const pozicije = STANJE.filter((r) => odgovara(r, kljuc, vrijednost));
    return prikaz === "artikli" ? new Set(pozicije.map((r) => r.artikl)).size : pozicije.length;
  };
  const opcije = (kljuc: Kljuc, lista: { value: string; label: string }[]) => lista.map((o) => ({ ...o, count: broj(kljuc, o.value) }));
  const filters = [
    { key: "granice", legend: "Granice", options: opcije("granice", GRANICE.filter((g) => g.key !== "sve").map((g) => ({ value: g.key, label: g.label }))) },
    { key: "skladiste", legend: "Skladište", options: opcije("skladiste", SKLADISTA.map((sk) => ({ value: sk.sifra, label: `${sk.sifra} · ${sk.naziv}` }))) },
    { key: "lokacija", legend: "Lokacija", options: opcije("lokacija", lokacije.map((l) => ({ value: l, label: l === BEZ_LOKACIJE ? "— bez lokacija" : l }))) },
    { key: "artikl", legend: "Artikl", options: opcije("artikl", artikliNaStanju.map((a) => ({ value: a, label: `${a} · ${artikl(a)?.naziv ?? ""}` }))) },
  ];

  /** Saves the sheet's ticks in the URL. A new warehouse choice clears the locations, as in cicak. */
  const sacuvaj = (vrijednosti: Record<string, string[]>) => {
    const skladisteNovo = vrijednosti.skladiste ?? [];
    const promijenjenoSkladiste = skladisteNovo.join(",") !== odabrano.skladiste.join(",");
    postavi({
      granice: (vrijednosti.granice ?? []).join(","),
      skladiste: skladisteNovo.join(","),
      lokacija: promijenjenoSkladiste ? "" : (vrijednosti.lokacija ?? []).join(","),
      artikl: (vrijednosti.artikl ?? []).join(","),
    });
  };

  const podnaslov = [
    opisOdabira(odabrano.skladiste, "Sva skladišta", skladisteNaziv, "skladišta"),
    opisOdabira(odabrano.lokacija, null, (l) => (l === BEZ_LOKACIJE ? "bez lokacija" : `lokacija ${l}`), "lokacije"),
    opisOdabira(odabrano.artikl, null, (a) => `artikl ${a}`, "artikla"),
  ]
    .filter((dio) => dio !== null)
    .join(" · ");
  const opis = `${prikaz === "artikli" ? "Zbirno po artiklu, sva skladišta u filteru" : "Po artiklu, skladištu, lokaciji i lotu"} · ${podnaslov}`;
  /** cicak's line beside its filters: what is left, and its value. */
  const sazetak = (n: number, vrijednost: number) => `${opis} · ${n} ${plural(n, "rezultat", "rezultata", "rezultata")} · Vrijednost prikazanog: ${km(vrijednost)}`;
  const napomene = [
    ...(prikaz === "artikli" ? [NAPOMENA_PO_ARTIKLU] : []),
    NAPOMENE.formulaRaspolozivo,
    NAPOMENE.karantinBezStanja,
    NAPOMENE.popisZamrzava,
    NAPOMENA_ZAMRZNUTO,
    NAPOMENE.filteriUrl,
  ];
  const zajednicko = {
    title: "Stanje zaliha",
    searchLabel: "Pretraga zaliha",
    filters,
    filterValues: odabrano,
    onFiltersChange: sacuvaj,
    quick: { label: "Filtriraj po granicama", allLabel: "Sve granice", several: (n: number) => `${n} granice` },
    choices: [
      {
        key: "prikaz",
        legend: "Prikaz",
        options: [
          { value: "pozicije", label: "Pozicije" },
          { value: "artikli", label: "Po artiklu" },
        ],
        value: prikaz,
        onChange: (v: string) => postavi({ prikaz: v === "artikli" ? "artikli" : "" }),
      },
    ],
    buttons: ["Premjesti na lokaciju", "Nova korekcija", "Izvoz"],
    fill: true,
    className: "min-h-0 flex-1",
  };

  const koloneGrupa: TableColumn<ZbirArtikla>[] = [
    {
      key: "artikl",
      header: "Artikl",
      render: (g) => <ArtiklCelija sifra={g.artikl} naziv={artikl(g.artikl)?.naziv ?? ""} detalj={`${artikl(g.artikl)?.jm ?? ""} · zbir svih skladišta u filteru`} />,
      sortValue: (g) => g.artikl,
      visibility: "w-[24%]",
    },
    {
      key: "skladista",
      header: "Skladišta",
      render: (g) => (
        <span className="block min-w-0">
          <span className="block truncate">
            {g.poSkladistu.length} {plural(g.poSkladistu.length, "skladište", "skladišta", "skladišta")}
          </span>
          <span className="block truncate font-mono text-xs text-gray-500">
            {g.poSkladistu.map((sk) => `${sk.skladiste} ${kol(sk.naStanju)}`).join(" · ") || "bez stanja"}
          </span>
        </span>
      ),
      sortValue: (g) => g.poSkladistu.length,
      visibility: "hidden w-[16%] md:table-cell",
    },
    { key: "pozicija", header: "Pozicija", align: "right", render: (g) => String(g.pozicija), sortValue: (g) => g.pozicija, className: NUM, visibility: "hidden w-[7%] md:table-cell" },
    ...koloneDijeljene<ZbirArtikla>((g) => kol(g.blokirano)),
    {
      key: "vrijednost",
      header: "Vrijednost",
      align: "right",
      render: (g) => <Vrijednost iznos={g.vrijednost} privremeno={g.privremeno} />,
      sortValue: (g) => g.vrijednost,
      visibility: "hidden w-[13%] sm:table-cell",
    },
    {
      key: "pozicije",
      header: "",
      align: "right",
      // cicak's row menu "Prikaži pozicije": this item's rows, in the positions view.
      render: (g) => (
        <button
          type="button"
          onClick={() => postavi({ artikl: g.artikl, prikaz: "" })}
          className="whitespace-nowrap rounded text-xs font-medium text-[#3B9DF8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]"
        >
          Prikaži pozicije
        </button>
      ),
      visibility: "hidden w-[11%] xl:table-cell",
    },
  ];

  return (
    <>
      {/* One table for both views, so the open sheet, search and sort stay when "Prikaz" changes. */}
      {prikaz === "artikli" ? (
        <DataTable<ZbirArtikla>
          {...zajednicko}
          description={(shown) => sazetak(shown.length, shown.reduce((a, g) => a + g.vrijednost, 0))}
          columns={koloneGrupa}
          rows={grupe}
          total={new Set(STANJE.map((r) => r.artikl)).size}
          getRowKey={(g) => g.artikl}
          getRowHref={(g) => artiklUrl(g.artikl)}
          searchText={(g) => [
            `${g.artikl} ${artikl(g.artikl)?.naziv ?? ""}`,
            ...redovi.filter((r) => r.artikl === g.artikl).map((r) => `${r.lot} ${r.lokacija}`),
          ]}
          sortFields={sortGrupa}
          noun="artikala"
        />
      ) : (
        <DataTable<StanjeRed>
          {...zajednicko}
          description={(shown) => sazetak(shown.length, shown.reduce((a, r) => a + r.vrijednost, 0))}
          columns={kolonePozicija}
          rows={redovi}
          total={STANJE.length}
          getRowKey={(r) => r.kljuc}
          getRowHref={(r) => artiklUrl(r.artikl)}
          searchText={(r) => [`${r.artikl} ${artikl(r.artikl)?.naziv ?? ""} ${r.lot} ${r.lokacija}`]}
          sortFields={sortPozicija}
          noun="pozicija"
        />
      )}

      <Napomene stavke={[...napomene, "Red otvara detalj artikla"]} />
    </>
  );
}

export const STANJE_EKRAN: Screen = { List: StanjeZaliha };
