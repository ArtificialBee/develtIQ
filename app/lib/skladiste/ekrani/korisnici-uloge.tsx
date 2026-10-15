import { Link, useSearchParams } from "react-router";
import { LuCalendarClock, LuRoute, LuShieldCheck, LuUsers } from "react-icons/lu";
import { DataTable } from "~/components/DataTable";
import type { RecordView } from "~/components/RecordPage";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import { Tabs } from "~/components/Tabs";
import dodjeleData from "~/data/skladiste/dodjele.json";
import ulogeData from "~/data/skladiste/uloge.json";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { DANAS, Plocice, Uvod, type Plocica } from "~/lib/skladiste/ekrani/plocice";
import { datum, plural } from "~/lib/skladiste/format";
import { NAPOMENE, POJMOVI, SKLADISTA, oznaka, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { Dodjela, DodjelaStatus, Uloga } from "~/lib/skladiste/types";
import { Napomene } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Postavke › Korisnici i uloge, from cicak's `KorisniciUlogePage` and
 * `UlogaDetaljPage`: who holds which role in which warehouse and until when, and
 * the catalogue of roles behind it. The same summary, note, tiles (read from the
 * whole register), the two tabs with their columns, filters and order, and each
 * role's own page.
 */

const DODJELE = dodjeleData as unknown as Dodjela[];
const ULOGE = ulogeData as unknown as Uloga[];
const MODUL = "skladiste/administracija.ts";
const STATUSI = oznaka<DodjelaStatus[]>(MODUL, "DODJELA_STATUSI");
const STATUS_LABELS = oznaka<Record<DodjelaStatus, string>>(MODUL, "DODJELA_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<DodjelaStatus, StatusTone>>(MODUL, "DODJELA_STATUS_TONES");
const TACKE = oznaka<Record<string, string>>(MODUL, "KONTROLNA_TACKA_LABELS");
const SVE_TACKE = oznaka<number[]>(MODUL, "KONTROLNE_TACKE_SVE");

const url = (id?: string) => ekranUrl("postavke", "korisnici-i-uloge", id);
/** cicak's `KATALOG`: this screen on its catalogue tab. */
const KATALOG = `${url()}?tab=uloge`;

/** Role name, or the bare code for an unknown one. */
const nazivUloge = (sifra: string) => ULOGE.find((u) => u.sifra === sifra)?.naziv ?? sifra;

/** `kreiraj` · `odobri + proknjiži` · `—` for a role outside the chain. */
function opisKontrolnihTacaka(sifra: string): string {
  const tacke = ULOGE.find((u) => u.sifra === sifra)?.tacke ?? [];
  return tacke.length === 0 ? "—" : tacke.map((t) => TACKE[t]).join(" + ");
}

/** `SK-01` · `sva skladišta`. */
const opisSkladistaDodjele = (skladiste: string) => (skladiste === "" ? "sva skladišta" : skladiste);

function statusDodjele(d: Dodjela): DodjelaStatus {
  if (d.vaziDo !== "" && d.vaziDo < DANAS) return "ISTEKLA";
  if (d.vaziOd > DANAS) return "BUDUCA";
  return "AKTIVNA";
}

/** Days until the assignment ends; `null` while it is open. */
function danaDoIsteka(d: Dodjela): number | null {
  if (d.vaziDo === "") return null;
  return Math.round((new Date(`${d.vaziDo}T00:00:00Z`).getTime() - new Date(`${DANAS}T00:00:00Z`).getTime()) / 86400000);
}

const dana = (n: number) => `${n} ${plural(n, "dan", "dana", "dana")}`;

/** `otvoreno — bez kraja` · `još 12 dana` · `istekla prije 40 dana` · `traje do …`. */
function opisRoka(d: Dodjela, st: DodjelaStatus): string {
  const n = danaDoIsteka(d);
  if (n === null) return "otvoreno — bez kraja";
  if (st === "ISTEKLA") return `istekla prije ${dana(-n)}`;
  if (st === "BUDUCA") return `traje do ${datum(d.vaziDo)}`;
  return `još ${dana(n)}`;
}

interface Red {
  d: Dodjela;
  st: DodjelaStatus;
}

const REDOSLIJED: Record<DodjelaStatus, number> = { AKTIVNA: 0, BUDUCA: 1, ISTEKLA: 2 };

/** Active first (by person), then upcoming, then expired — most recently ended first. */
function poredak(a: Red, b: Red): number {
  const ra = REDOSLIJED[a.st];
  const rb = REDOSLIJED[b.st];
  if (ra !== rb) return ra - rb;
  if (a.st === "ISTEKLA") return b.d.vaziDo.localeCompare(a.d.vaziDo) || a.d.id.localeCompare(b.d.id);
  return a.d.osoba.localeCompare(b.d.osoba) || a.d.skladiste.localeCompare(b.d.skladiste) || a.d.id.localeCompare(b.d.id);
}

/** Top-N counts of a grouping as tile facts. */
function najvise(brojevi: ReadonlyMap<string, number>, n: number, oznaka: (k: string) => string) {
  return [...brojevi.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([k, v]) => ({ label: oznaka(k), value: String(v) }));
}

const SVE: Red[] = DODJELE.map((d) => ({ d, st: statusDodjele(d) }));

// The tiles read the whole register, never the filtered view.
const aktivne = SVE.filter((x) => x.st === "AKTIVNA");
const poUlozi = new Map<string, number>();
for (const x of aktivne) poUlozi.set(x.d.uloga, (poUlozi.get(x.d.uloga) ?? 0) + 1);
const barovi = ULOGE.filter((u) => u.aktivna).map((u) => poUlozi.get(u.sifra) ?? 0);
const najvisaUloga = barovi.indexOf(Math.max(...barovi));

const sRokom = aktivne.filter((x) => x.d.vaziDo !== "");
const do30 = sRokom.filter((x) => (danaDoIsteka(x.d) ?? 999) <= 30).length;
const do90 = sRokom.filter((x) => (danaDoIsteka(x.d) ?? 999) <= 90).length;
const otvorene = aktivne.length - sRokom.length;
const vaziDalje = aktivne.length - do90;

const osobe = new Set(aktivne.map((x) => x.d.osoba));
const poSkladistu = new Map<string, Set<string>>();
for (const x of aktivne) {
  const s = poSkladistu.get(x.d.skladiste) ?? new Set<string>();
  s.add(x.d.osoba);
  poSkladistu.set(x.d.skladiste, s);
}
const skladistaRedom = [...poSkladistu.keys()].sort((a, b) => a.localeCompare(b));
const osobeBarovi = skladistaRedom.map((k) => poSkladistu.get(k)?.size ?? 0);
const osobePoSkladistu = new Map(skladistaRedom.map((k) => [k, poSkladistu.get(k)?.size ?? 0]));

const PLOCICE: Plocica[] = [
  {
    naslov: "Aktivnih dodjela",
    opis: "važe danas · po ulozi iz kataloga",
    icon: LuShieldCheck,
    vrijednost: String(aktivne.length),
    graf: { vrsta: "stupci", vrijednosti: barovi, ...(najvisaUloga >= 0 ? { istaknut: najvisaUloga } : {}) },
    cinjenice: najvise(poUlozi, 3, nazivUloge),
  },
  {
    naslov: "Ističe u 90 dana",
    opis: "aktivne dodjele s krajem u sljedećih 90 dana · skala: udio koji važi i poslije",
    icon: LuCalendarClock,
    vrijednost: String(do90),
    graf: { vrsta: "skala", postotak: aktivne.length > 0 ? Math.round((vaziDalje / aktivne.length) * 100) : 100 },
    cinjenice: [
      { label: "Do 30 dana", value: String(do30) },
      { label: "31–90 dana", value: String(do90 - do30) },
      { label: "Otvorene (bez kraja)", value: String(otvorene) },
    ],
  },
  {
    naslov: "Osoba s ulogom",
    opis: "različitih osoba s aktivnom dodjelom · po skladištu",
    icon: LuUsers,
    vrijednost: String(osobe.size),
    graf: { vrsta: "stupci", vrijednosti: osobeBarovi },
    cinjenice: najvise(osobePoSkladistu, 3, opisSkladistaDodjele),
  },
];

const SAZETAK = `${aktivne.length} ${plural(aktivne.length, "aktivna dodjela", "aktivne dodjele", "aktivnih dodjela")} · ${osobe.size} ${plural(osobe.size, "osoba", "osobe", "osoba")} · ${ULOGE.length} ${plural(ULOGE.length, "uloga", "uloge", "uloga")} u katalogu`;

/** A role's status line in a row: its badge and how long it still runs. */
const StatusCelija = ({ red }: { red: Red }) => (
  <span className="block min-w-0">
    <StatusBadge tone={STATUS_TONES[red.st]}>{STATUS_LABELS[red.st]}</StatusBadge>
    <span className="mt-0.5 block truncate text-xs text-gray-500">{opisRoka(red.d, red.st)}</span>
  </span>
);

const vaziDoCelija = (d: Dodjela) => (d.vaziDo ? datum(d.vaziDo) : <span className="text-gray-500">otvoreno</span>);

const DODJELE_KOLONE: TableColumn<Red>[] = [
  { key: "osoba", header: "Osoba", render: ({ d }) => d.osoba, sortValue: ({ d }) => d.osoba, className: "font-medium text-gray-900", visibility: "w-[15%]" },
  {
    key: "uloga",
    header: "Uloga",
    render: ({ d }) => (
      <span className="block min-w-0">
        <span className="block truncate">{nazivUloge(d.uloga)}</span>
        <span className="block truncate font-mono text-xs text-gray-500">
          {d.uloga} · {opisKontrolnihTacaka(d.uloga)}
        </span>
      </span>
    ),
    sortValue: ({ d }) => nazivUloge(d.uloga),
    visibility: "w-[22%]",
  },
  {
    key: "skladiste",
    header: "Skladište",
    render: ({ d }) => (d.skladiste === "" ? <span className="text-gray-500">sva skladišta</span> : skladisteNaziv(d.skladiste)),
    sortValue: ({ d }) => d.skladiste,
    className: "whitespace-nowrap",
    visibility: "hidden w-[18%] md:table-cell",
  },
  { key: "vaziOd", header: "Važi od", render: ({ d }) => datum(d.vaziOd), sortValue: ({ d }) => d.vaziOd, className: "whitespace-nowrap font-mono tabular-nums", visibility: "w-[10%]" },
  { key: "vaziDo", header: "Važi do", render: ({ d }) => vaziDoCelija(d), sortValue: ({ d }) => d.vaziDo || "9999-12-31", className: "whitespace-nowrap font-mono tabular-nums", visibility: "w-[10%]" },
  { key: "verzija", header: "Verzija", align: "right", render: ({ d }) => `v${d.verzija}`, sortValue: ({ d }) => d.verzija, className: "font-mono", visibility: "hidden w-[7%] lg:table-cell" },
  { key: "status", header: "Status", render: (red) => <StatusCelija red={red} />, sortValue: (red) => REDOSLIJED[red.st] },
];

const KATALOG_KOLONE: TableColumn<Uloga>[] = [
  {
    key: "sifra",
    header: "Šifra",
    render: (u) => (
      <Link to={url(u.sifra)} className="font-mono text-sm text-gray-900 hover:text-[#3B9DF8] hover:underline">
        {u.sifra}
      </Link>
    ),
    sortValue: (u) => u.sifra,
    visibility: "w-[18%]",
  },
  { key: "naziv", header: "Naziv", render: (u) => u.naziv, sortValue: (u) => u.naziv, className: "font-medium text-gray-900", visibility: "w-[15%]" },
  { key: "domen", header: "Domen", render: (u) => u.domen, sortValue: (u) => u.domen, visibility: "hidden w-[10%] md:table-cell" },
  { key: "tacke", header: "Kontrolna tačka", render: (u) => opisKontrolnihTacaka(u.sifra), sortValue: (u) => opisKontrolnihTacaka(u.sifra), className: "text-gray-500", visibility: "w-[14%]" },
  { key: "opis", header: "Šta radi", render: (u) => u.opis, className: "text-gray-500", visibility: "hidden lg:table-cell" },
  {
    key: "aktivnih",
    header: "Aktivnih dodjela",
    align: "right",
    render: (u) => String(poUlozi.get(u.sifra) ?? 0),
    sortValue: (u) => poUlozi.get(u.sifra) ?? 0,
    className: "font-mono",
    visibility: "w-[12%]",
  },
  {
    key: "aktivna",
    header: "Aktivna",
    render: (u) => <StatusBadge tone={u.aktivna ? "success" : "neutral"}>{u.aktivna ? "da" : "ne"}</StatusBadge>,
    sortValue: (u) => (u.aktivna ? 0 : 1),
    visibility: "w-[9%]",
  },
];

const DODJELE_REDOVI = [...SVE].sort(poredak);
const KATALOG_REDOVI = [...ULOGE];

type Tab = "dodjele" | "uloge";

/** The two registers share one place on the screen: the assignments, and the catalogue behind them. */
function List() {
  const [params, setParams] = useSearchParams();
  // `tab` lives in the URL, as in cicak, so a role's page can lead back to the catalogue.
  const tab: Tab = params.get("tab") === "uloge" ? "uloge" : "dodjele";
  const otvori = (key: Tab) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (key === "uloge") next.set("tab", "uloge");
        else next.delete("tab");
        return next;
      },
      { replace: true },
    );

  return (
    <>
      <Uvod
        sazetak={SAZETAK}
        napomena={`${POJMOVI.kontrolneTacke} Administrator vidi svaki ekran i smije pritisnuti svako dugme — zato dodjele kaže ko se u produkciji potpisuje na kojem koraku.`}
      />
      <Plocice label="Korisnici i uloge: pločice" plocice={PLOCICE} />
      <Tabs<Tab>
        label="Registri"
        value={tab}
        onChange={otvori}
        tabs={[
          { key: "dodjele", label: "Dodjele uloga", count: DODJELE.length },
          { key: "uloge", label: "Katalog uloga", count: ULOGE.length },
        ]}
      />
      {tab === "dodjele" ? (
        <>
          <DataTable<Red>
            key="dodjele"
            title="Dodjele uloga"
            description={`osoba · uloga · skladište · period — promjena je nova verzija · ${DODJELE.length}`}
            columns={DODJELE_KOLONE}
            rows={DODJELE_REDOVI}
            getRowKey={({ d }) => d.id}
            searchText={({ d, st }) => [
              d.osoba,
              d.uloga,
              nazivUloge(d.uloga),
              d.skladiste,
              skladisteNaziv(d.skladiste),
              opisSkladistaDodjele(d.skladiste),
              STATUS_LABELS[st],
            ]}
            searchLabel="Pretraga dodjela"
            filters={[
              {
                key: "status",
                legend: "Status",
                options: STATUSI.map((s) => ({ value: s, label: STATUS_LABELS[s], tone: STATUS_TONES[s] })),
                matches: (red, value) => red.st === value,
              },
              {
                key: "skladiste",
                legend: "Skladište",
                options: SKLADISTA.map((s) => ({ value: s.sifra, label: `${s.sifra} · ${s.naziv}` })),
                matches: (red, value) => red.d.skladiste === value,
              },
              {
                key: "uloga",
                legend: "Uloga",
                options: ULOGE.map((u) => ({ value: u.sifra, label: u.naziv })),
                matches: (red, value) => red.d.uloga === value,
              },
            ]}
            quick={{ label: "Filtriraj po statusu", allLabel: "Sve", several: (n) => `${n} statusa` }}
            // cicak's two buttons; the one for the open tab is the main one.
            buttons={["Dodijeli ulogu", "Nova uloga"]}
            sortFields={[
              { value: "status", label: "Status", compare: (a, b) => REDOSLIJED[a.st] - REDOSLIJED[b.st] },
              { value: "osoba", label: "Osoba", compare: (a, b) => a.d.osoba.localeCompare(b.d.osoba, "bs") },
              { value: "vaziOd", label: "Važi od", compare: (a, b) => a.d.vaziOd.localeCompare(b.d.vaziOd) },
              { value: "vaziDo", label: "Važi do", compare: (a, b) => a.d.vaziDo.localeCompare(b.d.vaziDo), isEmpty: (red) => red.d.vaziDo === "" },
            ]}
            noun="dodjela"
            fill
            className="min-h-0 flex-1"
          />
          <Napomene
            stavke={[
              NAPOMENE.dodjelaVerzija,
              "Završetak dodjele je zatvara, nikad je ne briše.",
              "Skladište „sva“ znači da uloga važi u svakom skladištu — i tada vrijedi pravilo susjednih tačaka.",
            ]}
          />
        </>
      ) : (
        <>
          <DataTable<Uloga>
            key="uloge"
            title="Katalog uloga"
            description={`uloga · domen · kontrolna tačka — administrator ga održava · ${ULOGE.length}`}
            columns={KATALOG_KOLONE}
            rows={KATALOG_REDOVI}
            getRowKey={(u) => u.sifra}
            getRowHref={(u) => url(u.sifra)}
            searchText={(u) => [u.sifra, u.naziv, u.domen, u.opis, opisKontrolnihTacaka(u.sifra)]}
            searchLabel="Pretraga uloga"
            filters={[
              {
                key: "aktivna",
                legend: "Aktivna",
                options: [
                  { value: "da", label: "da", tone: "success" },
                  { value: "ne", label: "ne", tone: "neutral" },
                ],
                matches: (u, value) => (u.aktivna ? "da" : "ne") === value,
              },
            ]}
            buttons={["Nova uloga", "Dodijeli ulogu"]}
            sortFields={[
              { value: "sifra", label: "Šifra", compare: (a, b) => a.sifra.localeCompare(b.sifra) },
              { value: "naziv", label: "Naziv", compare: (a, b) => a.naziv.localeCompare(b.naziv, "bs") },
              { value: "domen", label: "Domen", compare: (a, b) => a.domen.localeCompare(b.domen, "bs") },
              { value: "aktivnih", label: "Aktivnih dodjela", compare: (a, b) => (poUlozi.get(a.sifra) ?? 0) - (poUlozi.get(b.sifra) ?? 0) },
            ]}
            noun="uloga"
            fill
            className="min-h-0 flex-1"
          />
          <Napomene
            stavke={[
              "Kontrolna tačka kaže na kojem koraku dokumenta se uloga potpisuje: 1 kreiraj · 2 odobri · 3 izdaj · 4 proknjiži.",
              "Neaktivna uloga ostaje u katalogu radi historije, ali se ne može dodijeliti.",
              "Uloga koju neko drži se ne briše — prvo se obrišu ili završe njene dodjele.",
            ]}
          />
        </>
      )}
    </>
  );
}

/** One role's page (cicak's `UlogaDetaljPage`): what it is, its assignments, the control points it signs at. */
function zapis(sifra: string): RecordView | null {
  const u = ULOGE.find((candidate) => candidate.sifra === sifra);
  if (!u) return null;
  const njene = SVE.filter((x) => x.d.uloga === u.sifra).sort(
    (a, b) => a.d.osoba.localeCompare(b.d.osoba) || a.d.vaziOd.localeCompare(b.d.vaziOd),
  );
  const aktivneNjene = njene.filter((x) => x.st === "AKTIVNA");
  const osobeNjene = new Set(aktivneNjene.map((x) => x.d.osoba));
  const { tacke } = u;

  const kolone: TableColumn<Red>[] = [
    { key: "osoba", header: "Osoba", render: ({ d }) => d.osoba, className: "font-medium text-gray-900" },
    { key: "skladiste", header: "Skladište", render: ({ d }) => opisSkladistaDodjele(d.skladiste), className: "whitespace-nowrap" },
    { key: "vaziOd", header: "Važi od", render: ({ d }) => datum(d.vaziOd), className: "whitespace-nowrap font-mono tabular-nums" },
    { key: "vaziDo", header: "Važi do", render: ({ d }) => vaziDoCelija(d), className: "whitespace-nowrap font-mono tabular-nums" },
    { key: "verzija", header: "Verzija", align: "right", render: ({ d }) => `v${d.verzija}`, className: "font-mono" },
    {
      key: "status",
      header: "Status",
      // The role's page says "još N dana" for an upcoming assignment too, as cicak's does.
      render: ({ d, st }) => {
        const n = danaDoIsteka(d);
        return (
          <span className="block min-w-0">
            <StatusBadge tone={STATUS_TONES[st]}>{STATUS_LABELS[st]}</StatusBadge>
            <span className="mt-0.5 block text-xs text-gray-500">
              {n === null ? "otvoreno — bez kraja" : st === "ISTEKLA" ? `istekla prije ${dana(-n)}` : `još ${dana(n)}`}
            </span>
          </span>
        );
      },
    },
  ];

  /** cicak's four tiles under the role's card: the number, and its line under it. */
  const plocica = (vrijednost: string, opis: string) => (
    <>
      {vrijednost}
      <span className="block truncate font-sans text-xs font-normal text-gray-500">{opis}</span>
    </>
  );

  const dodjeleTab = (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-gray-500">ko je drži, gdje i do kada — izvedeno iz registra dodjela</p>
      <Table bare columns={kolone} rows={njene} getRowKey={({ d }) => d.id} emptyText="Ovu ulogu još niko ne drži." />
    </div>
  );

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Postavke" },
      { label: "Korisnici i uloge", to: KATALOG },
      { label: u.naziv },
    ],
    backTo: KATALOG,
    topTitle: "Postavke › Korisnici i uloge",
    topStatus: "Dodjele uloga po skladištu i periodu važenja",
    icon: LuShieldCheck,
    title: u.naziv,
    subtitle: `${u.sifra} · ${u.domen} · ${opisKontrolnihTacaka(u.sifra)}`,
    badges: [
      { label: u.aktivna ? "Aktivna" : "Neaktivna", tone: u.aktivna ? "success" : "neutral" },
      { label: u.domen, tone: "neutral" },
    ],
    actions: ["Uredi", u.aktivna ? "Deaktiviraj" : "Aktiviraj", "Obriši"],
    fields: [
      { label: "Šifra", value: <span className="font-mono">{u.sifra}</span> },
      { label: "Naziv", value: u.naziv || "—" },
      { label: "Domen", value: u.domen || "—" },
      { label: "Kontrolna tačka", value: opisKontrolnihTacaka(u.sifra) },
      { label: "Aktivna", value: u.aktivna ? "da" : "ne" },
      { label: "Šta radi", value: u.opis || "—", wide: true },
    ],
    summary: {
      tiles: [
        { label: "Aktivnih dodjela", value: plocica(String(aktivneNjene.length), `${osobeNjene.size} ${plural(osobeNjene.size, "osoba", "osobe", "osoba")} danas`) },
        { label: "Dodjela ukupno", value: plocica(String(njene.length), "sve verzije u registru") },
        { label: "Kontrolnih tačaka", value: plocica(String(tacke.length), tacke.length === 0 ? "van lanca potpisa" : opisKontrolnihTacaka(u.sifra)) },
        { label: "Status", value: plocica(u.aktivna ? "aktivna" : "neaktivna", u.aktivna ? "nudi se na dodjeli" : "ostaje radi historije") },
      ],
    },
    tabs: [{ key: "dodjele", label: "Dodjele ove uloge", count: njene.length, content: dodjeleTab }],
    sections: [
      {
        icon: LuRoute,
        title: "Kontrolne tačke dokumenta",
        content: (
          <div className="flex flex-col gap-2 px-1">
            <div className="flex flex-wrap gap-1.5">
              {SVE_TACKE.map((t) => (
                <StatusBadge key={t} tone={tacke.includes(t) ? "success" : "neutral"}>
                  {t} · {TACKE[t]}
                </StatusBadge>
              ))}
            </div>
            <p className="text-xs text-gray-500">Zelene tačke su one na kojima se ova uloga potpisuje.</p>
          </div>
        ),
      },
    ],
    notes: [
      `${POJMOVI.kontrolneTacke} Uloga se ne potpisuje sama — dodjela kaže u kojem skladištu i do kada je neko drži.`,
      "Kontrolna tačka kaže na kojem koraku dokumenta se uloga potpisuje: 1 kreiraj · 2 odobri · 3 izdaj · 4 proknjiži.",
      "Ista osoba nikad ne drži dvije susjedne kontrolne tačke u istom skladištu.",
    ],
  };
}

/** Postavke › Korisnici i uloge ("postavke/korisnici-i-uloge"), with each role's page. */
export const KORISNICI_ULOGE_EKRAN: Screen = { List, record: zapis };
