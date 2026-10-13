import { Link } from "react-router";
import { LuClipboardList, LuHistory } from "react-icons/lu";
import type { RecordView } from "~/components/RecordPage";
import { DataTable, type SortField } from "~/components/DataTable";
import { StatusBadge } from "~/components/StatusBadge";
import type { TableColumn } from "~/components/Table";
import korekcijeData from "~/data/skladiste/korekcije.json";
import popisiData from "~/data/skladiste/popisi.json";
import { dokumentiLista, type DokumentRedLista } from "~/lib/skladiste/dokumenti-lista";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { datum, km, kol, plural } from "~/lib/skladiste/format";
import { IZVEDENO, NAPOMENE, artikl, artiklNaziv, oznaka, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { Korekcija, Popis, PopisnaStavka, PopisStatus, VrstaPopisa } from "~/lib/skladiste/types";
import { ArtiklCelija, brojac, historijaTab, Napomene, potpisiKoraci, SLJEDECI_KORAK_NAPOMENA, tokKoraci } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Unutar skladišta › Popisi, from cicak's `PopisiListaPage` and
 * `PopisDetaljPage`: the count register, and one count's plan, its count list
 * (blind while counting: the book quantities stay hidden until counting is
 * closed), its differences with the corrections they became, and its history.
 */

const POPISI = popisiData as unknown as Popis[];
const KOREKCIJE = korekcijeData as unknown as Korekcija[];
const STATUS_LABELS = oznaka<Record<PopisStatus, string>>("skladiste/popisi.ts", "POPIS_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<PopisStatus, DokumentRedLista["tone"]>>("skladiste/popisi.ts", "POPIS_STATUS_TONES");
const VRSTA_LABELS = oznaka<Record<VrstaPopisa, string>>("skladiste/popisi.ts", "VRSTA_POPISA_LABELS");

const url = (id?: string) => ekranUrl("interno", "popisi", id);
const korekcijaUrl = (id: string) => ekranUrl("interno", "korekcije", id);

const GRUPA: Record<PopisStatus, string> = {
  PLANIRAN: "PLANIRANO",
  U_TOKU: "U_TOKU",
  BROJANJE_ZATVORENO: "ZATVORENO",
  PROKNJIZEN: "PROKNJIZENO",
  OTKAZAN: "OTKAZANO",
};

/** A blind count hides the book quantity until counting is closed; an open one never does. */
const knjigaSkrivena = (p: Popis) => p.slijepo !== false && (p.status === "PLANIRAN" || p.status === "U_TOKU");

function statusDetalj(p: Popis): string {
  const izvedeno = IZVEDENO.popisi[p.id];
  switch (p.status) {
    case "PLANIRAN":
      return [p.razlog, `${izvedeno.opisSlijepog} brojanje`].filter(Boolean).join(" · ");
    case "U_TOKU":
      return `prebrojano ${izvedeno.zbir.prebrojano} od ${izvedeno.zbir.stavki} · ${izvedeno.opisSlijepog} brojanje`;
    case "BROJANJE_ZATVORENO":
    case "PROKNJIZEN":
      return izvedeno.opisZbira;
    case "OTKAZAN":
      return p.razlogZatvaranja;
  }
}

const red = (p: Popis): DokumentRedLista => {
  const izvedeno = IZVEDENO.popisi[p.id];
  return {
    id: p.id,
    broj: p.broj,
    datum: p.datum,
    vrsta: `${VRSTA_LABELS[p.vrsta]} popis`,
    skladiste: skladisteNaziv(p.skladiste),
    strana: p.komisija.join(", "),
    stranaDetalj: izvedeno.opisObuhvata,
    vrijednost: knjigaSkrivena(p) ? 0 : izvedeno.zbir.razlikaVrijednost,
    privremeno: false,
    status: STATUS_LABELS[p.status],
    tone: STATUS_TONES[p.status],
    statusDetalj: statusDetalj(p),
    grupa: GRUPA[p.status],
    pretraga: [p.razlog, ...p.stavke.map((s) => artiklNaziv(s.artikl))].join(" "),
    path: url(p.id),
  };
};

const KORACI = ["Planiran", "Brojanje", "Zatvoreno", "Proknjiženo"];
const FAZA: Record<PopisStatus, number> = { PLANIRAN: 0, U_TOKU: 1, BROJANJE_ZATVORENO: 2, PROKNJIZEN: 4, OTKAZAN: 0 };

const ULOGA_KORAKA: Record<PopisStatus, string> = {
  PLANIRAN: "glavni skladištar pokreće brojanje",
  U_TOKU: "komisija broji · predsjednik zatvara brojanje",
  BROJANJE_ZATVORENO: "glavni skladištar knjiži razlike",
  PROKNJIZEN: "",
  OTKAZAN: "",
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Counted minus book; an uncounted row reads as fully missing. */
const razlika = (p: Popis, s: PopisnaStavka) => IZVEDENO.popisi[p.id].razlike[s.id];

/** The line's difference in money: razlika × the item's stock price. */
const vrijednostRazlike = (p: Popis, s: PopisnaStavka) => r2(razlika(p, s) * (artikl(s.artikl)?.cijena ?? 0));

/** `lot L-7690` · `serijski S-31 · S-32` · `bez praćenja`. */
function oznakaPracenja(s: PopisnaStavka): string {
  if (!s.lot) return "bez praćenja";
  return artikl(s.artikl)?.pracenje === "SERIJSKI" ? `serijski ${s.lot}` : `lot ${s.lot}`;
}

/** `+5` / `−2`: cicak's signed difference in the badge. */
const predznak = (n: number) => (n === 0 ? kol(0) : `${n > 0 ? "+" : "−"}${kol(Math.abs(n))}`);

/** The difference of a counted line as a status tint (cicak's `RazlikaBadge`). */
const RazlikaBadge = ({ razlika: d }: { razlika: number }) =>
  d < 0 ? (
    <StatusBadge tone="danger">manjak {predznak(d)}</StatusBadge>
  ) : d > 0 ? (
    <StatusBadge tone="warning">višak {predznak(d)}</StatusBadge>
  ) : (
    <StatusBadge tone="success">bez razlike</StatusBadge>
  );

/** The item cell with its tracking, the "nalaz" badge on a find, and (on the count list) the line's note. */
const ArtiklPopisa = ({ s, napomena }: { s: PopisnaStavka; napomena: boolean }) => (
  <ArtiklCelija
    sifra={s.artikl}
    naziv={artikl(s.artikl)?.naziv ?? ""}
    detalj={
      <>
        {oznakaPracenja(s)}
        {s.nalaz && (
          <StatusBadge tone="info" className="ml-2">
            nalaz
          </StatusBadge>
        )}
        {napomena && s.napomena ? ` · ${s.napomena}` : ""}
      </>
    }
  />
);

/** The correction a line's difference became, or why there is none yet. */
function KorekcijaCelija({ s, razlika: d, crtica }: { s: PopisnaStavka; razlika: number; crtica: boolean }) {
  const korekcija = s.korekcijaId ? KOREKCIJE.find((k) => k.id === s.korekcijaId) : undefined;
  if (korekcija) {
    return (
      <Link to={korekcijaUrl(korekcija.id)} className="font-mono font-medium text-[#3B9DF8] hover:underline">
        {korekcija.broj}
      </Link>
    );
  }
  return <span className="whitespace-nowrap text-gray-500">{crtica && d === 0 ? "—" : "po knjiženju"}</span>;
}

/** The search texts of a count's line, as cicak's search reads them. */
const tekstoviStavke = (s: PopisnaStavka) => [artiklNaziv(s.artikl), s.lokacija, s.lot, s.napomena];

/** The orders both line tabs offer in the sort sheet. */
const SORT_STAVKI: SortField<PopisnaStavka>[] = [
  { value: "artikl", label: "Artikl", compare: (a, b) => a.artikl.localeCompare(b.artikl) },
  { value: "lokacija", label: "Lokacija", compare: (a, b) => a.lokacija.localeCompare(b.lokacija) },
];

/** cicak's "Prikaži" switch while counting: the uncounted lines or the finds. */
const PRIKAZI: { value: string; label: string }[] = [
  { value: "NEPREBROJANO", label: "Neprebrojano" },
  { value: "NALAZI", label: "Nalazi" },
];

/**
 * The "Popisna lista" tab: every frozen position with what was counted. While
 * counting, a "Prikaži" filter narrows it to the uncounted lines or the finds;
 * before closing a status column says whether each line is counted, after it
 * the difference's value and its correction.
 */
function PopisnaLista({ p }: { p: Popis }) {
  const izvedeno = IZVEDENO.popisi[p.id];
  const zbir = izvedeno.zbir;
  const uToku = p.status === "U_TOKU";
  const planiran = p.status === "PLANIRAN";
  const prijeZatvaranja = planiran || uToku;
  const skrivena = knjigaSkrivena(p);
  const slijepo = p.slijepo !== false;

  const kolone: TableColumn<PopisnaStavka>[] = [
    { key: "artikl", header: "Artikl", render: (s) => <ArtiklPopisa s={s} napomena /> },
    { key: "jm", header: "JM", render: (s) => artikl(s.artikl)?.jm ?? "" },
    { key: "lokacija", header: "Lokacija", render: (s) => s.lokacija || "bez lokacija", className: "font-mono" },
    ...(skrivena
      ? []
      : [{ key: "knjigovodstveno", header: "Knjigovodstveno", align: "right" as const, render: (s: PopisnaStavka) => kol(s.knjigovodstveno), className: "font-mono tabular-nums" }]),
    {
      key: "prebrojano",
      header: "Prebrojano",
      align: "right",
      // While counting cicak types the count in place; here it reads as entered so far.
      render: (s) => (s.prebrojano === null ? "—" : uToku ? String(s.prebrojano) : kol(s.prebrojano)),
      className: "font-mono tabular-nums",
    },
    ...(skrivena
      ? []
      : [
          {
            key: "razlika",
            header: "Razlika",
            render: (s: PopisnaStavka) => (s.prebrojano === null ? <span className="text-gray-500">—</span> : <RazlikaBadge razlika={razlika(p, s)} />),
          },
        ]),
    ...(prijeZatvaranja
      ? [
          {
            key: "status",
            header: "Status",
            render: (s: PopisnaStavka) =>
              s.prebrojano === null ? <StatusBadge tone="neutral">nije prebrojano</StatusBadge> : <StatusBadge tone="success">prebrojano</StatusBadge>,
          },
        ]
      : [
          {
            key: "vrijednost",
            header: "Vrijednost razlike",
            align: "right" as const,
            render: (s: PopisnaStavka) => (razlika(p, s) === 0 ? "—" : km(vrijednostRazlike(p, s))),
            className: "font-mono tabular-nums",
          },
          { key: "korekcija", header: "Korekcija", render: (s: PopisnaStavka) => <KorekcijaCelija s={s} razlika={razlika(p, s)} crtica /> },
        ]),
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* cicak's "Prikaži" switch and search are the table's own quick filter and search. */}
      <DataTable<PopisnaStavka>
        bare
        title="Popisna lista"
        description={uToku ? (skrivena ? NAPOMENE.popisSlijepoDoZatvaranja : "Knjigovodstvena količina je uz svaku poziciju — otvoreno brojanje.") : ""}
        columns={kolone}
        rows={[...p.stavke]}
        getRowKey={(s) => s.id}
        searchText={tekstoviStavke}
        searchLabel="Pretraga popisne liste"
        filters={
          uToku
            ? [{ key: "prikazi", legend: "Prikaži", options: PRIKAZI, matches: (s, v) => (v === "NEPREBROJANO" ? s.prebrojano === null : Boolean(s.nalaz)) }]
            : []
        }
        quick={uToku ? { label: "Prikaži", allLabel: "Sve pozicije", several: (n) => `${n} odabrano` } : undefined}
        sortFields={SORT_STAVKI}
        noun="pozicija"
        emptyText={
          planiran
            ? "Popisna lista nastaje pokretanjem brojanja — snimak knjigovodstvenih količina svih pozicija u obuhvatu."
            : "Popis nema pozicija."
        }
      />
      <div className="flex flex-col gap-2 border-t border-[#e5eaf2] px-3 pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
          <span>
            Prebrojano:{" "}
            <span className="font-mono">
              {zbir.prebrojano} od {zbir.stavki}
            </span>
          </span>
          {!skrivena && <span>Razlike: {izvedeno.opisZbira}</span>}
        </div>
        <Napomene
          stavke={[
            ...(slijepo ? (skrivena ? [NAPOMENE.popisSlijepoDoZatvaranja] : []) : [NAPOMENE.popisOtvoren]),
            ...(uToku ? [NAPOMENE.popisZamrzava, "Unos se sprema kad polje izgubi fokus ili na Enter · nula je unos, prazno polje nije."] : []),
            NAPOMENE.popisRazlikeKorekcije,
            ...(p.status === "PROKNJIZEN" ? [NAPOMENE.proknjizenoSamoCita] : []),
          ]}
        />
      </div>
    </div>
  );
}

/** The "Razlike" tab: only the lines whose count differs from the book, with the correction each became. */
function Razlike({ p }: { p: Popis }) {
  const zbir = IZVEDENO.popisi[p.id].zbir;
  const razlike = p.stavke.filter((s) => razlika(p, s) !== 0);

  const kolone: TableColumn<PopisnaStavka>[] = [
    { key: "artikl", header: "Artikl", render: (s) => <ArtiklPopisa s={s} napomena={false} /> },
    { key: "lokacija", header: "Lokacija", render: (s) => s.lokacija || "bez lokacija", className: "font-mono" },
    {
      key: "knjigovodstveno",
      header: "Knjigovodstveno",
      align: "right",
      render: (s) => `${kol(s.knjigovodstveno)} ${artikl(s.artikl)?.jm ?? ""}`,
      className: "font-mono tabular-nums",
    },
    { key: "prebrojano", header: "Prebrojano", align: "right", render: (s) => kol(s.prebrojano ?? 0), className: "font-mono tabular-nums" },
    { key: "razlika", header: "Razlika", render: (s) => <RazlikaBadge razlika={razlika(p, s)} /> },
    { key: "vrijednost", header: "Vrijednost", align: "right", render: (s) => km(vrijednostRazlike(p, s)), className: "font-mono tabular-nums" },
    { key: "korekcija", header: "Korekcija", render: (s) => <KorekcijaCelija s={s} razlika={razlika(p, s)} crtica={false} /> },
  ];

  return (
    <div className="flex flex-col gap-3">
      <DataTable<PopisnaStavka>
        bare
        title="Razlike"
        description=""
        columns={kolone}
        rows={razlike}
        getRowKey={(s) => s.id}
        searchText={tekstoviStavke}
        searchLabel="Pretraga razlika"
        filters={[]}
        sortFields={[...SORT_STAVKI, { value: "vrijednost", label: "Vrijednost", compare: (a, b) => vrijednostRazlike(p, a) - vrijednostRazlike(p, b) }]}
        noun="razlika"
        emptyText="Bez razlika — prebrojano se poklapa s knjigom na svakoj poziciji."
      />
      <div className="flex flex-col gap-2 border-t border-[#e5eaf2] px-3 pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
          <span>
            {zbir.manjak} {plural(zbir.manjak, "manjak", "manjka", "manjaka")} · {zbir.visak} {plural(zbir.visak, "višak", "viška", "viškova")}
          </span>
          <span>
            Vrijednost razlika: <span className="font-mono">{km(zbir.razlikaVrijednost)}</span>
          </span>
        </div>
        <Napomene
          stavke={[
            NAPOMENE.popisRazlikeKorekcije,
            NAPOMENE.korekcijaStorno,
            ...(p.status === "BROJANJE_ZATVORENO" ? ["Korekcije nastaju knjiženjem — do tada je razlika samo nalaz komisije."] : []),
          ]}
        />
      </div>
    </div>
  );
}

/**
 * The buttons as in cicak's action bar for the status: the step decisions first,
 * then the sheets, cancel and delete. While counting, the filled button is "Unesi
 * brojanje" until every line is counted, then "Zatvori brojanje". A plan whose
 * scope holds no stock can neither start nor print its sheet.
 */
function radnje(p: Popis): Pick<RecordView, "actions" | "primary" | "disabledActions"> {
  const planiran = p.status === "PLANIRAN";
  const uToku = p.status === "U_TOKU";
  const zatvoreno = p.status === "BROJANJE_ZATVORENO";
  const pozicije = IZVEDENO.popisi[p.id].pozicijeZaPopis ?? [];
  const neprebrojano = p.stavke.some((s) => s.prebrojano === null);
  const odluke: string[] = [];
  if (planiran) odluke.push("Pokreni brojanje", "Uredi plan");
  if (uToku) {
    if (neprebrojano) odluke.push("Unesi brojanje");
    odluke.push("Zatvori brojanje", "+ Nalaz");
  }
  if (zatvoreno) odluke.push("Proknjiži razlike");
  const autorske: string[] = [];
  if (planiran || uToku) autorske.push("Popisna lista (PDF)");
  if (zatvoreno || p.status === "PROKNJIZEN") autorske.push("Lista razlika (PDF)");
  if (IZVEDENO.popisi[p.id].jeOtvoren) autorske.push("Otkaži");
  if (planiran) autorske.push("Obriši plan");
  const disabledActions: string[] = [];
  if (planiran && pozicije.length === 0) disabledActions.push("Pokreni brojanje");
  if ((planiran || uToku) && pozicije.length === 0 && p.stavke.length === 0) disabledActions.push("Popisna lista (PDF)");
  return {
    actions: [...odluke, ...autorske],
    primary: planiran ? "Pokreni brojanje" : uToku ? (neprebrojano ? "Unesi brojanje" : "Zatvori brojanje") : zatvoreno ? "Proknjiži razlike" : null,
    disabledActions,
  };
}

function zapis(id: string): RecordView | null {
  const p = POPISI.find((candidate) => candidate.id === id);
  if (!p) return null;
  const izvedeno = IZVEDENO.popisi[p.id];
  const zbir = izvedeno.zbir;
  const otkazan = p.status === "OTKAZAN";
  const skrivena = knjigaSkrivena(p);
  const slijepo = p.slijepo !== false;
  const opisNacina = slijepo ? NAPOMENE.popisSlijepo : NAPOMENE.popisOtvoren;
  const pozicije = izvedeno.pozicijeZaPopis ?? [];
  const neprebrojane = p.stavke.filter((s) => s.prebrojano === null);
  const nalazi = p.stavke.filter((s) => s.nalaz);
  const razlike = p.stavke.filter((s) => razlika(p, s) !== 0);
  const brojKorekcija = p.stavke.filter((s) => s.korekcijaId !== "").length;
  const faza = otkazan ? (p.zatvorioBrojanje ? 2 : p.otvorio ? 1 : 0) : FAZA[p.status];
  const uloga = ULOGA_KORAKA[p.status];
  const potpisi = potpisiKoraci(
    izvedeno.potpisi.map((mjesto) => ({ ...mjesto, hint: uloga ? `obično: ${uloga}` : undefined })),
    otkazan,
    "Popis otkazan",
  );

  // One notice, the first that holds, in cicak's order.
  const callouts: RecordView["callouts"] = [];
  if (otkazan) {
    callouts.push({
      tone: "info",
      title: "Popis je otkazan",
      text: `${p.razlogZatvaranja || "Bez navedenog razloga."} Zamrznute pozicije su oslobođene; ništa nije proknjiženo. Dokument je samo za čitanje.`,
    });
  } else if (p.status === "PROKNJIZEN") {
    callouts.push({
      tone: "success",
      title: `Razlike proknjižene · ${izvedeno.opisZbira}`,
      text: `${
        brojKorekcija === 0
          ? "Bez razlika — nijedna korekcija nije bila potrebna."
          : `${brojKorekcija} ${plural(brojKorekcija, "korekcija", "korekcije", "korekcija")} · veza na svaku je u tabu Razlike.`
      } ${NAPOMENE.proknjizenoSamoCita}`,
    });
  } else if (p.status === "BROJANJE_ZATVORENO") {
    callouts.push({
      tone: "info",
      title: `Brojanje zatvoreno · ${izvedeno.opisZbira}`,
      text: `Knjigovodstvene količine su sada vidljive. ${NAPOMENE.popisRazlikeKorekcije} Pozicije više nisu zamrznute — prije knjiženja svaka razlika se provjerava prema današnjem stanju.`,
    });
  } else if (p.status === "U_TOKU") {
    callouts.push({
      tone: "warning",
      title: `Brojanje u toku · ${izvedeno.opisSlijepog} · pozicije zamrznute`,
      text: `${opisNacina} Prebrojano ${zbir.prebrojano} od ${zbir.stavki}${
        nalazi.length > 0 ? ` · ${nalazi.length} ${plural(nalazi.length, "nalaz", "nalaza", "nalaza")}` : ""
      }.`,
    });
  } else if (pozicije.length === 0) {
    callouts.push({
      tone: "warning",
      title: "Obuhvat ne pokriva nijednu poziciju sa stanjem",
      text: "Brojanje se ne može pokrenuti dok nema šta brojati — uredite plan: drugo skladište, druge lokacije ili druga grupa artikala.",
    });
  } else {
    callouts.push({
      tone: "info",
      title: `Plan · pokretanjem se zamrzava ${pozicije.length} ${plural(pozicije.length, "pozicija", "pozicije", "pozicija")}`,
      text: `${NAPOMENE.popisZamrzava} ${opisNacina}`,
    });
  }

  // cicak's tile strip under the fields, once the count has lines.
  const summary: RecordView["summary"] =
    p.stavke.length > 0
      ? {
          tiles: [
            { label: "Pozicije", value: zbir.stavki },
            {
              label: "Prebrojano",
              value: (
                <>
                  {zbir.prebrojano} <span className="text-sm font-normal">od {zbir.stavki}</span>
                </>
              ),
            },
            ...(skrivena
              ? [
                  { label: "Neprebrojano", value: neprebrojane.length },
                  { label: "Nalazi", value: nalazi.length },
                ]
              : [
                  { label: "Manjak · višak", value: `${zbir.manjak} · ${zbir.visak}` },
                  { label: "Vrijednost razlika", value: km(zbir.razlikaVrijednost) },
                ]),
          ],
        }
      : undefined;

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Unutar skladišta" },
      { label: "Popisi", to: url() },
      { label: p.broj },
    ],
    backTo: url(),
    topTitle: "Unutar skladišta › Popisi",
    topStatus: "Brojanje zaliha na presjeku · razlike se knjiže kao korekcije",
    icon: LuClipboardList,
    title: `Popis ${p.broj}`,
    subtitle: `${VRSTA_LABELS[p.vrsta]} popis · ${skladisteNaziv(p.skladiste)} · ${izvedeno.opisObuhvata}`,
    badges: [
      { label: STATUS_LABELS[p.status], tone: STATUS_TONES[p.status] },
      { label: VRSTA_LABELS[p.vrsta], tone: "neutral" },
      { label: `${izvedeno.opisSlijepog} brojanje`, tone: slijepo ? "neutral" : "warning" },
    ],
    hint: uloga ? `obično: ${uloga}` : undefined,
    ...radnje(p),
    inlineActions: 3,
    steps: { title: "Tok popisa", steps: tokKoraci(KORACI, faza, otkazan) },
    callouts,
    fields: [
      { label: "Broj", value: <span className="font-mono">{p.broj}</span> },
      { label: "Datum presjeka", value: datum(p.datum) },
      { label: "Skladište", value: skladisteNaziv(p.skladiste) },
      { label: "Vrsta", value: VRSTA_LABELS[p.vrsta] },
      { label: "Obuhvat", value: izvedeno.opisObuhvata },
      {
        label: "Komisija",
        value: (
          <span className="flex flex-col">
            {p.komisija.map((ime, index) => (
              <span key={ime}>
                {ime}
                {index === 0 && <span className="text-xs text-gray-500"> · predsjednik</span>}
              </span>
            ))}
          </span>
        ),
      },
      { label: "Razlog", value: p.razlog || "—", wide: true },
      { label: "Napomena", value: p.napomena || "—", wide: true },
    ],
    summary,
    tabs: [
      { key: "lista", label: "Popisna lista", count: p.stavke.length, content: <PopisnaLista p={p} /> },
      // A blind count hides the book until counting is closed, so its differences can not be opened yet.
      skrivena
        ? { key: "razlike", label: "Razlike", disabled: true, content: null }
        : { key: "razlike", label: "Razlike", count: razlike.length, content: <Razlike p={p} /> },
      historijaTab([...p.historija]),
    ],
    notes: izvedeno.jeOtvoren ? [SLJEDECI_KORAK_NAPOMENA] : undefined,
    side: [{ icon: LuHistory, title: "Ovjere i potpisi", count: brojac(potpisi), steps: potpisi }],
  };
}

export const POPISI_EKRAN: Screen = dokumentiLista({
  naslov: "Popisi",
  opis: "Brojanje zaliha na presjeku · razlike se knjiže kao korekcije",
  stranaNaslov: "Komisija i obuhvat",
  redovi: POPISI.map(red),
  grupe: [
    { value: "PLANIRANO", label: "Planirano" },
    { value: "U_TOKU", label: "Brojanje" },
    { value: "ZATVORENO", label: "Zatvoreno" },
    { value: "PROKNJIZENO", label: "Proknjiženo" },
    { value: "OTKAZANO", label: "Otkazano" },
  ],
  novo: "Novi popis",
  prazno: "Nijedan popis ne odgovara filteru.",
  napomena: `Vrijednost = zbir razlika (manjak i višak) — skrivena dok slijepo brojanje traje. Način brojanja (slijepo ili otvoreno) bira se na planu. ${NAPOMENE.popisZamrzava} ${NAPOMENE.popisRazlikeKorekcije}`,
  record: zapis,
});
