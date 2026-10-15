import { LuArrowLeftRight, LuHistory } from "react-icons/lu";
import type { RecordView } from "~/components/RecordPage";
import { StatusBadge } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import prenosniceData from "~/data/skladiste/prenosnice.json";
import sifrarniciIzvedenoData from "~/data/skladiste/sifrarnici-izvedeno.json";
import { dokumentiLista, type DokumentRedLista } from "~/lib/skladiste/dokumenti-lista";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { datum, kol, km } from "~/lib/skladiste/format";
import { IZVEDENO, NAPOMENE, SKLADISTA, artikl, artiklNaziv, oznaka, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { Prenosnica, PrenosnicaStatus, PrenosnicaStavka, SifrarniciIzvedenoExport } from "~/lib/skladiste/types";
import { ArtiklCelija, SLJEDECI_KORAK_NAPOMENA, brojac, historijaTab, potpisiKoraci, tokKoraci } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Unutar skladišta › Prenosnice, from cicak's `PrenosniceListaPage`
 * and `PrenosnicaDetaljPage`. One register, two shapes of record: a move between
 * the shelves of one warehouse (one step) and a transfer between warehouses
 * (verify → dispatch to TRANZIT → count at receipt), each with its own steps,
 * signatures, fields and columns.
 */

const PRENOSNICE = prenosniceData as unknown as Prenosnica[];
const SIFRARNICI = sifrarniciIzvedenoData as unknown as SifrarniciIzvedenoExport;
const STATUS_LABELS = oznaka<Record<PrenosnicaStatus, string>>("skladiste/prenosnice.ts", "PRENOSNICA_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<PrenosnicaStatus, DokumentRedLista["tone"]>>("skladiste/prenosnice.ts", "PRENOSNICA_STATUS_TONES");

const url = (id?: string) => ekranUrl("interno", "prenosnice", id);

/** cicak's `nazivSkladista`: the warehouse's name alone, without its code. */
const nazivSkladista = (sifra: string) => SKLADISTA.find((s) => s.sifra === sifra)?.naziv ?? sifra;

const r3 = (n: number) => Math.round(n * 1000) / 1000;

function grupa(status: PrenosnicaStatus): string {
  if (status === "PRIPREMLJENA") return "NACRT";
  if (status === "PRENESENA") return "PRENESENO";
  if (status === "OTKAZANA") return "OTKAZANO";
  return "U_TOKU";
}

function statusDetalj(p: Prenosnica): string {
  const izvedeno = IZVEDENO.prenosnice[p.id];
  if (p.status === "OTKAZANA") return p.razlogZatvaranja;
  const gubitak = izvedeno.gubitakUTranzitu;
  if (gubitak.kolicina > 0) return `gubitak u tranzitu ${kol(gubitak.kolicina)} · ${km(gubitak.vrijednost)}`;
  if (p.status === "PRENESENA" && izvedeno.jeUnutarSkladista) return "polica → polica, bez kartice";
  return "";
}

/** `→ SK-04 · Servis pumpi` or, within a warehouse, `polica → polica · Glavno skladište`. */
function strana(p: Prenosnica): string {
  if (IZVEDENO.prenosnice[p.id].jeUnutarSkladista) return `polica → polica · ${nazivSkladista(p.izvornoSkladiste)}`;
  return `→ ${p.ciljnoSkladiste} · ${nazivSkladista(p.ciljnoSkladiste)}`;
}

const red = (p: Prenosnica): DokumentRedLista => {
  const izvedeno = IZVEDENO.prenosnice[p.id];
  return {
    id: p.id,
    broj: p.broj,
    datum: p.datum,
    vrsta: izvedeno.jeUnutarSkladista ? "Unutar skladišta" : "Između skladišta",
    skladiste: skladisteNaziv(p.izvornoSkladiste),
    strana: strana(p),
    stranaDetalj: p.razlog,
    vrijednost: izvedeno.vrijednost,
    privremeno: false,
    status: STATUS_LABELS[p.status],
    tone: STATUS_TONES[p.status],
    statusDetalj: statusDetalj(p),
    grupa: grupa(p.status),
    pretraga: [
      p.ciljnoSkladiste,
      nazivSkladista(p.izvornoSkladiste),
      ...p.stavke.flatMap((s) => [artiklNaziv(s.artikl), s.izvornaLokacija, s.ciljnaLokacija, s.lot]),
    ].join(" "),
    path: url(p.id),
  };
};

// A move between locations of one warehouse is one step; a transfer between warehouses is verified, on the road, received.
const KORACI_UNUTAR = ["Nacrt", "Preneseno"];
const KORACI_IZMEDJU = ["Nacrt", "Ovjereno", "U tranzitu", "Preneseno"];

const FAZA_UNUTAR: Record<PrenosnicaStatus, number> = { PRIPREMLJENA: 0, OVJERENA: 0, U_TRANZITU: 0, PRENESENA: 2, OTKAZANA: 0 };
const FAZA_IZMEDJU: Record<PrenosnicaStatus, number> = { PRIPREMLJENA: 0, OVJERENA: 2, U_TRANZITU: 3, PRENESENA: 4, OTKAZANA: 0 };

/** Who usually presses the next step, by shape and status. */
function ulogaKoraka(p: Prenosnica): string {
  if (IZVEDENO.prenosnice[p.id].jeUnutarSkladista) {
    return p.status === "PRIPREMLJENA" ? "skladištar premješta robu s police na policu" : "";
  }
  switch (p.status) {
    case "PRIPREMLJENA":
      return "glavni skladištar ovjerava — nikad onaj ko je pripremio";
    case "OVJERENA":
      return `skladištar skladišta ${p.izvornoSkladiste} otprema`;
    case "U_TRANZITU": {
      const odgovorna = SIFRARNICI.skladista[p.ciljnoSkladiste]?.odgovornaIme ?? "";
      return `skladištar skladišta ${p.ciljnoSkladiste}${odgovorna ? ` (${odgovorna})` : ""} broji i prima`;
    }
    default:
      return "";
  }
}

/**
 * The buttons as in cicak's action bar for the status: the step decisions first,
 * then print, cancel and delete. The step is the filled button; the first one of a
 * draft can not be pressed until the draft has lines.
 */
function radnje(p: Prenosnica): Pick<RecordView, "actions" | "primary" | "disabledActions"> {
  const unutar = IZVEDENO.prenosnice[p.id].jeUnutarSkladista;
  const nacrt = p.status === "PRIPREMLJENA";
  const korak = nacrt ? (unutar ? "Premjesti" : "Ovjeri") : p.status === "OVJERENA" ? "Otpremi u tranzit" : p.status === "U_TRANZITU" ? "Primi u skladište" : null;
  const odluke: string[] = korak ? [korak] : [];
  if (nacrt) odluke.push("Dodaj stavku", "Uredi zaglavlje");
  const autorske = ["Štampaj"];
  if (nacrt || p.status === "OVJERENA") autorske.push("Otkaži");
  if (nacrt) autorske.push("Obriši nacrt");
  return {
    actions: [...odluke, ...autorske],
    primary: korak,
    disabledActions: nacrt && korak && p.stavke.length === 0 ? [korak] : [],
  };
}

const pracenjeOpis = (s: PrenosnicaStavka) => (s.serijskiBrojevi ? `serijski broj ${s.serijskiBrojevi}` : s.lot ? `lot ${s.lot}` : "bez praćenja");

function zapis(id: string): RecordView | null {
  const p = PRENOSNICE.find((candidate) => candidate.id === id);
  if (!p) return null;
  const izvedeno = IZVEDENO.prenosnice[p.id];
  const unutar = izvedeno.jeUnutarSkladista;
  const nacrt = p.status === "PRIPREMLJENA";
  const otpremljena = izvedeno.jeOtpremljena;
  const prenesena = p.status === "PRENESENA";
  const prekinuto = p.status === "OTKAZANA";
  const gubitak = izvedeno.gubitakUTranzitu;
  const provjere = izvedeno.provjere ?? [];
  const neprolaze = provjere.filter((provjera) => !provjera.ok);
  const smjer = unutar
    ? `unutar ${p.izvornoSkladiste} · ${nazivSkladista(p.izvornoSkladiste)}`
    : `${p.izvornoSkladiste} · ${nazivSkladista(p.izvornoSkladiste)} → ${p.ciljnoSkladiste} · ${nazivSkladista(p.ciljnoSkladiste)}`;
  const vrstaLabel = unutar ? "Unutar skladišta" : "Između skladišta";
  const uloga = ulogaKoraka(p);
  const potpisi = potpisiKoraci(
    izvedeno.potpisi.map((mjesto) => ({ ...mjesto, hint: uloga ? `obično: ${uloga}` : undefined })),
    prekinuto,
    "Prenosnica otkazana",
  );
  const poslano = r3(p.stavke.reduce((zbir, s) => zbir + s.kolicina, 0));
  const primljeno = r3(p.stavke.reduce((zbir, s) => zbir + s.primljeno, 0));
  const imaCijene = p.stavke.some((s) => s.cijena > 0);

  const kolone: TableColumn<PrenosnicaStavka>[] = [
    { key: "artikl", header: "Artikl", render: (s) => <ArtiklCelija sifra={s.artikl} naziv={artikl(s.artikl)?.naziv ?? ""} detalj={pracenjeOpis(s)} /> },
    { key: "jm", header: "JM", render: (s) => artikl(s.artikl)?.jm ?? "" },
    { key: "kolicina", header: "Količina", align: "right", render: (s) => kol(s.kolicina), className: "font-mono tabular-nums" },
    {
      key: "slobodno",
      header: "Slobodno na izvoru",
      align: "right",
      render: (s) => {
        if (otpremljena) return <span className="text-gray-500">—</span>;
        const provjera = provjere.find((candidate) => candidate.stavkaId === s.id);
        return (
          <span className="whitespace-nowrap">
            <span className="font-mono">{kol(provjera?.raspolozivo ?? 0)}</span>
            {provjera && !provjera.ok && (
              <>
                <StatusBadge tone="danger" className="ml-2">
                  blokira
                </StatusBadge>
                <span className="block text-xs text-gray-500">{provjera.poruka}</span>
              </>
            )}
          </span>
        );
      },
    },
    { key: "izvorna", header: "Izvorna lokacija", render: (s) => s.izvornaLokacija || "bez lokacija", className: "font-mono" },
    { key: "ciljna", header: "Ciljna lokacija", render: (s) => s.ciljnaLokacija || "bez lokacija", className: "font-mono" },
    ...(unutar
      ? []
      : [
          {
            key: "primljeno",
            header: "Primljeno",
            align: "right" as const,
            render: (s: PrenosnicaStavka) => {
              if (!prenesena) return <span className="text-gray-500">{p.status === "U_TRANZITU" ? "po prijemu" : "—"}</span>;
              const manjak = r3(s.kolicina - s.primljeno);
              return (
                <span className="whitespace-nowrap">
                  <span className="font-mono">{kol(s.primljeno)}</span>
                  {manjak > 0 && (
                    <StatusBadge tone="warning" className="ml-2">
                      gubitak {kol(manjak)}
                    </StatusBadge>
                  )}
                </span>
              );
            },
          },
        ]),
    {
      key: "vrijednost",
      header: "Vrijednost",
      align: "right",
      render: (s) =>
        s.cijena > 0 ? (
          <span className="whitespace-nowrap font-mono">{km(s.cijena * s.kolicina)}</span>
        ) : (
          <span className="whitespace-nowrap text-gray-500">{unutar ? "po premještanju" : "po otpremi"}</span>
        ),
    },
  ];

  const stavkeTab = (
    <div className="flex flex-col gap-3">
      <Table
        bare
        columns={kolone}
        rows={[...p.stavke]}
        getRowKey={(s) => s.id}
        emptyText={`Nema stavki. Dodajte artikle koji se prenose ${unutar ? `unutar ${p.izvornoSkladiste}` : `iz ${p.izvornoSkladiste} u ${p.ciljnoSkladiste}`}.`}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e5eaf2] px-3 pt-3 text-xs text-gray-600">
        <span>
          Vrijednost (izračunata): <span className="font-mono">{imaCijene ? km(izvedeno.vrijednost) : "—"}</span>
        </span>
        {gubitak.kolicina > 0 && (
          <span>
            Gubitak u tranzitu:{" "}
            <span className="font-mono">
              {kol(gubitak.kolicina)} · {km(gubitak.vrijednost)}
            </span>
          </span>
        )}
      </div>
    </div>
  );

  // One notice, the first that holds, in cicak's order. The signed-in demo user is
  // the administrator, never the person who prepared the draft, so cicak's
  // "Isti čovjek priprema i ovjerava" notice does not come up.
  const callouts: RecordView["callouts"] = [];
  if (p.status === "OTKAZANA") {
    callouts.push({
      tone: "info",
      title: "Prenosnica je otkazana",
      text: `${p.razlogZatvaranja || "Bez navedenog razloga."} Roba nije napustila izvorno skladište. Dokument je samo za čitanje.`,
    });
  } else if (prenesena && unutar) {
    callouts.push({ tone: "success", title: "Premješteno unutar skladišta", text: `${NAPOMENE.prenosnicaUnutar} ${NAPOMENE.proknjizenoSamoCita}` });
  } else if (prenesena && gubitak.kolicina > 0) {
    callouts.push({
      tone: "warning",
      title: "Primljeno s gubitkom u tranzitu",
      text: (
        <>
          Poslano {kol(poslano)}, primljeno {kol(primljeno)} — gubitak <span className="font-mono">{kol(gubitak.kolicina)}</span> u vrijednosti{" "}
          <span className="font-mono">{km(gubitak.vrijednost)}</span> ostaje zapisan na ovoj prenosnici; ne pravi se posebna korekcija.{" "}
          {NAPOMENE.proknjizenoSamoCita}
        </>
      ),
    });
  } else if (prenesena) {
    callouts.push({
      tone: "success",
      title: "Primljeno u cijelosti",
      text: `Roba je na policama skladišta ${p.ciljnoSkladiste} · ${nazivSkladista(p.ciljnoSkladiste)} po istoj cijeni. ${NAPOMENE.proknjizenoSamoCita}`,
    });
  } else if (p.status === "U_TRANZITU") {
    callouts.push({
      tone: "warning",
      title: "Roba je na putu",
      text: `${NAPOMENE.tranzitCustody} Skladište ${p.ciljnoSkladiste} drži robu na TRANZIT-u dok je skladištar ne prebroji — do tada nije nigdje raspoloživa.`,
    });
  } else if (nacrt && p.stavke.length === 0) {
    callouts.push({
      tone: "info",
      title: "Nacrt bez stavki",
      text: `Dodajte artikle koji se prenose ${unutar ? "na drugu policu" : "u ciljno skladište"}. ${unutar ? "Premještanje" : "Ovjera"} je moguće tek kad ima stavki.`,
    });
  } else if (!otpremljena && neprolaze.length > 0) {
    callouts.push({
      tone: "warning",
      title: "Stavke ne prolaze provjeru zalihe",
      text: `${neprolaze.length === 1 ? "Jedna stavka blokira" : `${neprolaze.length} stavke blokiraju`} ${unutar ? "premještanje" : "otpremu"}: uklonite je ili dodajte ispravnu. Razlog stoji uz stavku u tabeli.`,
    });
  }

  // Between warehouses, once dispatched, cicak's tile strip under the fields.
  const summary: RecordView["summary"] =
    !unutar && otpremljena
      ? {
          tiles: [
            { label: "Stavki", value: p.stavke.length },
            { label: prenesena ? "Poslano" : "U tranzitu", value: kol(poslano) },
            { label: prenesena ? "Primljeno" : "Vrijednost u tranzitu", value: prenesena ? kol(primljeno) : km(izvedeno.vrijednost) },
            {
              label: "Gubitak u tranzitu",
              value: prenesena ? (
                <>
                  {kol(gubitak.kolicina)}
                  <span className="ml-2 text-sm font-normal text-gray-500">{km(gubitak.vrijednost)}</span>
                </>
              ) : (
                "—"
              ),
            },
          ],
        }
      : undefined;

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Unutar skladišta" },
      { label: "Prenosnice", to: url() },
      { label: p.broj },
    ],
    backTo: url(),
    topTitle: "Unutar skladišta › Prenosnice",
    topStatus: "Premještaj robe između skladišta ili između polica jednog skladišta",
    icon: LuArrowLeftRight,
    title: `Prenosnica ${p.broj}`,
    subtitle: `${vrstaLabel} · ${smjer} · ${p.razlog}`,
    badges: [
      { label: STATUS_LABELS[p.status], tone: STATUS_TONES[p.status] },
      { label: vrstaLabel, tone: "neutral" },
    ],
    hint: uloga ? `obično: ${uloga}` : undefined,
    ...radnje(p),
    inlineActions: 3,
    steps: {
      title: "Tok prenosnice",
      steps: unutar ? tokKoraci(KORACI_UNUTAR, FAZA_UNUTAR[p.status], prekinuto) : tokKoraci(KORACI_IZMEDJU, FAZA_IZMEDJU[p.status], prekinuto),
    },
    callouts,
    fields: [
      { label: "Broj", value: <span className="font-mono">{p.broj}</span> },
      { label: "Poslovni datum", value: datum(p.datum) },
      { label: "Vrsta", value: vrstaLabel },
      { label: "Razlog", value: p.razlog || "—" },
      { label: "Izvorno skladište", value: skladisteNaziv(p.izvornoSkladiste) },
      { label: "Ciljno skladište", value: skladisteNaziv(p.ciljnoSkladiste) },
      { label: unutar ? "Datum premještanja" : "Datum otpreme", value: datum(p.datumOtpreme) },
      unutar
        ? { label: "Vrijednost", value: imaCijene ? km(izvedeno.vrijednost) : "—" }
        : { label: "Datum prijema", value: datum(p.datumPrijema) },
      { label: "Napomena", value: p.napomena || "—", wide: true },
    ],
    summary,
    tabs: [{ key: "stavke", label: "Stavke", count: p.stavke.length, content: stavkeTab }, historijaTab([...p.historija])],
    notes: [
      NAPOMENE.prenosnicaVrijednost,
      NAPOMENE.prenosnicaSlobodno,
      unutar ? NAPOMENE.prenosnicaUnutar : NAPOMENE.tranzitCustody,
      ...(izvedeno.jeZaCitanje ? [NAPOMENE.proknjizenoSamoCita] : [SLJEDECI_KORAK_NAPOMENA]),
    ],
    side: [{ icon: LuHistory, title: "Ovjere i potpisi", count: brojac(potpisi), steps: potpisi }],
  };
}

export const PRENOSNICE_EKRAN: Screen = dokumentiLista({
  naslov: "Prenosnice",
  opis: "Premještaj robe između skladišta ili između polica jednog skladišta",
  stranaNaslov: "Cilj i razlog",
  redovi: PRENOSNICE.map(red),
  grupe: [
    { value: "NACRT", label: "Nacrt" },
    { value: "U_TOKU", label: "U toku" },
    { value: "PRENESENO", label: "Preneseno" },
    { value: "OTKAZANO", label: "Otkazano" },
  ],
  novo: "Nova prenosnica",
  prazno: "Nijedna prenosnica ne odgovara filteru.",
  napomena: `${NAPOMENE.prenosnicaVrijednost} ${NAPOMENE.prenosnicaSlobodno} ${NAPOMENE.tranzitCustody}`,
  record: zapis,
});
