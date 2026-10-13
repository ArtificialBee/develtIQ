import { LuFileCheck2, LuFileClock, LuLayers } from "react-icons/lu";
import { DataTable } from "~/components/DataTable";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import type { TableColumn } from "~/components/Table";
import politikeData from "~/data/skladiste/politike.json";
import sifrarniciIzvedenoData from "~/data/skladiste/sifrarnici-izvedeno.json";
import type { Screen } from "~/lib/skladiste/ekrani";
import { Plocice, SADA, Uvod, type Plocica } from "~/lib/skladiste/ekrani/plocice";
import { datum, plural } from "~/lib/skladiste/format";
import { NAPOMENE, oznaka } from "~/lib/skladiste/podaci";
import type { Politika, PolitikaStatus, SifrarniciIzvedenoExport } from "~/lib/skladiste/types";
import { Napomene } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Postavke › Politike, from cicak's `PolitikePage`: the rules the module
 * runs by, each versioned per kind and scope. The same summary, note, three tiles
 * (read from the whole register), columns, filters and order, in the app's list.
 */

const POLITIKE = politikeData as unknown as Politika[];
const IZVEDENO = (sifrarniciIzvedenoData as unknown as SifrarniciIzvedenoExport).politike;
const MODUL = "skladiste/administracija.ts";
const STATUSI = oznaka<PolitikaStatus[]>(MODUL, "POLITIKA_STATUSI");
const STATUS_LABELS = oznaka<Record<PolitikaStatus, string>>(MODUL, "POLITIKA_STATUS_LABELS");
const STATUS_OPISI = oznaka<Record<PolitikaStatus, string>>(MODUL, "POLITIKA_STATUS_OPISI");
const STATUS_TONES = oznaka<Record<PolitikaStatus, StatusTone>>(MODUL, "POLITIKA_STATUS_TONES");
const OPISI_VRSTA = oznaka(MODUL, "OPISI_VRSTA_POLITIKA");

/** cicak's `vrstePolitika`: the seeded kinds first, then any other the register holds. */
const VRSTE = (() => {
  const vrste = [...oznaka<string[]>(MODUL, "VRSTE_POLITIKA")];
  for (const p of POLITIKE) if (!vrste.includes(p.vrsta)) vrste.push(p.vrsta);
  return vrste;
})();

/** The person who wrote the draft: the oldest history line (cicak's `autorNacrta`). */
const autorNacrta = (p: Politika) => IZVEDENO[p.id]?.autorNacrta ?? "";

const REDOSLIJED: Record<PolitikaStatus, number> = { NACRT: 0, ODOBRENA: 1, POVUCENA: 2 };

/** Drafts first (they wait on someone), then the versions in force, then the withdrawn ones. */
function poredak(a: Politika, b: Politika): number {
  const ra = REDOSLIJED[a.status];
  const rb = REDOSLIJED[b.status];
  if (ra !== rb) return ra - rb;
  return a.vrsta.localeCompare(b.vrsta) || a.obuhvat.localeCompare(b.obuhvat) || b.verzija - a.verzija;
}

/** Whole days since the draft was written, on the export's clock. */
function starostNacrta(p: Politika): number {
  const kad = p.historija[p.historija.length - 1]?.kad;
  if (!kad) return 0;
  return Math.max(0, Math.floor((SADA - new Date(kad).getTime()) / 86400000));
}

// The tiles read the whole register, never the filtered view.
const odobrene = POLITIKE.filter((p) => p.status === "ODOBRENA");
const nacrti = POLITIKE.filter((p) => p.status === "NACRT");
const povucene = POLITIKE.filter((p) => p.status === "POVUCENA");
const odobrenePoVrsti = VRSTE.map((v) => odobrene.filter((p) => p.vrsta === v).length);
const obuhvati = new Set(POLITIKE.map((p) => `${p.vrsta} · ${p.obuhvat}`));
const obuhvatiBezVazece = [...obuhvati].filter((k) => !odobrene.some((p) => `${p.vrsta} · ${p.obuhvat}` === k)).length;
// How long the drafts have waited, in three buckets — the oldest is the one to act on.
const poStarosti = [0, 0, 0];
let najstariji = 0;
for (const p of nacrti) {
  const d = starostNacrta(p);
  najstariji = Math.max(najstariji, d);
  poStarosti[d <= 3 ? 0 : d <= 7 ? 1 : 2] += 1;
}

const PLOCICE: Plocica[] = [
  {
    naslov: "Odobrenih politika",
    opis: "verzije koje važe danas · po vrsti",
    icon: LuFileCheck2,
    vrijednost: String(odobrene.length),
    graf: { vrsta: "stupci", vrijednosti: odobrenePoVrsti },
    cinjenice: VRSTE.map((v, i) => ({ label: v, value: String(odobrenePoVrsti[i] ?? 0) }))
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 3),
  },
  {
    naslov: "Nacrta čeka odobrenje",
    opis: `napisani, još ne važe · po starosti čekanja${nacrti.length > 0 ? ` · najstariji ${najstariji} ${plural(najstariji, "dan", "dana", "dana")}` : ""}`,
    icon: LuFileClock,
    vrijednost: String(nacrti.length),
    graf: { vrsta: "stupci", vrijednosti: poStarosti, istaknut: 2 },
    cinjenice: [
      { label: "Do 3 dana", value: String(poStarosti[0]) },
      { label: "4–7 dana", value: String(poStarosti[1]) },
      { label: "Preko 7 dana", value: String(poStarosti[2]) },
    ],
  },
  {
    naslov: "Verzija ukupno",
    opis: "sve verzije u registru · skala: udio koji važi",
    icon: LuLayers,
    vrijednost: String(POLITIKE.length),
    graf: { vrsta: "skala", postotak: POLITIKE.length > 0 ? Math.round((odobrene.length / POLITIKE.length) * 100) : 0 },
    cinjenice: [
      { label: "Vrsta × obuhvat", value: String(obuhvati.size) },
      { label: "Obuhvata bez važeće verzije", value: String(obuhvatiBezVazece) },
      { label: "Povučenih", value: String(povucene.length) },
    ],
  },
];

const SAZETAK = `${odobrene.length} ${plural(odobrene.length, "odobrena", "odobrene", "odobrenih")} · ${nacrti.length} ${plural(nacrti.length, "nacrt čeka", "nacrta čekaju", "nacrta čeka")} odobrenje`;

/** The line under a policy's status: why it was withdrawn, how long the draft waits, or what the status means. */
function statusDetalj(p: Politika): string {
  if (p.status === "POVUCENA") return p.razlogPovlacenja;
  if (p.status === "NACRT") {
    const dana = starostNacrta(p);
    return `čeka ${dana} ${plural(dana, "dan", "dana", "dana")}`;
  }
  return STATUS_OPISI[p.status];
}

const KOLONE: TableColumn<Politika>[] = [
  {
    key: "vrsta",
    header: "Vrsta",
    render: (p) => (
      <span className="block min-w-0">
        <span className="block truncate font-medium text-gray-900">{p.vrsta}</span>
        <span className="block truncate text-xs text-gray-500">{OPISI_VRSTA[p.vrsta] ?? ""}</span>
      </span>
    ),
    sortValue: (p) => p.vrsta,
    visibility: "w-[20%]",
  },
  { key: "obuhvat", header: "Obuhvat", render: (p) => p.obuhvat, sortValue: (p) => p.obuhvat, className: "whitespace-nowrap", visibility: "w-[11%]" },
  { key: "verzija", header: "Verzija", align: "right", render: (p) => `v${p.verzija}`, sortValue: (p) => p.verzija, className: "font-mono", visibility: "w-[7%]" },
  {
    key: "status",
    header: "Status",
    render: (p) => (
      <span className="block min-w-0">
        <StatusBadge tone={STATUS_TONES[p.status]}>{STATUS_LABELS[p.status]}</StatusBadge>
        <span title={statusDetalj(p)} className="mt-0.5 block truncate text-xs text-gray-500">
          {statusDetalj(p)}
        </span>
      </span>
    ),
    sortValue: (p) => REDOSLIJED[p.status],
    visibility: "w-[17%]",
  },
  {
    key: "vaziOd",
    header: "Važi od",
    render: (p) => (p.vaziOd ? datum(p.vaziOd) : <span className="text-gray-500">—</span>),
    sortValue: (p) => p.vaziOd,
    className: "whitespace-nowrap font-mono tabular-nums",
    visibility: "hidden w-[9%] md:table-cell",
  },
  {
    key: "vlasnik",
    header: "Vlasnik · autor",
    render: (p) => (
      <span className="block min-w-0">
        <span className="block truncate">{p.vlasnik}</span>
        <span className="block truncate text-xs text-gray-500">nacrt: {autorNacrta(p) || "—"}</span>
      </span>
    ),
    sortValue: (p) => p.vlasnik,
    visibility: "hidden w-[13%] lg:table-cell",
  },
  { key: "opis", header: "Šta određuje", render: (p) => p.opis, className: "text-gray-500", visibility: "hidden lg:table-cell" },
];

const REDOVI = [...POLITIKE].sort(poredak);

const List = () => (
  <>
    <Uvod
      sazetak={SAZETAK}
      napomena={`${NAPOMENE.politikaVerzija} Nacrt piše vlasnik vrste, odobrava druga osoba od datuma — tada prethodna verzija istog obuhvata prestaje važiti i ostaje u registru kao povučena.`}
    />
    <Plocice label="Politike: pločice" plocice={PLOCICE} />
    <DataTable
      title="Politike"
      description={`vrednovanje, granice zaliha i ishodi — svaka verzionisana po obuhvatu · ${POLITIKE.length}`}
      columns={KOLONE}
      rows={REDOVI}
      getRowKey={(p) => p.id}
      searchText={(p) => [p.vrsta, p.obuhvat, `v${p.verzija}`, p.vlasnik, p.opis, autorNacrta(p), STATUS_LABELS[p.status]]}
      searchLabel="Pretraga politika"
      filters={[
        {
          key: "status",
          legend: "Status",
          options: STATUSI.map((s) => ({ value: s, label: STATUS_LABELS[s], tone: STATUS_TONES[s] })),
          matches: (p, value) => p.status === value,
        },
        { key: "vrsta", legend: "Vrsta", options: VRSTE.map((v) => ({ value: v, label: v })), matches: (p, value) => p.vrsta === value },
      ]}
      quick={{ label: "Filtriraj po statusu", allLabel: "Sve", several: (n) => `${n} statusa` }}
      buttons={["Nova verzija politike"]}
      sortFields={[
        { value: "status", label: "Status", compare: (a, b) => REDOSLIJED[a.status] - REDOSLIJED[b.status] },
        { value: "vrsta", label: "Vrsta", compare: (a, b) => a.vrsta.localeCompare(b.vrsta, "bs") },
        { value: "obuhvat", label: "Obuhvat", compare: (a, b) => a.obuhvat.localeCompare(b.obuhvat, "bs") },
        { value: "verzija", label: "Verzija", compare: (a, b) => a.verzija - b.verzija },
        { value: "vaziOd", label: "Važi od", compare: (a, b) => a.vaziOd.localeCompare(b.vaziOd), isEmpty: (p) => p.vaziOd === "" },
      ]}
      noun="politika"
      fill
      className="min-h-0 flex-1"
    />
    <Napomene
      stavke={[
        NAPOMENE.politikaVerzija,
        "Vrednovanje: računovodstvo · Granice: glavni skladištar, nikad podnosilac.",
        "Odobrava druga osoba — autor nacrta ne može biti odobravatelj.",
      ]}
    />
  </>
);

/** Postavke › Politike ("postavke/politike"). */
export const POLITIKE_EKRAN: Screen = { List };
