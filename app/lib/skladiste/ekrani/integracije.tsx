import { Link } from "react-router";
import { LuInbox, LuSend, LuWallet } from "react-icons/lu";
import { DataTable } from "~/components/DataTable";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import type { TableColumn } from "~/components/Table";
import integracijeData from "~/data/skladiste/integracije.json";
import outboxData from "~/data/skladiste/outbox.json";
import type { Screen } from "~/lib/skladiste/ekrani";
import { Plocice, Uvod, type Plocica } from "~/lib/skladiste/ekrani/plocice";
import { datum, km, plural, vrijeme } from "~/lib/skladiste/format";
import { NAPOMENE, POJMOVI, oznaka, putanja, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { Integracija, LegStatus, OutboxExport } from "~/lib/skladiste/types";
import { Napomene } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Postavke › Integracije, from cicak's `IntegracijePage`: the finance
 * outbox. Every posted stock document gives one general-ledger leg; the legs wait
 * here until the contract with finance is active. The same summary, note, tiles
 * (read from the whole outbox), columns, filters and order, in the app's list.
 */

const INTEGRACIJA = (integracijeData as unknown as Integracija[])[0];
const OUTBOX = outboxData as unknown as OutboxExport;
type Leg = OutboxExport[number];

const MODUL = "skladiste/administracija.ts";
const STATUSI = oznaka<LegStatus[]>(MODUL, "LEG_STATUSI");
const STATUS_LABELS = oznaka<Record<LegStatus, string>>(MODUL, "LEG_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<LegStatus, StatusTone>>(MODUL, "LEG_STATUS_TONES");
const VRSTE_LEGOVA = oznaka<string[]>(MODUL, "VRSTE_LEGOVA");

const REDOSLIJED: Record<LegStatus, number> = { SPREMNO: 0, BLOKIRANO: 0, POSLANO: 1 };

/** What still waits comes first, newest business date first inside a group. */
function poredak(a: Leg, b: Leg): number {
  const ra = REDOSLIJED[a.status];
  const rb = REDOSLIJED[b.status];
  if (ra !== rb) return ra - rb;
  return b.datum.localeCompare(a.datum) || b.broj.localeCompare(a.broj);
}

/** `+1.234,00 KM` · `−240,00 KM` — the ledger's signed money. */
function iznosSaPredznakom(n: number): string {
  if (n === 0) return km(0);
  return `${n > 0 ? "+" : "−"}${km(Math.abs(n))}`;
}

/** cicak's `zadnjeSlanje`: the last handover to the ledger, `''` when none happened yet. */
const zadnje = Object.values(INTEGRACIJA.poslano).sort().at(-1) ?? "";

// The tiles read the whole outbox, never the filtered view.
const blokirani = OUTBOX.filter((leg) => leg.status === "BLOKIRANO");
const spremni = OUTBOX.filter((leg) => leg.status === "SPREMNO");
const poslani = OUTBOX.filter((leg) => leg.status === "POSLANO");
const naCekanju = OUTBOX.filter((leg) => leg.status !== "POSLANO");
const vrijednostNaCekanju = naCekanju.reduce((a, leg) => a + Math.abs(leg.iznos), 0);
const vrijednostPoslano = poslani.reduce((a, leg) => a + Math.abs(leg.iznos), 0);
const vrijednostUkupno = vrijednostNaCekanju + vrijednostPoslano;
const ulaziNaCekanju = naCekanju.filter((leg) => leg.iznos > 0).reduce((a, leg) => a + leg.iznos, 0);
const izlaziNaCekanju = naCekanju.filter((leg) => leg.iznos < 0).reduce((a, leg) => a + leg.iznos, 0);
const najstarijiNaCekanju = naCekanju.reduce((m, leg) => (m === "" || leg.datum < m ? leg.datum : m), "");

const PLOCICE: Plocica[] = [
  {
    naslov: "Legova u outboxu",
    opis: "jedan leg po proknjiženom dokumentu · po statusu",
    icon: LuInbox,
    vrijednost: String(OUTBOX.length),
    graf: { vrsta: "stupci", vrijednosti: [blokirani.length, spremni.length, poslani.length], istaknut: INTEGRACIJA.ugovorAktivan ? 1 : 0 },
    cinjenice: [
      { label: STATUS_LABELS.BLOKIRANO, value: String(blokirani.length) },
      { label: STATUS_LABELS.SPREMNO, value: String(spremni.length) },
      { label: STATUS_LABELS.POSLANO, value: String(poslani.length) },
    ],
  },
  {
    naslov: "Vrijednost na čekanju",
    opis: "Σ |iznos| legova koji nisu predani · skala: udio vrijednosti koji je predan",
    icon: LuWallet,
    vrijednost: km(vrijednostNaCekanju),
    graf: { vrsta: "skala", postotak: vrijednostUkupno > 0 ? Math.round((vrijednostPoslano / vrijednostUkupno) * 100) : 100 },
    cinjenice: [
      { label: "Ulazi (na zalihu)", value: iznosSaPredznakom(ulaziNaCekanju) },
      { label: "Izlazi (sa zalihe)", value: iznosSaPredznakom(izlaziNaCekanju) },
      { label: "Predano ukupno", value: km(vrijednostPoslano) },
    ],
  },
  {
    naslov: "Zadnja predaja",
    opis: zadnje === "" ? "N/A — još nijedan leg nije predan glavnoj knjizi" : "kad je glavna knjiga zadnji put primila leg",
    icon: LuSend,
    vrijednost: zadnje === "" ? "N/A" : datum(zadnje.slice(0, 10)),
    cinjenice: [
      { label: "Ugovor", value: INTEGRACIJA.ugovorAktivan ? `od ${datum(INTEGRACIJA.aktiviran.slice(0, 10))}` : "neaktivan" },
      { label: "Poslanih legova", value: String(poslani.length) },
      { label: "Najstariji na čekanju", value: najstarijiNaCekanju === "" ? "—" : datum(najstarijiNaCekanju) },
    ],
  },
];

const SAZETAK = `Knjiženja prema Finansijama · ugovor ${
  INTEGRACIJA.ugovorAktivan ? `aktivan od ${datum(INTEGRACIJA.aktiviran.slice(0, 10))}` : "nije aktiviran"
} · ${naCekanju.length} ${plural(naCekanju.length, "leg čeka", "lega čekaju", "legova čeka")}`;

/** cicak's action bar: send the ready legs (when there are any), the contract switch, its history. */
const DUGMAD = [
  ...(spremni.length > 0 ? [`Pošalji sve spremne (${spremni.length})`] : []),
  INTEGRACIJA.ugovorAktivan ? "Deaktiviraj ugovor" : "Aktiviraj ugovor s finansijama",
  "Historija ugovora",
];

/** The line under a leg's status: when it was handed over, or why it waits. */
const statusDetalj = (leg: Leg) => (leg.status === "POSLANO" ? `predan ${vrijeme(INTEGRACIJA.poslano[leg.broj] ?? "")}` : leg.poruka);

const KOLONE: TableColumn<Leg>[] = [
  {
    key: "broj",
    header: "Dokument",
    render: (leg) => (
      <Link to={putanja(leg.path)} className="font-mono font-medium text-gray-900 hover:text-[#3B9DF8]">
        {leg.broj}
      </Link>
    ),
    sortValue: (leg) => leg.broj,
    visibility: "w-[15%]",
  },
  { key: "vrsta", header: "Vrsta", render: (leg) => leg.vrsta, sortValue: (leg) => leg.vrsta, visibility: "w-[17%]" },
  {
    key: "skladiste",
    header: "Skladište",
    render: (leg) => skladisteNaziv(leg.skladiste),
    sortValue: (leg) => leg.skladiste,
    className: "whitespace-nowrap text-gray-600",
    visibility: "hidden w-[19%] md:table-cell",
  },
  { key: "datum", header: "Datum", render: (leg) => datum(leg.datum), sortValue: (leg) => leg.datum, className: "whitespace-nowrap font-mono tabular-nums", visibility: "w-[10%]" },
  {
    key: "iznos",
    header: "Iznos",
    align: "right",
    render: (leg) => iznosSaPredznakom(leg.iznos),
    sortValue: (leg) => leg.iznos,
    className: "font-mono tabular-nums",
    visibility: "w-[13%]",
  },
  {
    key: "status",
    header: "Status",
    render: (leg) => (
      <span className="block min-w-0">
        <StatusBadge tone={STATUS_TONES[leg.status]}>{STATUS_LABELS[leg.status]}</StatusBadge>
        <span title={statusDetalj(leg)} className="mt-0.5 block truncate text-xs text-gray-500">
          {statusDetalj(leg)}
        </span>
      </span>
    ),
    sortValue: (leg) => REDOSLIJED[leg.status],
  },
];

const REDOVI = [...OUTBOX].sort(poredak);

const List = () => (
  <>
    <Uvod
      sazetak={SAZETAK}
      napomena="Svako knjiženje zaliha proizvodi jedan leg za glavnu knjigu. Legovi nastaju iz proknjiženih dokumenata (ne upisuju se ovdje), čuvaju se u outboxu i predaju kad je ugovor s finansijama aktivan — ništa se ne gubi."
    />
    <Plocice label="Integracije: pločice" plocice={PLOCICE} />
    <DataTable
      title="Finansijski outbox"
      description={`legovi koji čekaju predaju glavnoj knjizi i oni već predani · ${OUTBOX.length}`}
      columns={KOLONE}
      rows={REDOVI}
      getRowKey={(leg) => leg.id}
      getRowHref={(leg) => putanja(leg.path)}
      searchText={(leg) => [leg.broj, leg.vrsta, leg.skladiste, skladisteNaziv(leg.skladiste), STATUS_LABELS[leg.status], leg.poruka]}
      searchLabel="Pretraga outboxa"
      filters={[
        {
          key: "status",
          legend: "Status",
          options: STATUSI.map((s) => ({ value: s, label: STATUS_LABELS[s], tone: STATUS_TONES[s] })),
          matches: (leg, value) => leg.status === value,
        },
        { key: "vrsta", legend: "Vrsta", options: VRSTE_LEGOVA.map((v) => ({ value: v, label: v })), matches: (leg, value) => leg.vrsta === value },
      ]}
      quick={{ label: "Filtriraj po statusu", allLabel: "Sve", several: (n) => `${n} statusa` }}
      buttons={DUGMAD}
      sortFields={[
        { value: "status", label: "Status", compare: (a, b) => REDOSLIJED[a.status] - REDOSLIJED[b.status] },
        { value: "datum", label: "Datum", compare: (a, b) => a.datum.localeCompare(b.datum) },
        { value: "broj", label: "Dokument", compare: (a, b) => a.broj.localeCompare(b.broj) },
        { value: "iznos", label: "Iznos", compare: (a, b) => a.iznos - b.iznos },
        { value: "vrsta", label: "Vrsta", compare: (a, b) => a.vrsta.localeCompare(b.vrsta, "bs") },
      ]}
      noun="legova"
      fill
      className="min-h-0 flex-1"
    />
    <Napomene
      stavke={[
        "Legovi se čuvaju u outboxu dok ugovor nije aktivan — ništa se ne gubi.",
        "Leg se šalje jednom; ispravka ide novim dokumentom (storno), ne ponovnim slanjem.",
        NAPOMENE.naNeIzracunato,
        POJMOVI.pomocnaKnjiga,
        "Broj otvara izvorni dokument",
      ]}
    />
  </>
);

/** Postavke › Integracije ("postavke/integracije"). */
export const INTEGRACIJE_EKRAN: Screen = { List };
