import { LuHistory, LuUndo2 } from "react-icons/lu";
import type { RecordView } from "~/components/RecordPage";
import { Table, type TableColumn } from "~/components/Table";
import izdatniceData from "~/data/skladiste/izdatnice.json";
import povratniceData from "~/data/skladiste/povratnice.json";
import { dokumentiLista, type DokumentRedLista } from "~/lib/skladiste/dokumenti-lista";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { BrojLink, pracenjeOpis } from "~/lib/skladiste/ekrani/izdatnice";
import { datum, kol, km } from "~/lib/skladiste/format";
import { IZVEDENO, NAPOMENE, artikl, artiklNaziv, oznaka, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { Izdatnica, Povratnica, PovratnicaStatus, PovratnicaStavka, StanjeMaterijala, TipPovrata } from "~/lib/skladiste/types";
import {
  ArtiklCelija,
  SLJEDECI_KORAK_NAPOMENA,
  brojac,
  historijaTab,
  potpisiKoraci,
  stornoBadge,
  stornoCallout,
  tokKoraci,
} from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Prijem › Povratnice, from cicak's `PovratniceListaPage` and
 * `PovratnicaDetaljPage`: issued goods coming back onto stock at the source
 * issue's price — the same rows, steps, signatures, fields, custody balance,
 * lines and notes, in the app's list and record layout.
 */

const POVRATNICE = povratniceData as unknown as Povratnica[];
const IZDATNICE = izdatniceData as unknown as Izdatnica[];
const STATUS_LABELS = oznaka<Record<PovratnicaStatus, string>>("skladiste/povratnice.ts", "POVRATNICA_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<PovratnicaStatus, DokumentRedLista["tone"]>>("skladiste/povratnice.ts", "POVRATNICA_STATUS_TONES");
const TIP_POVRATA = oznaka<Record<TipPovrata, string>>("skladiste/povratnice.ts", "TIP_POVRATA_LABELS");
const STANJE = oznaka<Record<StanjeMaterijala, string>>("skladiste/povratnice.ts", "STANJE_LABELS");

const url = (id?: string) => ekranUrl("prijem", "povratnice", id);
const izdatnicaUrl = (id: string) => ekranUrl("izdavanje", "izdatnice", id);
const izvornaIzdatnica = (p: Povratnica) => IZDATNICE.find((i) => i.id === p.izvornaIzdatnica);

// ─── List ────────────────────────────────────────────────────────────────────

const GRUPE = [
  { value: "NACRT", label: "Nacrt" },
  { value: "U_TOKU", label: "U toku" },
  { value: "KNJIZEN", label: "Proknjiženo" },
  { value: "OTKAZANA", label: "Otkazano" },
];

function grupa(status: PovratnicaStatus): string {
  if (status === "PRIPREMLJENA") return "NACRT";
  if (status === "KNJIZEN") return "KNJIZEN";
  if (status === "OTKAZANA") return "OTKAZANA";
  return "U_TOKU";
}

function statusDetalj(p: Povratnica): string {
  if (p.status === "OTKAZANA") return p.razlogZatvaranja;
  if (p.status === "PREGLEDANA" || p.status === "KNJIZEN") {
    const z = IZVEDENO.povratnice[p.id].zbir;
    return `prihvaćeno ${z.prihvaceno} · vraćeno ${z.vracenoNazad} · otpisano ${z.otpisano}`;
  }
  return "";
}

const red = (p: Povratnica): DokumentRedLista => {
  const izvedeno = IZVEDENO.povratnice[p.id];
  return {
    id: p.id,
    broj: p.broj,
    datum: p.datum,
    vrsta: TIP_POVRATA[p.tipPovrata],
    skladiste: skladisteNaziv(p.skladiste),
    strana: izvornaIzdatnica(p)?.broj ?? "—",
    stranaDetalj: `vratio ${p.vratio}${p.naknadniPovrat ? " · zakašnjeli povrat" : ""}`,
    vrijednost: izvedeno.vrijednost,
    privremeno: false,
    status: izvedeno.stornoOznaka?.status ?? STATUS_LABELS[p.status],
    tone: izvedeno.stornoOznaka ? "neutral" : STATUS_TONES[p.status],
    statusDetalj: izvedeno.stornoOznaka?.detalj ?? statusDetalj(p),
    grupa: grupa(p.status),
    pretraga: p.stavke.map((s) => artiklNaziv(s.artikl)).join(" "),
    path: url(p.id),
  };
};

// ─── Record ──────────────────────────────────────────────────────────────────

// The return's way: the step each status stands on (5 = every step done).
const KORACI = ["Nacrt", "Ovjereno", "Primljeno", "Pregledano", "Proknjiženo"];
const FAZA: Record<PovratnicaStatus, number> = {
  PRIPREMLJENA: 0,
  OVJERENA: 2,
  FIZICKI_PRIMLJENA: 3,
  PREGLEDANA: 4,
  KNJIZEN: 5,
  OTKAZANA: 0,
};

/** Who usually presses the next step. */
const ULOGA_KORAKA: Record<PovratnicaStatus, string> = {
  PRIPREMLJENA: "glavni skladištar ovjerava",
  OVJERENA: "skladištar fizički prima, bez ocjene stanja",
  FIZICKI_PRIMLJENA: "stručno lice ili komisija pregleda",
  PREGLEDANA: "glavni skladištar knjiži",
  KNJIZEN: "",
  OTKAZANA: "",
};

/** The step each status presses next: cicak's `primary` button. */
const SLJEDECI_KORAK: Partial<Record<PovratnicaStatus, string>> = {
  PRIPREMLJENA: "Ovjeri",
  OVJERENA: "Fizički primi…",
  FIZICKI_PRIMLJENA: "Pregledaj i prihvati…",
  PREGLEDANA: "Proknjiži",
};

/**
 * cicak's action bar for the status, in its order: the step decisions, the
 * return's own actions, storno last and always under "⋯"; which one is filled
 * and which cannot be pressed yet.
 */
function radnje(p: Povratnica, uStornoParu: boolean): Pick<RecordView, "actions" | "primary" | "inlineActions" | "disabledActions"> {
  const izvedeno = IZVEDENO.povratnice[p.id];
  const nacrt = p.status === "PRIPREMLJENA";
  const odluke: string[] = [];
  if (nacrt) odluke.push("Ovjeri", "Dodaj stavku", "Uredi zaglavlje");
  if (p.status === "OVJERENA") odluke.push("Fizički primi…");
  if (p.status === "FIZICKI_PRIMLJENA") odluke.push("Pregledaj i prihvati…");
  if (p.status === "PREGLEDANA") odluke.push("Proknjiži");
  // Unusable goods accepted back onto stock leave through a write-off the commission approves.
  if (p.status === "KNJIZEN" && !uStornoParu && p.stavke.some((s) => s.stanje === "NEUPOTREBLJIVO" && s.prihvaceno > 0)) {
    odluke.push("Predloži otpis");
  }
  const autorske = ["Štampaj", ...(!izvedeno.jeZaCitanje && !nacrt ? ["Otkaži"] : []), ...(nacrt ? ["Obriši nacrt"] : [])];
  const storno = p.status === "KNJIZEN" && !p.stornoOd;
  return {
    actions: [...odluke, ...autorske, ...(storno ? ["Storniraj"] : [])],
    primary: SLJEDECI_KORAK[p.status] ?? null,
    inlineActions: storno ? Math.min(3, odluke.length + autorske.length) : 3,
    disabledActions: [...(nacrt && p.stavke.length === 0 ? ["Ovjeri"] : []), ...(storno && !izvedeno.mozeStorno ? ["Storniraj"] : [])],
  };
}

function zapis(id: string): RecordView | null {
  const p = POVRATNICE.find((candidate) => candidate.id === id);
  if (!p) return null;
  const izvedeno = IZVEDENO.povratnice[p.id];
  const izvorna = izvornaIzdatnica(p);
  const faza = FAZA[p.status];
  const nacrt = p.status === "PRIPREMLJENA";
  const prekinuto = p.status === "OTKAZANA";
  // A storno pair waits on nobody.
  const uStornoParu = Boolean(p.stornoOd || p.storniranBrojem);
  const uloga = uStornoParu ? "" : ULOGA_KORAKA[p.status];
  const uCustody = p.status === "FIZICKI_PRIMLJENA" || p.status === "PREGLEDANA";
  const zbir = izvedeno.zbir;
  const par = izvedeno.parStorna ? POVRATNICE.find((candidate) => candidate.id === izvedeno.parStorna) : undefined;
  const potpisi = potpisiKoraci(
    izvedeno.potpisi.map((mjesto) => ({ ...mjesto, hint: uloga ? `obično: ${uloga}` : undefined })),
    prekinuto,
    "Povratnica otkazana",
  );
  const storno = stornoBadge(p);
  const stornoNapomena = stornoCallout(p, "povratnice", par ? { broj: par.broj, path: url(par.id) } : null);
  const jm = (s: PovratnicaStavka) => artikl(s.artikl)?.jm ?? "";

  const kolone: TableColumn<PovratnicaStavka>[] = [
    {
      key: "artikl",
      header: "Artikl (sa stavke izdatnice)",
      render: (s) => <ArtiklCelija sifra={s.artikl} naziv={artikl(s.artikl)?.naziv ?? ""} detalj={pracenjeOpis(s)} />,
    },
    {
      key: "izvorna",
      header: "Stavka izvorne izdatnice",
      render: (s) =>
        izvorna ? (
          <span className="whitespace-nowrap">
            <BrojLink to={izdatnicaUrl(izvorna.id)}>{izvorna.broj}</BrojLink>
            <span className="text-gray-500"> · stavka {izvorna.stavke.findIndex((x) => x.id === s.izdatnicaStavkaId) + 1}</span>
          </span>
        ) : (
          "—"
        ),
    },
    { key: "prijavljeno", header: "Prijavljeno", align: "right", render: (s) => `${kol(s.prijavljeno)} ${jm(s)}`, className: "font-mono tabular-nums" },
    {
      key: "prebrojano",
      header: "Prebrojano",
      align: "right",
      render: (s) => (s.prebrojano === null ? "—" : kol(s.prebrojano)),
      className: "font-mono tabular-nums",
    },
    {
      key: "ishod",
      header: "Prihvaćeno · vraćeno · otpisano",
      align: "right",
      render: (s) => (s.stanje ? `${kol(s.prihvaceno)} · ${kol(s.vracenoNazad)} · ${kol(s.otpisano)}` : "—"),
      className: "whitespace-nowrap font-mono tabular-nums",
    },
    { key: "stanje", header: "Stanje", render: (s) => (s.stanje ? STANJE[s.stanje] : "—") },
    { key: "lokacija", header: "Odredišna lokacija", render: (s) => s.odredisnaLokacija || "bez lokacija", className: "font-mono" },
    {
      key: "vrijednost",
      header: "Vrijednost",
      align: "right",
      render: (s) => {
        // Before the review the value follows what was counted (or reported); after it, what was accepted.
        const kolicina = p.status === "KNJIZEN" || p.status === "PREGLEDANA" ? s.prihvaceno : (s.prebrojano ?? s.prijavljeno);
        return (
          <span className="block whitespace-nowrap">
            <span className="font-mono tabular-nums">{km(s.cijena * kolicina)}</span>
            <span className="block text-xs text-gray-500">
              {km(s.cijena)} / {jm(s)}
            </span>
          </span>
        );
      },
    },
  ];

  const stavkeTab = (
    <div className="flex flex-col gap-3">
      <Table bare columns={kolone} rows={[...p.stavke]} getRowKey={(s) => s.id} emptyText="Nema stavki. Dodajte stavke sa izvorne izdatnice." />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e5eaf2] px-3 pt-3 text-xs text-gray-600">
        <span>
          Vrijednost (= cijena izdatnice): <span className="font-mono">{km(izvedeno.vrijednost)}</span>
        </span>
      </div>
    </div>
  );

  const callouts: RecordView["callouts"] = [];
  if (stornoNapomena) callouts.push(stornoNapomena);
  if (p.status === "OTKAZANA") {
    callouts.push({ tone: "info", title: "Povratnica je otkazana", text: `${p.razlogZatvaranja || "Bez navedenog razloga."} Dokument je samo za čitanje.` });
  } else if (p.status === "KNJIZEN" && !uStornoParu) {
    callouts.push({
      tone: "success",
      title: "Proknjiženo · prihvaćena količina je na zalihi",
      text: `${NAPOMENE.proknjizenoSamoCita} ${NAPOMENE.povratnicaCijena}`,
    });
  } else if (uCustody) {
    callouts.push({ tone: "warning", title: `Roba je u custody na ${p.custodyLokacija}`, text: NAPOMENE.povratnicaZbir });
  } else if (nacrt && p.stavke.length === 0) {
    callouts.push({
      tone: "info",
      title: "Nacrt bez stavki",
      text: `Dodajte stavke sa izvorne izdatnice ${izvorna?.broj ?? ""}. Ovjera je moguća tek kad ima stavki.`,
    });
  }

  // cicak's custody balance under the header fields, from the physical receipt on.
  const bilans: RecordView["summary"] =
    faza >= 3
      ? {
          tiles: (
            [
              ["Primljeno", zbir.primljeno],
              ["Prihvaćeno", zbir.prihvaceno],
              ["Vraćeno nazad", zbir.vracenoNazad],
              ["Otpisano", zbir.otpisano],
              ["Preostalo", zbir.preostalo],
            ] as const
          ).map(([label, n]) => ({ label, value: <span className="font-mono">{kol(n)}</span> })),
          note: NAPOMENE.povratnicaZbir,
        }
      : undefined;

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Prijem" },
      { label: "Povratnice", to: url() },
      { label: p.broj },
    ],
    backTo: url(),
    topTitle: "Prijem › Povratnice",
    topStatus: "Povrat izdate robe nazad na zalihu, po cijeni izvorne izdatnice",
    icon: LuUndo2,
    title: `Povratnica ${p.broj}`,
    subtitle: `${TIP_POVRATA[p.tipPovrata]} · iz ${izvorna?.broj ?? "—"} · ${skladisteNaziv(p.skladiste)} · vratio ${p.vratio}`,
    badges: [
      { label: STATUS_LABELS[p.status], tone: STATUS_TONES[p.status] },
      ...(p.naknadniPovrat ? [{ label: "zakašnjeli povrat", tone: "warning" as const }] : []),
      ...(storno ? [storno] : []),
      ...(uCustody ? [{ label: `custody ${p.custodyLokacija}`, tone: "neutral" as const }] : []),
    ],
    hint: uloga ? `obično: ${uloga}` : undefined,
    ...radnje(p, uStornoParu),
    steps: { title: "Tok povratnice", steps: tokKoraci(KORACI, faza, prekinuto) },
    callouts,
    fields: [
      { label: "Broj", value: <span className="font-mono">{p.broj}</span> },
      { label: "Datum", value: datum(p.datum) },
      { label: "Skladište", value: skladisteNaziv(p.skladiste) },
      { label: "Izvorna izdatnica", value: izvorna ? <BrojLink to={izdatnicaUrl(izvorna.id)}>{izvorna.broj}</BrojLink> : "—" },
      { label: "Vrsta povrata", value: TIP_POVRATA[p.tipPovrata] },
      { label: "Vratio", value: p.vratio || "—" },
      { label: "Zakašnjeli povrat na zatvoreni osnov", value: p.naknadniPovrat ? "Da" : "Ne" },
      { label: "Custody lokacija", value: p.custodyLokacija ? <span className="font-mono">{p.custodyLokacija}</span> : "—" },
      { label: "Napomena", value: p.napomena || "—", wide: true },
    ],
    summary: bilans,
    tabs: [{ key: "stavke", label: "Stavke", count: p.stavke.length, content: stavkeTab }, historijaTab([...p.historija])],
    notes: [
      NAPOMENE.povratnicaGranica,
      NAPOMENE.povratnicaCijena,
      NAPOMENE.povratnicaCustody,
      ...(izvedeno.jeZaCitanje ? [NAPOMENE.proknjizenoSamoCita] : [SLJEDECI_KORAK_NAPOMENA]),
    ],
    side: [{ icon: LuHistory, title: "Ovjere i potpisi", count: brojac(potpisi), steps: potpisi }],
  };
}

export const POVRATNICE_EKRAN: Screen = dokumentiLista({
  naslov: "Povratnice",
  opis: "Povrat izdate robe nazad na zalihu, po cijeni izvorne izdatnice",
  stranaNaslov: "Izvorna izdatnica",
  redovi: POVRATNICE.map(red),
  grupe: GRUPE,
  novo: "Nova povratnica",
  prazno: "Nijedna povratnica ne odgovara filteru.",
  napomena: `${NAPOMENE.povratnicaGranica} ${NAPOMENE.povratnicaCijena}`,
  record: zapis,
});
