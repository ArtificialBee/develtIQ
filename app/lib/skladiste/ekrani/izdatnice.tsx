import type { ReactNode } from "react";
import { LuHistory, LuPackageMinus, LuUndo2 } from "react-icons/lu";
import { Link } from "react-router";
import type { RecordView } from "~/components/RecordPage";
import { StatusBadge } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import graniceData from "~/data/skladiste/granice.json";
import izdatniceData from "~/data/skladiste/izdatnice.json";
import povratniceData from "~/data/skladiste/povratnice.json";
import zaliheData from "~/data/skladiste/zalihe.json";
import { dokumentiLista, type DokumentRedLista } from "~/lib/skladiste/dokumenti-lista";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { datum, kol, km } from "~/lib/skladiste/format";
import { IZVEDENO, NAPOMENE, SKLADISTA, artikl, artiklNaziv, oznaka, putanja, skladisteNaziv } from "~/lib/skladiste/podaci";
import type {
  Dispozicija,
  Granica,
  Izdatnica,
  IzdatnicaStatus,
  IzdatnicaStavka,
  IzvorAutorizacije,
  PolozajGranice,
  Povratnica,
  ProvjeraStavke,
  ZaliheExport,
} from "~/lib/skladiste/types";
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
 * Skladište › Izdavanje › Izdatnice, from cicak's `IzdatniceListaPage` and
 * `IzdatnicaDetaljPage`: the same rows, steps, signatures, fields, lines with
 * their reservation split and stock check, and notes, in the app's list and
 * record layout. The stock lookups here (what is free of an item in a warehouse,
 * where it stands against its threshold) are shared with povratnice and
 * otpremnice.
 */

const IZDATNICE = izdatniceData as unknown as Izdatnica[];
const POVRATNICE = povratniceData as unknown as Povratnica[];
const GRANICE = graniceData as unknown as Granica[];
const ZALIHE = zaliheData as unknown as ZaliheExport;
const STATUS_LABELS = oznaka<Record<IzdatnicaStatus, string>>("skladiste/izdatnice.ts", "IZDATNICA_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<IzdatnicaStatus, DokumentRedLista["tone"]>>("skladiste/izdatnice.ts", "IZDATNICA_STATUS_TONES");
const IZVOR = oznaka<Record<IzvorAutorizacije, string>>("skladiste/izdatnice.ts", "IZVOR_LABELS");
const DISPOZICIJA = oznaka<Record<Dispozicija, string>>("skladiste/izdatnice.ts", "DISPOZICIJA_LABELS");

const url = (id?: string) => ekranUrl("izdavanje", "izdatnice", id);

// ─── Shared with povratnice and otpremnice ───────────────────────────────────

/**
 * The person pressing the steps: cicak's `useAkter()` without a persona is the
 * signed-in demo user as administrator, who prepared none of these documents.
 */
export const AKTER_IME = "admin";

/** A document number linking to its record (cicak's `BrojLink`). */
export const BrojLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="font-mono font-medium text-[#3B9DF8] hover:underline">
    {children}
  </Link>
);

/** What is free of an item in a warehouse right now (cicak's `stanjeArtikla(…).raspolozivo`). */
export const raspolozivoArtikla = (sifra: string, skladiste: string) =>
  ZALIHE.poArtikluISkladistu.find((red) => red.artikl === sifra && red.skladiste === skladiste)?.raspolozivo ?? 0;

/** Where an available quantity stands against a threshold (cicak's `polozaj`). */
function polozaj(raspolozivo: number, granica: Granica): PolozajGranice {
  if (raspolozivo < granica.min) return "ISPOD_MINIMUMA";
  if (raspolozivo < granica.signalna) return "ISPOD_SIGNALNE";
  if (raspolozivo === granica.signalna) return "NA_SIGNALNOJ";
  if (raspolozivo > granica.max) return "IZNAD_MAKSIMUMA";
  return "OK";
}

const skladisteImaLokacije = (sifra: string) => SKLADISTA.find((skladiste) => skladiste.sifra === sifra)?.lokacije ?? false;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * cicak's `provjeriIzdatnicu`: a line passes when its quantity fits what is free
 * plus what is reserved for this source, from a location that holds the item.
 * The export carries it while the issue is open; cicak also runs it on a
 * cancelled one, so it is computed here the same way.
 */
function provjeriIzdatnicu(i: Izdatnica): Pick<ProvjeraStavke, "stavkaId" | "ok">[] {
  return i.stavke.map((s) => {
    const raspolozivo = raspolozivoArtikla(s.artikl, i.skladiste);
    const dozvoljeno = r3(raspolozivo + s.rezervisano);
    const lokacijaOk =
      !skladisteImaLokacije(i.skladiste) ||
      s.lokacija === "" ||
      ZALIHE.pozicije.some((red) => red.artikl === s.artikl && red.skladiste === i.skladiste && red.lokacija === s.lokacija);
    return { stavkaId: s.id, ok: s.kolicina <= dozvoljeno && lokacijaOk };
  });
}

/** The tracing line under an item: its serial numbers, its lot, or none. */
export const pracenjeOpis = (s: { serijskiBrojevi: string; lot: string }) =>
  s.serijskiBrojevi ? `serijski broj ${s.serijskiBrojevi}` : s.lot ? `lot ${s.lot}` : "bez praćenja";

// ─── List ────────────────────────────────────────────────────────────────────

const GRUPE = [
  { value: "NACRT", label: "Nacrt" },
  { value: "U_TOKU", label: "U toku" },
  { value: "PREDATA", label: "Predano" },
  { value: "OTKAZANA", label: "Otkazano" },
];

function grupa(status: IzdatnicaStatus): string {
  if (status === "PRIPREMLJENA") return "NACRT";
  if (status === "PREDATA") return "PREDATA";
  if (status === "OTKAZANA") return "OTKAZANA";
  return "U_TOKU";
}

function statusDetalj(i: Izdatnica): string {
  const izvedeno = IZVEDENO.izdatnice[i.id];
  if (i.status === "DJELIMICNO_PREDATA") return `predano ${izvedeno.ukupnoPredano} · preostalo ${izvedeno.preostaloZaPredaju}`;
  if (i.status === "OTKAZANA") return i.razlogZatvaranja;
  return "";
}

const red = (i: Izdatnica): DokumentRedLista => {
  const izvedeno = IZVEDENO.izdatnice[i.id];
  return {
    id: i.id,
    broj: i.broj,
    datum: i.materijalniDatum,
    vrsta: IZVOR[i.izvorTip],
    skladiste: skladisteNaziv(i.skladiste),
    strana: i.izvorBroj,
    stranaDetalj: `primalac ${i.primalac}`,
    vrijednost: izvedeno.vrijednost,
    privremeno: false,
    status: izvedeno.stornoOznaka?.status ?? STATUS_LABELS[i.status],
    tone: izvedeno.stornoOznaka ? "neutral" : STATUS_TONES[i.status],
    statusDetalj: izvedeno.stornoOznaka?.detalj ?? statusDetalj(i),
    grupa: grupa(i.status),
    pretraga: i.stavke.map((s) => artiklNaziv(s.artikl)).join(" "),
    path: url(i.id),
  };
};

// ─── Record ──────────────────────────────────────────────────────────────────

// The issue's way: the step each status stands on (4 = every step done).
const KORACI = ["Nacrt", "Ovjereno", "Proknjiženo", "Predano"];
const FAZA: Record<IzdatnicaStatus, number> = {
  PRIPREMLJENA: 0,
  OVJERENA: 2,
  KNJIZEN_CEKA_PREDAJU: 3,
  DJELIMICNO_PREDATA: 3,
  PREDATA: 4,
  OTKAZANA: 0,
};

/** Who usually presses the next step. */
const ULOGA_KORAKA: Record<IzdatnicaStatus, string> = {
  PRIPREMLJENA: "glavni skladištar ovjerava — nikad onaj ko je pripremio",
  OVJERENA: "glavni skladištar knjiži",
  KNJIZEN_CEKA_PREDAJU: "skladištar predaje; primalac potpisuje",
  DJELIMICNO_PREDATA: "skladištar predaje ostatak",
  PREDATA: "",
  OTKAZANA: "",
};

/**
 * cicak's action bar for the status, in its order: the step decisions, the
 * issue's own actions, storno last and always under "⋯"; which one is filled
 * and which cannot be pressed yet.
 */
function radnje(i: Izdatnica, uStornoParu: boolean, imaPovratnih: boolean): Pick<RecordView, "actions" | "primary" | "inlineActions" | "disabledActions"> {
  const izvedeno = IZVEDENO.izdatnice[i.id];
  const nacrt = i.status === "PRIPREMLJENA";
  const predaja = (i.status === "KNJIZEN_CEKA_PREDAJU" || i.status === "DJELIMICNO_PREDATA") && !uStornoParu;
  const odluke: string[] = [];
  if (nacrt) odluke.push("Ovjeri", "Dodaj stavku", "Uredi zaglavlje");
  if (i.status === "OVJERENA") odluke.push("Proknjiži");
  if (predaja) odluke.push("Predaj…");
  if (izvedeno.jeProknjizena && imaPovratnih) odluke.push("Nova povratnica iz ove izdatnice");
  const autorske = ["Štampaj", ...(nacrt || i.status === "OVJERENA" ? ["Otkaži"] : []), ...(nacrt ? ["Obriši nacrt"] : [])];
  const storno = izvedeno.jeProknjizena && !i.stornoOd;
  return {
    actions: [...odluke, ...autorske, ...(storno ? ["Storniraj"] : [])],
    primary: nacrt ? "Ovjeri" : i.status === "OVJERENA" ? "Proknjiži" : predaja ? "Predaj…" : null,
    inlineActions: storno ? Math.min(3, odluke.length + autorske.length) : 3,
    disabledActions: [...(nacrt && i.stavke.length === 0 ? ["Ovjeri"] : []), ...(storno && !izvedeno.mozeStorno ? ["Storniraj"] : [])],
  };
}

function zapis(id: string): RecordView | null {
  const i = IZDATNICE.find((candidate) => candidate.id === id);
  if (!i) return null;
  const izvedeno = IZVEDENO.izdatnice[i.id];
  const faza = FAZA[i.status];
  const nacrt = i.status === "PRIPREMLJENA";
  const proknjizena = izvedeno.jeProknjizena;
  const prekinuto = i.status === "OTKAZANA";
  // A storno pair waits on nobody.
  const uStornoParu = Boolean(i.stornoOd || i.storniranBrojem);
  const uloga = uStornoParu ? "" : ULOGA_KORAKA[i.status];
  const istiPripremio = i.pripremio?.ko === AKTER_IME;
  const provjere: Pick<ProvjeraStavke, "stavkaId" | "ok">[] = izvedeno.provjere ? [...izvedeno.provjere] : provjeriIzdatnicu(i);
  // A storno pair gives nothing back: its goods are already on stock again.
  const povratneStavke = uStornoParu ? [] : i.stavke.filter((s) => (izvedeno.mozeVratiti[s.id] ?? 0) > 0);
  const povratnice = POVRATNICE.filter((p) => p.izvornaIzdatnica === i.id);
  const par = izvedeno.parStorna ? IZDATNICE.find((candidate) => candidate.id === izvedeno.parStorna) : undefined;
  const potpisi = potpisiKoraci(
    izvedeno.potpisi.map((mjesto) => ({ ...mjesto, hint: uloga ? `obično: ${uloga}` : undefined })),
    prekinuto,
    "Izdatnica otkazana",
  );
  const storno = stornoBadge(i);
  const stornoNapomena = stornoCallout(i, "izdatnice", par ? { broj: par.broj, path: url(par.id) } : null);

  const kolone: TableColumn<IzdatnicaStavka>[] = [
    { key: "artikl", header: "Artikl", render: (s) => <ArtiklCelija sifra={s.artikl} naziv={artikl(s.artikl)?.naziv ?? ""} detalj={pracenjeOpis(s)} /> },
    { key: "jm", header: "JM", render: (s) => artikl(s.artikl)?.jm ?? "" },
    { key: "kolicina", header: "Količina", align: "right", render: (s) => kol(s.kolicina), className: "font-mono tabular-nums" },
    {
      key: "rezervisano",
      header: "Rezervisano · slobodno",
      align: "right",
      render: (s) => `${kol(s.rezervisano)} · ${kol(s.slobodno)}`,
      className: "whitespace-nowrap font-mono tabular-nums",
    },
    {
      key: "raspolozivo",
      header: "Raspoloživo",
      align: "right",
      render: (s) => {
        const raspolozivo = raspolozivoArtikla(s.artikl, i.skladiste);
        const granica = GRANICE.find((g) => g.artikl === s.artikl && g.skladiste === i.skladiste);
        const p = granica ? polozaj(raspolozivo, granica) : null;
        const provjera = provjere.find((x) => x.stavkaId === s.id);
        return (
          <span className="block whitespace-nowrap">
            <span className="font-mono tabular-nums">{kol(raspolozivo)}</span>
            {!proknjizena && provjera && !provjera.ok && (
              <StatusBadge tone="danger" className="ml-2">
                nedovoljno
              </StatusBadge>
            )}
            {(p === "ISPOD_SIGNALNE" || p === "ISPOD_MINIMUMA") && (
              <Link to={putanja("/skladiste/nabavka/otvorene-potrebe")} className="block text-xs text-amber-600 hover:underline">
                ispod signalne → predloži zahtjev
              </Link>
            )}
          </span>
        );
      },
    },
    { key: "lokacija", header: "Lokacija", render: (s) => s.lokacija || "bez lokacija", className: "font-mono" },
    { key: "predano", header: "Predano", align: "right", render: (s) => (proknjizena ? kol(s.predano) : "—"), className: "font-mono tabular-nums" },
    {
      key: "vrijednost",
      header: "Vrijednost",
      align: "right",
      render: (s) =>
        proknjizena ? <span className="font-mono tabular-nums">{km(s.cijena * s.kolicina)}</span> : <span className="text-gray-500">po knjiženju</span>,
      className: "whitespace-nowrap",
    },
  ];

  const stavkeTab = (
    <div className="flex flex-col gap-3">
      <Table
        bare
        columns={kolone}
        rows={[...i.stavke]}
        getRowKey={(s) => s.id}
        emptyText={`Nema stavki. Dodajte artikle koji se izdaju po osnovu ${i.izvorBroj}.`}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e5eaf2] px-3 pt-3 text-xs text-gray-600">
        <span>
          Vrijednost (izračunata): <span className="font-mono">{proknjizena ? km(izvedeno.vrijednost) : "—"}</span>
        </span>
        {povratneStavke.length > 0 && (
          <span>
            Može se vratiti:{" "}
            {povratneStavke.map((s) => (
              <span key={s.id} className="mr-2 font-mono">
                {s.artikl} {kol(izvedeno.mozeVratiti[s.id] ?? 0)}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );

  const callouts: RecordView["callouts"] = [];
  if (stornoNapomena) callouts.push(stornoNapomena);
  if (i.status === "OTKAZANA") {
    callouts.push({ tone: "info", title: "Izdatnica je otkazana", text: `${i.razlogZatvaranja || "Bez navedenog razloga."} Dokument je samo za čitanje.` });
  } else if (i.status === "PREDATA" && !uStornoParu) {
    callouts.push({
      tone: "success",
      title: "Predano u cijelosti · custody je kod primaoca",
      text: `${NAPOMENE.proknjizenoSamoCita} Povrat ide kroz povratnicu iz ove izdatnice.`,
    });
  } else if (nacrt && istiPripremio && i.stavke.length > 0) {
    callouts.push({
      tone: "warning",
      title: "Isti čovjek priprema i ovjerava",
      text: `${NAPOMENE.ovjeraDrugaOsoba} Administrator smije zaobići pravilo u demou; sistem to zapisuje u historiju.`,
    });
  } else if (nacrt && i.stavke.length === 0) {
    callouts.push({ tone: "info", title: "Nacrt bez stavki", text: "Dodajte stavke za izdavanje. Ovjera je moguća tek kad ima stavki." });
  }

  // cicak's handover tiles under the header fields, once posted (a storno pair hands nothing over).
  const predaja: RecordView["summary"] =
    proknjizena && !uStornoParu
      ? {
          tiles: [
            { label: "Stavke za predaju", value: <span className="font-mono">{i.stavke.length}</span> },
            { label: "Predano", value: <span className="font-mono">{kol(izvedeno.ukupnoPredano)}</span> },
            { label: "Preostalo", value: <span className="font-mono">{kol(izvedeno.preostaloZaPredaju)}</span> },
          ],
        }
      : undefined;

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Izdavanje" },
      { label: "Izdatnice", to: url() },
      { label: i.broj },
    ],
    backTo: url(),
    topTitle: "Izdavanje › Izdatnice",
    topStatus: "Izdavanje sa zalihe po radnom nalogu ili odobrenom zahtjevu",
    icon: LuPackageMinus,
    title: `Izdatnica ${i.broj}`,
    subtitle: `${IZVOR[i.izvorTip]} ${i.izvorBroj} · ${skladisteNaziv(i.skladiste)} · ${i.primalac}`,
    badges: [
      { label: STATUS_LABELS[i.status], tone: STATUS_TONES[i.status] },
      { label: DISPOZICIJA[i.dispozicija], tone: "neutral" },
      ...(storno ? [storno] : []),
    ],
    hint: uloga ? `obično: ${uloga}` : undefined,
    ...radnje(i, uStornoParu, povratneStavke.length > 0),
    steps: { title: "Tok izdatnice", steps: tokKoraci(KORACI, faza, prekinuto) },
    callouts,
    fields: [
      { label: "Broj", value: <span className="font-mono">{i.broj}</span> },
      { label: "Poslovni datum", value: datum(i.materijalniDatum) },
      { label: "Skladište", value: skladisteNaziv(i.skladiste) },
      { label: "Osnov", value: `${IZVOR[i.izvorTip]} ${i.izvorBroj}` },
      { label: "Primalac", value: i.primalac || "—" },
      { label: "Dispozicija", value: DISPOZICIJA[i.dispozicija] },
      { label: "Napomena", value: i.napomena || "—", wide: true },
    ],
    summary: predaja,
    tabs: [{ key: "stavke", label: "Stavke", count: i.stavke.length, content: stavkeTab }, historijaTab([...i.historija])],
    sections: povratnice.length
      ? [
          {
            icon: LuUndo2,
            title: "Povratnice iz ove izdatnice",
            content: (
              <div className="flex flex-wrap items-center gap-3 px-1 text-sm">
                {povratnice.map((p) => (
                  <BrojLink key={p.id} to={ekranUrl("prijem", "povratnice", p.id)}>
                    {p.broj}
                  </BrojLink>
                ))}
              </div>
            ),
          },
        ]
      : undefined,
    notes: [
      NAPOMENE.kontrolaIzdatnice,
      NAPOMENE.izdatnicaCustody,
      NAPOMENE.vrijednostPolitika,
      ...(izvedeno.jeZaCitanje ? [NAPOMENE.proknjizenoSamoCita] : [SLJEDECI_KORAK_NAPOMENA]),
    ],
    side: [{ icon: LuHistory, title: "Ovjere i potpisi", count: brojac(potpisi), steps: potpisi }],
  };
}

export const IZDATNICE_EKRAN: Screen = dokumentiLista({
  naslov: "Izdatnice",
  opis: "Izdavanje sa zalihe po radnom nalogu ili odobrenom zahtjevu",
  stranaNaslov: "Osnov i primalac",
  redovi: IZDATNICE.map(red),
  grupe: GRUPE,
  novo: "Nova izdatnica",
  prazno: "Nijedna izdatnica ne odgovara filteru.",
  napomena: `${NAPOMENE.vrijednostPolitika} ${NAPOMENE.izdatnicaCustody}`,
  record: zapis,
});
