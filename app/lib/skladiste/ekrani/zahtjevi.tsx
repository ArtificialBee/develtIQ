import type { IconType } from "react-icons";
import { LuClipboardList, LuHistory, LuShoppingCart } from "react-icons/lu";
import { Link } from "react-router";
import type { TimelineStep } from "~/components/DetailPage";
import type { RecordView } from "~/components/RecordPage";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import rezervacijeData from "~/data/skladiste/rezervacije.json";
import zahtjeviData from "~/data/skladiste/zahtjevi.json";
import zaliheData from "~/data/skladiste/zalihe.json";
import { ekranUrl, listScreen, type Screen } from "~/lib/skladiste/ekrani";
import { datum, kol, plural } from "~/lib/skladiste/format";
import { IZVEDENO, NAPOMENE, artikl, artiklNaziv, oznaka, skladisteNaziv } from "~/lib/skladiste/podaci";
import type {
  OdlukaStavke,
  Prioritet,
  Rezervacija,
  VrstaPotrebe,
  Zahtjev,
  ZahtjevStatus,
  ZahtjevStavka,
  ZaliheExport,
} from "~/lib/skladiste/types";
import { ArtiklCelija, historijaTab, tokKoraci } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Izdavanje › Trebovanja and Skladište › Nabavka › Zahtjevi za
 * nabavku, from cicak's `ZahtjeviListaPage` and `ZahtjevDetaljPage`: one request
 * document, two registers by the kind of need. The same rows, steps, decisions
 * per line, fields, lines and notes, in the app's list and record layout.
 */

const ZAHTJEVI = zahtjeviData as unknown as Zahtjev[];
const REZERVACIJE = rezervacijeData as unknown as Rezervacija[];
const ZALIHE = zaliheData as unknown as ZaliheExport;

const MODUL = "skladiste/zahtjevi.ts";
const STATUS_LABELS = oznaka<Record<ZahtjevStatus, string>>(MODUL, "ZAHTJEV_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<ZahtjevStatus, StatusTone>>(MODUL, "ZAHTJEV_STATUS_TONES");
const PRIORITET_LABELS = oznaka<Record<Prioritet, string>>(MODUL, "PRIORITET_LABELS");
const ODLUKA_LABELS = oznaka<Record<OdlukaStavke, string>>(MODUL, "ODLUKA_LABELS");
const VRSTA_POTREBE_LABELS = oznaka<Record<VrstaPotrebe, string>>(MODUL, "VRSTA_POTREBE_LABELS");
const NAZIV_ZAHTJEVA = oznaka<Record<VrstaPotrebe, string>>(MODUL, "NAZIV_ZAHTJEVA");
const REGISTAR_ZAHTJEVA = oznaka<Record<VrstaPotrebe, { naziv: string; putanja: string }>>(MODUL, "REGISTAR_ZAHTJEVA");

/** Where each kind lives in edvin: requisitions under Izdavanje, purchases under Nabavka. */
const REGISTAR: Record<VrstaPotrebe, { sekcija: string; ekran: string; sekcijaNaziv: string; opisMenija: string; icon: IconType }> = {
  SA_ZALIHE: {
    sekcija: "izdavanje",
    ekran: "trebovanja",
    sekcijaNaziv: "Izdavanje",
    opisMenija: "Potrebe koje se izdaju sa zalihe: pošalji, ovjeri, odobri ili odbij",
    icon: LuClipboardList,
  },
  ZA_NABAVKU: {
    sekcija: "nabavka",
    ekran: "zahtjevi",
    sekcijaNaziv: "Nabavka",
    opisMenija: "Potrebe koje zaliha ne pokriva: ovjera, odluka i nabavka",
    icon: LuShoppingCart,
  },
};

/** A request's details page, in the register of its kind. */
export const zahtjevUrl = (z: Pick<Zahtjev, "id" | "vrsta">) => ekranUrl(REGISTAR[z.vrsta].sekcija, REGISTAR[z.vrsta].ekran, z.id);
const listaUrl = (vrsta: VrstaPotrebe) => ekranUrl(REGISTAR[vrsta].sekcija, REGISTAR[vrsta].ekran);

const OPIS_REGISTRA: Record<VrstaPotrebe, (n: number) => string> = {
  SA_ZALIHE: (n) =>
    `Potrebe koje se pokrivaju sa zalihe: odobrena stavka rezerviše robu, izdatnica je izdaje · ${n} ${plural(n, "trebovanje", "trebovanja", "trebovanja")}`,
  ZA_NABAVKU: (n) => `Potrebe koje zaliha ne pokriva: odobren zahtjev ide u nabavku · ${n} ${plural(n, "zahtjev", "zahtjeva", "zahtjeva")}`,
};

const STATUSI: ZahtjevStatus[] = ["NACRT", "POSLANO", "OVJERENO", "ODOBRENO", "U_NABAVCI", "ZAVRSENO"];

/** cicak's `stanjeArtikla(artikl, skladiste).raspolozivo`: what the warehouse has free for the item now. */
function raspolozivo(sifra: string, skladiste: string): number {
  return ZALIHE.poArtikluISkladistu.find((red) => red.artikl === sifra && red.skladiste === skladiste)?.raspolozivo ?? 0;
}

const prioritetTon = (p: Prioritet): StatusTone => (p === "VISOK" ? "warning" : "neutral");

// The app's small table buttons (the same as the list's own buttons).
const MALO_DUGME = "inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]";
export const MALO_PRIMARNO = `${MALO_DUGME} bg-[#3B9DF8] text-white hover:bg-blue-500`;
export const MALO_SEKUNDARNO = `${MALO_DUGME} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;

// ─── The register ──────────────────────────────────────────────────────────────

function kolone(): TableColumn<Zahtjev>[] {
  return [
    {
      key: "broj",
      header: "Broj",
      render: (z) => (
        <Link to={zahtjevUrl(z)} className="font-mono font-medium text-gray-900 hover:text-[#3B9DF8]">
          {z.broj}
        </Link>
      ),
      sortValue: (z) => z.broj,
      visibility: "w-[16%]",
    },
    { key: "skladiste", header: "Skladište", render: (z) => skladisteNaziv(z.skladiste), sortValue: (z) => z.skladiste, className: "text-gray-600", visibility: "hidden w-[22%] md:table-cell" },
    {
      key: "prioritet",
      header: "Prioritet",
      render: (z) => <StatusBadge tone={prioritetTon(z.prioritet)}>{PRIORITET_LABELS[z.prioritet]}</StatusBadge>,
      sortValue: (z) => ["NIZAK", "NORMALAN", "VISOK"].indexOf(z.prioritet),
      visibility: "w-[13%]",
    },
    { key: "stavki", header: "Stavki", align: "right", render: (z) => String(z.stavke.length), sortValue: (z) => z.stavke.length, className: "font-mono tabular-nums", visibility: "hidden w-[9%] sm:table-cell" },
    { key: "poslano", header: "Poslano", render: (z) => datum(z.poslano), sortValue: (z) => z.poslano, className: "font-mono tabular-nums", visibility: "w-[12%]" },
    {
      key: "status",
      header: "Status",
      render: (z) => (
        <span title={STATUS_LABELS[z.status]} className="block max-w-full truncate">
          <StatusBadge tone={STATUS_TONES[z.status]}>{STATUS_LABELS[z.status]}</StatusBadge>
        </span>
      ),
      sortValue: (z) => STATUSI.indexOf(z.status),
      visibility: "w-[28%]",
    },
  ];
}

/** One register: the requests of one kind, the highest number first, filtered by status as cicak's chips. */
function zahtjeviEkran(vrsta: VrstaPotrebe): Screen {
  const zahtjevi = ZAHTJEVI.filter((z) => z.vrsta === vrsta).sort((a, b) => b.broj.localeCompare(a.broj));
  // A requisition never goes to procurement, so it has no "U nabavci" step.
  const statusi = vrsta === "SA_ZALIHE" ? STATUSI.filter((s) => s !== "U_NABAVCI") : STATUSI;
  return listScreen<Zahtjev>({
    table: {
      title: REGISTAR_ZAHTJEVA[vrsta].naziv,
      description: `${OPIS_REGISTRA[vrsta](zahtjevi.length)} · ${NAPOMENE.zahtjevIshod}`,
      columns: kolone(),
      rows: zahtjevi,
      getRowKey: (z) => z.id,
      getRowHref: zahtjevUrl,
      searchText: (z) => [z.broj, z.trazilac, z.obrazlozenje, ...z.stavke.map((s) => artiklNaziv(s.artikl))],
      searchLabel: "Pretraga zahtjeva",
      filters: [
        {
          key: "status",
          legend: "Status",
          // The chip names the status up to its first " · ", as in cicak.
          options: statusi.map((s) => ({ value: s, label: STATUS_LABELS[s].split(" · ")[0], tone: STATUS_TONES[s] })),
          matches: (z, value) => z.status === value,
        },
      ],
      quick: { label: "Filtriraj po statusu", allLabel: "Sve", several: (count) => `${count} statusa` },
      buttons: [vrsta === "SA_ZALIHE" ? "Novo trebovanje" : "Novi zahtjev"],
      sortFields: [
        { value: "broj", label: "Broj", compare: (a, b) => a.broj.localeCompare(b.broj) },
        { value: "poslano", label: "Poslano", compare: (a, b) => a.poslano.localeCompare(b.poslano), isEmpty: (z) => !z.poslano },
        { value: "prioritet", label: "Prioritet", compare: (a, b) => ["NIZAK", "NORMALAN", "VISOK"].indexOf(a.prioritet) - ["NIZAK", "NORMALAN", "VISOK"].indexOf(b.prioritet) },
        { value: "stavki", label: "Stavki", compare: (a, b) => a.stavke.length - b.stavke.length },
        { value: "status", label: "Status", compare: (a, b) => STATUSI.indexOf(a.status) - STATUSI.indexOf(b.status) },
      ],
      noun: vrsta === "SA_ZALIHE" ? "trebovanja" : "zahtjeva",
    },
    record: zapis,
  });
}

// ─── One request ───────────────────────────────────────────────────────────────

// The request's way: the same labels for both kinds; the strip is never stopped.
const KORACI = ["Nacrt", "Poslano", "Ovjereno", "Odluka", "Realizovano"];
const FAZA: Record<ZahtjevStatus, number> = {
  NACRT: 0,
  POSLANO: 2,
  OVJERENO: 3,
  ODOBRENO: 4,
  U_NABAVCI: 4,
  ZAVRSENO: 5,
};

/** Who usually presses the next step — the header's helper line. */
const ULOGA_KORAKA: Record<ZahtjevStatus, string> = {
  NACRT: "tražilac dopunjava stavke i šalje zahtjev",
  POSLANO: "skladište ovjerava zahtjev",
  OVJERENO: "odobravatelj potrebe, nikad onaj ko je pripremio",
  ODOBRENO: "skladište izdaje ili prosljeđuje nabavci",
  U_NABAVCI: "nabavka evidentira narudžbu i zatvara zahtjev",
  ZAVRSENO: "",
};

/**
 * cicak's `koraciOdluka`: every line of the request in order — an approved one
 * done with the approved quantity, a refused or cancelled one stopped with its
 * reason, the first undecided one current, the rest still to come.
 */
function koraciOdluka(z: Zahtjev): TimelineStep[] {
  const prviCeka = z.stavke.findIndex((s) => s.odluka === "CEKA");
  return z.stavke.map((s, index) => {
    const jm = artikl(s.artikl)?.jm ?? "";
    const trazeno = s.trazeno === null ? "količina još nije određena" : `traženo ${kol(s.trazeno)} ${jm}`;
    const title = artiklNaziv(s.artikl);
    if (s.odluka === "ODOBRENO") {
      return {
        key: s.id,
        title,
        date: s.odobreno === null ? undefined : `${kol(s.odobreno)} ${jm}`,
        note: `${ODLUKA_LABELS[s.odluka]} · ${trazeno}`,
        state: "done" as const,
      };
    }
    if (s.odluka === "ODBIJENO" || s.odluka === "OTKAZANO") {
      return { key: s.id, title, note: `${ODLUKA_LABELS[s.odluka]}${s.razlog ? ` · ${s.razlog}` : ""}`, state: "late" as const };
    }
    return { key: s.id, title, note: trazeno, state: index === prviCeka ? ("current" as const) : ("next" as const) };
  });
}

/**
 * The buttons as in cicak's action bar for the status, and its filled one (each
 * status has its own next step; a verified request decides line by line, so its
 * bar is empty). cicak shows three in a row.
 */
function radnje(z: Zahtjev): { actions: string[]; primary: string | null; inlineActions: number } {
  // "Dodaj stavku" sits on cicak's tab bar while a draft; here it follows the bar's three, all four in a row.
  if (z.status === "NACRT") return { actions: ["Pošalji", "Uredi", "Obriši nacrt", "Dodaj stavku"], primary: "Pošalji", inlineActions: 4 };
  if (z.status === "POSLANO") return { actions: ["Ovjeri"], primary: "Ovjeri", inlineActions: 3 };
  if (z.status === "ODOBRENO") return { actions: ["Izdaj sa zalihe", "Završi"], primary: "Izdaj sa zalihe", inlineActions: 3 };
  if (z.status === "U_NABAVCI") {
    const korak = z.narudzba === "" ? "Evidentiraj narudžbu" : "Završi";
    return { actions: [korak], primary: korak, inlineActions: 3 };
  }
  return { actions: [], primary: null, inlineActions: 3 };
}

const odlukaTon = (o: OdlukaStavke): StatusTone => (o === "ODOBRENO" ? "success" : o === "CEKA" ? "warning" : "neutral");

function zapis(id: string): RecordView | null {
  const z = ZAHTJEVI.find((candidate) => candidate.id === id);
  if (!z) return null;
  const izvedeno = IZVEDENO.zahtjevi[z.id];
  const registar = REGISTAR[z.vrsta];
  const naziv = REGISTAR_ZAHTJEVA[z.vrsta].naziv;
  const nabavka = z.vrsta === "ZA_NABAVKU";
  const uloga = ULOGA_KORAKA[z.status];
  const odluke = koraciOdluka(z);
  const odluceno = z.stavke.filter((s) => s.odluka !== "CEKA").length;
  /** The reservation an approved line of a requisition became (cicak's `rezervacijaZaOsnov`). */
  const rezervacijaStavke = (s: ZahtjevStavka) => {
    const rezId = izvedeno.stavke[s.id]?.rezervacija;
    return rezId ? REZERVACIJE.find((r) => r.id === rezId) : undefined;
  };
  const sekundarno = "block font-sans text-xs text-gray-500";

  const kolone: TableColumn<ZahtjevStavka>[] = [
    {
      key: "artikl",
      header: "Artikl",
      render: (s) => (
        <ArtiklCelija
          sifra={s.artikl}
          naziv={artikl(s.artikl)?.naziv ?? ""}
          detalj={`${izvedeno.stavke[s.id]?.opisIzvora ?? ""} · ${izvedeno.stavke[s.id]?.opisNosioca ?? ""}`}
        />
      ),
    },
    { key: "jm", header: "JM", render: (s) => artikl(s.artikl)?.jm ?? "" },
    {
      key: "trazeno",
      header: "Traženo",
      align: "right",
      render: (s) => (s.trazeno === null ? <span className="text-gray-500">N/A</span> : kol(s.trazeno)),
      className: "font-mono tabular-nums",
    },
    {
      key: "odobreno",
      header: "Odobreno",
      align: "right",
      render: (s) => {
        const r = !nabavka && s.odluka === "ODOBRENO" ? rezervacijaStavke(s) : undefined;
        return (
          <>
            {s.odobreno === null ? "—" : kol(s.odobreno)}
            {r && (
              <span className={sekundarno}>
                rezervisano {kol(r.rezervisano)} · izdato {kol(r.izdato)}
              </span>
            )}
          </>
        );
      },
      className: "font-mono tabular-nums",
    },
    // cicak's purchase-request table heads "Raspoloživo" before "Naručeno / primljeno" but fills the cells the
    // other way round; here each heading stands over its own value, in the order of the cells.
    ...(nabavka
      ? [
          {
            key: "naruceno",
            header: "Naručeno / primljeno",
            align: "right" as const,
            render: (s: ZahtjevStavka) => (s.odluka === "ODOBRENO" ? `${kol(s.naruceno)} / ${kol(s.primljeno)}` : "—"),
            className: "whitespace-nowrap font-mono tabular-nums",
          },
        ]
      : []),
    {
      key: "raspolozivo",
      header: "Raspoloživo",
      align: "right",
      render: (s) => {
        const slobodno = raspolozivo(s.artikl, z.skladiste);
        return (
          <>
            {kol(slobodno)}
            {s.trazeno !== null && slobodno >= s.trazeno && <span className={sekundarno}>može se pokriti sa zalihe</span>}
          </>
        );
      },
      className: "font-mono tabular-nums",
    },
    {
      key: "status",
      header: "Status stavke",
      render: (s) => (
        <span className="block min-w-0">
          <StatusBadge tone={odlukaTon(s.odluka)}>{ODLUKA_LABELS[s.odluka]}</StatusBadge>
          {s.razlog && <span className="mt-0.5 block text-xs text-gray-500">{s.razlog}</span>}
        </span>
      ),
    },
    // A draft's lines are edited or removed; a verified request's undecided lines are approved or refused, line by line.
    ...(z.status === "NACRT" || z.status === "OVJERENO"
      ? [
          {
            key: "radnje",
            header: "",
            align: "right" as const,
            render: (s: ZahtjevStavka) =>
              z.status === "NACRT" ? (
                <span className="inline-flex justify-end gap-1">
                  <button type="button" className={MALO_SEKUNDARNO}>
                    {s.trazeno === null ? "Upiši količinu" : "Uredi"}
                  </button>
                  <button type="button" className={MALO_SEKUNDARNO}>
                    Ukloni
                  </button>
                </span>
              ) : s.odluka === "CEKA" ? (
                <span className="inline-flex justify-end gap-1">
                  <button type="button" className={MALO_PRIMARNO}>
                    Odobri
                  </button>
                  <button type="button" className={MALO_SEKUNDARNO}>
                    Odbij
                  </button>
                </span>
              ) : null,
            className: "whitespace-nowrap",
          },
        ]
      : []),
  ];

  const stavkeTab = <Table bare columns={kolone} rows={[...z.stavke]} getRowKey={(s) => s.id} emptyText="Nema stavki." />;

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: registar.sekcijaNaziv },
      { label: naziv, to: listaUrl(z.vrsta) },
      { label: z.broj },
    ],
    backTo: listaUrl(z.vrsta),
    topTitle: `${registar.sekcijaNaziv} › ${naziv}`,
    topStatus: registar.opisMenija,
    icon: registar.icon,
    title: `${NAZIV_ZAHTJEVA[z.vrsta]} ${z.broj}`,
    subtitle: `${VRSTA_POTREBE_LABELS[z.vrsta]} · ${skladisteNaziv(z.skladiste)} · ${z.trazilac}`,
    badges: [
      { label: STATUS_LABELS[z.status], tone: STATUS_TONES[z.status] },
      { label: PRIORITET_LABELS[z.prioritet], tone: prioritetTon(z.prioritet) },
    ],
    hint: uloga ? `obično: ${uloga}` : undefined,
    ...radnje(z),
    steps: { title: "Tok zahtjeva", steps: tokKoraci(KORACI, FAZA[z.status]) },
    fields: [
      { label: "Broj", value: <span className="font-mono">{z.broj}</span> },
      { label: "Vrsta potrebe", value: VRSTA_POTREBE_LABELS[z.vrsta] },
      { label: "Prioritet", value: PRIORITET_LABELS[z.prioritet] },
      { label: "Skladište", value: skladisteNaziv(z.skladiste) },
      { label: "Poslano", value: datum(z.poslano) },
      ...(nabavka ? [{ label: "Narudžba nabavci", value: z.narudzba ? <span className="font-mono">{z.narudzba}</span> : "—" }] : []),
      { label: "Ovjerio", value: z.ovjerio ? `${z.ovjerio.ko} · ${z.ovjerio.uloga}` : "—" },
      { label: "Obrazloženje", value: z.obrazlozenje || "—", wide: true },
    ],
    tabs: [{ key: "stavke", label: "Stavke", count: z.stavke.length, content: stavkeTab }, historijaTab([...z.historija])],
    notes: [NAPOMENE.zahtjevStavka, NAPOMENE.zahtjevIshod, nabavka ? NAPOMENE.zahtjevNarudzba : NAPOMENE.zahtjevRezervacija],
    side: [{ icon: LuHistory, title: "Odluke po stavkama", count: `${odluceno} od ${z.stavke.length}`, steps: odluke }],
  };
}

export const TREBOVANJA_EKRAN: Screen = zahtjeviEkran("SA_ZALIHE");
export const ZAHTJEVI_EKRAN: Screen = zahtjeviEkran("ZA_NABAVKU");
