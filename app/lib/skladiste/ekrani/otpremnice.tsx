import { LuHistory, LuTruck } from "react-icons/lu";
import type { RecordView } from "~/components/RecordPage";
import { StatusBadge } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import otpremniceData from "~/data/skladiste/otpremnice.json";
import { dokumentiLista, type DokumentRedLista } from "~/lib/skladiste/dokumenti-lista";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { AKTER_IME, pracenjeOpis, raspolozivoArtikla } from "~/lib/skladiste/ekrani/izdatnice";
import { datum, kol, km } from "~/lib/skladiste/format";
import { IZVEDENO, NAPOMENE, artikl, artiklNaziv, oznaka, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { Otpremnica, OtpremnicaStatus, OtpremnicaStavka, VrstaOtpremnice } from "~/lib/skladiste/types";
import { ArtiklCelija, SLJEDECI_KORAK_NAPOMENA, brojac, historijaTab, potpisiKoraci, tokKoraci } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Izdavanje › Otpremnice, from cicak's `OtpremniceListaPage` and
 * `OtpremnicaDetaljPage`: goods leaving the company, sold to a customer or sent
 * back to a supplier — the same rows, steps, signatures, fields, lines with the
 * stock check and the stock value, and notes, in the app's list and record layout.
 */

const OTPREMNICE = otpremniceData as unknown as Otpremnica[];
const STATUS_LABELS = oznaka<Record<OtpremnicaStatus, string>>("skladiste/otpremnice.ts", "OTPREMNICA_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<OtpremnicaStatus, DokumentRedLista["tone"]>>("skladiste/otpremnice.ts", "OTPREMNICA_STATUS_TONES");
const VRSTA = oznaka<Record<VrstaOtpremnice, string>>("skladiste/otpremnice.ts", "VRSTA_OTPREMNICE_LABELS");

const url = (id?: string) => ekranUrl("izdavanje", "otpremnice", id);

// ─── List ────────────────────────────────────────────────────────────────────

const GRUPE = [
  { value: "NACRT", label: "Nacrt" },
  { value: "U_TOKU", label: "U toku" },
  { value: "ISPORUCENO", label: "Isporučeno" },
  { value: "OTKAZANO", label: "Otkazano" },
];

function grupa(status: OtpremnicaStatus): string {
  if (status === "PRIPREMLJENA") return "NACRT";
  if (status === "ISPORUCENA") return "ISPORUCENO";
  if (status === "OTKAZANA") return "OTKAZANO";
  return "U_TOKU";
}

function statusDetalj(o: Otpremnica): string {
  if (o.status === "OTPREMLJENA") return o.prijevoznik ? `na putu · ${o.prijevoznik}` : "";
  if (o.status === "ISPORUCENA") return o.faktura ? `faktura ${o.faktura}` : `primio ${o.isporukuPotvrdio?.ko ?? "—"}`;
  if (o.status === "OTKAZANA") return o.razlogZatvaranja;
  return "";
}

const red = (o: Otpremnica): DokumentRedLista => ({
  id: o.id,
  broj: o.broj,
  datum: o.datumOtpreme || o.datum,
  vrsta: VRSTA[o.vrsta],
  skladiste: skladisteNaziv(o.skladiste),
  strana: o.primalac,
  stranaDetalj: [o.osnov, o.adresaIsporuke].filter(Boolean).join(" · "),
  vrijednost: IZVEDENO.otpremnice[o.id].vrijednost,
  privremeno: false,
  status: STATUS_LABELS[o.status],
  tone: STATUS_TONES[o.status],
  statusDetalj: statusDetalj(o),
  grupa: grupa(o.status),
  pretraga: [o.primalacSifra, o.faktura, o.prijevoznik, o.vozac, ...o.stavke.map((s) => artiklNaziv(s.artikl))].join(" "),
  path: url(o.id),
});

// ─── Record ──────────────────────────────────────────────────────────────────

// The dispatch's way: the step each status stands on (4 = every step done).
const KORACI = ["Nacrt", "Ovjereno", "Otpremljeno", "Isporučeno"];
const FAZA: Record<OtpremnicaStatus, number> = {
  PRIPREMLJENA: 0,
  OVJERENA: 2,
  OTPREMLJENA: 3,
  ISPORUCENA: 4,
  OTKAZANA: 0,
};

/** Who usually presses the next step. */
const ULOGA_KORAKA: Record<OtpremnicaStatus, string> = {
  PRIPREMLJENA: "glavni skladištar ovjerava — nikad onaj ko je pripremio",
  OVJERENA: "skladištar otprema; prijevoznik preuzima robu",
  OTPREMLJENA: "referent potvrđuje isporuku po potpisu primaoca i izlaznoj fakturi",
  ISPORUCENA: "",
  OTKAZANA: "",
};

/** The step each status presses next: cicak's `primary` button. */
const SLJEDECI_KORAK: Partial<Record<OtpremnicaStatus, string>> = {
  PRIPREMLJENA: "Ovjeri",
  OVJERENA: "Otpremi robu",
  OTPREMLJENA: "Potvrdi isporuku",
};

/**
 * cicak's action bar for the status, in its order: the step decisions, then the
 * note's own actions (three in a row, as cicak's bar); which one is filled and
 * which cannot be pressed yet.
 */
function radnje(o: Otpremnica): Pick<RecordView, "actions" | "primary" | "disabledActions"> {
  const nacrt = o.status === "PRIPREMLJENA";
  const radnje: string[] = [];
  if (nacrt) radnje.push("Ovjeri", "Dodaj stavku", "Uredi zaglavlje");
  if (o.status === "OVJERENA") radnje.push("Otpremi robu");
  if (o.status === "OTPREMLJENA") radnje.push("Potvrdi isporuku");
  radnje.push("Štampaj otpremnicu");
  if (nacrt || o.status === "OVJERENA") radnje.push("Otkaži");
  if (nacrt) radnje.push("Obriši nacrt");
  return {
    actions: radnje,
    primary: SLJEDECI_KORAK[o.status] ?? null,
    disabledActions: nacrt && o.stavke.length === 0 ? ["Ovjeri"] : [],
  };
}

function zapis(id: string): RecordView | null {
  const o = OTPREMNICE.find((candidate) => candidate.id === id);
  if (!o) return null;
  const izvedeno = IZVEDENO.otpremnice[o.id];
  const faza = FAZA[o.status];
  const nacrt = o.status === "PRIPREMLJENA";
  const otpremljena = izvedeno.jeOtpremljena;
  const zaCitanje = izvedeno.jeZaCitanje;
  const prekinuto = o.status === "OTKAZANA";
  const prodaja = o.vrsta === "PRODAJA";
  const uloga = ULOGA_KORAKA[o.status];
  const istiPripremio = o.pripremio?.ko === AKTER_IME;
  // The export carries the dispatch checks while the note is open, the only time the page shows them.
  const provjere = izvedeno.provjere ?? [];
  const neprolaze = provjere.filter((provjera) => !provjera.ok);
  // An estimate before dispatch, at each item's current purchase price (cicak's `procjenaVrijednosti`).
  const procjena = Math.round(o.stavke.reduce((zbir, s) => zbir + s.kolicina * (artikl(s.artikl)?.cijena ?? 0), 0) * 100) / 100;
  const potpisi = potpisiKoraci(
    izvedeno.potpisi.map((mjesto) => ({ ...mjesto, hint: uloga ? `obično: ${uloga}` : undefined })),
    prekinuto,
    "Otpremnica otkazana",
  );

  const kolone: TableColumn<OtpremnicaStavka>[] = [
    {
      key: "artikl",
      header: "Artikl",
      render: (s) => (
        <span className="block min-w-0">
          <ArtiklCelija sifra={s.artikl} naziv={artikl(s.artikl)?.naziv ?? ""} detalj={pracenjeOpis(s)} />
          {s.napomena && <span className="block truncate text-xs text-gray-500">{s.napomena}</span>}
        </span>
      ),
    },
    { key: "jm", header: "JM", render: (s) => artikl(s.artikl)?.jm ?? "" },
    { key: "kolicina", header: "Količina", align: "right", render: (s) => kol(s.kolicina), className: "font-mono tabular-nums" },
    {
      key: "raspolozivo",
      header: "Raspoloživo",
      align: "right",
      render: (s) => {
        const provjera = provjere.find((x) => x.stavkaId === s.id);
        return (
          <span className="whitespace-nowrap">
            <span className="font-mono tabular-nums">{kol(raspolozivoArtikla(s.artikl, o.skladiste))}</span>
            {!otpremljena && !prekinuto && provjera && !provjera.ok && (
              <StatusBadge tone="danger" className="ml-2">
                nedovoljno
              </StatusBadge>
            )}
          </span>
        );
      },
    },
    { key: "lokacija", header: "Lokacija", render: (s) => s.lokacija || "bez lokacija", className: "font-mono" },
    {
      key: "cijena",
      header: "Nabavna cijena",
      align: "right",
      render: (s) =>
        otpremljena ? (
          <span className="font-mono tabular-nums">{km(s.cijena)}</span>
        ) : (
          <span className="text-gray-500">
            sada <span className="font-mono">{km(artikl(s.artikl)?.cijena ?? 0)}</span>
          </span>
        ),
      className: "whitespace-nowrap",
    },
    {
      key: "vrijednost",
      header: "Vrijednost",
      align: "right",
      render: (s) =>
        otpremljena ? <span className="font-mono tabular-nums">{km(s.cijena * s.kolicina)}</span> : <span className="text-gray-500">po otpremi</span>,
      className: "whitespace-nowrap",
    },
  ];

  const stavkeTab = (
    <div className="flex flex-col gap-3">
      <Table
        bare
        columns={kolone}
        rows={[...o.stavke]}
        getRowKey={(s) => s.id}
        emptyText={`Nema stavki. Dodajte artikle koji se otpremaju po osnovu ${o.osnov}.`}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e5eaf2] px-3 pt-3 text-xs text-gray-600">
        <span>
          Vrijednost zalihe: <span className="font-mono">{otpremljena ? km(izvedeno.vrijednost) : "—"}</span>
        </span>
        {!otpremljena && o.stavke.length > 0 && (
          <span className="text-gray-500">
            procjena po trenutnoj nabavnoj cijeni <span className="font-mono">{km(procjena)}</span>
          </span>
        )}
      </div>
    </div>
  );

  const callouts: RecordView["callouts"] = [];
  if (o.status === "OTKAZANA") {
    callouts.push({ tone: "info", title: "Otpremnica je otkazana", text: `${o.razlogZatvaranja || "Bez navedenog razloga."} Dokument je samo za čitanje.` });
  } else if (o.status === "ISPORUCENA") {
    callouts.push({
      tone: "success",
      title: "Isporučeno · primalac potpisao",
      text: [
        o.isporukuPotvrdio ? `Primio ${o.isporukuPotvrdio.ko}` : "Isporuka potvrđena",
        o.datumIsporuke ? ` · ${datum(o.datumIsporuke)}` : "",
        o.faktura ? ` · izlazna faktura ${o.faktura}` : "",
        `. ${NAPOMENE.proknjizenoSamoCita}`,
      ].join(""),
    });
  } else if (o.status === "OTPREMLJENA") {
    callouts.push({
      tone: "warning",
      title: "Roba na putu",
      text: `Otpremljeno ${datum(o.datumOtpreme)} · ${o.prijevoznik} · vozač ${o.vozac}. Zaliha je izašla; slijedi potvrda isporuke po potpisu primaoca${prodaja ? " i broju izlazne fakture" : ""}.`,
    });
  } else if (o.status === "OVJERENA" && neprolaze.length > 0) {
    callouts.push({
      tone: "danger",
      title: "Otprema je blokirana",
      text: `${neprolaze.length === 1 ? "Jedna stavka nema raspoloživu zalihu" : `${neprolaze.length} stavke nemaju raspoloživu zalihu`} — označene su u tabeli. Dugme „Otpremi robu” objašnjava šta blokira i gdje to riješiti.`,
    });
  } else if (nacrt && istiPripremio && o.stavke.length > 0) {
    callouts.push({
      tone: "warning",
      title: "Isti čovjek priprema i ovjerava",
      text: `${NAPOMENE.ovjeraDrugaOsoba} Administrator smije zaobići pravilo u demou; sistem to zapisuje u historiju.`,
    });
  } else if (nacrt && o.stavke.length === 0) {
    callouts.push({
      tone: "info",
      title: "Nacrt bez stavki",
      text: `Dodajte artikle koji se otpremaju po osnovu ${o.osnov}. Ovjera je moguća tek kad ima stavki.`,
    });
  }

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Izdavanje" },
      { label: "Otpremnice", to: url() },
      { label: o.broj },
    ],
    backTo: url(),
    topTitle: "Izdavanje › Otpremnice",
    topStatus: "Roba napušta firmu: prodaja kupcu ili povrat dobavljaču",
    icon: LuTruck,
    title: `Otpremnica ${o.broj}`,
    subtitle: `${VRSTA[o.vrsta]} · ${o.primalac} · ${skladisteNaziv(o.skladiste)}`,
    badges: [
      { label: STATUS_LABELS[o.status], tone: STATUS_TONES[o.status] },
      { label: VRSTA[o.vrsta], tone: "neutral" },
    ],
    hint: uloga ? `obično: ${uloga}` : undefined,
    ...radnje(o),
    steps: { title: "Tok otpremnice", steps: tokKoraci(KORACI, faza, prekinuto) },
    callouts,
    fields: [
      { label: "Broj", value: <span className="font-mono">{o.broj}</span> },
      { label: "Planirani datum otpreme", value: datum(o.datum) },
      { label: "Skladište", value: skladisteNaziv(o.skladiste) },
      { label: "Vrsta", value: VRSTA[o.vrsta] },
      { label: prodaja ? "Kupac" : "Dobavljač", value: `${o.primalacSifra} · ${o.primalac}` },
      { label: "Adresa isporuke", value: o.adresaIsporuke || "—" },
      { label: prodaja ? "Narudžba kupca" : "Reklamacija", value: o.osnov ? <span className="font-mono">{o.osnov}</span> : "—" },
      { label: "Izlazna faktura", value: o.faktura ? <span className="font-mono">{o.faktura}</span> : "—" },
      { label: "Datum otpreme", value: o.datumOtpreme ? datum(o.datumOtpreme) : "—" },
      { label: "Prijevoznik · vozilo", value: o.prijevoznik || "—" },
      { label: "Vozač", value: o.vozac || "—" },
      { label: "Datum isporuke", value: o.datumIsporuke ? datum(o.datumIsporuke) : "—" },
      { label: "Napomena", value: o.napomena || "—", wide: true },
    ],
    tabs: [{ key: "stavke", label: "Stavke", count: o.stavke.length, content: stavkeTab }, historijaTab([...o.historija])],
    notes: [
      NAPOMENE.otpremnicaVrijednost,
      NAPOMENE.otpremnicaIzlaz,
      NAPOMENE.otpremnicaSamoGlavno,
      ...(zaCitanje ? [NAPOMENE.proknjizenoSamoCita] : []),
      // cicak keeps its closing line on a verified or dispatched note too: they still have a step ahead.
      ...(!zaCitanje || o.status === "OVJERENA" || o.status === "OTPREMLJENA" ? [SLJEDECI_KORAK_NAPOMENA] : []),
    ],
    side: [{ icon: LuHistory, title: "Ovjere i potpisi", count: brojac(potpisi), steps: potpisi }],
  };
}

export const OTPREMNICE_EKRAN: Screen = dokumentiLista({
  naslov: "Otpremnice",
  opis: "Roba napušta firmu: prodaja kupcu ili povrat dobavljaču",
  stranaNaslov: "Primalac i osnov",
  redovi: OTPREMNICE.map(red),
  grupe: GRUPE,
  novo: "Nova otpremnica",
  prazno: "Nijedna otpremnica ne odgovara filteru.",
  napomena: `${NAPOMENE.otpremnicaVrijednost} ${NAPOMENE.otpremnicaIzlaz}`,
  record: zapis,
});
