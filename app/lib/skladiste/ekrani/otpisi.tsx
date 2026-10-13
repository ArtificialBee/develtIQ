import { Link } from "react-router";
import { LuFileX2, LuHistory } from "react-icons/lu";
import type { RecordView } from "~/components/RecordPage";
import { Table, type TableColumn } from "~/components/Table";
import otpisiData from "~/data/skladiste/otpisi.json";
import { dokumentiLista, type DokumentRedLista } from "~/lib/skladiste/dokumenti-lista";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { brojDokumenta, pozicijaZaliha } from "~/lib/skladiste/ekrani/interno-pomocno";
import { datum, kol, km } from "~/lib/skladiste/format";
import { IZVEDENO, NAPOMENE, artikl, artiklNaziv, oznaka, putanja, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { Otpis, OtpisStatus, OtpisStavka, RazlogOtpisa } from "~/lib/skladiste/types";
import { ArtiklCelija, SLJEDECI_KORAK_NAPOMENA, brojac, historijaTab, potpisiKoraci, tokKoraci } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Unutar skladišta › Otpisi, from cicak's `OtpisiListaPage` and
 * `OtpisDetaljPage`: the write-off register, and one write-off's proposal
 * (warehouse, reason, justification, lines), the commission's approval with its
 * zapisnik, and the posting that takes the value off stock.
 */

const OTPISI = otpisiData as unknown as Otpis[];
const STATUS_LABELS = oznaka<Record<OtpisStatus, string>>("skladiste/otpisi.ts", "OTPIS_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<OtpisStatus, DokumentRedLista["tone"]>>("skladiste/otpisi.ts", "OTPIS_STATUS_TONES");
const RAZLOG_LABELS = oznaka<Record<RazlogOtpisa, string>>("skladiste/otpisi.ts", "RAZLOG_OTPISA_LABELS");

const url = (id?: string) => ekranUrl("interno", "otpisi", id);

const grupa = (status: OtpisStatus) => (status === "PROKNJIZEN" || status === "OTKAZAN" ? status : "U_TOKU");

const red = (o: Otpis): DokumentRedLista => ({
  id: o.id,
  broj: o.broj,
  datum: o.datum,
  vrsta: `Otpis · ${RAZLOG_LABELS[o.razlog]}`,
  skladiste: skladisteNaziv(o.skladiste),
  strana: o.stavke.length === 1 ? artiklNaziv(o.stavke[0].artikl) : `${o.stavke.length} stavki`,
  stranaDetalj: [o.obrazlozenje, o.izvor ? `iz ${o.izvor}` : ""].filter(Boolean).join(" · "),
  vrijednost: -IZVEDENO.otpisi[o.id].vrijednost,
  privremeno: o.status !== "PROKNJIZEN" && o.status !== "OTKAZAN",
  status: STATUS_LABELS[o.status],
  tone: STATUS_TONES[o.status],
  statusDetalj: o.komisija.length > 0 ? `komisija: ${o.komisija.join(", ")}` : "",
  grupa: grupa(o.status),
  pretraga: [o.obrazlozenje, o.izvor, o.zapisnik, ...o.stavke.map((s) => artiklNaziv(s.artikl))].join(" "),
  path: url(o.id),
});

const KORACI = ["Prijedlog", "Komisija", "Proknjiženo"];
const FAZA: Record<OtpisStatus, number> = { PRIPREMLJEN: 1, ODOBREN: 2, PROKNJIZEN: 3, OTKAZAN: 0 };

const ULOGA_KORAKA: Record<OtpisStatus, string> = {
  PRIPREMLJEN: "komisija pregleda robu i potpiše zapisnik",
  ODOBREN: "glavni skladištar knjiži",
  PROKNJIZEN: "",
  OTKAZAN: "",
};

/**
 * Where the proposal came from (cicak's `IzvorOtpisa`): a document number links to
 * its record, "Mrtva zaliha" to that report, anything else reads as written. An
 * empty source draws nothing, as in cicak.
 */
function IzvorOtpisa({ izvor }: { izvor: string }) {
  if (izvor === "") return null;
  const dokument = brojDokumenta(izvor);
  if (dokument?.path) {
    return (
      <Link to={dokument.path} className="font-mono font-medium text-[#3B9DF8] hover:underline">
        {izvor}
      </Link>
    );
  }
  if (izvor === "Mrtva zaliha") {
    return (
      <Link to={putanja("/skladiste/izvjestaji/mrtva-zaliha")} className="text-[#3B9DF8] hover:underline">
        Mrtva zaliha
      </Link>
    );
  }
  return <span>{izvor}</span>;
}

/**
 * The buttons as in cicak's action bar for the status: the step decisions first,
 * then print, cancel and delete. The step is the filled button; the commission
 * can not approve a proposal without lines.
 */
function radnje(o: Otpis): Pick<RecordView, "actions" | "primary" | "disabledActions"> {
  const nacrt = o.status === "PRIPREMLJEN";
  const korak = nacrt ? "Odobri (komisija)" : o.status === "ODOBREN" ? "Proknjiži otpis" : null;
  const odluke: string[] = korak ? [korak] : [];
  if (nacrt) odluke.push("Dodaj stavku", "Uredi zaglavlje");
  const autorske = ["Štampaj zapisnik"];
  if (nacrt || o.status === "ODOBREN") autorske.push("Otkaži");
  if (nacrt) autorske.push("Obriši prijedlog");
  return {
    actions: [...odluke, ...autorske],
    primary: korak,
    disabledActions: nacrt && o.stavke.length === 0 ? ["Odobri (komisija)"] : [],
  };
}

function zapis(id: string): RecordView | null {
  const o = OTPISI.find((candidate) => candidate.id === id);
  if (!o) return null;
  const izvedeno = IZVEDENO.otpisi[o.id];
  const nacrt = o.status === "PRIPREMLJEN";
  const proknjizen = izvedeno.jeProknjizen;
  const prekinuto = o.status === "OTKAZAN";
  const uloga = ULOGA_KORAKA[o.status];
  const prepreke = izvedeno.provjere ?? [];
  const potpisi = potpisiKoraci(
    izvedeno.potpisi.map((mjesto) => ({ ...mjesto, hint: uloga ? `obično: ${uloga}` : undefined })),
    prekinuto,
    "Otpis otkazan",
  );

  const kolone: TableColumn<OtpisStavka>[] = [
    { key: "artikl", header: "Artikl", render: (s) => <ArtiklCelija sifra={s.artikl} naziv={artikl(s.artikl)?.naziv ?? ""} detalj={s.napomena || undefined} /> },
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
    {
      key: "slobodno",
      header: "Slobodno sada",
      align: "right",
      render: (s) => (proknjizen ? "—" : kol(pozicijaZaliha(s.artikl, o.skladiste, s.lokacija, s.lot)?.raspolozivo ?? 0)),
      className: "font-mono tabular-nums",
    },
    {
      key: "vrijednost",
      header: "Vrijednost",
      align: "right",
      // Posted lines carry the price copied at posting; until then, today's item price.
      render: (s) => km(s.kolicina * (proknjizen ? s.cijena : (artikl(s.artikl)?.cijena ?? 0))),
      className: "whitespace-nowrap font-mono tabular-nums",
    },
  ];

  const stavkeTab = (
    <div className="flex flex-col gap-3">
      <Table bare columns={kolone} rows={[...o.stavke]} getRowKey={(s) => s.id} emptyText="Nema stavki." />
      <div className="border-t border-[#e5eaf2] px-3 pt-3 text-xs text-gray-600">
        Ukupno: <span className="font-mono">{kol(izvedeno.kolicina)}</span> · vrijednost <span className="font-mono">{km(izvedeno.vrijednost)}</span>
        {proknjizen ? "" : " (procjena po današnjoj cijeni artikla)"}
      </div>
    </div>
  );

  // One notice, the first that holds, in cicak's order.
  const callouts: RecordView["callouts"] = [];
  if (o.status === "OTKAZAN") {
    callouts.push({
      tone: "info",
      title: "Otpis je otkazan",
      text: `${o.razlogZatvaranja || "Bez navedenog razloga."} Roba je ostala na zalihi; dokument je samo za čitanje.`,
    });
  } else if (proknjizen) {
    callouts.push({
      tone: "success",
      title: `Proknjiženo · ${km(izvedeno.vrijednost)} izašlo sa zalihe`,
      text: "Količina je skinuta s pozicija, kartica i outbox nose red „Otpis“. Proknjižen otpis se samo čita; ako se pokaže da je roba ipak upotrebljiva, vraća se na zalihu korekcijom („pronađeno“) s brojem ovog otpisa u razlogu.",
    });
  } else if (o.status === "ODOBREN" && prepreke.length > 0) {
    callouts.push({ tone: "warning", title: "Otpis se još ne može proknjižiti", text: `${prepreke[0].razlog} ${prepreke[0].rjesenje}` });
  } else if (nacrt && o.stavke.length === 0) {
    callouts.push({ tone: "info", title: "Prijedlog bez stavki", text: "Dodajte stavke koje se otpisuju. Komisija odobrava tek kad ima stavki." });
  }

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Unutar skladišta" },
      { label: "Otpisi", to: url() },
      { label: o.broj },
    ],
    backTo: url(),
    topTitle: "Unutar skladišta › Otpisi",
    topStatus: "Istek roka, oštećenje, neupotrebljivo, zastarjelo — komisija odobrava, knjiženje skida vrijednost",
    icon: LuFileX2,
    title: `Otpis ${o.broj}`,
    subtitle: `${RAZLOG_LABELS[o.razlog]} · ${skladisteNaziv(o.skladiste)}`,
    badges: [{ label: STATUS_LABELS[o.status], tone: STATUS_TONES[o.status] }],
    hint: uloga ? `obično: ${uloga}` : undefined,
    ...radnje(o),
    inlineActions: 3,
    steps: { title: "Tok otpisa", steps: tokKoraci(KORACI, FAZA[o.status], prekinuto) },
    callouts,
    fields: [
      { label: "Broj", value: <span className="font-mono">{o.broj}</span> },
      { label: proknjizen ? "Poslovni datum" : "Datum prijedloga", value: datum(o.datum) },
      { label: "Skladište", value: skladisteNaziv(o.skladiste) },
      { label: "Razlog otpisa", value: RAZLOG_LABELS[o.razlog] },
      { label: "Obrazloženje", value: o.obrazlozenje || "—", wide: true },
      { label: "Prijedlog iz", value: <IzvorOtpisa izvor={o.izvor} /> },
      { label: "Vrijednost", value: <span className="font-mono">{`${km(izvedeno.vrijednost)}${proknjizen ? "" : " (procjena)"}`}</span> },
      { label: "Komisija", value: o.komisija.length > 0 ? o.komisija.join(" · ") : "—", wide: true },
      { label: "Zapisnik", value: o.zapisnik ? <span className="font-mono">{o.zapisnik}</span> : "—" },
    ],
    tabs: [{ key: "stavke", label: "Stavke", count: o.stavke.length, content: stavkeTab }, historijaTab([...o.historija])],
    notes: [NAPOMENE.otpisIliKorekcija, NAPOMENE.otpisRezervisano, ...(!proknjizen && !prekinuto ? [SLJEDECI_KORAK_NAPOMENA] : [])],
    side: [{ icon: LuHistory, title: "Ovjere i potpisi", count: brojac(potpisi), steps: potpisi }],
  };
}

export const OTPISI_EKRAN: Screen = dokumentiLista({
  naslov: "Otpisi",
  opis: "Istek roka, oštećenje, neupotrebljivo, zastarjelo — komisija odobrava, knjiženje skida vrijednost",
  stranaNaslov: "Artikl i obrazloženje",
  redovi: OTPISI.map(red),
  grupe: [
    { value: "U_TOKU", label: "U toku" },
    { value: "PROKNJIZEN", label: "Proknjiženo" },
    { value: "OTKAZAN", label: "Otkazano" },
  ],
  novo: "Novi otpis",
  prazno: "Nijedan otpis ne odgovara filteru.",
  napomena: `${NAPOMENE.otpisIliKorekcija} ${NAPOMENE.otpisVrijednost}`,
  record: zapis,
});
