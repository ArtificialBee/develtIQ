import { useState } from "react";
import {
  LuArrowDownToLine,
  LuArrowRight,
  LuArrowUpFromLine,
  LuBoxes,
  LuCoins,
  LuFileText,
  LuInfo,
  LuMap,
  LuPackageOpen,
  LuShieldAlert,
  LuTriangleAlert,
  LuUserRound,
  LuWarehouse,
} from "react-icons/lu";
import { Link } from "react-router";
import { CHART_PALETTE } from "~/components/Chart";
import { DetailSection, type DetailTile } from "~/components/DetailPage";
import type { RecordView } from "~/components/RecordPage";
import { StatusBadge } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import korisniciData from "~/data/skladiste/korisnici.json";
import lokacijeData from "~/data/skladiste/lokacije.json";
import pocetnaStanjaData from "~/data/skladiste/pocetna-stanja.json";
import prostorijeData from "~/data/skladiste/prostorije.json";
import radneLokacijeData from "~/data/skladiste/radne-lokacije.json";
import shemeData from "~/data/skladiste/sheme.json";
import sifrarniciIzvedenoData from "~/data/skladiste/sifrarnici-izvedeno.json";
import zaliheData from "~/data/skladiste/zalihe.json";
import { ekranUrl, listScreen, type Screen } from "~/lib/skladiste/ekrani";
import { datum, kol, km } from "~/lib/skladiste/format";
import { NAPOMENE, SKLADISTA, artikl, artiklNaziv, oznaka, putanja } from "~/lib/skladiste/podaci";
import type {
  DokumentRed,
  KorisniciExport,
  Lokacija,
  PocetnoStanje,
  Polje,
  RadnaLokacija,
  SedmicaPrometa,
  ShemaSkladista,
  ShemeExport,
  SifrarniciIzvedenoExport,
  Skladiste,
  SkladistePregled,
  StanjeRed,
  VrstaLokacije,
  ZaliheExport,
} from "~/lib/skladiste/types";

/**
 * Skladište › Postavke › Skladišta i lokacije, from cicak's `SkladistaPage`,
 * `SkladisteDetaljPage` and the warehouse visuals of `ShemaSkladista`: the same
 * register, master data, tiles, locations, stock, documents, floor plan and
 * weekly movement, in the app's list and record layout.
 */

const LOKACIJE = lokacijeData as unknown as Lokacija[];
const RADNE_LOKACIJE = radneLokacijeData as unknown as RadnaLokacija[];
const POCETNA_STANJA = pocetnaStanjaData as unknown as PocetnoStanje[];
const SHEME = shemeData as unknown as ShemeExport;
const ZALIHE = zaliheData as unknown as ZaliheExport;
const KORISNICI = korisniciData as unknown as KorisniciExport;
/** What the list and detail pages compute per warehouse. */
const PREGLED = (sifrarniciIzvedenoData as unknown as SifrarniciIzvedenoExport).skladista as Readonly<Record<string, SkladistePregled>>;

/** The rooms the warehouses stand in, by id (Matični podaci). */
const PROSTORIJE = new Map((prostorijeData as { id: string; naziv: string }[]).map((x) => [x.id, x.naziv]));
/** A room's name, or its id for one the register does not know (cicak's `nazivProstorije`). */
const nazivProstorije = (id: string) => PROSTORIJE.get(id) ?? id;

const VRSTA_LABELS = oznaka<Record<Skladiste["vrsta"], string>>("skladiste/sifrarnici.ts", "SKLADISTE_VRSTA_LABELS");
const LOKACIJA_VRSTA_LABELS = oznaka<Record<VrstaLokacije, string>>("skladiste/sifrarnici.ts", "LOKACIJA_VRSTA_LABELS");
const SISTEMSKE = [
  oznaka<string>("skladiste/sifrarnici.ts", "KARANTIN_LOKACIJA"),
  oznaka<string>("skladiste/sifrarnici.ts", "RETURN_HOLD_LOKACIJA"),
  oznaka<string>("skladiste/sifrarnici.ts", "TRANZIT_LOKACIJA"),
];

const url = (sifra?: string) => ekranUrl("postavke", "skladista", sifra);
const ZALIHE_URL = ekranUrl("zalihe", "stanje");

/** The system locations every warehouse with locations carries; never deleted (cicak's `jeSistemskaLokacija`). */
const jeSistemska = (sifra: string) => SISTEMSKE.includes(sifra);

/** A warehouse's locations, system ones last, then by code (cicak's `sveLokacijeSkladista`). */
const lokacijeSkladista = (skladiste: string) =>
  LOKACIJE.filter((l) => l.skladiste === skladiste).sort(
    (a, b) => Number(jeSistemska(a.sifra)) - Number(jeSistemska(b.sifra)) || a.sifra.localeCompare(b.sifra),
  );

/** "Ime Prezime" of the responsible person from HR; the bare id for an unknown one (cicak's `imeOdgovorne`). */
const imeOdgovorne = (s: Skladiste) => {
  const z = KORISNICI.odgovorne.find((osoba) => osoba.id === s.odgovorna);
  return z ? `${z.ime} ${z.prezime}` : s.odgovorna;
};

/** The company location's name, or its code (cicak's `nazivLokacije`). */
const nazivRadneLokacije = (sifra: string) => RADNE_LOKACIJE.find((l) => l.sifra === sifra)?.nazivBs ?? sifra;

/** "SK-02 · Terensko skladište" for a warehouse code. */
const nazivSkladista = (sifra: string) => SKLADISTA.find((s) => s.sifra === sifra)?.naziv ?? "";

/** Stock of a shelf, as Stanje zaliha opens it. */
const naPolici = (skladiste: string, lokacija: string) =>
  `${ZALIHE_URL}?skladiste=${encodeURIComponent(skladiste)}&lokacija=${encodeURIComponent(lokacija)}`;

/** Statuses (as `DokumentRed.status`) after which a document no longer moves goods (cicak's detail page `ZATVORENI`). */
const ZATVORENI = new Set([
  "Proknjiženo",
  "Predano",
  "Otkazano",
  "Otkazana",
  "Otkazan",
  "Odbijeno",
  "Isporučena · potpisano",
  "Prenesena",
  "Proknjižen",
  "Stornirano",
]);

const LINK = "text-[#3B9DF8] hover:underline";

// ─── List ────────────────────────────────────────────────────────────────────

interface SkladisteRed {
  s: Skladiste;
  mjesto: string;
  odgovorna: string;
  lokacija: number;
  redova: number;
  vrijednost: number;
}

const REDOVI: SkladisteRed[] = SKLADISTA.map((s) => {
  const pregled = PREGLED[s.sifra];
  return {
    s,
    mjesto: pregled.mjesto,
    odgovorna: imeOdgovorne(s),
    lokacija: pregled.lokacija,
    redova: pregled.redova,
    vrijednost: pregled.vrijednost,
  };
});

const kolone: TableColumn<SkladisteRed>[] = [
  {
    key: "sifra",
    header: "Šifra",
    render: (red) => (
      <Link to={url(red.s.sifra)} className="font-mono font-medium text-[#3B9DF8] hover:underline">
        {red.s.sifra}
      </Link>
    ),
    sortValue: (red) => red.s.sifra,
    visibility: "w-[9%]",
  },
  {
    key: "naziv",
    header: "Naziv",
    render: (red) => (
      <span className="block min-w-0">
        <span className="block truncate font-medium text-gray-900">{red.s.naziv}</span>
        <span className="block truncate text-xs text-gray-500">{red.mjesto}</span>
      </span>
    ),
    sortValue: (red) => red.s.naziv,
    visibility: "w-[27%]",
  },
  {
    key: "vrsta",
    header: "Vrsta",
    render: (red) => (
      <>
        {VRSTA_LABELS[red.s.vrsta]}
        {red.s.nadredjeno && <span className="text-xs text-gray-500"> · {red.s.nadredjeno}</span>}
      </>
    ),
    sortValue: (red) => VRSTA_LABELS[red.s.vrsta],
    visibility: "hidden w-[14%] md:table-cell",
  },
  {
    key: "lokacije",
    header: "Lokacije",
    render: (red) => (red.s.lokacije ? <span className="font-mono">{red.lokacija}</span> : <span className="text-gray-500">bez lokacija</span>),
    sortValue: (red) => (red.s.lokacije ? red.lokacija : -1),
    visibility: "hidden w-[9%] lg:table-cell",
  },
  { key: "odgovorna", header: "Odgovorna osoba", render: (red) => red.odgovorna, sortValue: (red) => red.odgovorna, visibility: "hidden w-[14%] lg:table-cell" },
  {
    key: "redova",
    header: "Pozicije zaliha",
    align: "right",
    render: (red) => String(red.redova),
    sortValue: (red) => red.redova,
    className: "font-mono tabular-nums",
    visibility: "hidden w-[10%] sm:table-cell",
  },
  {
    key: "vrijednost",
    header: "Vrijednost zalihe",
    align: "right",
    render: (red) => km(red.vrijednost),
    sortValue: (red) => red.vrijednost,
    className: "font-mono tabular-nums",
    visibility: "w-[12%]",
  },
  {
    key: "aktivno",
    header: "Aktivno",
    render: (red) => <StatusBadge tone={red.s.aktivno ? "success" : "neutral"}>{red.s.aktivno ? "Da" : "Ne"}</StatusBadge>,
    sortValue: (red) => (red.s.aktivno ? 1 : 0),
    visibility: "w-[8%]",
  },
];

// ─── Record: the tabs ────────────────────────────────────────────────────────

/** A tab's helper lines, as cicak's `Napomene` under its table. */
const Napomene = ({ stavke, desno }: { stavke: string[]; desno?: string }) => (
  <div className="flex flex-wrap items-start gap-x-4 gap-y-2 border-t border-[#e5eaf2] px-3 pt-3">
    <ul className="space-y-1 text-xs text-gray-500">
      {stavke.map((stavka) => (
        <li key={stavka} className="flex items-start gap-2">
          <LuInfo aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {stavka}
        </li>
      ))}
    </ul>
    {desno && <span className="ml-auto text-xs text-gray-500">{desno}</span>}
  </div>
);

interface LokacijaRed {
  l: Lokacija;
  redovi: StanjeRed[];
}

const lokacijeKolone = (skladiste: string): TableColumn<LokacijaRed>[] => [
  {
    key: "sifra",
    header: "Šifra",
    render: ({ l }) => (
      <Link to={naPolici(skladiste, l.sifra)} className="font-mono font-medium text-gray-900 hover:text-[#3B9DF8]">
        {l.sifra}
      </Link>
    ),
  },
  { key: "zona", header: "Zona", render: ({ l }) => l.zona },
  { key: "vrsta", header: "Vrsta", render: ({ l }) => LOKACIJA_VRSTA_LABELS[l.vrsta] },
  {
    key: "naStanju",
    header: "Na stanju (redova)",
    align: "right",
    render: ({ l, redovi }) =>
      l.nosiStanje ? `${kol(redovi.reduce((a, r) => a + r.naStanju, 0))} (${redovi.length})` : `bez stanja · ${redovi.length} u custody`,
    className: "font-mono tabular-nums",
  },
  { key: "aktivna", header: "Aktivna", render: ({ l }) => <StatusBadge tone={l.aktivna ? "success" : "neutral"}>{l.aktivna ? "Da" : "Ne"}</StatusBadge> },
];

const zaliheKolone: TableColumn<StanjeRed>[] = [
  {
    key: "artikl",
    header: "Artikl",
    render: (r) => (
      <span className="block min-w-0">
        <Link to={`/app/skladiste/zalihe/artikli/${r.artikl}`} className="font-mono font-medium text-[#3B9DF8] hover:underline">
          {r.artikl}
        </Link>
        <span className="block truncate text-xs text-gray-500">{artikl(r.artikl)?.naziv ?? ""}</span>
      </span>
    ),
  },
  {
    key: "lokacija",
    header: "Lokacija · lot",
    render: (r) => (
      <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 whitespace-nowrap">
        {r.lokacija || <span className="text-gray-500">bez lokacija</span>}
        {r.lot && <span className="text-gray-500"> · {r.lot}</span>}
        {r.bezStanja && (
          <StatusBadge tone="neutral" className="ml-1">
            bez stanja
          </StatusBadge>
        )}
      </span>
    ),
  },
  { key: "naStanju", header: "Na stanju", align: "right", render: (r) => kol(r.naStanju), className: "font-mono tabular-nums" },
  { key: "blokirano", header: "Blokirano", align: "right", render: (r) => kol(r.blokirano), className: "font-mono tabular-nums" },
  { key: "rezervisano", header: "Rezervisano", align: "right", render: (r) => kol(r.rezervisano), className: "font-mono tabular-nums" },
  { key: "raspolozivo", header: "Raspoloživo", align: "right", render: (r) => kol(r.raspolozivo), className: "font-mono font-medium tabular-nums" },
  { key: "vrijednost", header: "Vrijednost", align: "right", render: (r) => km(r.vrijednost), className: "font-mono tabular-nums" },
];

const dokumentiKolone: TableColumn<DokumentRed>[] = [
  {
    key: "broj",
    header: "Broj",
    render: (d) => (
      <Link to={putanja(d.path)} className="font-mono font-medium text-gray-900 hover:text-[#3B9DF8]">
        {d.broj}
      </Link>
    ),
  },
  { key: "vrsta", header: "Vrsta", render: (d) => d.vrsta },
  { key: "datum", header: "Datum", render: (d) => datum(d.datum), className: "whitespace-nowrap font-mono tabular-nums" },
  { key: "kontekst", header: "Strana / osnov", render: (d) => d.kontekst, className: "text-gray-500" },
  { key: "status", header: "Status", render: (d) => <StatusBadge tone={d.tone}>{d.status}</StatusBadge> },
];

// ─── Record: the floor plan and the movement (cicak's ShemaSkladista) ────────

/** A cell's shade by the stock value it holds: empty, then low, medium, high. */
const NIVO: Record<Polje["nivo"], string> = {
  0: "bg-gray-100 text-gray-400",
  1: "bg-[#3B9DF8]/20 text-[#3B9DF8]",
  2: "bg-[#3B9DF8]/45 text-white",
  3: "bg-[#3B9DF8] text-white",
};

/** One location on the floor plan: its place on the shelf, shaded by value; a floor position is wider and dashed. */
const Celija = ({ p, odabrano, onOdaberi }: { p: Polje; odabrano: boolean; onOdaberi: () => void }) => {
  const pod = p.lokacija.vrsta === "POD";
  const mjesto = p.lokacija.sifra.split("-")[2] ?? p.lokacija.sifra;
  return (
    <button
      type="button"
      onClick={onOdaberi}
      title={`${p.lokacija.sifra} · ${p.redovi.length} art. · ${km(p.vrijednost)}`}
      aria-pressed={odabrano}
      className={`flex h-9 items-center justify-center rounded-md font-mono text-[0.625rem] font-medium tabular-nums transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] ${
        pod ? "w-16 border border-dashed border-[#3B9DF8]/40" : "w-9"
      } ${
        p.lokacija.aktivna
          ? NIVO[p.nivo]
          : "bg-[repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6_4px,transparent_4px,transparent_8px)] text-gray-400 line-through"
      } ${odabrano ? "ring-2 ring-gray-900 ring-offset-2" : ""}`}
    >
      {pod ? `POD ${mjesto}` : mjesto}
    </button>
  );
};

/**
 * The warehouse as a floor plan (cicak's `TlocrtSkladista`): zones as blocks on a
 * dotted floor, aisles as rows and every location a cell shaded by the stock value
 * it holds; quarantine and custody sit apart. Clicking a cell lists what is on it,
 * with a link to that location's stock.
 */
const Tlocrt = ({ shema, skladiste }: { shema: ShemaSkladista; skladiste: string }) => {
  const [odabrano, setOdabrano] = useState<string | null>(null);
  const svaPolja = [...shema.zone.flatMap((z) => z.prolazi.flatMap((p) => p.polja)), ...shema.posebne];
  const izabrano = svaPolja.find((p) => p.lokacija.id === odabrano);
  const odaberi = (id: string) => setOdabrano(odabrano === id ? null : id);
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#e5eaf2] bg-gray-50 bg-[radial-gradient(#e5eaf2_1px,transparent_1px)] p-4 [background-size:14px_14px]">
        <div className="flex flex-wrap items-start gap-4">
          {shema.zone.map((z) => (
            <div key={z.zona} className="min-w-40 flex-1 rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <div className="mb-2.5 flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-[#3B9DF8]/10 font-mono text-xs font-semibold text-[#3B9DF8]">
                    {z.zona}
                  </span>
                  <span className="text-sm font-medium text-gray-900">Zona {z.zona}</span>
                </span>
                <span className="text-xs tabular-nums text-gray-500">
                  {z.zauzeto}/{z.ukupno}
                </span>
              </div>
              <div className="space-y-1.5">
                {z.prolazi.map((p) => (
                  <div key={p.prolaz} className="flex items-center gap-1.5">
                    <span className="w-6 shrink-0 font-mono text-[0.625rem] text-gray-500">{p.prolaz}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.polja.map((polje) => (
                        <Celija
                          key={polje.lokacija.id}
                          p={polje}
                          odabrano={odabrano === polje.lokacija.id}
                          onOdaberi={() => odaberi(polje.lokacija.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-xs tabular-nums text-gray-500">{km(z.vrijednost)}</p>
            </div>
          ))}
          {shema.posebne.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-amber-200 bg-amber-50 p-3">
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                <LuShieldAlert aria-hidden className="size-4 text-amber-600" />
                Posebne zone
              </span>
              {shema.posebne.map((p) => (
                <button
                  key={p.lokacija.id}
                  type="button"
                  onClick={() => odaberi(p.lokacija.id)}
                  className={`flex items-center justify-between gap-3 rounded-md bg-white px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 ${
                    odabrano === p.lokacija.id ? "ring-2 ring-gray-900" : ""
                  }`}
                >
                  <span>{LOKACIJA_VRSTA_LABELS[p.lokacija.vrsta].split(" · ")[0]}</span>
                  <span className="font-mono tabular-nums text-gray-500">{p.redovi.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <span className="h-px flex-1 border-t border-dashed border-gray-300" />
          <LuArrowDownToLine aria-hidden className="size-3.5" />
          Utovar i ulaz robe
          <span className="h-px flex-1 border-t border-dashed border-gray-300" />
        </div>
      </div>

      {izabrano ? (
        <div className="rounded-xl border border-[#e5eaf2] bg-gray-50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <LuPackageOpen aria-hidden className="size-4 text-[#3B9DF8]" />
              <span className="font-mono">{izabrano.lokacija.sifra}</span>
              <span className="font-normal text-gray-500">
                · {LOKACIJA_VRSTA_LABELS[izabrano.lokacija.vrsta]}
                {izabrano.lokacija.aktivna ? "" : " · neaktivna"}
              </span>
            </span>
            <span className="flex items-center gap-3">
              <span className="text-xs tabular-nums text-gray-500">{km(izabrano.vrijednost)}</span>
              {izabrano.redovi.length > 0 && (
                <Link to={naPolici(skladiste, izabrano.lokacija.sifra)} className="flex items-center gap-1 text-xs text-[#3B9DF8] hover:underline">
                  Zalihe
                  <LuArrowRight aria-hidden className="size-3.5" />
                </Link>
              )}
            </span>
          </div>
          {izabrano.redovi.length === 0 ? (
            <p className="text-xs text-gray-500">Lokacija je prazna.</p>
          ) : (
            <ul className="space-y-1">
              {izabrano.redovi.map((r) => (
                <li key={r.kljuc} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    {artiklNaziv(r.artikl)}
                    {r.lot && <span className="ml-1.5 font-mono text-xs text-gray-500">{r.lot}</span>}
                  </span>
                  <span className="shrink-0 font-mono text-xs tabular-nums">{kol(r.naStanju)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
          {(
            [
              ["Prazno", NIVO[0]],
              ["Malo", NIVO[1]],
              ["Srednje", NIVO[2]],
              ["Puno", NIVO[3]],
            ] as const
          ).map(([oznakaNivoa, boja]) => (
            <li key={oznakaNivoa} className="flex items-center gap-1.5">
              <span aria-hidden className={`size-3 rounded-sm ${boja}`} />
              {oznakaNivoa}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-5 rounded-sm border border-dashed border-[#3B9DF8]/40" />
            Podna pozicija
          </li>
          <li className="ml-auto">Klik na lokaciju pokazuje šta je na njoj</li>
        </ul>
      )}
    </div>
  );
};

// Goods in and goods out, in the app's chart colors.
const ULAZ = CHART_PALETTE[4];
const IZLAZ = CHART_PALETTE[0];

/** "05.10": the Monday a week starts on, as the bars name it. */
const sedmica = (od: string) => `${od.slice(8)}.${od.slice(5, 7)}`;

/**
 * Goods-in against goods-out documents per week, side by side (cicak's
 * `PrometRobe`); the current week is bold.
 */
const PrometRobe = ({ promet }: { promet: readonly SedmicaPrometa[] }) => {
  const maxPromet = Math.max(1, ...promet.flatMap((s) => [s.ulaz, s.izlaz]));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Promet robe · 8 sedmica</span>
        <span className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <LuArrowDownToLine aria-hidden className="size-3.5" style={{ color: ULAZ }} />
            ulaz
          </span>
          <span className="flex items-center gap-1">
            <LuArrowUpFromLine aria-hidden className="size-3.5" style={{ color: IZLAZ }} />
            izlaz
          </span>
        </span>
      </div>
      <div className="flex h-28 items-end gap-2">
        {promet.map((s, index) => (
          <div key={s.od} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-24 w-full items-end justify-center gap-0.5">
              <span
                title={`Sedmica od ${sedmica(s.od)}.: ulaz ${s.ulaz}`}
                className="w-2.5 rounded-t-sm transition-all"
                style={{ height: `${Math.max(4, (s.ulaz / maxPromet) * 100)}%`, backgroundColor: ULAZ }}
              />
              <span
                title={`Sedmica od ${sedmica(s.od)}.: izlaz ${s.izlaz}`}
                className="w-2.5 rounded-t-sm transition-all"
                style={{ height: `${Math.max(4, (s.izlaz / maxPromet) * 100)}%`, backgroundColor: IZLAZ }}
              />
            </div>
            <span className={`font-mono text-[0.625rem] ${index === promet.length - 1 ? "font-semibold text-gray-900" : "text-gray-500"}`}>
              {sedmica(s.od)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** The active sub-warehouses of a main one, each with a bar of the stock value it holds (cicak's `PodskladistaTrake`). */
const PodskladistaTrake = ({ stavke, odgovorna }: { stavke: ShemeExport[string]["podskladista"]; odgovorna: string }) => {
  const maxDjeca = Math.max(1, ...stavke.map((x) => x.vrijednost));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Podskladišta</span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <LuUserRound aria-hidden className="size-3.5" />
          odgovorna osoba: {odgovorna}
        </span>
      </div>
      {stavke.length === 0 ? (
        <p className="text-xs text-gray-500">Nema aktivnih podskladišta.</p>
      ) : (
        <ul className="space-y-2.5">
          {stavke.map(({ skladiste: d, vrijednost }) => (
            <li key={d.sifra}>
              <Link to={url(d.sifra)} className="group block space-y-1">
                <span className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-gray-900 group-hover:underline">{d.naziv}</span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-gray-500">{km(vrijednost)}</span>
                </span>
                <span className="block h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <span className="block h-full rounded-full bg-[#3B9DF8]/70" style={{ width: `${(vrijednost / maxDjeca) * 100}%` }} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/** cicak's „Tlocrt i promet" view: the shelf layout with its fill rate, the weekly movement and, on a main warehouse, its sub-warehouses. */
const TlocrtIPromet = ({ s }: { s: Skladiste }) => {
  const vizual = SHEME[s.sifra];
  if (!vizual) return null;
  return (
    <DetailSection
      icon={LuMap}
      title={s.lokacije ? "Raspored polica" : "Promet robe"}
      action={
        s.lokacije ? <StatusBadge tone={vizual.popunjenost >= 90 ? "warning" : "neutral"}>{vizual.popunjenost}% popunjeno</StatusBadge> : undefined
      }
    >
      <p className="-mt-1 mb-4 px-1 text-sm text-gray-500">
        {s.lokacije
          ? `Popunjenost polica ${vizual.popunjenost}% · ${vizual.shema.zauzeto} od ${vizual.shema.ukupno} lokacija nosi robu`
          : "Skladište bez lokacija — stanje se vodi po artiklu i lotu"}
      </p>
      <div className="space-y-5">
        {s.lokacije && vizual.shema.zone.length > 0 && <Tlocrt shema={vizual.shema} skladiste={s.sifra} />}
        <div className={s.vrsta === "GLAVNO" ? "grid grid-cols-1 gap-5 @lg:grid-cols-2" : ""}>
          <PrometRobe promet={vizual.promet} />
          {s.vrsta === "GLAVNO" && <PodskladistaTrake stavke={vizual.podskladista} odgovorna={imeOdgovorne(s)} />}
        </div>
      </div>
    </DetailSection>
  );
};

// ─── Record ──────────────────────────────────────────────────────────────────


/** A tile's number, as a link where cicak's tile opens the stock. */
const plocica = (vrijednost: string, to: string | null) =>
  to ? (
    <Link to={to} className="hover:text-[#3B9DF8]">
      {vrijednost}
    </Link>
  ) : (
    vrijednost
  );

function zapis(sifra: string): RecordView | null {
  const s = SKLADISTA.find((candidate) => candidate.sifra === sifra);
  if (!s) return null;
  const pregled = PREGLED[s.sifra];
  const redovi = ZALIHE.pozicije.filter((r) => r.skladiste === s.sifra);
  const lokacije = lokacijeSkladista(s.sifra);
  const dokumenti = pregled.dokumenti;
  const otvoreni = dokumenti.filter((d) => !ZATVORENI.has(d.status)).length;
  const djeca = pregled.podskladista;
  // An empty warehouse (no movement, no opening balance yet) offers its opening balance; one in progress is a click away.
  const pocetnoUToku = pregled.pocetnoUToku ? POCETNA_STANJA.find((x) => x.id === pregled.pocetnoUToku) : undefined;
  const zaliheSkladista = `${ZALIHE_URL}?skladiste=${encodeURIComponent(s.sifra)}`;

  const lokacijeTab = (
    <div className="flex flex-col gap-3">
      <Table
        bare
        columns={lokacijeKolone(s.sifra)}
        rows={lokacije.map((l) => ({ l, redovi: redovi.filter((r) => r.lokacija === l.sifra) }))}
        getRowKey={({ l }) => l.id}
        getRowHref={({ l }) => naPolici(s.sifra, l.sifra)}
        emptyText="Skladište ne koristi lokacije — stanje se vodi po artiklu i lotu."
      />
      <Napomene stavke={[NAPOMENE.sistemskeLokacije, NAPOMENE.karantinBezStanja, NAPOMENE.lokacijaNeBrise]} desno="Red otvara artikle na polici" />
    </div>
  );
  const zaliheTab = (
    <div className="flex flex-col gap-3">
      <Table
        bare
        columns={zaliheKolone}
        rows={redovi}
        getRowKey={(r) => r.kljuc}
        getRowHref={(r) => `/app/skladiste/zalihe/artikli/${r.artikl}`}
        emptyText="Skladište nema zalihe."
      />
      <Napomene stavke={[NAPOMENE.kolicinaSamoDokumentom, NAPOMENE.formulaRaspolozivo]} />
    </div>
  );
  const dokumentiTab = (
    <div className="flex flex-col gap-3">
      <Table
        bare
        columns={dokumentiKolone}
        rows={[...dokumenti]}
        getRowKey={(d) => d.path}
        getRowHref={(d) => putanja(d.path)}
        emptyText="Nijedan dokument još nije prošao kroz ovo skladište."
      />
      <Napomene
        stavke={[
          NAPOMENE.izdajeSamoGlavno,
          "Prenosnica se vidi u oba skladišta — izvornom, iz kojeg izlazi, i ciljnom, u koje stiže.",
          NAPOMENE.tranzitCustody,
        ]}
      />
    </div>
  );

  const view: RecordView = {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Postavke" },
      { label: "Skladišta i lokacije", to: url() },
      { label: s.sifra },
    ],
    backTo: url(),
    topTitle: "Postavke › Skladišta i lokacije",
    topStatus: "Skladišta, njihove lokacije i tlocrt",
    icon: LuWarehouse,
    title: `${s.sifra} · ${s.naziv}`,
    subtitle: `${VRSTA_LABELS[s.vrsta]} · ${pregled.adresa}`,
    badges: [
      { label: s.aktivno ? "Aktivno" : "Neaktivno", tone: s.aktivno ? "success" : "neutral" },
      { label: s.lokacije ? "stanje po lokaciji" : "bez lokacija", tone: "neutral" },
    ],
    // As in cicak's action bar; "Nova lokacija" is greyed out there for a warehouse without locations.
    actions: [
      "Uredi",
      "Nova lokacija",
      ...(pregled.mozePocetnoStanje || pocetnoUToku ? [pocetnoUToku ? `Početno stanje ${pocetnoUToku.broj}` : "Unesi početno stanje"] : []),
      "Naljepnice lokacija",
      s.aktivno ? "Deaktiviraj" : "Aktiviraj",
      "Obriši",
    ],
    fields: [
      { label: "Šifra", value: <span className="font-mono">{s.sifra}</span> },
      { label: "Naziv", value: s.naziv },
      { label: "Vrsta", value: VRSTA_LABELS[s.vrsta] },
      { label: "Lokacije", value: s.lokacije ? "Da · stanje po lokaciji" : "Ne · stanje po artiklu i lotu" },
      { label: "Radna lokacija", value: s.radnaLokacija ? `${s.radnaLokacija} · ${nazivRadneLokacije(s.radnaLokacija)}` : "—" },
      { label: "Prostorija", value: s.prostorija ? `${nazivProstorije(s.prostorija)} · ${s.prostorija}` : "—" },
      { label: "Adresa", value: pregled.adresa || "—" },
      { label: "Odgovorna osoba", value: imeOdgovorne(s) || "—" },
      s.vrsta === "GLAVNO"
        ? {
            label: "Podskladišta",
            value:
              djeca.length === 0 ? (
                "—"
              ) : (
                <span className="flex flex-wrap gap-x-2 gap-y-1">
                  {djeca.map((dijete) => (
                    <Link key={dijete} to={url(dijete)} className={LINK}>
                      {dijete} · {nazivSkladista(dijete)}
                    </Link>
                  ))}
                </span>
              ),
          }
        : {
            label: "Glavno skladište",
            value: s.nadredjeno ? (
              <Link to={url(s.nadredjeno)} className={LINK}>
                {s.nadredjeno} · {nazivSkladista(s.nadredjeno)}
              </Link>
            ) : (
              "—"
            ),
          },
      { label: "Opis", value: s.opis || "—" },
    ],
    summary: {
      tiles: [
        {
          icon: LuBoxes,
          label: "Pozicije zaliha",
          value: plocica(String(pregled.redova), zaliheSkladista),
          note: "po artiklu, lokaciji i lotu · otvara zalihe",
        },
        { icon: LuCoins, label: "Vrijednost zalihe", value: km(pregled.vrijednost), note: "po ugovornoj / priznatoj cijeni" },
        {
          icon: LuTriangleAlert,
          label: "Ispod signalne",
          value: plocica(String(pregled.ispodSignalne), `${zaliheSkladista}&granice=ispod-signalne`),
          note: "artikala prema granicama skladišta · otvara zalihe",
        },
        { icon: LuFileText, label: "Otvoreni dokumenti", value: String(otvoreni), note: `od ${dokumenti.length} ukupno` },
      ],
    },
    tabs: [
      { key: "lokacije", label: "Lokacije", count: lokacije.length, content: lokacijeTab },
      { key: "zalihe", label: "Zalihe", count: redovi.length, content: zaliheTab },
      { key: "dokumenti", label: "Dokumenti", count: dokumenti.length, content: dokumentiTab },
      { key: "tlocrt", label: s.lokacije ? "Tlocrt i promet" : "Promet", content: <TlocrtIPromet s={s} /> },
    ],
  };
  return view;
}

/** The warehouses with their places, stock and status; a row opens the warehouse. */
export const SKLADISTA_EKRAN: Screen = listScreen<SkladisteRed>({
  table: {
    title: "Skladišta",
    description: [
      `Glavno skladište i podskladišta; lokacije, zaliha i dokumenti su na detalju · ${SKLADISTA.filter((s) => s.aktivno).length} aktivnih`,
      `${NAPOMENE.izdajeSamoGlavno} ${NAPOMENE.skladisteNeBrise}`,
    ].join(" · "),
    columns: kolone,
    rows: REDOVI,
    getRowKey: (red) => red.s.sifra,
    getRowHref: (red) => url(red.s.sifra),
    searchText: (red) => [red.s.sifra, red.s.naziv, red.mjesto, red.odgovorna],
    searchLabel: "Pretraga skladišta",
    filters: [
      {
        key: "aktivno",
        legend: "Aktivno",
        options: [
          { value: "DA", label: "da" },
          { value: "NE", label: "ne" },
        ],
        matches: (red, value) => (value === "DA") === red.s.aktivno,
      },
    ],
    quick: { label: "Aktivno", allLabel: "sva", several: () => "sva" },
    initialFilters: { aktivno: ["DA"] },
    buttons: ["Novo skladište"],
    sortFields: [
      { value: "sifra", label: "Šifra", compare: (a, b) => a.s.sifra.localeCompare(b.s.sifra) },
      { value: "naziv", label: "Naziv", compare: (a, b) => a.s.naziv.localeCompare(b.s.naziv, "bs") },
      { value: "redova", label: "Pozicije zaliha", compare: (a, b) => a.redova - b.redova },
      { value: "vrijednost", label: "Vrijednost zalihe", compare: (a, b) => a.vrijednost - b.vrijednost },
    ],
    noun: "skladišta",
  },
  record: zapis,
});
