import { LuHistory, LuPackagePlus } from "react-icons/lu";
import type { RecordView } from "~/components/RecordPage";
import { StatusBadge } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import naljepniceData from "~/data/skladiste/naljepnice.json";
import prijemniceData from "~/data/skladiste/prijemnice.json";
import { dokumentiLista, type DokumentRedLista } from "~/lib/skladiste/dokumenti-lista";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { priloziSekcija } from "~/lib/skladiste/ekrani/prilozi";
import { datum, km } from "~/lib/skladiste/format";
import { IZVEDENO, NAPOMENE, POJMOVI, artikl, oznaka, skladisteNaziv } from "~/lib/skladiste/podaci";
import type { NaljepniceExport, Prijemnica, PrijemnicaStatus, PrijemnicaStavka } from "~/lib/skladiste/types";
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
 * Skladište › Prijem › Prijemnice, from cicak's `PrijemniceListaPage` and
 * `PrijemnicaDetaljPage`: the same rows, steps, signatures, fields, lines and
 * notes, in the app's list and record layout.
 */

const PRIJEMNICE = prijemniceData as unknown as Prijemnica[];
const NALJEPNICE = naljepniceData as unknown as NaljepniceExport;
const STATUS_LABELS = oznaka<Record<PrijemnicaStatus, string>>("skladiste/prijemnice.ts", "PRIJEMNICA_STATUS_LABELS");
const STATUS_TONES = oznaka<Record<PrijemnicaStatus, DokumentRedLista["tone"]>>("skladiste/prijemnice.ts", "PRIJEMNICA_STATUS_TONES");
const GRUPA_LABELS = oznaka("skladiste/prijemnice.ts", "STATUS_GRUPA_LABELS");
const VRSTA_ULAZA = oznaka("skladiste/sifrarnici.ts", "VRSTA_ULAZA_LABELS");

const url = (id?: string) => ekranUrl("prijem", "prijemnice", id);

/** The other side of a receipt in the list: the supplier and its order or contract, or why there is none. */
function strana(p: Prijemnica) {
  if (p.vrstaUlaza === "POCETNO_STANJE") return { glavno: "—", detalj: "nema dobavljača na početnom stanju" };
  if (p.vrstaUlaza === "DRUGI_OSNOV") return { glavno: p.osnov || "—", detalj: "bez dobavljača" };
  const vrsta = p.osnov.startsWith("NAR-") ? "narudžba" : "ugovor";
  return { glavno: p.dobavljac || "—", detalj: p.osnov ? `${vrsta} ${p.osnov}` : "" };
}

/** "1 stavka", "2 stavke", "5 stavki". */
const stavki = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? "stavke" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "stavke" : "stavki");

function statusDetalj(p: Prijemnica): string {
  const izvedeno = IZVEDENO.prijemnice[p.id];
  if (p.status === "DJELIMICNO_PROKNJIZENO") return `${izvedeno.proknjizenihStavki} od ${p.stavke.length} ${stavki(p.stavke.length)} proknjiženo`;
  if (p.status === "ODBIJENO" || p.status === "OTKAZANO") return p.razlogZatvaranja;
  if (p.status === "PROKNJIZENO" && p.faktura) return `cijene priznate · ${p.faktura}`;
  return "";
}

const red = (p: Prijemnica): DokumentRedLista => {
  const izvedeno = IZVEDENO.prijemnice[p.id];
  const s = strana(p);
  return {
    id: p.id,
    broj: p.broj,
    datum: p.datumPrijema,
    vrsta: VRSTA_ULAZA[p.vrstaUlaza],
    skladiste: skladisteNaziv(p.skladiste),
    strana: s.glavno,
    stranaDetalj: s.detalj,
    vrijednost: izvedeno.vrijednost,
    privremeno: izvedeno.cijenaPrivremena && p.stavke.length > 0,
    status: izvedeno.stornoOznaka?.status ?? STATUS_LABELS[p.status],
    tone: izvedeno.stornoOznaka ? "neutral" : STATUS_TONES[p.status],
    statusDetalj: izvedeno.stornoOznaka?.detalj ?? statusDetalj(p),
    grupa: izvedeno.statusGrupa,
    pretraga: [p.otpremnica, p.faktura, ...p.stavke.map((stavka) => artikl(stavka.artikl)?.naziv ?? "")].join(" "),
    path: url(p.id),
  };
};

// The receipt's way: the step each status stands on (5 = every step done).
const KORACI = ["Nacrt", "Fizički prijem", "Količinska", "Kvalitativna", "Evidentirano"];
const FAZA: Record<PrijemnicaStatus, number> = {
  NACRT: 0,
  FIZICKI_PRIMLJENO: 2,
  CEKA_KVALITATIVNU: 3,
  U_KARANTINU: 3,
  CEKA_EVIDENCIJU: 4,
  DJELIMICNO_PROKNJIZENO: 4,
  PROKNJIZENO: 5,
  ODBIJENO: 3,
  OTKAZANO: 0,
};

/** Who usually presses the next step. */
const ULOGA_KORAKA: Record<PrijemnicaStatus, string> = {
  NACRT: "skladištar potvrđuje fizički prijem",
  FIZICKI_PRIMLJENO: "referent ili glavni skladištar",
  CEKA_KVALITATIVNU: "tehnički primalac",
  U_KARANTINU: "tehnički primalac",
  CEKA_EVIDENCIJU: "glavni skladištar",
  DJELIMICNO_PROKNJIZENO: "glavni skladištar",
  PROKNJIZENO: "računovodstvo priznaje cijene po fakturi",
  ODBIJENO: "",
  OTKAZANO: "",
};

function pracenjeOpis(s: PrijemnicaStavka): string {
  if (s.serijskiBrojevi) return `serijski broj ${s.serijskiBrojevi}`;
  if (s.lot) return `lot ${s.lot}${s.rokTrajanja ? ` · rok ${datum(s.rokTrajanja)}` : ""}`;
  return "bez praćenja";
}

/** The step each status presses next: cicak's `primary` button, when the bar offers it. */
const SLJEDECI_KORAK: Partial<Record<PrijemnicaStatus, string>> = {
  NACRT: "Potvrdi fizički prijem",
  FIZICKI_PRIMLJENO: "Usklađeno",
  CEKA_KVALITATIVNU: "Prihvati",
  U_KARANTINU: "Razriješi karantin",
  CEKA_EVIDENCIJU: "Materijalno evidentiraj",
  DJELIMICNO_PROKNJIZENO: "Materijalno evidentiraj",
  PROKNJIZENO: "Priznaj cijene",
};

/**
 * cicak's action bar for the status, in its order: the step decisions, the
 * receipt's own actions, storno last and always under "⋯"; which one is filled
 * and which cannot be pressed yet.
 */
function radnje(p: Prijemnica): Pick<RecordView, "actions" | "primary" | "inlineActions" | "disabledActions"> {
  const izvedeno = IZVEDENO.prijemnice[p.id];
  const nacrt = p.status === "NACRT";
  const mozeKarantin =
    izvedeno.kontrolaZbira.karantin > 0 && ["U_KARANTINU", "CEKA_EVIDENCIJU", "DJELIMICNO_PROKNJIZENO", "PROKNJIZENO"].includes(p.status);
  const odluke: string[] = [];
  if (nacrt) odluke.push("Potvrdi fizički prijem", "Dodaj stavku", "Uredi zaglavlje");
  if (p.status === "FIZICKI_PRIMLJENO") odluke.push("Usklađeno", "Odstupanje");
  if (p.status === "CEKA_KVALITATIVNU") odluke.push("Prihvati", "U karantin", "Odbij");
  if (p.status === "CEKA_EVIDENCIJU" || p.status === "DJELIMICNO_PROKNJIZENO") odluke.push("Materijalno evidentiraj");
  if (mozeKarantin) odluke.push("Razriješi karantin");
  if (izvedeno.mozePriznatiCijene) odluke.push("Priznaj cijene");
  const autorske = ["Štampaj", "Naljepnice serija", ...(nacrt ? ["Obriši nacrt"] : [])];
  const storno = p.status === "PROKNJIZENO" && !p.stornoOd;
  const primary = SLJEDECI_KORAK[p.status];
  return {
    actions: [...odluke, ...autorske, ...(storno ? ["Storniraj"] : [])],
    primary: primary && odluke.includes(primary) ? primary : null,
    inlineActions: storno ? Math.min(3, odluke.length + autorske.length) : 3,
    disabledActions: [
      ...(nacrt && p.stavke.length === 0 ? ["Potvrdi fizički prijem"] : []),
      // Labels exist only for posted lot and serial lines.
      ...(NALJEPNICE.serijePrijemnica[p.id]?.length ? [] : ["Naljepnice serija"]),
      ...(storno && !izvedeno.mozeStorno ? ["Storniraj"] : []),
    ],
  };
}

function zapis(id: string): RecordView | null {
  const p = PRIJEMNICE.find((candidate) => candidate.id === id);
  if (!p) return null;
  const izvedeno = IZVEDENO.prijemnice[p.id];
  const faza = FAZA[p.status];
  const prekinuto = p.status === "ODBIJENO" || p.status === "OTKAZANO";
  const nacrt = p.status === "NACRT";
  const uloga = p.stornoOd || p.storniranBrojem ? "" : ULOGA_KORAKA[p.status];
  const privremeno = izvedeno.cijenaPrivremena;
  const poslijeKolicinske = faza >= 3;
  const par = izvedeno.parStorna ? PRIJEMNICE.find((candidate) => candidate.id === izvedeno.parStorna) : undefined;
  const zbir = izvedeno.kontrolaZbira;
  const potpisi = potpisiKoraci(
    izvedeno.potpisi.map((mjesto) => ({ ...mjesto, hint: uloga ? `obično: ${uloga}` : undefined })),
    prekinuto,
    p.status === "ODBIJENO" ? "Isporuka odbijena" : "Prijemnica otkazana",
  );
  const storno = stornoBadge(p);
  const stornoNapomena = stornoCallout(p, "prijemnice", par ? { broj: par.broj, path: url(par.id) } : null);
  const split = (n: number) => (poslijeKolicinske ? String(n) : "—");

  const kolone: TableColumn<PrijemnicaStavka>[] = [
    { key: "artikl", header: "Artikl", render: (s) => <ArtiklCelija sifra={s.artikl} naziv={artikl(s.artikl)?.naziv ?? ""} detalj={pracenjeOpis(s)} /> },
    { key: "jm", header: "JM", render: (s) => artikl(s.artikl)?.jm ?? "" },
    { key: "isporuceno", header: "Isporučeno", align: "right", render: (s) => String(s.isporuceno), className: "font-mono tabular-nums" },
    { key: "prihvaceno", header: "Prihvaćeno", align: "right", render: (s) => split(s.prihvaceno), className: "font-mono tabular-nums" },
    { key: "odbijeno", header: "Odbijeno", align: "right", render: (s) => split(s.odbijeno), className: "font-mono tabular-nums" },
    { key: "karantin", header: "Karantin", align: "right", render: (s) => split(s.karantin), className: "font-mono tabular-nums" },
    { key: "evidentirano", header: "Evidentirano", align: "right", render: (s) => (faza >= 4 ? String(s.evidentirano) : "—"), className: "font-mono tabular-nums" },
    {
      key: "cijena",
      header: "Cijena i osnov",
      render: (s) => {
        const stavka = izvedeno.stavke[s.id];
        if (!(s.cijena > 0 || s.konacnaCijena !== null)) return <span className="text-gray-500">{s.osnovCijene}</span>;
        return (
          <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
            <span className="whitespace-nowrap font-mono">{km(stavka.cijena)}</span>
            <span className="whitespace-nowrap text-gray-500"> · {s.osnovCijene}</span>
            <StatusBadge tone={stavka.privremena ? "neutral" : "success"}>
              {stavka.privremena ? "privremeno" : s.konacnaCijena === null ? "konačna" : "priznata"}
            </StatusBadge>
          </span>
        );
      },
    },
    {
      key: "lokacija",
      header: "Lokacija",
      render: (s) => (
        <span className="block whitespace-nowrap">
          <span className="font-mono">{s.lokacija || "bez lokacija"}</span>
          {s.karantin > 0 && <span className="block text-xs text-gray-500">+ QUARANTINE (bez stanja)</span>}
        </span>
      ),
    },
  ];

  const stavkeTab = (
    <div className="flex flex-col gap-3">
      <Table bare columns={kolone} rows={[...p.stavke]} getRowKey={(s) => s.id} emptyText="Nema stavki. Dodajte stavke po otpremnici dobavljača." />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e5eaf2] px-3 pt-3 text-xs text-gray-600">
        {poslijeKolicinske ? (
          <span className="flex items-center gap-2">
            {NAPOMENE.kontrolaPrijema} →{" "}
            <span className="font-mono">
              {zbir.isporuceno} = {zbir.prihvaceno} + {zbir.odbijeno} + {zbir.karantin}
            </span>
            <StatusBadge tone={zbir.uskladjeno ? "success" : "warning"}>{zbir.uskladjeno ? "OK" : "nije raspoređeno"}</StatusBadge>
          </span>
        ) : (
          <span>
            Ukupno isporučeno: <span className="font-mono">{zbir.isporuceno}</span>
          </span>
        )}
        <span>
          Vrijednost: <span className="font-mono">{km(izvedeno.vrijednost)}</span>
          {privremeno && p.stavke.length > 0 ? " (privremeno)" : ""}
        </span>
      </div>
    </div>
  );

  const callouts: RecordView["callouts"] = [];
  if (stornoNapomena) callouts.push(stornoNapomena);
  if (p.status === "ODBIJENO") {
    callouts.push({ tone: "danger", title: "Isporuka je odbijena", text: `${p.razlogZatvaranja || "Bez navedenog razloga."} Dokument je samo za čitanje.` });
  } else if (p.status === "OTKAZANO") {
    callouts.push({ tone: "info", title: "Prijemnica je otkazana", text: `${p.razlogZatvaranja || "Bez navedenog razloga."} Dokument je samo za čitanje.` });
  } else if (p.status === "PROKNJIZENO" && !p.stornoOd && !p.storniranBrojem) {
    callouts.push({
      tone: "success",
      title: "Proknjiženo · zaliha je povećana",
      text: `${NAPOMENE.proknjizenoSamoCita}${privremeno ? " Cijene su još privremene — računovodstvo ih priznaje po fakturi." : ""}`,
    });
  } else if (nacrt && p.stavke.length === 0) {
    callouts.push({ tone: "info", title: "Nacrt bez stavki", text: "Dodajte stavke po otpremnici dobavljača. Fizički prijem se potvrđuje tek kad ima stavki." });
  }
  if (p.odstupanje) callouts.push({ tone: "warning", title: "Količinsko odstupanje", text: p.odstupanje });

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Prijem" },
      { label: "Prijemnice", to: url() },
      { label: p.broj },
    ],
    backTo: url(),
    topTitle: "Prijem › Prijemnice",
    topStatus: "Prijem robe: prijem, kontrola i knjiženje na zalihu",
    icon: LuPackagePlus,
    title: `Prijemnica ${p.broj}`,
    subtitle: [VRSTA_ULAZA[p.vrstaUlaza], skladisteNaziv(p.skladiste), p.dobavljac || p.osnov].filter(Boolean).join(" · "),
    badges: [
      { label: STATUS_LABELS[p.status], tone: STATUS_TONES[p.status] },
      ...(privremeno && p.stavke.length > 0 ? [{ label: "privremena cijena", tone: "neutral" as const }] : []),
      ...(p.faktura ? [{ label: `cijene priznate · ${p.faktura}`, tone: "success" as const }] : []),
      ...(storno ? [storno] : []),
    ],
    hint: uloga ? `obično: ${uloga}` : undefined,
    ...radnje(p),
    steps: { title: "Tok prijemnice", steps: tokKoraci(KORACI, faza, prekinuto) },
    callouts,
    fields: [
      { label: "Broj", value: <span className="font-mono">{p.broj}</span> },
      { label: "Datum prijema", value: datum(p.datumPrijema) },
      { label: "Skladište", value: skladisteNaziv(p.skladiste) },
      { label: "Vrsta ulaza", value: VRSTA_ULAZA[p.vrstaUlaza] },
      { label: "Dobavljač", value: p.vrstaUlaza === "DRUGI_OSNOV" ? "bez dobavljača" : p.dobavljac || "—" },
      {
        label: p.vrstaUlaza === "DRUGI_OSNOV" ? "Odobreni osnov" : "Narudžba / ugovor",
        value: p.osnov ? <span className={p.vrstaUlaza === "KUPOVINA" ? "font-mono text-[#3B9DF8]" : ""}>{p.osnov}</span> : "—",
      },
      { label: "Otpremnica", value: p.otpremnica ? <span className="font-mono">{p.otpremnica}</span> : "—" },
      { label: "Poslovni datum knjiženja", value: p.poslovniDatum ? datum(p.poslovniDatum) : "—" },
      { label: "Napomena", value: p.napomena || "—", wide: true },
    ],
    tabs: [{ key: "stavke", label: "Stavke", count: p.stavke.length, content: stavkeTab }, historijaTab([...p.historija])],
    // The delivery's papers and photos from the document library, as under cicak's tabs.
    sections: [priloziSekcija(p.broj)],
    notes: [
      NAPOMENE.cijenaIzOsnova,
      privremeno ? NAPOMENE.cijenaPrivremena : POJMOVI.priznavanjeCijene,
      ...(izvedeno.jeZaCitanje ? [NAPOMENE.proknjizenoSamoCita] : [SLJEDECI_KORAK_NAPOMENA]),
    ],
    side: [{ icon: LuHistory, title: "Ovjere i potpisi", count: brojac(potpisi), steps: potpisi }],
  };
}

export const PRIJEMNICE_EKRAN: Screen = dokumentiLista({
  naslov: "Prijemnice",
  opis: "Prijem robe: prijem, kontrola i knjiženje na zalihu",
  stranaNaslov: "Dobavljač ili osnov",
  redovi: PRIJEMNICE.map(red),
  grupe: (["NACRT", "U_TOKU", "PROKNJIZENO", "OTKAZANO"] as const).map((g) => ({ value: g, label: GRUPA_LABELS[g] })),
  novo: "Nova prijemnica",
  prazno: "Nijedna prijemnica ne odgovara filteru.",
  napomena: NAPOMENE.cijenaPrivremena,
  record: zapis,
});
