/**
 * Exports every piece of the Skladište (warehouse) demo data of divetiq-cicak
 * into `app/data/skladiste/*.json` (+ a generated README.md), exactly as the
 * cicak demo computes it — the seeded stores and the derived views the screens
 * show (stock, stock cards, dashboard, reports, per-document flags, outbox …).
 *
 * The seeds date themselves relative to `Date.now()` (`prijeDana`, `prijeSati`,
 * `isoDatum` in `skladiste/store.ts`), so the clock is frozen at
 * `ZAMRZNUTO_VRIJEME` (Sarajevo local time) before any cicak module loads;
 * runtime ids (`novId` = prefix + Date.now() + a module counter) come out the
 * same on every run because the clock is frozen and the stores are always
 * read in the same order. Nothing in divetiq-cicak is written.
 *
 * Run from divetiq-cicak (its vitest, TypeScript transform and jsdom):
 *
 *   cd ../divetiq-cicak
 *   node_modules/.bin/vitest run --config ../divetiq-edvin/scripts/vitest.export-skladiste.config.mjs
 *
 * cicak modules are imported by runtime path, so edvin's `tsc` never walks into
 * cicak's sources; what this file writes is typed against
 * `app/lib/skladiste/types.ts`.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type {
  Akter,
  ArtiklPregled,
  DobavljacPregled,
  DodjelaPregled,
  DokumentiIzvedenoExport,
  DokumentRed,
  ExportMeta,
  IzdatnicaIzvedeno,
  IzvjestajiExport,
  KarticeExport,
  KorekcijaIzvedeno,
  KorisniciExport,
  NaljepniceExport,
  NumeracijaExport,
  OpcijeExport,
  OtpisIzvedeno,
  OtpremnicaIzvedeno,
  OutboxExport,
  PlocicaPocetne,
  PocetnaExport,
  PocetnoStanjeIzvedeno,
  PojmoviExport,
  PopisIzvedeno,
  PovratnicaIzvedeno,
  PrenosnicaIzvedeno,
  PrijemnicaIzvedeno,
  RezervacijaIzvedeno,
  ShemeExport,
  SifrarniciIzvedenoExport,
  SkladistePregled,
  StanjeRed,
  UlogaPregled,
  ZahtjevIzvedeno,
  ZaliheExport,
  ZbirArtikla,
} from '../app/lib/skladiste/types'
import type { FormatPriloga, PrilogBiblioteke, PriloziExport } from '../app/lib/skladiste/ekrani/prilozi'

// vitest runs this file with `globals: true`; edvin has no vitest types.
declare const vi: { useFakeTimers(o: { now: number; toFake: string[] }): void; useRealTimers(): void }
declare const test: (name: string, fn: () => Promise<void>, timeout?: number) => void

/**
 * The moment the export is taken at — local time in Europe/Sarajevo. Every
 * relative seed date and every "today" (dashboard, reports, ages) follows it.
 * Change it here and re-run to re-export at another moment.
 */
export const ZAMRZNUTO_VRIJEME = '2026-10-13T08:00:00+02:00'
/** The demo's zone: `isoDatum` and the seeds' local dates read it. */
export const VREMENSKA_ZONA = 'Europe/Sarajevo'

const OVDJE = dirname(fileURLToPath(import.meta.url))
const CICAK = resolve(OVDJE, '../../divetiq-cicak')
const SRC = `${CICAK}/src/`
const IZLAZ = resolve(OVDJE, '../app/data/skladiste')

// A cicak module namespace — untyped on purpose (see the header).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Modul = Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bilo = any

/** The cicak modules the export reads, loaded one by one in this order. */
const MODULI = {
  store: 'skladiste/store.ts',
  sifrarnici: 'skladiste/sifrarnici.ts',
  pravila: 'skladiste/sifrarnici-pravila.ts',
  granice: 'skladiste/granice.ts',
  prijemnice: 'skladiste/prijemnice.ts',
  izdatnice: 'skladiste/izdatnice.ts',
  povratnice: 'skladiste/povratnice.ts',
  zahtjevi: 'skladiste/zahtjevi.ts',
  otpremnice: 'skladiste/otpremnice.ts',
  prenosnice: 'skladiste/prenosnice.ts',
  popisi: 'skladiste/popisi.ts',
  korekcije: 'skladiste/korekcije.ts',
  otpisi: 'skladiste/otpisi.ts',
  pocetnaStanja: 'skladiste/pocetna-stanja.ts',
  rezervacije: 'skladiste/rezervacije.ts',
  zalihe: 'skladiste/zalihe.ts',
  pocetna: 'skladiste/pocetna.ts',
  izvjestaji: 'skladiste/izvjestaji.ts',
  administracija: 'skladiste/administracija.ts',
  potpisi: 'skladiste/potpisi.ts',
  storno: 'skladiste/storno.ts',
  shema: 'skladiste/shema.ts',
  naljepniceIspis: 'skladiste/naljepnice-ispis.ts',
  naljepnicePostavke: 'skladiste/naljepnice-postavke.ts',
  numeracija: 'skladiste/numeracija.ts',
  sken: 'skladiste/sken.ts',
  pojmovi: 'skladiste/pojmovi.ts',
  records: 'skladiste/records.ts',
  artikliMp: 'maticni-podaci/artikli.ts',
  grupeMp: 'maticni-podaci/grupe-artikala.ts',
  numeracijaMp: 'maticni-podaci/numeracija.ts',
  radneLokacije: 'maticni-podaci/radne-lokacije.ts',
  hr: 'hr/store.ts',
  formatDatum: 'lib/format-datum.ts',
} as const

type ImeModula = keyof typeof MODULI

/** The modules whose plain (non-function) exports go into `oznake.json`. */
const MODULI_OZNAKA: readonly ImeModula[] = [
  'sifrarnici',
  'granice',
  'prijemnice',
  'izdatnice',
  'povratnice',
  'zahtjevi',
  'otpremnice',
  'prenosnice',
  'popisi',
  'korekcije',
  'otpisi',
  'pocetnaStanja',
  'rezervacije',
  'zalihe',
  'izvjestaji',
  'administracija',
  'naljepniceIspis',
  'numeracija',
  'sken',
  'artikliMp',
  'grupeMp',
]

/** Closed lanes on the warehouse visuals (`ZATVORENI` of pages/skladiste/zajednicko/ShemaSkladista.tsx). */
const ZATVORENI = new Set(['Proknjiženo', 'Predano', 'Otkazano', 'Otkazana', 'Stornirano'])

/** One file of the export, with what the README says about it. */
interface Datoteka {
  readonly ime: string
  readonly podaci: unknown
  readonly zapisa: number
  /** Source module(s) + export(s), relative to `divetiq-cicak/src/`. */
  readonly izvor: string
  readonly opis: string
}

function json(v: unknown): string {
  return `${JSON.stringify(v, null, 2)}\n`
}

/** `undefined` → `null`, so a missing link is still a key in the JSON. */
function ilNull<T>(v: T | undefined): T | null {
  return v === undefined ? null : v
}

function poId<T extends { readonly id: string }, R>(lista: readonly T[], f: (x: T) => R): Record<string, R> {
  const r: Record<string, R> = {}
  for (const x of lista) r[x.id] = f(x)
  return r
}

/** Every plain export of a module: labels, tones, enums, lists — no functions, no stores. */
function konstante(m: Modul): Record<string, unknown> {
  const r: Record<string, unknown> = {}
  for (const ime of Object.keys(m).sort()) {
    const v: unknown = m[ime]
    if (typeof v === 'function') continue
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      const vrijednosti = Object.values(v)
      if (vrijednosti.length > 0 && vrijednosti.every((x) => typeof x === 'function')) continue
    }
    const s = JSON.stringify(v)
    if (s === undefined) continue
    r[ime] = JSON.parse(s)
  }
  return r
}

test(
  'izvoz demo podataka Skladišta',
  async () => {
    // ─── the frozen clock ──────────────────────────────────────────────────
    process.env.TZ = VREMENSKA_ZONA
    const sada = Date.parse(ZAMRZNUTO_VRIJEME)
    vi.useFakeTimers({ now: sada, toFake: ['Date'] })
    const provjera = new Date()
    if (provjera.getTime() !== sada || provjera.getHours() !== Number(ZAMRZNUTO_VRIJEME.slice(11, 13))) {
      throw new Error(`Sat nije zamrznut u ${VREMENSKA_ZONA}: ${provjera.toString()}`)
    }

    // ─── cicak's modules, after the clock froze ────────────────────────────
    const m = {} as Record<ImeModula, Modul>
    for (const [ime, put] of Object.entries(MODULI) as [ImeModula, string][]) {
      m[ime] = (await import(/* @vite-ignore */ `${SRC}${put}`)) as Modul
    }
    const { store, sifrarnici, pravila, zalihe, pocetna, administracija, potpisi, storno } = m
    const danasIso: string = store.isoDatum(new Date())
    const formatDatum: (iso: string) => string = m.formatDatum.formatDatum

    // ─── the stores, read once in a fixed order (the home page's hook order) ─
    const P: Bilo[] = m.prijemnice.readPrijemnice()
    const I: Bilo[] = m.izdatnice.readIzdatnice()
    const POV: Bilo[] = m.povratnice.readPovratnice()
    const Z: Bilo[] = m.zahtjevi.readZahtjevi()
    const O: Bilo[] = m.otpremnice.readOtpremnice()
    const PR: Bilo[] = m.prenosnice.readPrenosnice()
    const POP: Bilo[] = m.popisi.readPopisi()
    const K: Bilo[] = m.korekcije.readKorekcije()
    const OT: Bilo[] = m.otpisi.readOtpisi()
    const PS: Bilo[] = m.pocetnaStanja.readPocetnaStanja()
    const R: Bilo[] = m.rezervacije.readRezervacije()
    const G: Bilo[] = m.granice.readGranice()
    const A: Bilo[] = sifrarnici.readArtikli()
    const stanje: StanjeRed[] = zalihe.readStanje()
    const SK: Bilo[] = sifrarnici.readSkladista()
    const L: Bilo[] = sifrarnici.readLokacije()
    const D: Bilo[] = sifrarnici.readDobavljaci()
    const U: Bilo[] = administracija.readUloge()
    const DOD: Bilo[] = administracija.readDodjele()
    const POL: Bilo[] = administracija.readPolitike()
    const INT: Bilo = administracija.readIntegracija()
    const NAL: Bilo[] = m.naljepnicePostavke.postavkeNaljepnicaStore.read()
    const GRUPE: Bilo[] = m.grupeMp.readGrupeArtikala()
    const SERIJE: Bilo[] = m.numeracijaMp.readSerijeBrojeva()
    const BROJACI: Bilo[] = m.numeracijaMp.readBrojaciBrojeva()

    const nazivSkladista: (s: string) => string = sifrarnici.nazivSkladista

    // ─── zalihe.json ───────────────────────────────────────────────────────
    const poArtikluISkladistu = zalihe.stanjePoArtiklu(stanje).map((a: Bilo) => {
      const g = m.granice.granicaZa(a.artikl, a.skladiste, G)
      return { ...a, granica: g ?? null, polozaj: g ? m.granice.polozaj(a.raspolozivoZaGranice, g) : null }
    })
    const zaliheExport: ZaliheExport = {
      pozicije: stanje,
      poArtikluISkladistu,
      poArtiklu: grupisiPoArtiklu(stanje, store.r2, store.r3),
    }

    // ─── kartice.json ──────────────────────────────────────────────────────
    const izvoriKartice = zalihe.readKarticaIzvori()
    const kartice: Record<string, { sva: Bilo[]; poSkladistu: Record<string, Bilo[]> }> = {}
    for (const a of A) {
      const sva: Bilo[] = zalihe.karticaArtikla(a.sifra, izvoriKartice)
      const prisutna = new Set(sva.map((k) => k.skladiste))
      const poSkladistu: Record<string, Bilo[]> = {}
      for (const s of SK) {
        if (prisutna.has(s.sifra)) poSkladistu[s.sifra] = zalihe.karticaArtikla(a.sifra, izvoriKartice, s.sifra)
      }
      kartice[a.sifra] = { sva, poSkladistu }
    }
    const karticeExport: KarticeExport = kartice

    // ─── pocetna.json (Skladište › Početna) ─────────────────────────────────
    const izvoriPocetne = {
      prijemnice: P,
      izdatnice: I,
      povratnice: POV,
      zahtjevi: Z,
      otpremnice: O,
      prenosnice: PR,
      popisi: POP,
      korekcije: K,
      otpisi: OT,
      pocetnaStanja: PS,
    }
    const mojiZadaci: Bilo[] = pocetna.zadaci(izvoriPocetne)
    const nedavni: DokumentRed[] = pocetna.nedavniDokumenti(izvoriPocetne, 7)
    const kpi = pocetna.pokazatelji(stanje, G, R, Z, POP)
    const trajanjeCekanja: (od: string) => string = pocetna.trajanjeCekanja
    const plural: (n: number, a: string, b: string, c: string) => string = store.plural
    const starostZadataka = [0, 0, 0]
    for (const zad of mojiZadaci) {
      const d = Math.floor((new Date().getTime() - new Date(zad.cekaOd).getTime()) / 86400000)
      starostZadataka[d <= 1 ? 0 : d <= 3 ? 1 : 2] += 1
    }
    const najduzeCeka = mojiZadaci[0]
    // The four tiles exactly as pages/skladiste/SkladistePocetnaPage.tsx builds them.
    const plocice: PlocicaPocetne[] = [
      {
        key: 'ispod-signalne',
        naslov: 'Ispod signalne',
        opis: `Artikli ispod signalne granice po skladištu · ${kpi.uZahtjevu} već u zahtjevu`,
        icon: 'TriangleAlert',
        badge: { label: 'Otvorene potrebe', tone: 'warning' },
        vrijednost: kpi.ispodSignalne,
        chart: {
          kind: 'bars',
          values: [kpi.ispodMinimuma, kpi.ispodSignalne - kpi.ispodMinimuma, kpi.uGranicama + kpi.iznadMaksimuma],
          highlightedIndex: 0,
        },
        facts: [
          { label: 'Ispod minimuma', value: String(kpi.ispodMinimuma) },
          { label: 'Ispod signalne, iznad minimuma', value: String(kpi.ispodSignalne - kpi.ispodMinimuma) },
          { label: 'U granicama i iznad', value: String(kpi.uGranicama + kpi.iznadMaksimuma) },
        ],
        path: '/skladiste/zalihe/stanje?granice=ispod-signalne',
      },
      {
        key: 'ceka-moju-radnju',
        naslov: 'Čeka moju radnju',
        opis: najduzeCeka
          ? `Dokumenti koji čekaju moj korak · najduže čeka ${trajanjeCekanja(najduzeCeka.cekaOd)}`
          : 'Dokumenti koji čekaju moj korak',
        icon: 'UserCheck',
        badge: { label: 'Dokumenti', tone: 'info' },
        vrijednost: mojiZadaci.length,
        chart: { kind: 'bars', values: starostZadataka, highlightedIndex: 2 },
        facts: [
          { label: 'Do 1 dan', value: String(starostZadataka[0]) },
          { label: '2–3 dana', value: String(starostZadataka[1]) },
          { label: 'Preko 3 dana', value: String(starostZadataka[2]) },
        ],
        path: '/skladiste/prijem/prijemnice',
      },
      {
        key: 'nepokrivene-potrebe',
        naslov: 'Nepokrivene potrebe',
        opis: 'Rezervisano, a nema zalihe iza toga',
        icon: 'Hourglass',
        badge: { label: 'Rezervacije', tone: 'danger' },
        vrijednost: kpi.nepokrivene,
        chart: { kind: 'gradient-bar', percent: kpi.pokrivenostPotreba },
        facts: [
          { label: 'Osnova (nalozi, zahtjevi)', value: String(kpi.nepokriveniOsnovi) },
          { label: 'Nedostaje jedinica', value: String(kpi.nedostajeJedinica) },
          { label: 'Rezervisano jedinica', value: String(kpi.rezervisanoOtvorene) },
        ],
        path: '/skladiste/zalihe/rezervacije',
      },
      {
        key: 'otvoreni-popisi',
        naslov: 'Otvoreni popisi',
        opis: 'Brojanje počelo, nije zatvoreno',
        icon: 'ClipboardCheck',
        badge: { label: 'Popisi', tone: 'neutral' },
        vrijednost: kpi.otvoreniPopisi,
        chart: { kind: 'gradient-bar', percent: kpi.popisNapredak },
        facts: [
          { label: 'Izbrojano stavki', value: `${kpi.popisPrebrojano} / ${kpi.popisStavki}` },
          { label: 'Preostalo za brojanje', value: String(kpi.popisStavki - kpi.popisPrebrojano) },
          { label: 'Skladišta u popisu', value: String(kpi.popisSkladista) },
        ],
        path: '/skladiste/interno/popisi',
      },
    ]
    const pocetnaExport: PocetnaExport = {
      danas: danasIso,
      podnaslov: `Danas ${formatDatum(danasIso)} · pogled administratora`,
      pokazatelji: kpi,
      plocice,
      starostZadataka,
      zadaci: mojiZadaci.map((zad) => ({
        ...zad,
        trajanje: trajanjeCekanja(zad.cekaOd),
        odDatum: formatDatum(store.isoDatum(new Date(zad.cekaOd))),
        skladisteNaziv: nazivSkladista(zad.dokument.skladiste),
      })),
      nedavniDokumenti: nedavni.map((d) => ({
        ...d,
        datumPrikaz: formatDatum(d.datum),
        skladisteNaziv: nazivSkladista(d.skladiste),
      })),
      napomeneZadaci: [
        `${mojiZadaci.length} ${plural(mojiZadaci.length, 'zadatak', 'zadatka', 'zadataka')} · red otvara dokument na koraku koji čeka.`,
        'Administrator vidi svaki korak. U produkciji svako vidi samo korake svoje uloge.',
      ],
      napomeneNedavni: [
        'Zadnjih 7 dana · svi dokumenti skladišta · red otvara dokument.',
        m.pojmovi.NAPOMENE.proknjizenoSamoCita,
      ],
    }

    // ─── izvjestaji.json — every report × every warehouse × every period ────
    const izvoriIzvjestaja = m.izvjestaji.readIzvoriIzvjestaja()
    const sifreSkladista: string[] = ['', ...izvoriIzvjestaja.skladista.map((s: Bilo) => s.sifra)]
    const izvjestajiLista: Bilo[] = []
    for (const def of m.izvjestaji.IZVJESTAJI as Bilo[]) {
      const periodi: number[] = def.period ? [...m.izvjestaji.PERIODI_DANA] : [m.izvjestaji.ZADANI_FILTER.periodDana]
      for (const skladiste of sifreSkladista) {
        for (const periodDana of periodi) {
          const filter = { skladiste, periodDana }
          izvjestajiLista.push({
            kljuc: def.kljuc,
            filter,
            periodOd: def.period ? store.prijeDana(periodDana) : null,
            izvjestaj: m.izvjestaji.izvjestaj(def.kljuc, izvoriIzvjestaja, filter),
          })
        }
      }
    }
    const izvjestajiExport: IzvjestajiExport = {
      definicije: m.izvjestaji.IZVJESTAJI,
      periodiDana: m.izvjestaji.PERIODI_DANA,
      zadaniFilter: m.izvjestaji.ZADANI_FILTER,
      skladista: sifreSkladista,
      izvjestaji: izvjestajiLista,
    }

    // ─── sheme.json — `useVizualSkladista` of ShemaSkladista.tsx, per warehouse ─
    const danasUtc = new Date().toISOString().slice(0, 10)
    const dokumentiVizuala = (sifra: string): DokumentRed[] => [
      ...P.filter((p) => p.skladiste === sifra).map(pocetna.prijemnicaRed),
      ...I.filter((i) => i.skladiste === sifra).map(pocetna.izdatnicaRed),
      ...POV.filter((p) => p.skladiste === sifra).map((p) => pocetna.povratnicaRed(p, I)),
      ...O.filter((o) => o.skladiste === sifra).map(pocetna.otpremnicaRed),
    ]
    const sheme: Record<string, Bilo> = {}
    for (const skl of SK) {
      const shema = m.shema.shemaSkladista(
        sifrarnici.sveLokacijeSkladista(skl.sifra, L),
        stanje.filter((r) => r.skladiste === skl.sifra),
      )
      const dokumenti = dokumentiVizuala(skl.sifra)
      sheme[skl.sifra] = {
        shema,
        promet: m.shema.prometPoSedmicama(dokumenti, danasUtc),
        otvoreni: dokumenti.filter((d) => !ZATVORENI.has(d.status)).length,
        popunjenost: shema.ukupno > 0 ? Math.round((shema.zauzeto / shema.ukupno) * 100) : 0,
        podskladista: sifrarnici
          .podskladista(skl.sifra, SK)
          .filter((s: Bilo) => s.aktivno)
          .map((s: Bilo) => ({
            skladiste: s,
            vrijednost: stanje
              .filter((r) => r.skladiste === s.sifra && !r.bezStanja)
              .reduce((n, r) => n + r.vrijednost, 0),
          })),
      }
    }
    const shemeExport: ShemeExport = sheme

    // ─── dokumenti-izvedeno.json ───────────────────────────────────────────
    const parId = (x: Bilo): string | null => (x ? x.id : null)
    const izvoriPrometa = zalihe.readIzvoriPrometa()
    const dokumentiIzvedeno: DokumentiIzvedenoExport = {
      prijemnice: poId(P, (p): PrijemnicaIzvedeno => {
        const mozeStorno: boolean = m.prijemnice.mozeStornoPrijemnice(p)
        return {
          red: pocetna.prijemnicaRed(p),
          sljedecaRadnja: m.prijemnice.sljedecaRadnja(p),
          cekaOd: m.prijemnice.cekaOd(p),
          potpisi: potpisi.potpisiPrijemnice(p),
          statusGrupa: m.prijemnice.statusGrupa(p.status),
          vrijednost: m.prijemnice.vrijednost(p),
          cijenaPrivremena: m.prijemnice.cijenaPrivremena(p),
          mozePriznatiCijene: m.prijemnice.mozePriznatiCijene(p),
          jeZaCitanje: m.prijemnice.jeZaCitanje(p),
          mozeStorno,
          proknjizenihStavki: m.prijemnice.proknjizenihStavki(p),
          kontrolaZbira: m.prijemnice.kontrolaZbira(p),
          stornoOznaka: storno.stornoOznaka(p),
          parStorna: parId(m.prijemnice.parStorna(p, P)),
          preprekeStorna: mozeStorno ? zalihe.provjeriStornoPrijemnice(p, stanje) : null,
          stavke: poId(p.stavke as Bilo[], (s) => ({
            cijena: m.prijemnice.cijenaStavke(s),
            kolicinaZaVrijednost: m.prijemnice.kolicinaZaVrijednost(p, s),
            privremena: m.prijemnice.stavkaPrivremena(p, s),
          })),
        }
      }),
      izdatnice: poId(I, (i): IzdatnicaIzvedeno => {
        const mozeStorno: boolean = m.izdatnice.mozeStornoIzdatnice(i)
        return {
          red: pocetna.izdatnicaRed(i),
          sljedecaRadnja: m.izdatnice.sljedecaRadnjaIzdatnice(i),
          cekaOd: m.izdatnice.cekaOdIzdatnica(i),
          potpisi: potpisi.potpisiIzdatnice(i),
          jeProknjizena: m.izdatnice.jeProknjizena(i),
          jeZaCitanje: m.izdatnice.jeZaCitanjeIzdatnica(i),
          mozeStorno,
          vrijednost: m.izdatnice.vrijednostIzdatnice(i),
          preostaloZaPredaju: m.izdatnice.preostaloZaPredaju(i),
          ukupnoPredano: m.izdatnice.ukupnoPredano(i),
          stornoOznaka: storno.stornoOznaka(i),
          parStorna: parId(m.izdatnice.parStornaIzdatnice(i, I)),
          preprekeStorna: mozeStorno ? zalihe.provjeriStornoIzdatnice(i, POV, stanje) : null,
          provjere: i.status === 'PRIPREMLJENA' || i.status === 'OVJERENA' ? zalihe.provjeriIzdatnicu(i, stanje) : null,
          mozeVratiti: poId(i.stavke as Bilo[], (s) => m.povratnice.mozeVratiti(s, POV) as number),
        }
      }),
      povratnice: poId(POV, (p): PovratnicaIzvedeno => {
        const mozeStorno: boolean = m.povratnice.mozeStornoPovratnice(p)
        return {
          red: pocetna.povratnicaRed(p, I),
          sljedecaRadnja: m.povratnice.sljedecaRadnjaPovratnice(p),
          cekaOd: m.povratnice.cekaOdPovratnica(p),
          potpisi: potpisi.potpisiPovratnice(p),
          jeZaCitanje: m.povratnice.jeZaCitanjePovratnica(p),
          mozeStorno,
          vrijednost: m.povratnice.vrijednostPovratnice(p),
          zbir: m.povratnice.zbirPovrata(p),
          stornoOznaka: storno.stornoOznaka(p),
          parStorna: parId(m.povratnice.parStornaPovratnice(p, POV)),
          preprekeStorna: mozeStorno ? zalihe.provjeriStornoPovratnice(p, stanje) : null,
          izvornaIzdatnicaBroj: I.find((i) => i.id === p.izvornaIzdatnica)?.broj ?? null,
        }
      }),
      otpremnice: poId(O, (o): OtpremnicaIzvedeno => ({
        red: pocetna.otpremnicaRed(o),
        sljedecaRadnja: m.otpremnice.sljedecaRadnjaOtpremnice(o),
        cekaOd: m.otpremnice.cekaOdOtpremnica(o),
        potpisi: potpisi.potpisiOtpremnice(o),
        jeOtpremljena: m.otpremnice.jeOtpremljena(o),
        jeZaCitanje: m.otpremnice.jeZaCitanjeOtpremnica(o),
        vrijednost: m.otpremnice.vrijednostOtpremnice(o),
        provjere: o.status === 'PRIPREMLJENA' || o.status === 'OVJERENA' ? zalihe.provjeriOtpremnicu(o, stanje) : null,
      })),
      prenosnice: poId(PR, (p): PrenosnicaIzvedeno => ({
        red: pocetna.prenosnicaRed(p),
        sljedecaRadnja: m.prenosnice.sljedecaRadnjaPrenosnice(p),
        cekaOd: m.prenosnice.cekaOdPrenosnica(p),
        potpisi: potpisi.potpisiPrenosnice(p),
        jeUnutarSkladista: m.prenosnice.jeUnutarSkladista(p),
        jeOtpremljena: m.prenosnice.jeOtpremljena(p),
        jeZaCitanje: m.prenosnice.jeZaCitanjePrenosnica(p),
        vrijednost: m.prenosnice.vrijednostPrenosnice(p),
        gubitakUTranzitu: m.prenosnice.gubitakUTranzitu(p),
        provjere: p.status === 'PRIPREMLJENA' || p.status === 'OVJERENA' ? zalihe.provjeriPrenosnicu(p, stanje) : null,
      })),
      popisi: poId(POP, (p): PopisIzvedeno => {
        const zbir = m.popisi.zbirPopisa(p)
        return {
          red: pocetna.popisRed(p),
          sljedecaRadnja: m.popisi.sljedecaRadnjaPopisa(p),
          cekaOd: m.popisi.cekaOdPopis(p),
          // popisi.ts has no potpisi* helper: the chain PopisDetaljPage.tsx builds inline.
          potpisi: [
            { label: 'Otvorio', potpis: p.otvorio, pojam: 'popis' },
            { label: 'Zatvorio brojanje', potpis: p.zatvorioBrojanje, pojam: 'slijepoBrojanje' },
            { label: 'Proknjižio', potpis: p.proknjizio, pojam: 'korekcija' },
          ],
          jeOtvoren: m.popisi.jeOtvoren(p),
          zbir,
          opisZbira: m.popisi.opisZbira(zbir),
          opisObuhvata: m.popisi.opisObuhvata(p.obuhvat),
          opisSlijepog: m.popisi.opisSlijepog(p),
          razlike: poId(p.stavke as Bilo[], (s) => m.popisi.razlika(s) as number),
          pozicijeZaPopis: p.status === 'PLANIRAN' ? m.popisi.pozicijeZaPopis(p, stanje) : null,
        }
      }),
      korekcije: poId(K, (k): KorekcijaIzvedeno => {
        const s = m.korekcije.stornoKorekcije(k, K)
        return {
          red: pocetna.korekcijaRed(k),
          sljedecaRadnja: null,
          // A correction posts the moment it is made: it never waits.
          cekaOd: null,
          potpisi: potpisi.potpisiKorekcije(k, s),
          jeStorno: m.korekcije.jeStorno(k),
          storno: parId(s),
        }
      }),
      otpisi: poId(OT, (o): OtpisIzvedeno => ({
        red: pocetna.otpisRed(o),
        sljedecaRadnja: m.otpisi.sljedecaRadnjaOtpisa(o),
        cekaOd: m.otpisi.cekaOdOtpis(o),
        potpisi: potpisi.potpisiOtpisa(o),
        jeProknjizen: m.otpisi.jeProknjizenOtpis(o),
        jeZaCitanje: m.otpisi.jeZaCitanjeOtpis(o),
        vrijednost: m.otpisi.vrijednostOtpisa(o),
        kolicina: m.otpisi.kolicinaOtpisa(o),
        provjere: o.status === 'PRIPREMLJEN' || o.status === 'ODOBREN' ? zalihe.provjeriOtpis(o, stanje) : null,
      })),
      pocetnaStanja: poId(PS, (p): PocetnoStanjeIzvedeno => ({
        red: pocetna.pocetnoStanjeRed(p),
        sljedecaRadnja: m.pocetnaStanja.sljedecaRadnjaPocetnog(p),
        cekaOd: m.pocetnaStanja.cekaOdPocetnog(p),
        potpisi: potpisi.potpisiPocetnog(p),
        jeProknjizeno: m.pocetnaStanja.jeProknjizenoPocetno(p),
        vrijednost: m.pocetnaStanja.vrijednostPocetnog(p),
        kolicina: m.pocetnaStanja.kolicinaPocetnog(p),
        provjere:
          p.status === 'NACRT' || p.status === 'ODOBRENO'
            ? [
                ...zalihe.preprekePocetnogStanja(p.skladiste, izvoriPrometa, p.id),
                ...zalihe.provjeriStavkePocetnog(p),
              ]
            : null,
      })),
      zahtjevi: poId(Z, (z): ZahtjevIzvedeno => ({
        red: pocetna.zahtjevRed(z),
        sljedecaRadnja: m.zahtjevi.sljedecaRadnjaZahtjeva(z),
        cekaOd: m.zahtjevi.cekaOdZahtjev(z),
        // A request has no signature chain; its page shows `ovjerio` as a field.
        potpisi: [],
        jeOtvoren: m.zahtjevi.jeOtvoren(z),
        naziv: m.zahtjevi.NAZIV_ZAHTJEVA[z.vrsta],
        putanja: m.zahtjevi.putanjaZahtjeva(z),
        odobreneStavke: (m.zahtjevi.odobreneStavke(z) as Bilo[]).map((s) => s.id as string),
        stavke: poId(z.stavke as Bilo[], (s) => ({
          opisIzvora: m.zahtjevi.opisIzvora(s) as string,
          opisNosioca: m.zahtjevi.opisNosioca(s) as string,
          rezervacija: parId(m.rezervacije.rezervacijaZaOsnov(s.artikl, z.skladiste, z.broj, R)),
        })),
      })),
      rezervacije: poId(R, (r): RezervacijaIzvedeno => ({
        status: m.rezervacije.statusRezervacije(r),
        nepokriveno: m.rezervacije.nepokriveno(r),
        drziSe: m.rezervacije.drziSe(r),
        preostalo: m.rezervacije.preostalo(r),
        jeOtvorena: m.rezervacije.jeOtvorena(r),
        putIzvora: m.rezervacije.putIzvora(r),
        starostDana: m.rezervacije.starostDana(r),
        raspolozivo: zalihe.stanjeArtikla(r.artikl, r.skladiste, stanje).raspolozivo,
      })),
    }

    // ─── sifrarnici-izvedeno.json ──────────────────────────────────────────
    const radnaLokacija = (sifra: string): Bilo => m.radneLokacije.getLokacija(sifra)
    const skladistaPregled = poId(SK, (s): SkladistePregled => {
      const rl = radnaLokacija(s.radnaLokacija)
      const redovi = stanje.filter((r) => r.skladiste === s.sifra)
      const zalihaRedovi = redovi.filter((r) => !r.bezStanja)
      const dokumenti: DokumentRed[] = [
        ...P.filter((p) => p.skladiste === s.sifra).map(pocetna.prijemnicaRed),
        ...I.filter((i) => i.skladiste === s.sifra).map(pocetna.izdatnicaRed),
        ...POV.filter((p) => p.skladiste === s.sifra).map((p) => pocetna.povratnicaRed(p, I)),
        ...O.filter((o) => o.skladiste === s.sifra).map(pocetna.otpremnicaRed),
        ...PR.filter((p) => p.izvornoSkladiste === s.sifra || p.ciljnoSkladiste === s.sifra).map(pocetna.prenosnicaRed),
        ...K.filter((k) => k.skladiste === s.sifra).map(pocetna.korekcijaRed),
        ...POP.filter((p) => p.skladiste === s.sifra).map(pocetna.popisRed),
      ].sort((a, b) => b.datum.localeCompare(a.datum) || b.broj.localeCompare(a.broj))
      const preprekePocetnog = zalihe.preprekePocetnogStanja(s.sifra, izvoriPrometa)
      return {
        adresa: sifrarnici.adresaSkladista(s),
        grad: sifrarnici.gradSkladista(s.sifra),
        odgovornaIme: sifrarnici.imeOdgovorne(s),
        mjesto: rl ? `${rl.nazivBs} · ${rl.adresa}` : s.radnaLokacija,
        lokacija: sifrarnici.sveLokacijeSkladista(s.sifra, L).filter((l: Bilo) => l.nosiStanje).length,
        redova: zalihaRedovi.length,
        vrijednost: zalihaRedovi.reduce((a, r) => a + r.vrijednost, 0),
        podskladista: sifrarnici.podskladista(s.sifra, SK).map((x: Bilo) => x.sifra),
        ispodSignalne: zalihe.stanjePoArtiklu(zalihaRedovi).filter((a: Bilo) => {
          const g = m.granice.granicaZa(a.artikl, s.sifra, G)
          if (!g) return false
          const pol = m.granice.polozaj(a.raspolozivoZaGranice, g)
          return pol === 'ISPOD_MINIMUMA' || pol === 'ISPOD_SIGNALNE'
        }).length,
        dokumenti,
        otvoreniDokumenti: dokumenti.filter((d) => !ZATVORENI.has(d.status)).length,
        mozePocetnoStanje: preprekePocetnog.length === 0,
        preprekePocetnogStanja: preprekePocetnog,
        pocetnoUToku:
          PS.find((x) => x.skladiste === s.sifra && (x.status === 'NACRT' || x.status === 'ODOBRENO'))?.id ?? null,
        preprekeDeaktivacije: pravila.preprekeDeaktivacijeSkladista(s.sifra, stanje),
      }
    })
    const sifrarniciIzvedeno: SifrarniciIzvedenoExport = {
      artikli: poId(A, (a): ArtiklPregled => {
        const prisutna = new Set(kartice[a.sifra].sva.map((k) => k.skladiste))
        return {
          raspolozivo: store.r3(stanje.filter((r) => r.artikl === a.sifra).reduce((sum, r) => sum + r.raspolozivo, 0)),
          imaPrometa: pravila.artiklImaPrometa(a.sifra),
          grupaNaziv: m.grupeMp.nazivGrupeArtikala(a.grupa),
          skladistaKartice: SK.filter((s) => prisutna.has(s.sifra)).map((s) => s.sifra as string),
          granice: G.filter((g) => g.artikl === a.sifra).map((g) => g.id as string),
          preprekeDeaktivacije: pravila.preprekeDeaktivacijeArtikla(a.sifra, stanje),
        }
      }),
      skladista: skladistaPregled,
      dobavljaci: poId(D, (d): DobavljacPregled => {
        const njegove: Bilo[] = pravila.prijemniceDobavljaca(d, P)
        return {
          prijemnica: njegove.length,
          vrijednost: njegove
            .filter((p) => p.status === 'PROKNJIZENO')
            .reduce((a, p) => a + (m.prijemnice.vrijednost(p) as number), 0),
          prijemnice: njegove.map((p) => p.id as string),
          preprekeBrisanja: pravila.preprekeBrisanjaDobavljaca(d.sifra),
          preprekeDeaktivacije: pravila.preprekeDeaktivacijeDobavljaca(d.sifra),
        }
      }),
      uloge: poId(U, (u): UlogaPregled => ({
        opisKontrolnihTacaka: administracija.opisKontrolnihTacaka(u.sifra),
        dodjela: DOD.filter((d) => d.uloga === u.sifra).length,
        preprekeBrisanja: administracija.preprekeBrisanjaUloge(u.sifra, DOD),
      })),
      dodjele: poId(DOD, (d): DodjelaPregled => ({
        status: administracija.statusDodjele(d),
        danaDoIsteka: administracija.danaDoIsteka(d),
        nazivUloge: administracija.nazivUloge(d.uloga),
        opisSkladista: administracija.opisSkladistaDodjele(d.skladiste),
        opisKontrolnihTacaka: administracija.opisKontrolnihTacaka(d.uloga),
      })),
      politike: poId(POL, (p) => ({ autorNacrta: administracija.autorNacrta(p) as string })),
    }

    // ─── outbox.json ───────────────────────────────────────────────────────
    const outbox: OutboxExport = (administracija.readOutbox() as Bilo[]).map((leg) => ({
      ...leg,
      status: administracija.statusLega(leg, INT),
      poruka: administracija.porukaLega(leg, INT),
    }))

    // ─── numeracija.json ───────────────────────────────────────────────────
    const aplikacija: string = m.numeracija.APLIKACIJA_SKLADISTA
    const postojeci: Record<string, Bilo[]> = {
      PRIJEMNICA: P,
      IZDATNICA: I,
      POVRATNICA: POV,
      PRENOSNICA: PR,
      OTPREMNICA: O,
      TREBOVANJE: Z,
      POPIS_ZALIHA: POP,
      KOREKCIJA_ZALIHA: K,
      OTPIS_ZALIHA: OT,
      POCETNO_STANJE_ZALIHA: PS,
    }
    const sljedeciBrojevi: Record<string, Bilo> = {}
    for (const [predmet, zapisi] of Object.entries(postojeci)) {
      sljedeciBrojevi[predmet] = m.numeracijaMp.predloziBroj(
        predmet,
        aplikacija,
        danasIso,
        zapisi.map((x) => x.broj),
      )
    }
    const sljedeceSifre: Record<string, Bilo> = {}
    for (const predmet of ['ARTIKAL', 'SKLADISTE', 'DOBAVLJAC']) {
      sljedeceSifre[predmet] = m.numeracija.predloziSifru(predmet)
    }
    const numeracijaExport: NumeracijaExport = {
      aplikacija,
      serije: SERIJE.filter((s) => s.aplikacija === aplikacija),
      brojaci: BROJACI,
      sljedeciBrojevi,
      sljedeceSifre,
    }

    // ─── naljepnice.json ───────────────────────────────────────────────────
    const serijePrijemnica: Record<string, Bilo[]> = {}
    for (const p of P) {
      const n: Bilo[] = m.naljepniceIspis.naljepniceSerijaPrijemnice(p)
      if (n.length > 0) serijePrijemnica[p.id] = n
    }
    const naljepniceExport: NaljepniceExport = {
      postavke: NAL,
      artikli: Object.fromEntries(A.map((a) => [a.sifra, m.naljepniceIspis.naljepnicaArtikla(a)])),
      lokacije: Object.fromEntries(L.map((l) => [l.id, m.naljepniceIspis.naljepnicaLokacije(l)])),
      serijePrijemnica,
    }

    // ─── korisnici.json, opcije.json, pojmovi.json, oznake.json ────────────
    const odgovorne = [...new Set(SK.map((s) => s.odgovorna as string))].sort().map((id) => {
      const z = m.hr.getZaposlenik(id)
      return { id, ime: (z?.ime as string) ?? '', prezime: (z?.prezime as string) ?? '' }
    })
    const korisnici: KorisniciExport = {
      osobe: sifrarnici.OSOBE as Record<string, Akter>,
      osobeZaDodjelu: administracija.osobeZaDodjelu(DOD),
      primaoci: sifrarnici.PRIMAOCI,
      odgovorne,
    }
    const opcije: OpcijeExport = {
      kandidatiPrimaoca: {
        PRODAJA: m.otpremnice.kandidatiPrimaoca('PRODAJA', D),
        POVRAT_DOBAVLJACU: m.otpremnice.kandidatiPrimaoca('POVRAT_DOBAVLJACU', D),
      },
      skladistaZaOtpremu: m.otpremnice.skladistaZaOtpremu(SK).map((s: Bilo) => s.sifra),
      glavnaSkladista: sifrarnici.glavnaSkladista(SK).map((s: Bilo) => s.sifra),
      lokacijeSkladista: Object.fromEntries(
        SK.map((s) => [s.sifra, sifrarnici.lokacijeSkladista(s.sifra, L).map((l: Bilo) => l.sifra)]),
      ),
      domeniUloga: administracija.domeniUloga(U),
      vrstePolitika: administracija.vrstePolitika(POL),
      nosilacTroskaOpcije: Object.fromEntries(
        (m.zahtjevi.NOSILAC_TROSKA_TIPOVI as Bilo[]).map((t) => [t.sifra, m.zahtjevi.nosilacTroskaOpcije(t.sifra)]),
      ),
    }
    const pojmovi: PojmoviExport = { POJMOVI: m.pojmovi.POJMOVI, NAPOMENE: m.pojmovi.NAPOMENE }
    const oznake: Record<string, Record<string, unknown>> = {}
    for (const ime of MODULI_OZNAKA) oznake[MODULI[ime]] = konstante(m[ime])

    const referiraneLokacije = new Set(SK.map((s) => s.radnaLokacija as string))
    const radneLokacije: Bilo[] = (m.radneLokacije.readLokacije() as Bilo[]).filter((l) => referiraneLokacije.has(l.sifra))
    const otvorenePotrebe: Bilo[] = m.zahtjevi.otvorenePotrebe(stanje, G, Z)

    // ─── naljepnice-primjeri.json — the previews of Postavke › Naljepnice ───
    // NaljepnicePage's `primjeri` (a SK-01 shelf, the first active item, a sample lot),
    // each as the preview page its frames show in every code kind.
    const artiklPrimjera: Bilo = A.find((a) => a.aktivan) ?? A[0]
    const lokacijaPrimjera: Bilo = L.find((l) => l.skladiste === 'SK-01' && String(l.sifra).includes('-')) ?? L[0]
    const primjeriNaljepnica: Bilo[] = [
      ...(lokacijaPrimjera ? [m.naljepniceIspis.naljepnicaLokacije(lokacijaPrimjera)] : []),
      ...(artiklPrimjera
        ? [
            m.naljepniceIspis.naljepnicaArtikla(artiklPrimjera),
            {
              kod: m.sken.kodSerije(artiklPrimjera.sifra, 'L-2609', '2027-05'),
              naslov: 'L-2609',
              redovi: [`${artiklPrimjera.sifra} · ${artiklPrimjera.naziv}`, 'rok 2027-05 · primjer lota'],
            },
          ]
        : []),
    ]
    const naljepnicePrimjeri = primjeriNaljepnica.map((n) => ({
      naljepnica: n,
      gustBarkod: m.naljepniceIspis.gustBarkod(n) as boolean,
      html: Object.fromEntries(
        (m.naljepniceIspis.VRSTE_KODA as string[]).map((v) => [v, m.naljepniceIspis.primjerNaljepnice(n, v) as string]),
      ),
    }))

    // ─── prilozi.json — Biblioteka attachments of the warehouse records ─────
    // Read last, after every other output is computed, so loading the library's
    // modules moves no other output's runtime ids.
    const prilozi = await priloziSkladista()
    // ─── prostorije.json — the rooms the warehouses stand in (Skladište › Prostorija) ─
    const prostorije = await prostorijeSkladista(SK.map((s) => s.prostorija as string | undefined))

    // ─── the files ─────────────────────────────────────────────────────────
    const brojKljuceva = (o: object): number => Object.keys(o).length
    const ukupnoPoVrsti = (o: Record<string, object>): number =>
      Object.values(o).reduce((n, x) => n + Object.keys(x).length, 0)
    const datoteke: Datoteka[] = [
      // Codebooks
      { ime: 'artikli.json', podaci: A, zapisa: A.length, izvor: 'maticni-podaci/artikli.ts · readArtikli() (re-exported by skladiste/sifrarnici.ts)', opis: 'Item catalogue (šifrarnik artikala).' },
      { ime: 'grupe-artikala.json', podaci: GRUPE, zapisa: GRUPE.length, izvor: 'maticni-podaci/grupe-artikala.ts · readGrupeArtikala()', opis: 'Item groups `Artikl.grupa` points at (GA-…).' },
      { ime: 'skladista.json', podaci: SK, zapisa: SK.length, izvor: 'skladiste/sifrarnici.ts · readSkladista()', opis: 'Warehouses (main + sub-warehouses).' },
      { ime: 'lokacije.json', podaci: L, zapisa: L.length, izvor: 'skladiste/sifrarnici.ts · readLokacije()', opis: 'Shelf / floor / system locations per warehouse.' },
      { ime: 'dobavljaci.json', podaci: D, zapisa: D.length, izvor: 'skladiste/sifrarnici.ts · readDobavljaci()', opis: 'Suppliers.' },
      { ime: 'kupci.json', podaci: sifrarnici.KUPCI, zapisa: sifrarnici.KUPCI.length, izvor: 'skladiste/sifrarnici.ts · KUPCI', opis: 'Customers dispatch notes go to (read-only list).' },
      { ime: 'radne-lokacije.json', podaci: radneLokacije, zapisa: radneLokacije.length, izvor: 'maticni-podaci/radne-lokacije.ts · readLokacije() (only those a warehouse names)', opis: 'Company locations the warehouses run at (address, town).' },
      { ime: 'granice.json', podaci: G, zapisa: G.length, izvor: 'skladiste/granice.ts · readGranice()', opis: 'Stock thresholds min / signalna / max per item × warehouse.' },
      // Documents
      { ime: 'prijemnice.json', podaci: P, zapisa: P.length, izvor: 'skladiste/prijemnice.ts · readPrijemnice()', opis: 'Goods receipts with lines, signatures, history, storno links.' },
      { ime: 'izdatnice.json', podaci: I, zapisa: I.length, izvor: 'skladiste/izdatnice.ts · readIzdatnice()', opis: 'Goods issues.' },
      { ime: 'povratnice.json', podaci: POV, zapisa: POV.length, izvor: 'skladiste/povratnice.ts · readPovratnice()', opis: 'Return notes (link `izvornaIzdatnica` → izdatnice id).' },
      { ime: 'zahtjevi.json', podaci: Z, zapisa: Z.length, izvor: 'skladiste/zahtjevi.ts · readZahtjevi()', opis: 'Requisitions (SA_ZALIHE = trebovanja) and purchase requests (ZA_NABAVKU).' },
      { ime: 'otpremnice.json', podaci: O, zapisa: O.length, izvor: 'skladiste/otpremnice.ts · readOtpremnice()', opis: 'Dispatch notes (sale / return to supplier).' },
      { ime: 'prenosnice.json', podaci: PR, zapisa: PR.length, izvor: 'skladiste/prenosnice.ts · readPrenosnice()', opis: 'Transfer notes (between / within warehouses).' },
      { ime: 'popisi.json', podaci: POP, zapisa: POP.length, izvor: 'skladiste/popisi.ts · readPopisi()', opis: 'Stock counts with their lines (`korekcijaId` → korekcije id).' },
      { ime: 'korekcije.json', podaci: K, zapisa: K.length, izvor: 'skladiste/korekcije.ts · readKorekcije()', opis: 'Stock corrections (`stornoOd` → korekcije id).' },
      { ime: 'otpisi.json', podaci: OT, zapisa: OT.length, izvor: 'skladiste/otpisi.ts · readOtpisi()', opis: 'Write-offs.' },
      { ime: 'pocetna-stanja.json', podaci: PS, zapisa: PS.length, izvor: 'skladiste/pocetna-stanja.ts · readPocetnaStanja()', opis: 'Opening balances (one per warehouse).' },
      { ime: 'rezervacije.json', podaci: R, zapisa: R.length, izvor: 'skladiste/rezervacije.ts · readRezervacije()', opis: 'Stock reservations (from approved requisitions and work orders).' },
      // Administration
      { ime: 'uloge.json', podaci: U, zapisa: U.length, izvor: 'skladiste/administracija.ts · readUloge()', opis: 'Role catalogue with control points.' },
      { ime: 'dodjele.json', podaci: DOD, zapisa: DOD.length, izvor: 'skladiste/administracija.ts · readDodjele()', opis: 'Role assignments (Korisnici i uloge): person × role × warehouse × period.' },
      { ime: 'korisnici.json', podaci: korisnici, zapisa: korisnici.osobeZaDodjelu.length, izvor: 'skladiste/sifrarnici.ts · OSOBE, PRIMAOCI; skladiste/administracija.ts · osobeZaDodjelu(); hr/store.ts · getZaposlenik()', opis: 'People of the demo warehouse (count = osobeZaDodjelu).' },
      { ime: 'politike.json', podaci: POL, zapisa: POL.length, izvor: 'skladiste/administracija.ts · readPolitike()', opis: 'Versioned policies.' },
      { ime: 'integracije.json', podaci: [INT], zapisa: 1, izvor: 'skladiste/administracija.ts · readIntegracija()', opis: 'The finance connection record (contract state, sent legs, history).' },
      { ime: 'outbox.json', podaci: outbox, zapisa: outbox.length, izvor: 'skladiste/administracija.ts · readOutbox() + statusLega() + porukaLega()', opis: 'Finance outbox: one GL leg per posted document, with its status.' },
      { ime: 'naljepnice.json', podaci: naljepniceExport, zapisa: NAL.length, izvor: 'skladiste/naljepnice-postavke.ts · postavkeNaljepnicaStore; skladiste/naljepnice-ispis.ts · naljepnicaArtikla(), naljepnicaLokacije(), naljepniceSerijaPrijemnice()', opis: 'Label settings (count = settings records) + the label content of every item, location and posted lot/serial.' },
      { ime: 'naljepnice-primjeri.json', podaci: naljepnicePrimjeri, zapisa: naljepnicePrimjeri.length, izvor: 'skladiste/naljepnice-ispis.ts · primjerNaljepnice(), gustBarkod(); `primjeri` of pages/skladiste/administracija/NaljepnicePage.tsx', opis: 'Postavke › Naljepnice: the sample labels (count = samples), each with its preview page per code kind (QR_BARKOD, QR, BARKOD) and whether its barcode is dense.' },
      { ime: 'numeracija.json', podaci: numeracijaExport, zapisa: numeracijaExport.serije.length, izvor: 'maticni-podaci/numeracija.ts · readSerijeBrojeva(), readBrojaciBrojeva(), predloziBroj(); skladiste/numeracija.ts · predloziSifru()', opis: 'Number series of application `skladiste` (count = series) + next number / code per kind as of the frozen day.' },
      // Derived views
      { ime: 'zalihe.json', podaci: zaliheExport, zapisa: stanje.length, izvor: 'skladiste/zalihe.ts · readStanje(), stanjePoArtiklu(); skladiste/granice.ts · granicaZa(), polozaj(); grupisiPoArtiklu of pages/skladiste/zalihe/StanjeZalihaPage.tsx', opis: 'Stock (count = position rows), per item × warehouse with threshold position, and the „Po artiklu" view.' },
      { ime: 'kartice.json', podaci: karticeExport, zapisa: brojKljuceva(karticeExport), izvor: 'skladiste/zalihe.ts · karticaArtikla(artikl, readKarticaIzvori(), skladiste?)', opis: 'Stock card of every item (count = items): all warehouses, and per warehouse it appears in.' },
      { ime: 'pocetna.json', podaci: pocetnaExport, zapisa: pocetnaExport.zadaci.length + pocetnaExport.nedavniDokumenti.length, izvor: 'skladiste/pocetna.ts · zadaci(), nedavniDokumenti(izvori, 7), pokazatelji(); tiles of pages/skladiste/SkladistePocetnaPage.tsx', opis: 'Dashboard: 4 tiles, „Čeka moju radnju" and „Nedavni dokumenti" (count = tasks + recent documents).' },
      { ime: 'izvjestaji.json', podaci: izvjestajiExport, zapisa: izvjestajiLista.length, izvor: 'skladiste/izvjestaji.ts · izvjestaj(kljuc, readIzvoriIzvjestaja(), filter)', opis: 'All 7 reports for every warehouse filter (sva + each) and, for period reports, every period (30/90/180) — count = report instances.' },
      { ime: 'sheme.json', podaci: shemeExport, zapisa: brojKljuceva(shemeExport), izvor: 'skladiste/shema.ts · shemaSkladista(), prometPoSedmicama(); useVizualSkladista of pages/skladiste/zajednicko/ShemaSkladista.tsx', opis: 'Floor plan, weekly in/out, fill rate and sub-warehouses per warehouse.' },
      { ime: 'otvorene-potrebe.json', podaci: otvorenePotrebe, zapisa: otvorenePotrebe.length, izvor: 'skladiste/zahtjevi.ts · otvorenePotrebe(stanje, granice, zahtjevi)', opis: 'Items below the signal threshold, and the open request covering each.' },
      { ime: 'dokumenti-izvedeno.json', podaci: dokumentiIzvedeno, zapisa: ukupnoPoVrsti(dokumentiIzvedeno as unknown as Record<string, object>), izvor: 'skladiste/{prijemnice,izdatnice,…}.ts derived helpers, skladiste/pocetna.ts *Red, skladiste/potpisi.ts, skladiste/storno.ts, skladiste/zalihe.ts provjeri*', opis: 'Per document (by kind, by id): list row, next step, waiting since, signature chain, value, flags, checks.' },
      { ime: 'sifrarnici-izvedeno.json', podaci: sifrarniciIzvedeno, zapisa: ukupnoPoVrsti(sifrarniciIzvedeno as unknown as Record<string, object>), izvor: 'skladiste/sifrarnici.ts, sifrarnici-pravila.ts, administracija.ts helpers; list/detail pages of pages/skladiste/sifrarnici', opis: 'Per codebook record: what its list and detail pages compute (addresses, totals, obstacles, statuses).' },
      { ime: 'opcije.json', podaci: opcije, zapisa: brojKljuceva(opcije), izvor: 'skladiste/otpremnice.ts · kandidatiPrimaoca(), skladistaZaOtpremu(); skladiste/sifrarnici.ts · glavnaSkladista(), lokacijeSkladista(); administracija.ts · domeniUloga(), vrstePolitika(); zahtjevi.ts · nosilacTroskaOpcije()', opis: 'Option lists the forms offer.' },
      { ime: 'pojmovi.json', podaci: pojmovi, zapisa: brojKljuceva(pojmovi.POJMOVI) + brojKljuceva(pojmovi.NAPOMENE), izvor: 'skladiste/pojmovi.ts · POJMOVI, NAPOMENE', opis: 'Glossary and recurring notes the screens print.' },
      { ime: 'oznake.json', podaci: oznake, zapisa: ukupnoPoVrsti(oznake), izvor: 'every plain export of the modules listed inside (labels, tones, enums, option lists)', opis: 'Status labels / tones / descriptions and other constants, per cicak module.' },
      { ime: 'protokol-zapisi.json', podaci: m.records.SKLADISTE_RECORDS, zapisa: m.records.SKLADISTE_RECORDS.length, izvor: 'skladiste/records.ts · SKLADISTE_RECORDS', opis: 'Skladište rows as Protokol may copy them into an act.' },
      { ime: 'prilozi.json', podaci: prilozi, zapisa: ukupnoPoVrsti(prilozi as unknown as Record<string, object>), izvor: 'biblioteka/store.ts · useBiblioteka() filtered as useDokumentiZapisa(\'skladiste\', oznaka); biblioteka/sifrarnici.ts · STATUSI, datumVrijeme(); line of pages/biblioteka/PriloziBiblioteke.tsx', opis: 'Biblioteka documents linked to each warehouse record („Dokumenti i fotografije“ on Prijemnica / Artikl), by the record\'s number (count = links).' },
      { ime: 'prostorije.json', podaci: prostorije, zapisa: prostorije.length, izvor: 'maticni-podaci/prostorije.ts · readProstorije() (only those a warehouse names), nazivProstorije()', opis: 'Rooms the warehouses stand in (`Skladiste.prostorija` → name), as the warehouse page prints „naziv · PRS-…“.' },
    ]

    const meta: ExportMeta = {
      zamrznutoVrijeme: ZAMRZNUTO_VRIJEME,
      zamrznutoUtc: new Date().toISOString(),
      vremenskaZona: VREMENSKA_ZONA,
      danas: danasIso,
      izvor: 'divetiq-cicak/src (Skladište demo seed)',
      datoteke: datoteke.map((d) => ({ datoteka: d.ime, zapisa: d.zapisa })),
    }

    // ─── write ─────────────────────────────────────────────────────────────
    mkdirSync(IZLAZ, { recursive: true })
    for (const f of readdirSync(IZLAZ)) {
      if (f.endsWith('.json') || f === 'README.md') rmSync(join(IZLAZ, f))
    }
    for (const d of datoteke) writeFileSync(join(IZLAZ, d.ime), json(d.podaci))
    writeFileSync(join(IZLAZ, 'meta.json'), json(meta))
    writeFileSync(join(IZLAZ, 'README.md'), readme(datoteke, meta))

    vi.useRealTimers()
  },
  600_000,
)

/** StanjeZalihaPage's `grupisiPoArtiklu` (page-local in cicak), over every stock row. */
function grupisiPoArtiklu(
  redovi: readonly StanjeRed[],
  r2: (n: number) => number,
  r3: (n: number) => number,
): ZbirArtikla[] {
  const mapa = new Map<
    string,
    {
      naStanju: number
      blokirano: number
      rezervisano: number
      raspolozivo: number
      vrijednost: number
      privremeno: boolean
      pozicija: number
      poSkladistu: Map<string, number>
    }
  >()
  for (const r of redovi) {
    const g = mapa.get(r.artikl) ?? {
      naStanju: 0,
      blokirano: 0,
      rezervisano: 0,
      raspolozivo: 0,
      vrijednost: 0,
      privremeno: false,
      pozicija: 0,
      poSkladistu: new Map<string, number>(),
    }
    if (!r.bezStanja) {
      g.naStanju += r.naStanju
      g.poSkladistu.set(r.skladiste, (g.poSkladistu.get(r.skladiste) ?? 0) + r.naStanju)
    }
    g.blokirano += r.blokirano
    g.rezervisano += r.rezervisano
    g.raspolozivo += r.raspolozivo
    g.vrijednost += r.vrijednost
    g.privremeno = g.privremeno || r.privremeno
    g.pozicija += 1
    mapa.set(r.artikl, g)
  }
  return [...mapa.entries()]
    .map(([artikl, g]) => ({
      artikl,
      naStanju: r3(g.naStanju),
      blokirano: r3(g.blokirano),
      rezervisano: r3(g.rezervisano),
      raspolozivo: r3(g.raspolozivo),
      vrijednost: r2(g.vrijednost),
      privremeno: g.privremeno,
      pozicija: g.pozicija,
      poSkladistu: [...g.poSkladistu.entries()]
        .map(([skladiste, naStanju]) => ({ skladiste, naStanju: r3(naStanju) }))
        .sort((a, b) => a.skladiste.localeCompare(b.skladiste)),
    }))
    .sort((a, b) => a.artikl.localeCompare(b.artikl))
}

function readme(datoteke: readonly Datoteka[], meta: ExportMeta): string {
  const redovi = datoteke.map((d) => `| \`${d.ime}\` | ${d.zapisa} | ${d.izvor} | ${d.opis} |`)
  return `# Skladište — demo data (exported from divetiq-cicak)

Generated by \`scripts/export-skladiste.test.ts\` — do not edit by hand; re-run the export instead.

- **Frozen clock:** \`${meta.zamrznutoVrijeme}\` (${meta.vremenskaZona}) = \`${meta.zamrznutoUtc}\` UTC — "today" is **${meta.danas}**.
  Every relative seed date (\`prijeDana\`, \`prijeSati\`, \`isoDatum\` in \`skladiste/store.ts\`), the dashboard, report periods and ages are computed against it.
  To move it, change \`ZAMRZNUTO_VRIJEME\` in the script and re-run.
- **Source:** \`divetiq-cicak/src\` — sources below are relative to it. Records keep the order their store holds them; every field is kept (lines, signatures, history, notes, storno links).
- **Types:** \`app/lib/skladiste/types.ts\`.
- **Run:**

  \`\`\`sh
  cd ../divetiq-cicak
  node_modules/.bin/vitest run --config ../divetiq-edvin/scripts/vitest.export-skladiste.config.mjs
  \`\`\`

| File | Records | Source (module · export) | What |
| --- | ---: | --- | --- |
${redovi.join('\n')}
| \`meta.json\` | ${meta.datoteke.length} | — | Frozen clock and the file list with counts. |

## Notes

- Stock (\`zalihe.json\`) is never stored in cicak: it is derived from the posted documents, exactly as \`readStanje()\` derives it.
- Sums the pages build inline (warehouse value, sub-warehouse value, shema values) are kept unrounded, as cicak computes them; the screens format them with \`km()\` (2 decimals).
- History ids (\`h-<base36 time>-<n>\`) and other runtime ids come from \`novId()\`; with the clock frozen and the stores read in a fixed order they are the same on every run, but they differ from the ids a live browser session generates (time of first load, page order). They are React keys only — never shown.
- Comparing with the live demo: cicak keeps each store in the browser's localStorage from the first visit, so a browser that opened the demo on an earlier day still shows dates relative to that day. Clear the demo's site data (or use a private window) to get a fresh seed; even then hour-based seeds (\`prijeSati\`) and "waiting since" texts follow the hour the page is loaded, not 08:00.
- \`dokumenti-izvedeno.json\` checks (\`provjere\`, \`preprekeStorna\`) are only computed where the screen would offer that action (open drafts / storno-able documents); elsewhere they are \`null\`.
`
}

/**
 * `prilozi.json`: what cicak's `PriloziBiblioteke` card lists for each warehouse
 * record — `useDokumentiZapisa('skladiste', oznaka)`, i.e. every Biblioteka document
 * (the library's own, the adapters' and the generated year) with a `skladiste` link
 * to that record, newest first — read through the real `useBiblioteka()` hook. Keyed
 * by the link's `oznaka` (a receipt's broj, an item's šifra).
 */
async function priloziSkladista(): Promise<PriloziExport> {
  const { renderHook } = (await import(
    /* @vite-ignore */ `${CICAK}/node_modules/@testing-library/react/dist/@testing-library/react.esm.js`
  )) as Modul
  const biblioteka = (await import(/* @vite-ignore */ `${SRC}biblioteka/store.ts`)) as Modul
  const bibSifrarnici = (await import(/* @vite-ignore */ `${SRC}biblioteka/sifrarnici.ts`)) as Modul
  const STATUSI: Record<string, string> = bibSifrarnici.STATUSI
  const datumVrijeme: (iso: string) => string = bibSifrarnici.datumVrijeme

  const pogled = renderHook(() => biblioteka.useBiblioteka())
  const svi: Bilo[] = pogled.result.current
  pogled.unmount()

  const r: Record<string, PrilogBiblioteke[]> = {}
  for (const d of svi) {
    const oznake = new Set<string>(
      (d.veze as Bilo[]).filter((v) => v.modul === 'skladiste').map((v) => v.oznaka as string),
    )
    for (const oznaka of oznake) {
      ;(r[oznaka] ??= []).push({
        id: d.id,
        naziv: d.naziv,
        vrsta: d.vrsta,
        format: d.format as FormatPriloga,
        status: d.status,
        statusNaziv: STATUSI[d.status],
        kreirano: d.kreirano,
        verzija: d.verzije.length,
        kontekst: d.kontekst,
        autor: { ime: d.autor.ime, uloga: d.autor.uloga },
        // `putanjaDokumenta` of pages/biblioteka/pomocnici.ts.
        putanja: `/upravljanje-dokumentima/dokument/${encodeURIComponent(d.id)}`,
        // The card's line: PriloziBiblioteke.tsx.
        linija: `${datumVrijeme(d.kreirano).slice(0, 11)} · ${STATUSI[d.status].toLowerCase()} · v${d.verzije.length}`,
      })
    }
  }
  return Object.fromEntries(Object.keys(r).sort().map((k) => [k, r[k]]))
}

/**
 * `prostorije.json`: the rooms the warehouses name (`Skladiste.prostorija`), from
 * Matični podaci — the warehouse page prints `nazivProstorije(id) · id`. Loaded last,
 * after every other output, like the attachments.
 */
async function prostorijeSkladista(ids: readonly (string | undefined)[]): Promise<Bilo[]> {
  const prostorijeMp = (await import(/* @vite-ignore */ `${SRC}maticni-podaci/prostorije.ts`)) as Modul
  const trazene = new Set(ids.filter((id): id is string => !!id))
  return (prostorijeMp.readProstorije() as Bilo[]).filter((x) => trazene.has(x.id))
}
