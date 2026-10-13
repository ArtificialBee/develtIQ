import { Link } from "react-router";
import { LuDiff } from "react-icons/lu";
import type { RecordView } from "~/components/RecordPage";
import korekcijeData from "~/data/skladiste/korekcije.json";
import { dokumentiLista, type DokumentRedLista } from "~/lib/skladiste/dokumenti-lista";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { brojDokumenta, pozicijaZaliha } from "~/lib/skladiste/ekrani/interno-pomocno";
import { datum, kol, km, vrijeme } from "~/lib/skladiste/format";
import { IZVEDENO, NAPOMENE, POJMOVI, artikl, artiklNaziv, oznaka, putanja, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { Korekcija, Potpis, UzrokKorekcije } from "~/lib/skladiste/types";

/**
 * Skladište › Unutar skladišta › Korekcije, from cicak's `KorekcijeListaPage` and
 * `KorekcijaDetaljPage`. A correction posts the moment it is made, so its page has
 * no steps, no tabs and no side column: the position it hit, the signed quantity
 * and value, who posted it (cicak's signature strip under the fields), and its
 * storno link in either direction.
 */

const KOREKCIJE = korekcijeData as unknown as Korekcija[];
const UZROK_LABELS = oznaka<Record<UzrokKorekcije, string>>("skladiste/korekcije.ts", "UZROK_LABELS");

const url = (id?: string) => ekranUrl("interno", "korekcije", id);

const jm = (sifra: string) => artikl(sifra)?.jm ?? "";

/** `+2` / `-4`: the signed quantity the way the register shows it. */
const predznak = (kolicina: number) => `${kolicina > 0 ? "+" : ""}${kol(kolicina)}`;

/** The storno that reversed a correction, if one did. */
function stornoKorekcije(k: Korekcija): Korekcija | undefined {
  const id = IZVEDENO.korekcije[k.id].storno;
  return id ? KOREKCIJE.find((candidate) => candidate.id === id) : undefined;
}

const jeStorno = (k: Korekcija) => IZVEDENO.korekcije[k.id].jeStorno;

function statusDetalj(k: Korekcija): string {
  if (k.stornirana) {
    const storno = stornoKorekcije(k);
    return storno ? `stornirana sa ${storno.broj}` : "stornirana";
  }
  if (jeStorno(k)) return `storno korekcije ${k.izvor}`;
  if (k.izvor !== "" && brojDokumenta(k.izvor)?.predmet === "POPIS_ZALIHA") return `iz popisa ${k.izvor}`;
  if (k.izvor !== "") return `iz ${k.izvor}`;
  return "";
}

const red = (k: Korekcija): DokumentRedLista => ({
  id: k.id,
  broj: k.broj,
  datum: k.datum,
  vrsta: `Korekcija · ${predznak(k.kolicina)} ${jm(k.artikl)}`,
  skladiste: skladisteNaziv(k.skladiste),
  strana: `${UZROK_LABELS[k.uzrok]} · ${artiklNaziv(k.artikl)}`,
  stranaDetalj: `${k.lokacija || "bez lokacija"}${k.lot ? ` · ${k.lot}` : ""} · ${k.razlog}`,
  vrijednost: k.vrijednost,
  privremeno: false,
  status: k.stornirana ? "Stornirana" : jeStorno(k) ? "Storno · proknjiženo" : "Proknjiženo",
  tone: k.stornirana ? "neutral" : "success",
  statusDetalj: statusDetalj(k),
  grupa: k.stornirana ? "STORNIRANO" : "PROKNJIZENO",
  pretraga: [k.artikl, k.lot, k.lokacija, k.razlog, k.izvor, k.proknjizio.ko].join(" "),
  path: url(k.id),
});

const KOREKCIJA_ODMAH = "Korekcija se knjiži odmah — nema nacrta ni ovjere; datum je poslovni datum knjiženja.";

const BrojLink = ({ to, children }: { to: string; children: string }) => (
  <Link to={to} className="font-mono font-medium text-[#3B9DF8] hover:underline">
    {children}
  </Link>
);

/** One cell of cicak's signature strip: who and in what role, and when — or `—` while unsigned. */
const potpisPolje = (label: string, potpis: Potpis | null) => ({
  label,
  value: potpis ? (
    <span className="block min-w-0">
      <span className="block truncate font-medium">
        {potpis.ko} · {potpis.uloga}
      </span>
      <span className="block text-xs text-gray-500">{vrijeme(potpis.kad)}</span>
    </span>
  ) : (
    <span className="text-gray-500">—</span>
  ),
});

function zapis(id: string): RecordView | null {
  const k = KOREKCIJE.find((candidate) => candidate.id === id);
  if (!k) return null;
  const izvedeno = IZVEDENO.korekcije[k.id];
  const storno = stornoKorekcije(k);
  const izvorna = jeStorno(k) ? KOREKCIJE.find((candidate) => candidate.id === k.stornoOd) : undefined;
  const pozicija = pozicijaZaliha(k.artikl, k.skladiste, k.lokacija, k.lot);
  const a = artikl(k.artikl);
  const jedinica = jm(k.artikl);
  // Where the `izvor` reference leads: the record that carries that number, if one does.
  const izvorDokument = k.izvor === "" ? null : brojDokumenta(k.izvor);
  const izvorLabel = izvorDokument ? `${izvorDokument.naziv.toLowerCase()} ${k.izvor}` : k.izvor;
  const zaliheTo = putanja(
    `/skladiste/zalihe/stanje?skladiste=${encodeURIComponent(k.skladiste)}${k.lokacija ? `&lokacija=${encodeURIComponent(k.lokacija)}` : ""}&artikl=${encodeURIComponent(k.artikl)}`,
  );

  const callouts: RecordView["callouts"] = [];
  if (k.stornirana && storno) {
    callouts.push({
      tone: "info",
      title: "Korekcija je stornirana",
      text: (
        <>
          Storno <BrojLink to={url(storno.id)}>{storno.broj}</BrojLink> je proknjižen {vrijeme(storno.proknjizio.kad)} ({storno.proknjizio.ko}) ·
          razlog: {storno.razlog}. Ova korekcija je samo za čitanje; ako je potrebna ispravka, knjiži se nova korekcija na istoj poziciji.
        </>
      ),
    });
  } else if (jeStorno(k)) {
    callouts.push({
      tone: "info",
      title: `Storno korekcije ${k.izvor}`,
      text: (
        <>
          Poništava {izvorna ? <BrojLink to={url(izvorna.id)}>{izvorna.broj}</BrojLink> : k.izvor} suprotnim knjiženjem na istoj poziciji:{" "}
          {predznak(k.kolicina)} {jedinica} · {km(k.vrijednost)}. {POJMOVI.storno}
        </>
      ),
    });
  } else if (izvorDokument?.predmet === "POPIS_ZALIHA") {
    callouts.push({
      tone: "info",
      title: `Nastala iz popisa ${k.izvor}`,
      text: (
        <>
          {NAPOMENE.popisRazlikeKorekcije}{" "}
          {izvorDokument.path && (
            <Link to={izvorDokument.path} className="underline underline-offset-2">
              Otvori popis
            </Link>
          )}
        </>
      ),
    });
  }

  // A reversed correction and a storno can not be reversed again.
  const zakljucana = k.stornirana || jeStorno(k);

  // cicak's line under the strip when Storniraj is not available.
  const nedostupno = k.stornirana
    ? `Storniraj nije dostupno: korekcija je već stornirana${storno ? ` (${storno.broj})` : ""}. Nova ispravka je nova korekcija na istoj poziciji.`
    : jeStorno(k)
      ? `Storniraj nije dostupno: ovo je storno korekcije ${izvorna?.broj ?? k.izvor} — storno se ne stornira. Ako je storno bio pogrešan, knjiži se nova korekcija na istoj poziciji.`
      : null;

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Unutar skladišta" },
      { label: "Korekcije", to: url() },
      { label: k.broj },
    ],
    backTo: url(),
    topTitle: "Unutar skladišta › Korekcije",
    topStatus: "Oštećenje, manjak, pronađeno, istek roka, popisna razlika — knjiženo odmah",
    icon: LuDiff,
    title: `Korekcija ${k.broj}`,
    subtitle: `${UZROK_LABELS[k.uzrok]} · ${skladisteNaziv(k.skladiste)} · ${k.artikl} · ${a?.naziv ?? ""}`,
    badges: [
      { label: k.stornirana ? "Stornirana" : "Proknjiženo", tone: k.stornirana ? "neutral" : "success" },
      { label: `${predznak(k.kolicina)} ${jedinica}`, tone: k.kolicina < 0 ? "danger" : "info" },
      ...(jeStorno(k) ? [{ label: `storno korekcije ${k.izvor}`, tone: "neutral" as const }] : []),
    ],
    hint: "obično: glavni skladištar knjiži; ispravka je storno",
    // Storniraj is cicak's next step on a live correction; on a reversed one or a storno it stays, disabled.
    actions: ["Storniraj", "Nova korekcija na ovoj poziciji", "Otvori karticu artikla", "Štampaj"],
    primary: zakljucana ? null : "Storniraj",
    inlineActions: 3,
    disabledActions: zakljucana ? ["Storniraj"] : [],
    callouts,
    fields: [
      { label: "Broj", value: <span className="font-mono">{k.broj}</span> },
      { label: "Poslovni datum", value: datum(k.datum) },
      {
        label: "Skladište",
        value: (
          <Link to={putanja(`/skladiste/postavke/skladista/${k.skladiste}`)} className="text-[#3B9DF8] hover:underline">
            {skladisteNaziv(k.skladiste)}
          </Link>
        ),
      },
      { label: "Lokacija", value: <span className="font-mono">{k.lokacija || "bez lokacija"}</span> },
      {
        label: "Artikl",
        value: (
          <>
            <BrojLink to={`/app/skladiste/zalihe/artikli/${k.artikl}`}>{k.artikl}</BrojLink> · {a?.naziv ?? "—"}
          </>
        ),
        wide: true,
      },
      { label: a?.pracenje === "SERIJSKI" ? "Serijski brojevi" : "Lot", value: <span className="font-mono">{k.lot || "bez praćenja"}</span> },
      {
        label: "Količina",
        value: (
          <span className={`font-mono ${k.kolicina < 0 ? "text-red-600" : ""}`}>
            {predznak(k.kolicina)} {jedinica}
          </span>
        ),
      },
      {
        label: "Vrijednost",
        value: (
          <span className={`font-mono ${k.vrijednost < 0 ? "text-red-600" : ""}`}>
            {k.vrijednost > 0 ? "+" : ""}
            {km(k.vrijednost)}
          </span>
        ),
      },
      { label: "Uzrok", value: UZROK_LABELS[k.uzrok] },
      {
        label: "Izvor",
        value:
          k.izvor === "" ? (
            "—"
          ) : izvorDokument?.path ? (
            <BrojLink to={izvorDokument.path}>{izvorLabel}</BrojLink>
          ) : (
            <span className="font-mono">{izvorLabel}</span>
          ),
      },
      { label: "Storno", value: storno ? <BrojLink to={url(storno.id)}>{storno.broj}</BrojLink> : k.stornirana ? "stornirana" : "—" },
      { label: "Razlog", value: k.razlog || "—", wide: true },
      // cicak's signature strip under the header fields.
      ...izvedeno.potpisi.map((mjesto) => potpisPolje(mjesto.label, mjesto.potpis)),
    ],
    // cicak's tile strip: the stock position the correction posted to, as it stands now, and the way to it.
    summary: {
      tiles: [
        {
          label: "Pozicija zaliha",
          value: (
            <span className="text-sm font-normal">
              {k.skladiste} · {k.lokacija || "bez lokacija"} · {k.lot || "bez praćenja"}
            </span>
          ),
        },
        {
          label: "Na stanju sada",
          value: (
            <>
              {kol(pozicija?.naStanju ?? 0)} <span className="text-sm font-normal">{jedinica}</span>
            </>
          ),
        },
        {
          label: "",
          value: (
            <Link to={zaliheTo} className="font-sans text-xs font-normal text-[#3B9DF8] hover:underline">
              Otvori poziciju u zalihama
            </Link>
          ),
        },
      ],
    },
    tabs: [],
    notes: [
      ...(nedostupno ? [nedostupno] : []),
      KOREKCIJA_ODMAH,
      NAPOMENE.korekcijaStorno,
      NAPOMENE.korekcijaRazlog,
      NAPOMENE.kolicinaSamoDokumentom,
      NAPOMENE.karticaNeUredjuje,
    ],
  };
}

export const KOREKCIJE_EKRAN: Screen = dokumentiLista({
  naslov: "Korekcije zaliha",
  opis: "Oštećenje, manjak, pronađeno, istek roka, popisna razlika — knjiženo odmah",
  stranaNaslov: "Uzrok i artikl",
  redovi: KOREKCIJE.map(red),
  grupe: [
    { value: "PROKNJIZENO", label: "Proknjiženo" },
    { value: "STORNIRANO", label: "Stornirano" },
  ],
  novo: "Nova korekcija",
  prazno: "Nijedna korekcija ne odgovara filteru.",
  napomena: `${NAPOMENE.korekcijaStorno} ${NAPOMENE.kolicinaSamoDokumentom}`,
  record: zapis,
});
