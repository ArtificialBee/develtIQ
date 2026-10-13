import { useMemo, useState } from "react";
import { LuPackage } from "react-icons/lu";
import { Link, useSearchParams } from "react-router";
import { DataTable } from "~/components/DataTable";
import type { RecordView } from "~/components/RecordPage";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import graniceData from "~/data/skladiste/granice.json";
import grupeData from "~/data/skladiste/grupe-artikala.json";
import karticeData from "~/data/skladiste/kartice.json";
import sifrarniciData from "~/data/skladiste/sifrarnici-izvedeno.json";
import zaliheData from "~/data/skladiste/zalihe.json";
import { ekranUrl, type Screen } from "~/lib/skladiste/ekrani";
import { priloziSekcija } from "~/lib/skladiste/ekrani/prilozi";
import { datum, km, kol } from "~/lib/skladiste/format";
import { ARTIKLI, NAPOMENE, POJMOVI, SKLADISTA, oznaka, putanja, skladisteNaziv } from "~/lib/skladiste/podaci";
import type {
  Artikl,
  Granica,
  GrupaArtikala,
  KarticaRed,
  KarticeExport,
  PolozajGranice,
  Pracenje,
  SifrarniciIzvedenoExport,
  ZaliheExport,
} from "~/lib/skladiste/types";
import { Napomene } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Zalihe › Artikli, from cicak's `ArtikliPage` and `ArtiklDetaljPage`:
 * the item catalogue with what is available over every warehouse, and one item's
 * master data, its stock and thresholds per warehouse, its stock card and its
 * attachments. The record id is the item's code (ART-1001), so every item link of
 * the warehouse (`/app/skladiste/zalihe/artikli/ART-1001`) opens it.
 */

const GRUPE = grupeData as unknown as GrupaArtikala[];
const GRANICE = graniceData as unknown as Granica[];
const KARTICE = karticeData as unknown as KarticeExport;
const PREGLED = (sifrarniciData as unknown as SifrarniciIzvedenoExport).artikli;
const STANJE = (zaliheData as unknown as ZaliheExport).pozicije;
const PRACENJE_LABELS = oznaka<Record<Pracenje, string>>("skladiste/sifrarnici.ts", "PRACENJE_LABELS");
const POLOZAJ_LABELS = oznaka<Record<PolozajGranice, string>>("skladiste/granice.ts", "POLOZAJ_LABELS");

const url = (sifra?: string) => ekranUrl("zalihe", "artikli", sifra);

// ─── the group tree (cicak's maticni-podaci/grupe-artikala.ts) ──────────────

const poSifri = (a: GrupaArtikala, b: GrupaArtikala) => a.sifra.localeCompare(b.sifra, "bs", { numeric: true });

/** The groups right below `id` (`null`: the top-level ones), by code. A group whose parent is gone counts as top-level. */
function djecaGrupe(id: string | null): GrupaArtikala[] {
  const ima = new Set(GRUPE.map((x) => x.id));
  return GRUPE.filter((x) => (id === null ? x.nadredjena === null || !ima.has(x.nadredjena) : x.nadredjena === id)).sort(poSifri);
}

/** `id` and every group below it — what the group filter takes in. */
function podstabloGrupe(id: string): Set<string> {
  const skup = new Set([id]);
  const red = [id];
  while (red.length > 0) {
    const tren = red.pop();
    for (const x of GRUPE) {
      if (x.nadredjena === tren && !skup.has(x.id)) {
        skup.add(x.id);
        red.push(x.id);
      }
    }
  }
  return skup;
}

/** `Elektro materijal › Kablovi`, or the bare id for a group the tree does not have. */
function putanjaGrupe(id: string): string {
  const grupa = GRUPE.find((x) => x.id === id);
  if (!grupa) return id;
  const preci: GrupaArtikala[] = [];
  const vidjeno = new Set([id]);
  let roditelj = grupa.nadredjena;
  while (roditelj !== null && !vidjeno.has(roditelj)) {
    vidjeno.add(roditelj);
    const r = GRUPE.find((x) => x.id === roditelj);
    if (!r) break;
    preci.unshift(r);
    roditelj = r.nadredjena;
  }
  return [...preci, grupa].map((x) => x.naziv).join(" › ");
}

/** The whole tree in reading order: each group by code, its subgroups right under it. */
function stabloGrupa(): GrupaArtikala[] {
  const redovi: GrupaArtikala[] = [];
  const vidjeno = new Set<string>();
  const obidji = (roditelj: string | null) => {
    for (const x of djecaGrupe(roditelj)) {
      if (vidjeno.has(x.id)) continue;
      vidjeno.add(x.id);
      redovi.push(x);
      obidji(x.id);
    }
  };
  obidji(null);
  return redovi;
}

const PODSTABLA = new Map(GRUPE.map((g) => [g.id, podstabloGrupe(g.id)]));

// ─── the list ───────────────────────────────────────────────────────────────

/** cicak's `aktivan` query value: only active items, only retired ones, or both. */
const citajAktivan = (v: string | null) => (v === "ne" || v === "svi" ? v : "da");

const NUM = "font-mono tabular-nums";

const kolone: TableColumn<Artikl>[] = [
  {
    key: "sifra",
    header: "Šifra",
    render: (a) => (
      <Link to={url(a.sifra)} className="font-mono font-medium text-[#3B9DF8] hover:underline">
        {a.sifra}
      </Link>
    ),
    sortValue: (a) => a.sifra,
    visibility: "w-[11%]",
  },
  { key: "naziv", header: "Naziv", render: (a) => a.naziv, sortValue: (a) => a.naziv, className: "text-gray-900", visibility: "w-[24%]" },
  { key: "jm", header: "JM", render: (a) => a.jm, sortValue: (a) => a.jm, visibility: "hidden w-[6%] md:table-cell" },
  { key: "grupa", header: "Grupa", render: (a) => putanjaGrupe(a.grupa), sortValue: (a) => putanjaGrupe(a.grupa), className: "text-gray-600", visibility: "hidden w-[22%] lg:table-cell" },
  { key: "pracenje", header: "Praćenje", render: (a) => PRACENJE_LABELS[a.pracenje], sortValue: (a) => a.pracenje, className: "text-gray-500", visibility: "hidden w-[13%] lg:table-cell" },
  {
    key: "raspolozivo",
    header: "Raspoloživo",
    align: "right",
    // Available over every warehouse — the one number the catalogue shows.
    render: (a) => (
      <span className="whitespace-nowrap">
        <span className="font-mono font-medium tabular-nums text-gray-900">{kol(PREGLED[a.sifra]?.raspolozivo ?? 0)}</span> {a.jm}
      </span>
    ),
    sortValue: (a) => PREGLED[a.sifra]?.raspolozivo ?? 0,
    visibility: "w-[13%]",
  },
  {
    key: "aktivan",
    header: "Aktivan",
    render: (a) => <StatusBadge tone={a.aktivan ? "success" : "neutral"}>{a.aktivan ? "Da" : "Ne"}</StatusBadge>,
    sortValue: (a) => (a.aktivan ? 1 : 0),
    visibility: "w-[9%]",
  },
];

const OPCIJE_GRUPA = stabloGrupa().map((g) => ({ value: g.id, label: `${putanjaGrupe(g.id)}${g.aktivna ? "" : " (neaktivna)"}` }));

/** The catalogue: cicak's columns, the Aktivan and Grupa filters (from the URL, as in cicak), and its notes. */
function ArtikliLista() {
  const [params] = useSearchParams();
  const aktivan = citajAktivan(params.get("aktivan"));
  const grupa = params.get("grupa") ?? "";
  const pocetni = {
    aktivan: aktivan === "svi" ? [] : [aktivan],
    grupa: grupa === "" ? [] : [grupa],
  };
  // The labels button counts the rows the list opens with, as cicak's "Naljepnice (n)".
  const naljepnica = ARTIKLI.filter(
    (a) => (aktivan === "svi" || (aktivan === "da") === a.aktivan) && (grupa === "" || PODSTABLA.get(grupa)?.has(a.grupa)),
  ).length;
  return (
    <>
      <DataTable<Artikl>
        title="Artikli"
        description={`Katalog artikala: JM, praćenje i knjigovodstveni profil · ${ARTIKLI.filter((a) => a.aktivan).length} aktivnih`}
        columns={kolone}
        rows={ARTIKLI}
        getRowKey={(a) => a.sifra}
        getRowHref={(a) => url(a.sifra)}
        searchText={(a) => [a.sifra, a.naziv, a.barkod]}
        searchLabel="Pretraga artikala"
        filters={[
          {
            key: "aktivan",
            legend: "Aktivan",
            options: [
              { value: "da", label: "da" },
              { value: "ne", label: "ne" },
            ],
            matches: (a, v) => (v === "da") === a.aktivan,
          },
          { key: "grupa", legend: "Grupa", options: OPCIJE_GRUPA, matches: (a, v) => PODSTABLA.get(v)?.has(a.grupa) ?? false },
        ]}
        quick={{ label: "Aktivan", allLabel: "svi", several: () => "svi" }}
        initialFilters={pocetni}
        buttons={["Novi artikl", `Naljepnice (${naljepnica})`, "Izvoz"]}
        sortFields={[
          { value: "sifra", label: "Šifra", compare: (a, b) => a.sifra.localeCompare(b.sifra) },
          { value: "naziv", label: "Naziv", compare: (a, b) => a.naziv.localeCompare(b.naziv, "bs") },
          { value: "grupa", label: "Grupa", compare: (a, b) => putanjaGrupe(a.grupa).localeCompare(putanjaGrupe(b.grupa), "bs") },
          { value: "raspolozivo", label: "Raspoloživo", compare: (a, b) => (PREGLED[a.sifra]?.raspolozivo ?? 0) - (PREGLED[b.sifra]?.raspolozivo ?? 0) },
        ]}
        noun="artikala"
        fill
        className="min-h-0 flex-1"
      />
      <Napomene
        stavke={[
          `${NAPOMENE.artiklNeBrise} ${NAPOMENE.jmZakljucana} ${NAPOMENE.filteriUrl} ${NAPOMENE.skenPretraga}`,
          "Raspoloživo je zbir svih skladišta · red otvara detalj artikla",
        ]}
      />
    </>
  );
}

// ─── one item ───────────────────────────────────────────────────────────────

const POLOZAJ_TON: Partial<Record<PolozajGranice, StatusTone>> = {
  ISPOD_MINIMUMA: "danger",
  IZNAD_MAKSIMUMA: "neutral",
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** cicak's `polozaj`: where an available quantity stands against a threshold. */
function polozaj(raspolozivo: number, g: Granica): PolozajGranice {
  if (raspolozivo < g.min) return "ISPOD_MINIMUMA";
  if (raspolozivo < g.signalna) return "ISPOD_SIGNALNE";
  if (raspolozivo === g.signalna) return "NA_SIGNALNOJ";
  if (raspolozivo > g.max) return "IZNAD_MAKSIMUMA";
  return "OK";
}

/** A position frozen by a count in progress (cicak's `jeZamrznut`). */
const jeZamrznut = (napomena: string) => napomena.startsWith("zamrznuto popisom");

/** The item's stock and thresholds in every active warehouse, plus an inactive one that still holds it. */
function poSkladistu(sifra: string) {
  const redovi = STANJE.filter((r) => r.artikl === sifra);
  return SKLADISTA.filter((s) => s.aktivno || redovi.some((r) => r.skladiste === s.sifra)).map((s) => {
    const rows = redovi.filter((r) => r.skladiste === s.sifra);
    const g = GRANICE.find((x) => x.artikl === sifra && x.skladiste === s.sifra);
    return {
      s,
      rows,
      naStanju: rows.filter((r) => !r.bezStanja).reduce((a, r) => a + r.naStanju, 0),
      blokirano: rows.reduce((a, r) => a + r.blokirano, 0),
      rezervisano: rows.reduce((a, r) => a + r.rezervisano, 0),
      raspolozivo: rows.reduce((a, r) => a + r.raspolozivo, 0),
      g,
      // A frozen position still counts against the thresholds.
      polozaj: g ? polozaj(rows.reduce((a, r) => a + (jeZamrznut(r.napomena) && !r.bezStanja ? r.naStanju : r.raspolozivo), 0), g) : null,
    };
  });
}

type RedSkladista = ReturnType<typeof poSkladistu>[number];

const TAB_FOOTER = "border-t border-[#e5eaf2] px-3 pt-3";

const koloneZaliha: TableColumn<RedSkladista>[] = [
  { key: "skladiste", header: "Skladište", render: (x) => skladisteNaziv(x.s.sifra), className: "whitespace-nowrap" },
  {
    key: "lokacija",
    header: "Lokacija · lot",
    render: (x) =>
      x.rows.length === 0
        ? "nema zalihe"
        : x.rows.map((r) => `${r.lokacija || "bez lokacija"}${r.lot ? ` · ${r.lot}` : ""}${r.bezStanja ? " (bez stanja)" : ""}`).join(" · "),
    className: "text-xs text-gray-500",
  },
  { key: "naStanju", header: "Na stanju", align: "right", render: (x) => kol(x.naStanju), className: NUM },
  { key: "blokirano", header: "Blokirano", align: "right", render: (x) => kol(x.blokirano), className: NUM },
  { key: "rezervisano", header: "Rezervisano", align: "right", render: (x) => kol(x.rezervisano), className: NUM },
  { key: "raspolozivo", header: "Raspoloživo", align: "right", render: (x) => kol(x.raspolozivo), className: `${NUM} font-medium text-gray-900` },
  {
    key: "granice",
    header: "Min / signalna / max",
    render: (x) =>
      x.g ? (
        <span className="block whitespace-nowrap">
          <span className="inline-flex items-center gap-2">
            <span className="font-mono">
              {kol(x.g.min)} / {kol(x.g.signalna)} / {kol(x.g.max)}
            </span>
            {x.polozaj && x.polozaj !== "OK" && <StatusBadge tone={POLOZAJ_TON[x.polozaj] ?? "warning"}>{POLOZAJ_LABELS[x.polozaj]}</StatusBadge>}
          </span>
          <span className="block text-xs text-gray-500">
            v{x.g.verzija} · od {datum(x.g.vaziOd)}
          </span>
        </span>
      ) : (
        // cicak opens the thresholds dialog here; dialogs are not built.
        <button type="button" className="text-xs text-[#3B9DF8] hover:underline">
          nema granice · postavi
        </button>
      ),
  },
];

const SVA = "__sva";

/** The stock card tab: every posted movement, for every warehouse or one, with its running balance. */
function Kartica({ sifra }: { sifra: string }) {
  const [skladiste, setSkladiste] = useState(SVA);
  const karta = KARTICE[sifra] ?? { sva: [], poSkladistu: {} };
  // A chosen warehouse has its own card, so the running balance is that warehouse's.
  const redovi = useMemo(() => (skladiste === SVA ? karta.sva : (karta.poSkladistu[skladiste] ?? [])), [karta, skladiste]);
  const prisutna = PREGLED[sifra]?.skladistaKartice ?? [];
  const kolone: TableColumn<KarticaRed>[] = [
    { key: "datum", header: "Poslovni datum", render: (k) => datum(k.datum), className: "whitespace-nowrap font-mono tabular-nums" },
    {
      key: "dokument",
      header: "Dokument",
      render: (k) => (
        <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
          <Link to={putanja(k.path)} onClick={(e) => e.stopPropagation()} className="font-mono font-medium text-gray-900 hover:text-[#3B9DF8]">
            {k.dokument}
          </Link>
          <span className="text-xs text-gray-500"> · {k.vrsta}</span>
          {k.storno && <StatusBadge tone="neutral">storno</StatusBadge>}
        </span>
      ),
    },
    { key: "skladiste", header: "Skladište", render: (k) => skladisteNaziv(k.skladiste), className: "whitespace-nowrap" },
    { key: "ulaz", header: "Ulaz", align: "right", render: (k) => (k.ulaz ? kol(k.ulaz) : "—"), className: NUM },
    { key: "izlaz", header: "Izlaz", align: "right", render: (k) => (k.izlaz ? kol(k.izlaz) : "—"), className: NUM },
    { key: "stanje", header: "Stanje", align: "right", render: (k) => kol(k.stanje), className: `${NUM} font-medium text-gray-900` },
    {
      key: "cijena",
      header: "Cijena",
      align: "right",
      render: (k) => (
        <span className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
          <span className="font-mono">{km(k.cijena)}</span>
          {k.privremeno && <StatusBadge tone="neutral">privremeno</StatusBadge>}
        </span>
      ),
    },
  ];
  return (
    <div className="flex flex-col gap-3">
      {/* cicak's Skladište switch is a choice in the table's filter sheet: one warehouse's card, or all. */}
      <DataTable<KarticaRed>
        bare
        title="Skladišna kartica"
        description={skladiste === SVA ? "Sva skladišta" : skladisteNaziv(skladiste)}
        columns={kolone}
        rows={[...redovi]}
        getRowKey={(k) => k.id}
        getRowHref={(k) => putanja(k.path)}
        searchText={(k) => [k.dokument, k.vrsta, k.skladiste, skladisteNaziv(k.skladiste)]}
        searchLabel="Pretraga kartice"
        filters={[]}
        choices={
          karta.sva.length > 0
            ? [
                {
                  key: "skladiste",
                  legend: "Skladište",
                  options: [{ value: SVA, label: "Sva" }, ...prisutna.map((sk) => ({ value: sk, label: skladisteNaziv(sk) }))],
                  value: skladiste,
                  onChange: setSkladiste,
                },
              ]
            : []
        }
        sortFields={[{ value: "datum", label: "Poslovni datum", compare: (a, b) => a.datum.localeCompare(b.datum) }]}
        noun="knjiženja"
        emptyText="Artikl još nema prometa — kartica se puni prvim proknjiženim dokumentom."
      />
      <div className={TAB_FOOTER}>
        <Napomene
          stavke={[
            `${NAPOMENE.karticaNeUredjuje} ${POJMOVI.skladisnaKartica}`,
            skladiste === SVA
              ? "Stanje je zbir svih skladišta; odaberi skladište da vidiš njegov tok."
              : `Stanje teče samo kroz ${skladisteNaziv(skladiste)}.`,
            NAPOMENE.prenosnicaUnutar,
          ]}
        />
      </div>
    </div>
  );
}

function zapis(sifra: string): RecordView | null {
  const a = ARTIKLI.find((x) => x.sifra === sifra);
  if (!a) return null;
  const pregled = PREGLED[a.sifra];
  const skladista = poSkladistu(a.sifra);
  // The company-wide figure: the sum over every warehouse (the central one is just one of them).
  const ukupnoNaStanju = r3(skladista.reduce((s, x) => s + x.naStanju, 0));
  const ukupnoRaspolozivo = r3(skladista.reduce((s, x) => s + x.raspolozivo, 0));
  const saZalihom = skladista.filter((x) => x.naStanju > 0).length;
  const grupa = putanjaGrupe(a.grupa);
  const pracenje = PRACENJE_LABELS[a.pracenje];

  const zaliheTab = (
    <div className="flex flex-col gap-3">
      <Table bare columns={koloneZaliha} rows={skladista} getRowKey={(x) => x.s.sifra} />
      <div className={TAB_FOOTER}>
        <Napomene stavke={[NAPOMENE.formulaRaspolozivo, NAPOMENE.granicePoSkladistu, NAPOMENE.karantinBezStanja]} />
      </div>
    </div>
  );

  return {
    crumbs: [
      { label: "Skladište", to: "/app/skladiste/pocetna" },
      { label: "Zalihe" },
      { label: "Artikli", to: url() },
      { label: a.sifra },
    ],
    backTo: url(),
    topTitle: "Zalihe › Artikli",
    topStatus: "Katalog artikala: JM, praćenje i knjigovodstveni profil",
    icon: LuPackage,
    title: `${a.sifra} · ${a.naziv}`,
    subtitle: `${grupa} · ${a.jm} · ${pracenje}`,
    badges: [{ label: a.aktivan ? "Aktivan" : "Neaktivan", tone: a.aktivan ? "success" : "neutral" }],
    actions: ["Uredi granice", "Uredi", "Štampaj naljepnicu", a.aktivan ? "Deaktiviraj" : "Aktiviraj"],
    fields: [
      { label: "Šifra", value: <span className="font-mono">{a.sifra}</span> },
      { label: "Naziv", value: a.naziv || "—" },
      { label: "JM", value: `${a.jm}${pregled?.imaPrometa ? " (zaključana nakon prvog prometa)" : ""}` },
      { label: "Praćenje", value: pracenje },
      { label: "Grupa", value: grupa || "—" },
      { label: "Knjigovodstveni profil", value: a.profil || "—" },
      { label: "Barkod", value: a.barkod ? <span className="font-mono">{a.barkod}</span> : "—" },
      { label: "Cijena (ugovor / narudžba)", value: `${km(a.cijena)} / ${a.jm}` },
      { label: "Na stanju · sva skladišta", value: <span className="font-mono">{`${kol(ukupnoNaStanju)} ${a.jm}`}</span> },
      { label: "Raspoloživo · sva skladišta", value: <span className="font-mono">{`${kol(ukupnoRaspolozivo)} ${a.jm}`}</span> },
      { label: "Skladišta sa zalihom", value: <span className="font-mono">{`${saZalihom} od ${skladista.length}`}</span> },
    ],
    tabs: [
      { key: "zalihe", label: "Zalihe i granice", content: zaliheTab },
      { key: "kartica", label: "Skladišna kartica", count: (KARTICE[a.sifra]?.sva ?? []).length, content: <Kartica sifra={a.sifra} /> },
    ],
    sections: [priloziSekcija(a.sifra)],
  };
}

export const ARTIKLI_EKRAN: Screen = { List: ArtikliLista, record: zapis };
