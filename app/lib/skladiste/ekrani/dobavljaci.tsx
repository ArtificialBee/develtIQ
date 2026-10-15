import { LuBanknote, LuCalendarDays, LuHourglass, LuPackagePlus, LuUsers } from "react-icons/lu";
import { Link } from "react-router";
import { DataTable } from "~/components/DataTable";
import type { DetailTile } from "~/components/DetailPage";
import type { RecordView } from "~/components/RecordPage";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import dobavljaciData from "~/data/skladiste/dobavljaci.json";
import prijemniceData from "~/data/skladiste/prijemnice.json";
import sifrarniciData from "~/data/skladiste/sifrarnici-izvedeno.json";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { datum, km, kol } from "~/lib/skladiste/format";
import { IZVEDENO, NAPOMENE, artikl, oznaka, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { Dobavljac, Prijemnica, PrijemnicaStatus, PrijemnicaStavka, SifrarniciIzvedenoExport } from "~/lib/skladiste/types";
import { Napomene } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Nabavka › Dobavljači, from cicak's `DobavljaciPage` and
 * `DobavljacDetaljPage`: the supplier register with its receipts and their value,
 * and one supplier's data, four figures, the receipts it delivered and the items it
 * delivered. Receipts point at a supplier by name, as in cicak.
 */

const DOBAVLJACI = dobavljaciData as unknown as Dobavljac[];
const PRIJEMNICE = prijemniceData as unknown as Prijemnica[];
const PREGLED = (sifrarniciData as unknown as SifrarniciIzvedenoExport).dobavljaci;
const STATUS_LABELS = oznaka<Record<PrijemnicaStatus, string>>("skladiste/prijemnice.ts", "PRIJEMNICA_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<PrijemnicaStatus, StatusTone>>("skladiste/prijemnice.ts", "PRIJEMNICA_STATUS_TONES");

const url = (sifra?: string) => ekranUrl("nabavka", "dobavljaci", sifra);
const prijemnicaUrl = (id: string) => ekranUrl("prijem", "prijemnice", id);
const artiklUrl = (sifra: string) => ekranUrl("zalihe", "artikli", sifra);
const NUM = "font-mono tabular-nums";

/** The receipts of a supplier (cicak's `prijemniceDobavljaca`): every receipt naming it. */
const prijemniceDobavljaca = (d: Dobavljac) => PRIJEMNICE.filter((p) => p.dobavljac === d.naziv);

/** The price a line is valued at: the recognised one once there is one (cicak's `cijenaStavke`). */
const cijenaStavke = (s: PrijemnicaStavka) => s.konacnaCijena ?? s.cijena;

// ─── the list ───────────────────────────────────────────────────────────────

const kolone: TableColumn<Dobavljac>[] = [
  {
    key: "sifra",
    header: "Šifra",
    render: (d) => (
      <Link to={url(d.sifra)} className="font-mono font-medium text-[#3B9DF8] hover:underline">
        {d.sifra}
      </Link>
    ),
    sortValue: (d) => d.sifra,
    visibility: "w-[9%]",
  },
  {
    key: "naziv",
    header: "Naziv",
    render: (d) => (
      <span className="block min-w-0">
        <span className="block truncate font-medium text-gray-900">{d.naziv}</span>
        <span className="block truncate text-xs text-gray-500">{d.adresa}</span>
      </span>
    ),
    sortValue: (d) => d.naziv,
    visibility: "w-[22%]",
  },
  { key: "pdv", header: "PDV broj", render: (d) => d.pdvBroj, sortValue: (d) => d.pdvBroj, className: "font-mono", visibility: "hidden w-[13%] lg:table-cell" },
  { key: "osnov", header: "Otvoreni osnov", render: (d) => d.osnov, sortValue: (d) => d.osnov, className: "font-mono", visibility: "hidden w-[13%] md:table-cell" },
  { key: "kontakt", header: "Kontakt", render: (d) => d.kontakt, sortValue: (d) => d.kontakt, visibility: "hidden w-[13%] lg:table-cell" },
  { key: "prijemnica", header: "Prijemnica", align: "right", render: (d) => String(PREGLED[d.sifra]?.prijemnica ?? 0), sortValue: (d) => PREGLED[d.sifra]?.prijemnica ?? 0, className: NUM, visibility: "w-[9%]" },
  {
    key: "vrijednost",
    header: "Vrijednost prijema",
    align: "right",
    // The value of the supplier's posted receipts.
    render: (d) => km(PREGLED[d.sifra]?.vrijednost ?? 0),
    sortValue: (d) => PREGLED[d.sifra]?.vrijednost ?? 0,
    className: NUM,
    visibility: "hidden w-[13%] sm:table-cell",
  },
  {
    key: "aktivan",
    header: "Aktivan",
    render: (d) => <StatusBadge tone={d.aktivan ? "success" : "neutral"}>{d.aktivan ? "Da" : "Ne"}</StatusBadge>,
    sortValue: (d) => (d.aktivan ? 1 : 0),
    visibility: "w-[8%]",
  },
];

/** The register: cicak's columns, the Aktivan filter (active ones first, as cicak opens), and its notes. */
const DobavljaciLista = () => (
  <>
    <DataTable<Dobavljac>
      title="Dobavljači"
      description={`Dobavljači od kojih skladište prima robu, s otvorenim ugovorom ili narudžbom · ${DOBAVLJACI.filter((d) => d.aktivan).length} aktivnih`}
      columns={kolone}
      rows={DOBAVLJACI}
      getRowKey={(d) => d.sifra}
      getRowHref={(d) => url(d.sifra)}
      searchText={(d) => [d.sifra, d.naziv, d.pdvBroj, d.osnov, d.kontakt]}
      searchLabel="Pretraga dobavljača"
      filters={[
        {
          key: "aktivan",
          legend: "Aktivan",
          options: [
            { value: "da", label: "da" },
            { value: "ne", label: "ne" },
          ],
          matches: (d, v) => (v === "da") === d.aktivan,
        },
      ]}
      quick={{ label: "Aktivan", allLabel: "svi", several: () => "svi" }}
      initialFilters={{ aktivan: ["da"] }}
      buttons={["Novi dobavljač"]}
      sortFields={[
        { value: "sifra", label: "Šifra", compare: (a, b) => a.sifra.localeCompare(b.sifra) },
        { value: "naziv", label: "Naziv", compare: (a, b) => a.naziv.localeCompare(b.naziv, "bs") },
        { value: "prijemnica", label: "Prijemnica", compare: (a, b) => (PREGLED[a.sifra]?.prijemnica ?? 0) - (PREGLED[b.sifra]?.prijemnica ?? 0) },
        { value: "vrijednost", label: "Vrijednost prijema", compare: (a, b) => (PREGLED[a.sifra]?.vrijednost ?? 0) - (PREGLED[b.sifra]?.vrijednost ?? 0) },
      ]}
      noun="dobavljača"
      fill
      className="min-h-0 flex-1"
    />
    <Napomene stavke={[`${NAPOMENE.cijenaIzOsnova} ${NAPOMENE.dobavljacIzNabavke}`, "Red otvara detalj dobavljača"]} />
  </>
);

// ─── one supplier ───────────────────────────────────────────────────────────

const TAB_FOOTER = "border-t border-[#e5eaf2] px-3 pt-3";

const kolonePrijemnica: TableColumn<Prijemnica>[] = [
  {
    key: "broj",
    header: "Broj",
    render: (p) => (
      <Link to={prijemnicaUrl(p.id)} className="font-mono font-medium text-gray-900 hover:text-[#3B9DF8]">
        {p.broj}
      </Link>
    ),
  },
  { key: "datum", header: "Datum prijema", render: (p) => datum(p.datumPrijema), className: "whitespace-nowrap font-mono tabular-nums" },
  { key: "skladiste", header: "Skladište", render: (p) => skladisteNaziv(p.skladiste), className: "whitespace-nowrap" },
  { key: "osnov", header: "Osnov", render: (p) => p.osnov, className: "font-mono" },
  { key: "otpremnica", header: "Otpremnica", render: (p) => p.otpremnica || "—", className: "font-mono" },
  {
    key: "vrijednost",
    header: "Vrijednost",
    align: "right",
    render: (p) => (
      <span className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
        <span className="font-mono">{km(IZVEDENO.prijemnice[p.id].vrijednost)}</span>
        {IZVEDENO.prijemnice[p.id].cijenaPrivremena && p.stavke.length > 0 && <StatusBadge tone="neutral">privremeno</StatusBadge>}
      </span>
    ),
  },
  { key: "status", header: "Status", render: (p) => <StatusBadge tone={STATUS_TONES[p.status]}>{STATUS_LABELS[p.status]}</StatusBadge> },
];

interface IsporuceniArtikl {
  artikl: string;
  kolicina: number;
  prijemnica: number;
  zadnjaCijena: number;
  zadnji: string;
}

const koloneArtikala: TableColumn<IsporuceniArtikl>[] = [
  {
    key: "artikl",
    header: "Artikl",
    render: (a) => (
      <span className="block min-w-0">
        <Link to={artiklUrl(a.artikl)} className="font-mono text-[#3B9DF8] hover:underline">
          {a.artikl}
        </Link>
        <span className="block truncate text-xs text-gray-500">{artikl(a.artikl)?.naziv ?? ""}</span>
      </span>
    ),
  },
  { key: "kolicina", header: "Primljeno ukupno", align: "right", render: (a) => `${kol(a.kolicina)} ${artikl(a.artikl)?.jm ?? ""}`, className: `${NUM} whitespace-nowrap` },
  { key: "prijemnica", header: "Prijemnica", align: "right", render: (a) => String(a.prijemnica), className: NUM },
  { key: "cijena", header: "Posljednja cijena", align: "right", render: (a) => `${km(a.zadnjaCijena)} / ${artikl(a.artikl)?.jm ?? ""}`, className: `${NUM} whitespace-nowrap` },
  { key: "zadnji", header: "Posljednji prijem", render: (a) => datum(a.zadnji), className: "whitespace-nowrap font-mono tabular-nums" },
];

/** The items the supplier delivered on posted receipts: how much, on how many receipts, the last price and date. */
function isporuceniArtikli(njegove: Prijemnica[]): IsporuceniArtikl[] {
  const mapa = new Map<string, IsporuceniArtikl>();
  for (const p of njegove) {
    if (p.status !== "PROKNJIZENO") continue;
    for (const s of p.stavke) {
      const red = mapa.get(s.artikl) ?? { artikl: s.artikl, kolicina: 0, prijemnica: 0, zadnjaCijena: 0, zadnji: "" };
      red.kolicina += s.evidentirano;
      red.prijemnica += 1;
      if (p.datumPrijema >= red.zadnji) {
        red.zadnji = p.datumPrijema;
        red.zadnjaCijena = cijenaStavke(s);
      }
      mapa.set(s.artikl, red);
    }
  }
  return [...mapa.values()].sort((a, b) => a.artikl.localeCompare(b.artikl));
}


function zapis(sifra: string): RecordView | null {
  const d = DOBAVLJACI.find((x) => x.sifra === sifra);
  if (!d) return null;
  // Newest receipt first, as cicak sorts them.
  const njegove = [...prijemniceDobavljaca(d)].sort((a, b) => b.datumPrijema.localeCompare(a.datumPrijema));
  const artikli = isporuceniArtikli(njegove);
  const proknjizene = njegove.filter((p) => p.status === "PROKNJIZENO");
  const ukupno = proknjizene.reduce((a, p) => a + IZVEDENO.prijemnice[p.id].vrijednost, 0);
  const cekaCijenu = proknjizene.filter((p) => IZVEDENO.prijemnice[p.id].cijenaPrivremena).length;
  const zadnji = njegove[0]?.datumPrijema ?? "";

  const prijemniceTab = (
    <div className="flex flex-col gap-3">
      <Table bare columns={kolonePrijemnica} rows={njegove} getRowKey={(p) => p.id} getRowHref={(p) => prijemnicaUrl(p.id)} emptyText="Još nema prijemnica od ovog dobavljača." />
      <div className={TAB_FOOTER}>
        <Napomene stavke={[NAPOMENE.cijenaIzOsnova, NAPOMENE.cijenaPrivremena]} />
      </div>
    </div>
  );
  const artikliTab = (
    <div className="flex flex-col gap-3">
      <Table bare columns={koloneArtikala} rows={artikli} getRowKey={(a) => a.artikl} getRowHref={(a) => artiklUrl(a.artikl)} emptyText="Još nema proknjiženih isporuka." />
      <div className={TAB_FOOTER}>
        <Napomene stavke={["Samo proknjižene prijemnice · red otvara artikl."]} />
      </div>
    </div>
  );

  const view: RecordView = {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Nabavka" },
      { label: "Dobavljači", to: url() },
      { label: d.naziv },
    ],
    backTo: url(),
    topTitle: "Nabavka › Dobavljači",
    topStatus: "Dobavljači od kojih skladište prima robu",
    icon: LuUsers,
    title: d.naziv,
    subtitle: `${d.sifra} · PDV ${d.pdvBroj} · ${d.adresa}`,
    badges: [
      { label: d.aktivan ? "Aktivan" : "Neaktivan", tone: d.aktivan ? "success" : "neutral" },
      ...(d.osnov ? [{ label: d.osnov, tone: "neutral" as const }] : []),
    ],
    actions: ["Uredi", "Nova prijemnica", d.aktivan ? "Deaktiviraj" : "Aktiviraj", "Obriši"],
    fields: [
      { label: "Šifra", value: <span className="font-mono">{d.sifra}</span> },
      { label: "Naziv", value: d.naziv || "—" },
      { label: "PDV broj", value: d.pdvBroj ? <span className="font-mono">{d.pdvBroj}</span> : "—" },
      { label: "Otvoreni osnov", value: d.osnov ? <span className="font-mono">{d.osnov}</span> : "—" },
      { label: "Adresa", value: d.adresa || "—" },
      { label: "Kontakt osoba", value: d.kontakt || "—" },
      { label: "E-mail", value: d.email || "—" },
      { label: "Telefon", value: d.telefon ? <span className="font-mono">{d.telefon}</span> : "—" },
    ],
    summary: {
      tiles: [
        { icon: LuPackagePlus, label: "Prijemnica", value: String(njegove.length), note: `${proknjizene.length} proknjiženih` },
        { icon: LuBanknote, label: "Vrijednost prijema", value: <span className="font-mono">{km(ukupno)}</span>, note: "proknjižene prijemnice" },
        { icon: LuHourglass, label: "Čeka priznavanje cijene", value: String(cekaCijenu), note: "proknjiženo po privremenoj cijeni" },
        {
          icon: LuCalendarDays,
          label: "Posljednji prijem",
          value: <span className="font-mono">{zadnji ? datum(zadnji) : "—"}</span>,
          note: njegove[0]?.broj ?? "još nema prijema",
        },
      ],
    },
    tabs: [
      { key: "prijemnice", label: "Prijemnice", count: njegove.length, content: prijemniceTab },
      { key: "artikli", label: "Isporučeni artikli", count: artikli.length, content: artikliTab },
    ],
  };
  return view;
}

export const DOBAVLJACI_EKRAN: Screen = { List: DobavljaciLista, record: zapis };
