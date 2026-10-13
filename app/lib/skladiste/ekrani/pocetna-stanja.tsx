import { LuDatabaseZap, LuHistory } from "react-icons/lu";
import type { RecordView } from "~/components/RecordPage";
import { Table, type TableColumn } from "~/components/Table";
import pocetnaStanjaData from "~/data/skladiste/pocetna-stanja.json";
import { dokumentiLista, type DokumentRedLista } from "~/lib/skladiste/dokumenti-lista";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { datum, km, kol, plural } from "~/lib/skladiste/format";
import { IZVEDENO, NAPOMENE, artikl, oznaka, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { PocetnoStanje, PocetnoStanjeStatus, PocetnoStanjeStavka } from "~/lib/skladiste/types";
import { ArtiklCelija, SLJEDECI_KORAK_NAPOMENA, brojac, historijaTab, potpisiKoraci, tokKoraci } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Postavke › Početna stanja, from cicak's `PocetnaStanjaListaPage` and
 * `PocetnoStanjeDetaljPage`: one opening balance per warehouse, its lines (typed
 * or imported from CSV), the approval and the posting that makes it the
 * warehouse's first stock. After posting, documents take over.
 */

const POCETNA_STANJA = pocetnaStanjaData as unknown as PocetnoStanje[];
const STATUS_LABELS = oznaka<Record<PocetnoStanjeStatus, string>>("skladiste/pocetna-stanja.ts", "PST_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<PocetnoStanjeStatus, DokumentRedLista["tone"]>>("skladiste/pocetna-stanja.ts", "PST_STATUS_TONES");

const url = (id?: string) => ekranUrl("postavke", "pocetna-stanja", id);

const grupa = (status: PocetnoStanjeStatus) => (status === "PROKNJIZENO" || status === "OTKAZANO" ? status : "U_TOKU");

const red = (p: PocetnoStanje): DokumentRedLista => ({
  id: p.id,
  broj: p.broj,
  datum: p.datum,
  vrsta: "Početno stanje",
  skladiste: skladisteNaziv(p.skladiste),
  strana: skladisteNaziv(p.skladiste),
  stranaDetalj: `${p.stavke.length} ${plural(p.stavke.length, "pozicija", "pozicije", "pozicija")}${p.izvor ? ` · ${p.izvor}` : ""}`,
  vrijednost: IZVEDENO.pocetnaStanja[p.id].vrijednost,
  privremeno: false,
  status: STATUS_LABELS[p.status],
  tone: STATUS_TONES[p.status],
  statusDetalj: p.napomena,
  grupa: grupa(p.status),
  pretraga: [p.napomena, p.izvor, ...p.stavke.map((s) => `${s.artikl} ${s.lot}`)].join(" "),
  path: url(p.id),
});

const KORACI = ["Nacrt", "Odobreno", "Proknjiženo"];
const FAZA: Record<PocetnoStanjeStatus, number> = { NACRT: 1, ODOBRENO: 2, PROKNJIZENO: 3, OTKAZANO: 0 };

const ULOGA_KORAKA: Record<PocetnoStanjeStatus, string> = {
  NACRT: "referent unosi ili uvozi stavke · glavni skladištar odobrava",
  ODOBRENO: "glavni skladištar knjiži",
  PROKNJIZENO: "",
  OTKAZANO: "",
};

/**
 * The buttons as in cicak's action bar for the status: the step decisions first,
 * then print, template, cancel and delete. The step is the filled button; a draft
 * without lines can not be approved.
 */
function radnje(p: PocetnoStanje): Pick<RecordView, "actions" | "primary" | "disabledActions"> {
  const nacrt = p.status === "NACRT";
  const korak = nacrt ? "Odobri" : p.status === "ODOBRENO" ? "Proknjiži" : null;
  const odluke: string[] = korak ? [korak] : [];
  if (nacrt) odluke.push("Dodaj stavku", "Uvezi CSV");
  const autorske = ["Štampaj"];
  if (nacrt) autorske.push("Preuzmi CSV predložak", "Uredi zaglavlje");
  if (nacrt || p.status === "ODOBRENO") autorske.push("Otkaži");
  if (nacrt) autorske.push("Obriši nacrt");
  return {
    actions: [...odluke, ...autorske],
    primary: korak,
    disabledActions: nacrt && p.stavke.length === 0 ? ["Odobri"] : [],
  };
}

/**
 * Why the warehouse itself can no longer take this balance (cicak's
 * `preprekePocetnogStanja`). The export keeps them ahead of the line checks in one
 * list; a line check always names its line (`ART-… · lokacija…:`) or says there are
 * none, so the warehouse's own obstacles are the rest.
 */
function preprekeSkladista(p: PocetnoStanje) {
  const provjere = IZVEDENO.pocetnaStanja[p.id].provjere ?? [];
  return provjere.filter(
    (prepreka) => prepreka.razlog !== "Početno stanje nema stavki." && !p.stavke.some((s) => prepreka.razlog.startsWith(`${s.artikl} · `)),
  );
}

function zapis(id: string): RecordView | null {
  const p = POCETNA_STANJA.find((candidate) => candidate.id === id);
  if (!p) return null;
  const izvedeno = IZVEDENO.pocetnaStanja[p.id];
  const proknjizeno = izvedeno.jeProknjizeno;
  const prekinuto = p.status === "OTKAZANO";
  const uloga = ULOGA_KORAKA[p.status];
  const skladisteSmetnje = proknjizeno || prekinuto ? [] : preprekeSkladista(p);
  const potpisi = potpisiKoraci(
    izvedeno.potpisi.map((mjesto) => ({ ...mjesto, hint: uloga ? `obično: ${uloga}` : undefined })),
    prekinuto,
    "Početno stanje otkazano",
  );

  const kolone: TableColumn<PocetnoStanjeStavka>[] = [
    { key: "artikl", header: "Artikl", render: (s) => <ArtiklCelija sifra={s.artikl} naziv={artikl(s.artikl)?.naziv ?? ""} /> },
    {
      key: "lokacija",
      header: "Lokacija · lot",
      render: (s) => `${s.lokacija || "bez lokacija"}${s.lot ? ` · ${s.lot}` : ""}`,
      className: "whitespace-nowrap font-mono",
    },
    {
      key: "kolicina",
      header: "Količina",
      align: "right",
      render: (s) => `${kol(s.kolicina)} ${artikl(s.artikl)?.jm ?? ""}`,
      className: "whitespace-nowrap font-mono tabular-nums",
    },
    { key: "cijena", header: "Jed. cijena", align: "right", render: (s) => km(s.cijena), className: "font-mono tabular-nums" },
    { key: "vrijednost", header: "Vrijednost", align: "right", render: (s) => km(s.kolicina * s.cijena), className: "font-mono tabular-nums" },
  ];

  const stavkeTab = (
    <div className="flex flex-col gap-3">
      <Table bare columns={kolone} rows={[...p.stavke]} getRowKey={(s) => s.id} emptyText="Nema stavki." />
      <div className="border-t border-[#e5eaf2] px-3 pt-3 text-xs text-gray-600">
        Ukupno: <span className="font-mono">{kol(izvedeno.kolicina)}</span> · vrijednost <span className="font-mono">{km(izvedeno.vrijednost)}</span>
      </div>
    </div>
  );

  // One notice, the first that holds, in cicak's order.
  const callouts: RecordView["callouts"] = [];
  if (prekinuto) {
    callouts.push({
      tone: "info",
      title: "Početno stanje je otkazano",
      text: `${p.razlogZatvaranja || "Bez navedenog razloga."} Skladište može dobiti novo početno stanje dok u njemu nema prometa.`,
    });
  } else if (proknjizeno) {
    callouts.push({
      tone: "success",
      title: `Proknjiženo · ${km(izvedeno.vrijednost)} prve zalihe`,
      text: `Ovo je prvi red skladišne kartice svakog artikla u ${p.skladiste}; outbox nosi leg „Početno stanje“. Dokument je samo za čitanje — dalje zalihu mijenjaju dokumenti.`,
    });
  } else if (skladisteSmetnje.length > 0) {
    callouts.push({
      tone: "warning",
      title: "Skladište više ne može primiti početno stanje",
      text: `${skladisteSmetnje[0].razlog} ${skladisteSmetnje[0].rjesenje}`,
    });
  } else if (p.stavke.length === 0) {
    callouts.push({ tone: "info", title: "Nacrt bez stavki", text: "Dodajte stavke ručno (ili skenom) ili uvezite CSV — predložak je u meniju." });
  }

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Postavke" },
      { label: "Početna stanja", to: url() },
      { label: p.broj },
    ],
    backTo: url(),
    topTitle: "Postavke › Početna stanja",
    topStatus: "Prva zaliha skladišta, preuzeta na dan presjeka — jedno po skladištu, prije prvog prometa",
    icon: LuDatabaseZap,
    title: `Početno stanje ${p.broj}`,
    subtitle: `${skladisteNaziv(p.skladiste)} · presjek ${datum(p.datum)}`,
    badges: [{ label: STATUS_LABELS[p.status], tone: STATUS_TONES[p.status] }],
    hint: uloga ? `obično: ${uloga}` : undefined,
    ...radnje(p),
    inlineActions: 3,
    steps: { title: "Tok početnog stanja", steps: tokKoraci(KORACI, FAZA[p.status], prekinuto) },
    callouts,
    fields: [
      { label: "Broj", value: <span className="font-mono">{p.broj}</span> },
      { label: "Datum presjeka", value: datum(p.datum) },
      { label: "Skladište", value: skladisteNaziv(p.skladiste) },
      { label: "Izvor stavki", value: p.izvor || "unos ručno" },
      { label: "Pozicija", value: <span className="font-mono">{p.stavke.length}</span> },
      { label: "Vrijednost", value: <span className="font-mono">{km(izvedeno.vrijednost)}</span> },
      { label: "Napomena", value: p.napomena || "—", wide: true },
    ],
    tabs: [{ key: "stavke", label: "Stavke", count: p.stavke.length, content: stavkeTab }, historijaTab([...p.historija])],
    notes: [
      "Jedno početno stanje po skladištu, samo prije prvog prometa.",
      NAPOMENE.kolicinaSamoDokumentom,
      ...(!proknjizeno && !prekinuto ? [SLJEDECI_KORAK_NAPOMENA] : []),
    ],
    side: [{ icon: LuHistory, title: "Ovjere i potpisi", count: brojac(potpisi), steps: potpisi }],
  };
}

export const POCETNA_STANJA_EKRAN: Screen = dokumentiLista({
  naslov: "Početna stanja",
  opis: "Prva zaliha skladišta, preuzeta na dan presjeka — jedno po skladištu, prije prvog prometa",
  stranaNaslov: "Skladište i stavke",
  redovi: POCETNA_STANJA.map(red),
  grupe: [
    { value: "U_TOKU", label: "U toku" },
    { value: "PROKNJIZENO", label: "Proknjiženo" },
    { value: "OTKAZANO", label: "Otkazano" },
  ],
  novo: "Novo početno stanje",
  prazno: "Nijedno početno stanje ne odgovara filteru.",
  napomena: "Početno stanje se unosi ručno ili uvozom CSV-a, odobrava i knjiži; poslije njega zalihu mijenjaju samo dokumenti.",
  record: zapis,
});
