import { LuCalendarCheck, LuHistory, LuHourglass, LuTriangleAlert } from "react-icons/lu";
import { Link } from "react-router";
import type { TimelineStep } from "~/components/DetailPage";
import type { RecordView } from "~/components/RecordPage";
import type { Stat } from "~/components/StatCard";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import izdatniceData from "~/data/skladiste/izdatnice.json";
import rezervacijeData from "~/data/skladiste/rezervacije.json";
import { SKLADISTA, IZVEDENO, NAPOMENE, POJMOVI, artikl, artiklNaziv, oznaka, putanja, skladisteNaziv } from "~/lib/skladiste/podaci";
import { ekranUrl, listScreen, type Screen } from "~/lib/skladiste/ekrani";
import { datum, kol, plural } from "~/lib/skladiste/format";
import type { Izdatnica, IzdatnicaStatus, IzvorRezervacije, Rezervacija, RezervacijaIzvedeno, RezervacijaStatus } from "~/lib/skladiste/types";
import { ArtiklCelija, brojac, historijaTab, tokKoraci } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Zalihe › Rezervacije, from cicak's `RezervacijePage` and
 * `RezervacijaDetaljPage`: stock held for approved needs and what is not covered
 * yet — the same tiles, rows, order, fields, cover steps and issue notes, in the
 * app's list and record layout. Nobody types a reservation in: it is born from an
 * approved requisition line or a work order, so the list's first button is a new
 * requisition.
 */

const REZERVACIJE = rezervacijeData as unknown as Rezervacija[];
const IZDATNICE = izdatniceData as unknown as Izdatnica[];

const MODUL = "skladiste/rezervacije.ts";
const STATUSI = oznaka<RezervacijaStatus[]>(MODUL, "REZERVACIJA_STATUSI");
const STATUS_LABELS = oznaka<Record<RezervacijaStatus, string>>(MODUL, "REZERVACIJA_STATUS_LABELS");
const STATUS_OPISI = oznaka<Record<RezervacijaStatus, string>>(MODUL, "REZERVACIJA_STATUS_OPISI");
const STATUS_TONES = oznaka<Record<RezervacijaStatus, StatusTone>>(MODUL, "REZERVACIJA_STATUS_TONES");
const IZVOR_LABELS = oznaka<Record<IzvorRezervacije, string>>(MODUL, "IZVOR_REZERVACIJE_LABELS");
const IZDATNICA_STATUS_LABELS = oznaka<Record<IzdatnicaStatus, string>>("skladiste/izdatnice.ts", "IZDATNICA_STATUS_LABELS");
const IZDATNICA_STATUS_TONES = oznaka<Record<IzdatnicaStatus, StatusTone>>("skladiste/izdatnice.ts", "IZDATNICA_STATUS_TONES");

const url = (id?: string) => ekranUrl("zalihe", "rezervacije", id);

/** One reservation with what cicak derives for it: status, uncovered, held, age, the source's page and what is free now. */
interface Red {
  r: Rezervacija;
  iz: RezervacijaIzvedeno;
}

const REDOVI: Red[] = REZERVACIJE.map((r) => ({ r, iz: IZVEDENO.rezervacije[r.id] }));

/**
 * The list order: what a person has to act on comes first — waiting for stock,
 * then partly covered, then covered — oldest need first inside a group; the
 * closed and released ones follow, newest first.
 */
const REDOSLIJED: Record<RezervacijaStatus, number> = {
  CEKA_ZALIHU: 0,
  DJELIMICNO: 1,
  OTVORENA: 2,
  ZATVORENA: 3,
  OTPUSTENA: 3,
};

function poredak(a: Red, b: Red): number {
  const ra = REDOSLIJED[a.iz.status];
  const rb = REDOSLIJED[b.iz.status];
  if (ra !== rb) return ra - rb;
  const poDatumu = ra < 3 ? a.r.kreirana.localeCompare(b.r.kreirana) : b.r.kreirana.localeCompare(a.r.kreirana);
  return poDatumu || a.r.id.localeCompare(b.r.id);
}

const jm = (sifra: string) => artikl(sifra)?.jm ?? "";
const dana = (n: number) => `${n} ${plural(n, "dan", "dana", "dana")}`;
const sekundarno = "block font-sans text-xs text-gray-500";

/** The source document: a link to the requisition it was approved on, or a work order's bare number. */
const IzvorniDokument = ({ r, iz }: Red) =>
  iz.putIzvora ? (
    <Link to={putanja(iz.putIzvora)} className="whitespace-nowrap font-mono font-medium text-[#3B9DF8] hover:underline">
      {r.izvorBroj}
    </Link>
  ) : (
    <span className="whitespace-nowrap font-mono font-medium">{r.izvorBroj}</span>
  );

// ─── The tiles ─────────────────────────────────────────────────────────────────

/** cicak's three tiles, read over the whole register, never the filtered view. */
function kartice(): Stat[] {
  const otvorene = REDOVI.filter((x) => x.iz.jeOtvorena);
  const cekaZalihu = REDOVI.filter((x) => x.iz.status === "CEKA_ZALIHU");
  const drziUkupno = otvorene.reduce((a, x) => a + x.iz.drziSe, 0);
  const nepokrivenoUkupno = otvorene.reduce((a, x) => a + x.iz.nepokriveno, 0);
  const osnovaSNepokrivenim = new Set(otvorene.filter((x) => x.iz.nepokriveno > 0).map((x) => x.r.izvorBroj)).size;
  const najstarija = cekaZalihu.reduce((m, x) => Math.max(m, x.iz.starostDana), 0);
  const djelimicne = REDOVI.filter((x) => x.iz.status === "DJELIMICNO").length;
  const pokrivene = REDOVI.filter((x) => x.iz.status === "OTVORENA").length;
  const trazenoUkupno = otvorene.reduce((a, x) => a + x.r.trazeno, 0);
  const rezervisanoUkupno = otvorene.reduce((a, x) => a + x.r.rezervisano, 0);
  const pokriveno = trazenoUkupno > 0 ? Math.round((rezervisanoUkupno / trazenoUkupno) * 100) : 100;
  // How long the needs still waiting for stock have waited, in three buckets.
  const poStarosti = [0, 0, 0];
  for (const x of cekaZalihu) poStarosti[x.iz.starostDana <= 3 ? 0 : x.iz.starostDana <= 7 ? 1 : 2] += 1;
  // A tile's one line carries cicak's description and then its three facts (the bars are not drawn).
  const linija = (opis: string, cinjenice: [string, string][]) => [opis, ...cinjenice.map(([label, value]) => `${label} ${value}`)].join(" · ");

  return [
    {
      key: "otvorene",
      label: "Otvorene rezervacije",
      value: otvorene.length,
      icon: LuCalendarCheck,
      highlight: {
        label: "Otvorene rezervacije",
        title: linija(`drže zalihu ili čekaju prijem · drži se ukupno ${kol(drziUkupno)} ${plural(Math.round(drziUkupno), "jedinica", "jedinice", "jedinica")}`, [
          [STATUS_LABELS.CEKA_ZALIHU, String(cekaZalihu.length)],
          [STATUS_LABELS.DJELIMICNO, String(djelimicne)],
          [STATUS_LABELS.OTVORENA, String(pokrivene)],
        ]),
      },
    },
    {
      key: "nepokriveno",
      label: "Nepokrivena količina",
      value: nepokrivenoUkupno,
      icon: LuTriangleAlert,
      highlight: {
        label: "Nepokrivena količina",
        title: linija("traženo − rezervisano · sve otvorene, sve JM · skala: koliko je traženog pokriveno", [
          ["Na osnova", `${osnovaSNepokrivenim} ${plural(osnovaSNepokrivenim, "dokument", "dokumenta", "dokumenata")}`],
          ["Traženo ukupno", kol(trazenoUkupno)],
          ["Rezervisano ukupno", kol(rezervisanoUkupno)],
        ]),
      },
      // The figure over cicak's gradient bar: how much of what is asked for is held.
      badge: { label: `${Math.min(100, Math.max(0, pokriveno))}%`, tone: "neutral" },
    },
    {
      key: "ceka",
      label: "Čeka zalihu",
      value: cekaZalihu.length,
      icon: LuHourglass,
      highlight: {
        label: "Čeka zalihu",
        title: linija(`ništa još nije rezervisano — čeka prijem · po starosti čekanja${cekaZalihu.length > 0 ? ` · najstarija ${dana(najstarija)}` : ""}`, [
          ["Do 3 dana", String(poStarosti[0])],
          ["4–7 dana", String(poStarosti[1])],
          ["Preko 7 dana", String(poStarosti[2])],
        ]),
      },
    },
  ];
}

// ─── The register ──────────────────────────────────────────────────────────────

const kolone: TableColumn<Red>[] = [
  {
    key: "artikl",
    header: "Artikl",
    render: ({ r, iz }) => (
      <ArtiklCelija sifra={r.artikl} naziv={artikl(r.artikl)?.naziv ?? ""} detalj={`${jm(r.artikl)} · od ${datum(r.kreirana)} · ${dana(iz.starostDana)}`} />
    ),
    sortValue: ({ r }) => r.artikl,
    visibility: "w-[24%]",
  },
  { key: "skladiste", header: "Skladište", render: ({ r }) => skladisteNaziv(r.skladiste), sortValue: ({ r }) => r.skladiste, className: "text-gray-600", visibility: "hidden w-[14%] xl:table-cell" },
  {
    key: "izvor",
    header: "Izvorni dokument",
    render: (red) => (
      <span className="block min-w-0">
        <IzvorniDokument {...red} />
        <span className={sekundarno}>{IZVOR_LABELS[red.r.izvorTip]}</span>
      </span>
    ),
    sortValue: ({ r }) => r.izvorBroj,
    visibility: "w-[14%]",
  },
  { key: "trazeno", header: "Traženo", align: "right", render: ({ r }) => kol(r.trazeno), sortValue: ({ r }) => r.trazeno, className: "font-mono tabular-nums", visibility: "hidden w-[8%] md:table-cell" },
  {
    key: "rezervisano",
    header: "Rezervisano",
    align: "right",
    render: ({ r, iz }) => (
      <span className="block">
        {kol(r.rezervisano)}
        <span className={sekundarno}>drži se {kol(iz.drziSe)}</span>
      </span>
    ),
    sortValue: ({ r }) => r.rezervisano,
    className: "font-mono tabular-nums",
    visibility: "w-[10%]",
  },
  { key: "izdato", header: "Izdato", align: "right", render: ({ r }) => kol(r.izdato), sortValue: ({ r }) => r.izdato, className: "font-mono tabular-nums", visibility: "hidden w-[8%] md:table-cell" },
  {
    key: "nepokriveno",
    header: "Nepokriveno",
    align: "right",
    render: ({ iz }) => kol(iz.nepokriveno),
    sortValue: ({ iz }) => iz.nepokriveno,
    className: "font-mono font-medium tabular-nums text-gray-900",
    visibility: "w-[10%]",
  },
  {
    key: "status",
    header: "Status",
    render: ({ r, iz }) => {
      const opis = iz.status === "OTPUSTENA" ? r.razlogOtpustanja : STATUS_OPISI[iz.status];
      return (
        <span className="block min-w-0">
          <StatusBadge tone={STATUS_TONES[iz.status]}>{STATUS_LABELS[iz.status]}</StatusBadge>
          <span title={opis} className="mt-0.5 block truncate text-xs text-gray-500">
            {opis}
          </span>
        </span>
      );
    },
    sortValue: ({ iz }) => STATUSI.indexOf(iz.status),
    visibility: "w-[22%]",
  },
];

function opisRegistra(): string {
  const otvorenih = REDOVI.filter((x) => x.iz.jeOtvorena).length;
  const cekaju = REDOVI.filter((x) => x.iz.status === "CEKA_ZALIHU").length;
  return [
    `${otvorenih} ${plural(otvorenih, "otvorena", "otvorene", "otvorenih")} · ${cekaju} ${plural(cekaju, "čeka", "čekaju", "čeka")} zalihu`,
    "traženo = rezervisano + nepokriveno · rezervisano − izdato = drži se",
    `Rezervacija se ne upisuje ručno — nastaje iz odobrene potrebe (zahtjev odobren sa zalihe ili radni nalog), zato je prva radnja „Novi zahtjev sa zalihe“. ${NAPOMENE.zahtjevRezervacija}`,
    NAPOMENE.rezervacijaZbir,
    NAPOMENE.rezervacijaDrzi,
    POJMOVI.nepokriveno,
  ].join(" · ");
}

// ─── One reservation ───────────────────────────────────────────────────────────

const KORACI = ["Odobrena potreba", "Zaliha rezervisana", "Izdato", "Zatvorena"];

/**
 * Where the flow strip stands: a fully covered reservation waits at "Izdato", a
 * partly covered or empty one is still being reserved, a closed one is through. A
 * released one stops where it was.
 */
function fazaToka(r: Rezervacija, st: RezervacijaStatus): number {
  if (st === "ZATVORENA") return 4;
  if (st === "OTVORENA") return 2;
  if (st === "OTPUSTENA") return r.rezervisano >= r.trazeno ? 2 : 1;
  return 1;
}

/**
 * cicak's `koraciPokrica`: how much is asked for, how much stock is held, how much
 * has left on issue notes, and whether it is closed. The first step not done is
 * current — or, on a released reservation, ends there as "Otpuštena".
 */
function koraciPokrica(r: Rezervacija, st: RezervacijaStatus): TimelineStep[] {
  const j = jm(r.artikl);
  const koraci = [
    { label: "Potreba evidentirana", done: true, date: datum(r.kreirana), note: `traženo ${kol(r.trazeno)} ${j}` },
    { label: "Zaliha rezervisana", done: r.rezervisano >= r.trazeno, note: `rezervisano ${kol(r.rezervisano)} od ${kol(r.trazeno)} ${j}` },
    { label: "Izdato po rezervaciji", done: r.izdato >= r.trazeno, note: `izdato ${kol(r.izdato)} od ${kol(r.trazeno)} ${j}` },
    { label: "Zatvorena", done: r.zatvorena && st !== "OTPUSTENA", note: "ne drži više ništa na zalihi" },
  ];
  const prviOtvoren = koraci.findIndex((k) => !k.done);
  return koraci.map((k, index): TimelineStep => {
    if (st === "OTPUSTENA" && index === prviOtvoren) {
      return { key: k.label, title: "Otpuštena", note: r.razlogOtpustanja || "Bez navedenog razloga.", state: "late" };
    }
    return {
      key: k.label,
      title: k.label,
      ...(k.date ? { date: k.date } : {}),
      note: k.note,
      state: k.done ? "done" : index === prviOtvoren ? "current" : "next",
    };
  });
}

/** What an issue note took for this item — summed over its lines of the item. */
function stavkeZa(i: Izdatnica, sifra: string) {
  return i.stavke
    .filter((s) => s.artikl === sifra)
    .reduce((a, s) => ({ kolicina: a.kolicina + s.kolicina, rezervisano: a.rezervisano + s.rezervisano, predano: a.predano + s.predano }), {
      kolicina: 0,
      rezervisano: 0,
      predano: 0,
    });
}

/** The buttons as in cicak's action bar: issue what is held, top up what is not covered, release. */
function radnje({ iz }: Red): string[] {
  const dugmad: string[] = [];
  if (iz.drziSe > 0) dugmad.push("Izdaj sa zalihe");
  if (iz.jeOtvorena && iz.nepokriveno > 0) dugmad.push("Dopuni iz zalihe");
  if (iz.jeOtvorena) dugmad.push("Otpusti");
  return dugmad;
}

/** cicak's filled button: issuing what is held; with nothing held yet, topping up; never "Otpusti". */
function primarna({ iz }: Red): string | null {
  if (iz.drziSe > 0) return "Izdaj sa zalihe";
  if (iz.jeOtvorena && iz.nepokriveno > 0) return "Dopuni iz zalihe";
  return null;
}

function zapis(id: string): RecordView | null {
  const red = REDOVI.find((candidate) => candidate.r.id === id);
  if (!red) return null;
  const { r, iz } = red;
  const st = iz.status;
  const j = jm(r.artikl);
  const pokrice = koraciPokrica(r, st);
  // Every issue note raised on the same basis, in the same warehouse, that carries this item.
  const poOsnovu = IZDATNICE.filter((i) => i.izvorBroj === r.izvorBroj && i.skladiste === r.skladiste && i.stavke.some((s) => s.artikl === r.artikl)).sort(
    (a, b) => b.materijalniDatum.localeCompare(a.materijalniDatum) || b.broj.localeCompare(a.broj),
  );

  const izdatniceKolone: TableColumn<Izdatnica>[] = [
    {
      key: "broj",
      header: "Broj",
      render: (i) => (
        <Link to={ekranUrl("izdavanje", "izdatnice", i.id)} className="font-mono font-medium text-[#3B9DF8] hover:underline">
          {i.broj}
        </Link>
      ),
    },
    { key: "datum", header: "Datum", render: (i) => datum(i.materijalniDatum), className: "whitespace-nowrap font-mono tabular-nums" },
    { key: "status", header: "Status", render: (i) => <StatusBadge tone={IZDATNICA_STATUS_TONES[i.status]}>{IZDATNICA_STATUS_LABELS[i.status]}</StatusBadge> },
    { key: "kolicina", header: "Količina", align: "right", render: (i) => `${kol(stavkeZa(i, r.artikl).kolicina)} ${j}`, className: "font-mono tabular-nums" },
    { key: "rezervisano", header: "Iz rezervacije", align: "right", render: (i) => kol(stavkeZa(i, r.artikl).rezervisano), className: "font-mono tabular-nums" },
    { key: "predano", header: "Predano", align: "right", render: (i) => kol(stavkeZa(i, r.artikl).predano), className: "font-mono tabular-nums" },
  ];

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Zalihe" },
      { label: "Rezervacije", to: url() },
      { label: `${r.artikl} · ${r.izvorBroj}` },
    ],
    backTo: url(),
    topTitle: "Zalihe › Rezervacije",
    topStatus: "Zaliha koju drže odobrena trebovanja, i šta još nije pokriveno",
    icon: LuCalendarCheck,
    title: `Rezervacija · ${artiklNaziv(r.artikl)}`,
    subtitle: `${IZVOR_LABELS[r.izvorTip]} ${r.izvorBroj} · ${skladisteNaziv(r.skladiste)}`,
    badges: [{ label: STATUS_LABELS[st], tone: STATUS_TONES[st] }],
    hint: STATUS_OPISI[st],
    actions: radnje(red),
    primary: primarna(red),
    inlineActions: 3,
    steps: { title: "Tok rezervacije", steps: tokKoraci(KORACI, fazaToka(r, st), st === "OTPUSTENA") },
    fields: [
      {
        label: "Artikl",
        value: (
          <>
            <Link to={`/app/skladiste/zalihe/artikli/${r.artikl}`} className="font-mono text-[#3B9DF8] hover:underline">
              {r.artikl}
            </Link>{" "}
            · {artikl(r.artikl)?.naziv ?? ""}
          </>
        ),
      },
      { label: "Skladište", value: skladisteNaziv(r.skladiste) },
      { label: "Izvorni dokument", value: <IzvorniDokument {...red} /> },
      { label: "Vrsta izvora", value: IZVOR_LABELS[r.izvorTip] },
      { label: "Kreirana", value: `${datum(r.kreirana)} · ${dana(iz.starostDana)}` },
      { label: "Traženo", value: <span className="font-mono">{`${kol(r.trazeno)} ${j}`}</span> },
      { label: "Rezervisano", value: <span className="font-mono">{`${kol(r.rezervisano)} ${j}`}</span> },
      { label: "Izdato", value: <span className="font-mono">{`${kol(r.izdato)} ${j}`}</span> },
      { label: "Nepokriveno", value: <span className="font-mono">{`${kol(iz.nepokriveno)} ${j}`}</span> },
      { label: "Drži se", value: <span className="font-mono">{`${kol(iz.drziSe)} ${j}`}</span> },
      { label: "Raspoloživo sada u skladištu", value: <span className="font-mono">{`${kol(iz.raspolozivo)} ${j}`}</span> },
      ...(st === "OTPUSTENA" ? [{ label: "Razlog otpuštanja", value: r.razlogOtpustanja || "—", wide: true }] : []),
    ],
    tabs: [
      {
        key: "izdatnice",
        label: "Izdatnice po ovom osnovu",
        count: poOsnovu.length,
        content: (
          <Table
            bare
            columns={izdatniceKolone}
            rows={poOsnovu}
            getRowKey={(i) => i.id}
            emptyText={`Još nema izdatnice s ovim osnovom — „Izdaj sa zalihe“ je otvara s ${r.izvorBroj} kao osnovom.`}
          />
        ),
      },
      historijaTab([...r.historija]),
    ],
    // The header card's note first, then the notes under the issue notes.
    notes: [NAPOMENE.rezervacijaZbir, NAPOMENE.rezervacijaDrzi, NAPOMENE.kolicinaSamoDokumentom],
    side: [{ icon: LuHistory, title: "Pokriće rezervacije", count: brojac(pokrice), steps: pokrice }],
  };
}

export const REZERVACIJE_EKRAN: Screen = listScreen<Red>({
  stats: kartice(),
  table: {
    title: "Rezervacije zaliha",
    description: opisRegistra(),
    columns: kolone,
    rows: [...REDOVI].sort(poredak),
    getRowKey: ({ r }) => r.id,
    getRowHref: ({ r }) => url(r.id),
    searchText: ({ r, iz }) => [r.artikl, artikl(r.artikl)?.naziv ?? "", r.izvorBroj, r.skladiste, skladisteNaziv(r.skladiste), STATUS_LABELS[iz.status]],
    searchLabel: "Pretraga rezervacija",
    filters: [
      {
        key: "status",
        legend: "Status",
        options: STATUSI.map((s) => ({ value: s, label: STATUS_LABELS[s], tone: STATUS_TONES[s] })),
        matches: ({ iz }, value) => iz.status === value,
      },
      {
        key: "skladiste",
        legend: "Skladište",
        options: SKLADISTA.map((s) => ({ value: s.sifra, label: `${s.sifra} · ${s.naziv}` })),
        matches: ({ r }, value) => r.skladiste === value,
      },
    ],
    quick: { label: "Filtriraj po statusu", allLabel: "Sve", several: (count) => `${count} statusa` },
    buttons: ["Novo trebovanje", "Izvoz"],
    sortFields: [
      { value: "kreirana", label: "Kreirana", compare: (a, b) => a.r.kreirana.localeCompare(b.r.kreirana) },
      { value: "artikl", label: "Artikl", compare: (a, b) => a.r.artikl.localeCompare(b.r.artikl) },
      { value: "trazeno", label: "Traženo", compare: (a, b) => a.r.trazeno - b.r.trazeno },
      { value: "rezervisano", label: "Rezervisano", compare: (a, b) => a.r.rezervisano - b.r.rezervisano },
      { value: "nepokriveno", label: "Nepokriveno", compare: (a, b) => a.iz.nepokriveno - b.iz.nepokriveno },
      { value: "status", label: "Status", compare: (a, b) => REDOSLIJED[a.iz.status] - REDOSLIJED[b.iz.status] },
    ],
    noun: "rezervacija",
  },
  record: zapis,
});
