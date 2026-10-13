/**
 * Shapes of the Skladište (warehouse) demo data exported from divetiq-cicak into
 * `app/data/skladiste/*.json` by `scripts/export-skladiste.test.ts`.
 *
 * Part 1 is copied from cicak's own interfaces (field names exact; doc comments
 * shortened). The source module is named above each group, relative to
 * `divetiq-cicak/src/`. Part 2 describes the export files themselves — the
 * derived views (stock, dashboard, reports, per-document flags) the screens
 * compute from the stores.
 */

// ═══ Part 1 — cicak's entities ══════════════════════════════════════════════

// ─── ui/status-badge.tsx ─────────────────────────────────────────────────────

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

// ─── skladiste/store.ts ──────────────────────────────────────────────────────

/** A person's signature on a document step. */
export interface Potpis {
  readonly ko: string
  readonly uloga: string
  /** ISO timestamp. */
  readonly kad: string
}

/** One line of a document's history (newest first in the document). */
export interface HistorijaUnos {
  readonly id: string
  /** ISO timestamp. */
  readonly kad: string
  readonly ko: string
  readonly radnja: string
  readonly napomena: string
}

/** The signed-in user acting on a document. */
export interface Akter {
  readonly ime: string
  readonly uloga: string
}

// ─── skladiste/storno.ts ─────────────────────────────────────────────────────

/** The storno fields every reversible document kind carries (all optional: older rows have none). */
export interface StornoPolja {
  /** On a storno: the number of the document it reverses. */
  readonly stornoOd?: string
  /** On a storno: why it was made. */
  readonly razlogStorna?: string
  /** On a reversed document: the number of its storno. */
  readonly storniranBrojem?: string
}

/** `stornoOznaka()` — how a list row names a storno pair. */
export interface StornoOznaka {
  readonly status: string
  readonly detalj: string
}

// ─── skladiste/sifrarnici-pravila.ts ─────────────────────────────────────────

/** An obstacle, as a sentence and what to do about it. */
export interface Prepreka {
  readonly razlog: string
  readonly rjesenje: string
  /** A screen that resolves it, when there is one. */
  readonly path?: string
}

// ─── skladiste/sifrarnici.ts ─────────────────────────────────────────────────

export interface Skladiste {
  /** `= sifra`. */
  readonly id: string
  readonly sifra: string
  readonly naziv: string
  readonly vrsta: 'GLAVNO' | 'PODSKLADISTE'
  /** Whether the warehouse tracks stock per location. */
  readonly lokacije: boolean
  /** The company location it runs at (HR `RadnaLokacija.sifra`, e.g. `SA-SKL`). */
  readonly radnaLokacija: string
  /** The room it stands in — Matični podaci `Prostorija.id`. */
  readonly prostorija?: string
  /** The responsible person — an HR employee id (`zap-NNN`). */
  readonly odgovorna: string
  readonly opis: string
  /** The main warehouse a sub-warehouse belongs to; `null` for a main one. */
  readonly nadredjeno: string | null
  readonly aktivno: boolean
}

export type VrstaLokacije = 'POLICA' | 'POD' | 'KARANTIN' | 'CUSTODY'

export interface Lokacija {
  /** `skladiste/sifra`. */
  readonly id: string
  readonly sifra: string
  readonly skladiste: string
  readonly zona: string
  readonly vrsta: VrstaLokacije
  /** Goods on a location without stock are held, never available for issue. */
  readonly nosiStanje: boolean
  readonly aktivna: boolean
}

export interface Dobavljac {
  /** `= sifra`. */
  readonly id: string
  readonly sifra: string
  /** Receipts point at the supplier by this name. */
  readonly naziv: string
  readonly pdvBroj: string
  readonly adresa: string
  readonly kontakt: string
  readonly email: string
  readonly telefon: string
  /** The open contract or order the receipt is based on. */
  readonly osnov: string
  readonly aktivan: boolean
}

/** A customer our dispatch notes go to (`KUPCI`, read-only). */
export interface Partner {
  /** `= sifra`. */
  readonly id: string
  readonly sifra: string
  readonly naziv: string
  readonly adresa: string
  readonly pdvBroj: string
  readonly kontakt: string
}

export type VrstaUlaza = 'KUPOVINA' | 'POCETNO_STANJE' | 'POVRAT_KUPCA' | 'DRUGI_OSNOV'

// ─── maticni-podaci/artikli.ts (re-exported by skladiste/sifrarnici.ts) ──────

export type Pracenje = 'BEZ' | 'LOT' | 'LOT_ROK' | 'SERIJSKI'

export interface Artikl {
  /** `= sifra`. */
  readonly id: string
  readonly sifra: string
  readonly naziv: string
  /** Unit of measure — locked after the first stock movement. */
  readonly jm: string
  /** The group it is filed under — a `GrupaArtikala.id` (`GA-007`). */
  readonly grupa: string
  readonly pracenje: Pracenje
  /** Accounting profile the item posts to. */
  readonly profil: string
  readonly barkod: string
  /** Unit price from the contract or order (KM). */
  readonly cijena: number
  /** Default storage location in the main warehouse (SK-01). */
  readonly lokacija: string
  /** Technically equal items of other makers. */
  readonly grupaZamjene?: string
  readonly aktivan: boolean
}

// ─── maticni-podaci/grupe-artikala.ts ────────────────────────────────────────

export interface GrupaArtikala {
  /** `GA-001` — what items carry; never changes. */
  readonly id: string
  /** `07` for a top-level group, `07.01` below it. */
  readonly sifra: string
  readonly naziv: string
  /** The parent group's id; `null` for a top-level group. */
  readonly nadredjena: string | null
  /** The accounting profile a new item of the group starts with. */
  readonly profil: string
  readonly aktivna: boolean
  readonly napomena: string
}

// ─── maticni-podaci/radne-lokacije.ts ────────────────────────────────────────

export interface RadnaLokacija {
  readonly sifra: string
  readonly nazivBs: string
  /** Šifra of the location type. */
  readonly tip: string
  readonly adresa: string
  readonly grad: string
  readonly lat?: number
  readonly lon?: number
  readonly nadredjenaLokacija?: string
  readonly aktivna: boolean
}

// ─── skladiste/granice.ts ────────────────────────────────────────────────────

export interface Granica {
  readonly id: string
  readonly artikl: string
  readonly skladiste: string
  readonly min: number
  readonly signalna: number
  readonly max: number
  /** `yyyy-mm-dd`. */
  readonly vaziOd: string
  readonly verzija: number
  readonly postavio: string
}

export type PolozajGranice = 'ISPOD_MINIMUMA' | 'ISPOD_SIGNALNE' | 'NA_SIGNALNOJ' | 'OK' | 'IZNAD_MAKSIMUMA'

// ─── skladiste/prijemnice.ts ─────────────────────────────────────────────────

export type PrijemnicaStatus =
  | 'NACRT'
  | 'FIZICKI_PRIMLJENO'
  | 'CEKA_KVALITATIVNU'
  | 'U_KARANTINU'
  | 'CEKA_EVIDENCIJU'
  | 'DJELIMICNO_PROKNJIZENO'
  | 'PROKNJIZENO'
  | 'ODBIJENO'
  | 'OTKAZANO'

/** The list's status chips group the flow states. */
export type StatusGrupa = 'NACRT' | 'U_TOKU' | 'PROKNJIZENO' | 'OTKAZANO'

export interface PrijemnicaStavka {
  readonly id: string
  readonly artikl: string
  readonly isporuceno: number
  readonly prihvaceno: number
  readonly odbijeno: number
  readonly karantin: number
  /** Already posted to stock (never above `prihvaceno`). */
  readonly evidentirano: number
  readonly lot: string
  /** `yyyy-mm-dd` or `''`. */
  readonly rokTrajanja: string
  readonly serijskiBrojevi: string
  readonly lokacija: string
  /** Provisional unit price (KM), from the order or the contract. */
  readonly cijena: number
  readonly osnovCijene: string
  /** The recognised invoice price (KM), once accounting confirmed it. */
  readonly konacnaCijena: number | null
}

export interface Prijemnica extends StornoPolja {
  readonly id: string
  readonly broj: string
  /** `yyyy-mm-dd`. */
  readonly datumPrijema: string
  readonly skladiste: string
  readonly vrstaUlaza: VrstaUlaza
  /** Supplier name; `''` for an opening balance or another approved basis. */
  readonly dobavljac: string
  /** Order or contract number, or the approving act. */
  readonly osnov: string
  readonly otpremnica: string
  readonly napomena: string
  readonly status: PrijemnicaStatus
  readonly razlogZatvaranja: string
  /** The recorded quantity discrepancy, `''` when the count matched. */
  readonly odstupanje: string
  /** Supplier invoice the prices were recognised against, `''` until then. */
  readonly faktura: string
  /** Business date of the last posting, `''` until posted. */
  readonly poslovniDatum: string
  readonly pripremio: Potpis | null
  readonly kolicinskiProvjerio: Potpis | null
  readonly kvalitativnoPrihvatio: Potpis | null
  readonly proknjizio: Potpis | null
  readonly cijenuPriznao: Potpis | null
  readonly stavke: readonly PrijemnicaStavka[]
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

export interface KontrolaZbira {
  readonly isporuceno: number
  readonly prihvaceno: number
  readonly odbijeno: number
  readonly karantin: number
  readonly uskladjeno: boolean
}

// ─── skladiste/izdatnice.ts ──────────────────────────────────────────────────

export type IzdatnicaStatus =
  | 'PRIPREMLJENA'
  | 'OVJERENA'
  | 'KNJIZEN_CEKA_PREDAJU'
  | 'DJELIMICNO_PREDATA'
  | 'PREDATA'
  | 'OTKAZANA'

export type IzvorAutorizacije = 'RADNI_NALOG' | 'ODOBRENI_ZAHTJEV' | 'DISTRIBUCIJA_OJ'

export type Dispozicija = 'UTROSAK' | 'REVERS'

export interface IzdatnicaStavka {
  readonly id: string
  readonly artikl: string
  readonly lokacija: string
  readonly lot: string
  readonly serijskiBrojevi: string
  readonly kolicina: number
  /** The part taken from the reservation of this document's source. */
  readonly rezervisano: number
  /** The part taken from free available stock. */
  readonly slobodno: number
  /** Handed over to the recipient so far. */
  readonly predano: number
  /** Unit value (KM) assigned at posting; 0 until then. */
  readonly cijena: number
  readonly napomena: string
}

export interface Izdatnica extends StornoPolja {
  readonly id: string
  readonly broj: string
  /** Business date of the issue, `yyyy-mm-dd`. */
  readonly materijalniDatum: string
  readonly skladiste: string
  readonly izvorTip: IzvorAutorizacije
  /** The source document (`RN-…`, `ZZN-…`) or the receiving unit. */
  readonly izvorBroj: string
  readonly primalac: string
  readonly dispozicija: Dispozicija
  readonly napomena: string
  readonly status: IzdatnicaStatus
  readonly razlogZatvaranja: string
  readonly pripremio: Potpis | null
  readonly ovjerio: Potpis | null
  readonly proknjizio: Potpis | null
  /** The last handover (predaja) signatures. */
  readonly predao: Potpis | null
  readonly primio: Potpis | null
  readonly stavke: readonly IzdatnicaStavka[]
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

// ─── skladiste/povratnice.ts ─────────────────────────────────────────────────

export type PovratnicaStatus =
  | 'PRIPREMLJENA'
  | 'OVJERENA'
  | 'FIZICKI_PRIMLJENA'
  | 'PREGLEDANA'
  | 'KNJIZEN'
  | 'OTKAZANA'

export type TipPovrata = 'NEUTROSENO' | 'VISAK' | 'OPREMA_REVERS'

export type StanjeMaterijala = 'DOBRO' | 'OSTECENO_UPOTREBLJIVO' | 'NEUPOTREBLJIVO'

export interface PovratnicaStavka {
  readonly id: string
  /** The issue-note line this return comes from. */
  readonly izdatnicaStavkaId: string
  readonly artikl: string
  readonly lot: string
  readonly serijskiBrojevi: string
  /** Quantity the returner reported. */
  readonly prijavljeno: number
  /** Counted on physical receipt; `null` until then. */
  readonly prebrojano: number | null
  readonly prihvaceno: number
  readonly vracenoNazad: number
  readonly otpisano: number
  readonly stanje: StanjeMaterijala | null
  /** Where the accepted quantity goes on stock. */
  readonly odredisnaLokacija: string
  /** Unit value (KM) = the price of the source issue-note line. */
  readonly cijena: number
  readonly napomena: string
}

export interface Povratnica extends StornoPolja {
  readonly id: string
  readonly broj: string
  /** `yyyy-mm-dd`. */
  readonly datum: string
  readonly skladiste: string
  /** The source issue note's id. */
  readonly izvornaIzdatnica: string
  readonly tipPovrata: TipPovrata
  readonly vratio: string
  /** The source work order was already closed when the goods came back. */
  readonly naknadniPovrat: boolean
  readonly napomena: string
  readonly status: PovratnicaStatus
  readonly razlogZatvaranja: string
  readonly custodyLokacija: string
  readonly pripremio: Potpis | null
  readonly ovjerio: Potpis | null
  readonly primio: Potpis | null
  readonly pregledao: Potpis | null
  readonly proknjizio: Potpis | null
  readonly stavke: readonly PovratnicaStavka[]
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

export interface ZbirPovrata {
  readonly primljeno: number
  readonly prihvaceno: number
  readonly vracenoNazad: number
  readonly otpisano: number
  readonly preostalo: number
}

// ─── skladiste/zahtjevi.ts ───────────────────────────────────────────────────

export type ZahtjevStatus = 'NACRT' | 'POSLANO' | 'OVJERENO' | 'ODOBRENO' | 'U_NABAVCI' | 'ZAVRSENO'

export type VrstaPotrebe = 'SA_ZALIHE' | 'ZA_NABAVKU'

export type Prioritet = 'NIZAK' | 'NORMALAN' | 'VISOK'

export type OdlukaStavke = 'CEKA' | 'ODOBRENO' | 'ODBIJENO' | 'OTKAZANO'

/** Why the line is needed — a controlled reason. */
export type IzvorPotrebeVrsta = 'RADNI_NALOG' | 'ISPOD_SIGNALNE' | 'KVAR' | 'PLAN' | 'OSTALO'

/** Who pays — a cost carrier. */
export type NosilacTroskaTip = 'ODJEL' | 'OBJEKAT' | 'PROJEKAT'

export interface ZahtjevStavka {
  readonly id: string
  readonly artikl: string
  /** `null` for a proposal whose quantity is still to be decided. */
  readonly trazeno: number | null
  readonly odobreno: number | null
  readonly odluka: OdlukaStavke
  readonly razlog: string
  readonly izvorVrsta: IzvorPotrebeVrsta
  /** A short detail for the source; '' when none is asked for. */
  readonly izvorDetalj: string
  /** `''` for a proposal nobody has assigned a cost carrier to yet. */
  readonly nosilacTroskaTip: NosilacTroskaTip | ''
  readonly nosilacTroskaId: string
  readonly naruceno: number
  readonly primljeno: number
}

export interface Zahtjev {
  readonly id: string
  readonly broj: string
  readonly skladiste: string
  readonly vrsta: VrstaPotrebe
  readonly prioritet: Prioritet
  readonly trazilac: string
  readonly obrazlozenje: string
  /** `yyyy-mm-dd`, `''` while a draft. */
  readonly poslano: string
  /** The procurement order raised for an approved purchase request, `''` until forwarded. */
  readonly narudzba: string
  readonly status: ZahtjevStatus
  readonly ovjerio: Potpis | null
  readonly stavke: readonly ZahtjevStavka[]
  readonly historija: readonly HistorijaUnos[]
}

/** `otvorenePotrebe()` — items below the signal threshold. */
export interface OtvorenaPotreba {
  readonly artikl: string
  readonly skladiste: string
  readonly raspolozivo: number
  readonly granica: Granica
  readonly polozaj: PolozajGranice
  /** The open request that already covers this item, if any. */
  readonly uZahtjevu: Zahtjev | null
}

// ─── skladiste/otpremnice.ts ─────────────────────────────────────────────────

export type VrstaOtpremnice = 'PRODAJA' | 'POVRAT_DOBAVLJACU'

export type OtpremnicaStatus = 'PRIPREMLJENA' | 'OVJERENA' | 'OTPREMLJENA' | 'ISPORUCENA' | 'OTKAZANA'

export interface OtpremnicaStavka {
  readonly id: string
  readonly artikl: string
  readonly lokacija: string
  readonly lot: string
  readonly serijskiBrojevi: string
  readonly kolicina: number
  /** Unit stock value (KM) copied from the item at dispatch; 0 until then. */
  readonly cijena: number
  readonly napomena: string
}

export interface Otpremnica {
  readonly id: string
  readonly broj: string
  /** Planned dispatch date, `yyyy-mm-dd`. */
  readonly datum: string
  readonly skladiste: string
  readonly vrsta: VrstaOtpremnice
  /** The receiving party, by name. */
  readonly primalac: string
  /** `KUP-…` for a sale, `DOB-…` for a return to the supplier. */
  readonly primalacSifra: string
  readonly adresaIsporuke: string
  /** The customer order (`NRK-…`) or the complaint (`REK-…`). */
  readonly osnov: string
  /** `''` until dispatch. */
  readonly prijevoznik: string
  readonly vozac: string
  /** The outgoing invoice; `''` until delivery is confirmed. */
  readonly faktura: string
  readonly napomena: string
  readonly status: OtpremnicaStatus
  readonly razlogZatvaranja: string
  /** Actual dispatch date, `yyyy-mm-dd`; `''` until dispatch. */
  readonly datumOtpreme: string
  /** `yyyy-mm-dd`; `''` until delivery is confirmed. */
  readonly datumIsporuke: string
  readonly pripremio: Potpis | null
  readonly ovjerio: Potpis | null
  readonly otpremio: Potpis | null
  /** The receiving party's signature. */
  readonly isporukuPotvrdio: Potpis | null
  readonly stavke: readonly OtpremnicaStavka[]
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

/** `kandidatiPrimaoca()` — who a delivery note of a kind may be addressed to. */
export interface KandidatPrimaoca {
  readonly sifra: string
  readonly naziv: string
  readonly adresa: string
}

// ─── skladiste/prenosnice.ts ─────────────────────────────────────────────────

export type PrenosnicaStatus = 'PRIPREMLJENA' | 'OVJERENA' | 'U_TRANZITU' | 'PRENESENA' | 'OTKAZANA'

export interface PrenosnicaStavka {
  readonly id: string
  readonly artikl: string
  readonly lot: string
  readonly serijskiBrojevi: string
  /** Quantity sent from the source row. */
  readonly kolicina: number
  /** Location in the source warehouse (`''` when it tracks none). */
  readonly izvornaLokacija: string
  /** Location in the target warehouse (`''` when it tracks none). */
  readonly ciljnaLokacija: string
  /** Counted at receipt; 0 until then. */
  readonly primljeno: number
  /** Unit value (KM), copied at dispatch; 0 until then. */
  readonly cijena: number
  readonly napomena: string
}

export interface Prenosnica {
  readonly id: string
  readonly broj: string
  /** Business date of the transfer, `yyyy-mm-dd`. */
  readonly datum: string
  readonly izvornoSkladiste: string
  /** `= izvornoSkladiste` for a move between locations of one warehouse. */
  readonly ciljnoSkladiste: string
  readonly razlog: string
  readonly napomena: string
  readonly status: PrenosnicaStatus
  readonly razlogZatvaranja: string
  /** `''` until dispatch. */
  readonly datumOtpreme: string
  /** `''` until receipt. */
  readonly datumPrijema: string
  readonly pripremio: Potpis | null
  /** Only a transfer between warehouses has one. */
  readonly ovjerio: Potpis | null
  readonly otpremio: Potpis | null
  readonly primio: Potpis | null
  readonly stavke: readonly PrenosnicaStavka[]
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

export interface GubitakUTranzitu {
  readonly kolicina: number
  readonly vrijednost: number
}

// ─── skladiste/popisi.ts ─────────────────────────────────────────────────────

export type PopisStatus = 'PLANIRAN' | 'U_TOKU' | 'BROJANJE_ZATVORENO' | 'PROKNJIZEN' | 'OTKAZAN'

export type VrstaPopisa = 'REDOVNI' | 'VANREDNI'

/** What the count covers: the whole warehouse, a set of its locations, or one item group. */
export type ObuhvatPopisa =
  | { readonly tip: 'CIJELO' }
  | { readonly tip: 'LOKACIJE'; readonly lokacije: readonly string[] }
  | { readonly tip: 'GRUPA'; readonly grupa: string }

export interface PopisnaStavka {
  readonly id: string
  readonly artikl: string
  /** `''` in a warehouse without locations. */
  readonly lokacija: string
  readonly lot: string
  /** Book quantity — the stock row's `naStanju` the moment counting started. */
  readonly knjigovodstveno: number
  /** What the commission counted; `null` until the row is counted. */
  readonly prebrojano: number | null
  /** Found on the shelf but absent from the book. */
  readonly nalaz: boolean
  readonly napomena: string
  /** The correction that posted this row's difference; `''` until posted. */
  readonly korekcijaId: string
}

export interface Popis {
  readonly id: string
  readonly broj: string
  /** Cutoff date of the count, `yyyy-mm-dd`. */
  readonly datum: string
  readonly skladiste: string
  readonly vrsta: VrstaPopisa
  readonly obuhvat: ObuhvatPopisa
  /** At least two names; the first is the predsjednik. */
  readonly komisija: readonly string[]
  readonly razlog: string
  readonly napomena: string
  /** Whether the commission counts blind. */
  readonly slijepo: boolean
  readonly status: PopisStatus
  readonly razlogZatvaranja: string
  readonly otvorio: Potpis | null
  readonly zatvorioBrojanje: Potpis | null
  readonly proknjizio: Potpis | null
  readonly stavke: readonly PopisnaStavka[]
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

export interface ZbirPopisa {
  readonly stavki: number
  readonly prebrojano: number
  readonly manjak: number
  readonly visak: number
  readonly razlikaKolicina: number
  /** Σ razlika × the item's stock price (KM), signed. */
  readonly razlikaVrijednost: number
}

// ─── skladiste/korekcije.ts ──────────────────────────────────────────────────

export type UzrokKorekcije = 'OSTECENJE' | 'MANJAK' | 'PRONADJENO' | 'ISTEK_ROKA' | 'GRESKA_POPISA' | 'OSTALO'

export interface Korekcija {
  readonly id: string
  readonly broj: string
  /** Business date, `yyyy-mm-dd`. */
  readonly datum: string
  readonly skladiste: string
  /** `''` in a warehouse without locations. */
  readonly lokacija: string
  readonly artikl: string
  readonly lot: string
  /** Signed, never 0. */
  readonly kolicina: number
  readonly uzrok: UzrokKorekcije
  readonly razlog: string
  /** `''`, the count / transfer number it comes from, or on a storno the correction it reverses. */
  readonly izvor: string
  readonly proknjizio: Potpis
  /** kolicina × the item's stock price at posting (KM), signed. */
  readonly vrijednost: number
  /** Reversed by a later storno. */
  readonly stornirana: boolean
  /** Id of the correction this one reverses; `''` otherwise. */
  readonly stornoOd: string
}

// ─── skladiste/otpisi.ts ─────────────────────────────────────────────────────

export type OtpisStatus = 'PRIPREMLJEN' | 'ODOBREN' | 'PROKNJIZEN' | 'OTKAZAN'

export type RazlogOtpisa = 'ISTEK_ROKA' | 'OSTECENJE' | 'NEUPOTREBLJIVO' | 'ZASTARJELO'

export interface OtpisStavka {
  readonly id: string
  readonly artikl: string
  readonly lokacija: string
  readonly lot: string
  readonly kolicina: number
  /** Unit stock price (KM) copied at posting; 0 until then. */
  readonly cijena: number
  readonly napomena: string
}

export interface Otpis {
  readonly id: string
  readonly broj: string
  /** Business date of the posting; the draft's date until then. */
  readonly datum: string
  readonly skladiste: string
  readonly razlog: RazlogOtpisa
  readonly obrazlozenje: string
  /** `POV-…`, `Mrtva zaliha`, `Stanje zaliha`, or `''`. */
  readonly izvor: string
  readonly komisija: readonly string[]
  /** File name of the signed zapisnik; required at approval. */
  readonly zapisnik: string
  readonly status: OtpisStatus
  readonly razlogZatvaranja: string
  readonly pripremio: Potpis | null
  readonly odobrio: Potpis | null
  readonly proknjizio: Potpis | null
  readonly stavke: readonly OtpisStavka[]
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

// ─── skladiste/pocetna-stanja.ts ─────────────────────────────────────────────

export type PocetnoStanjeStatus = 'NACRT' | 'ODOBRENO' | 'PROKNJIZENO' | 'OTKAZANO'

export interface PocetnoStanjeStavka {
  readonly id: string
  readonly artikl: string
  readonly lokacija: string
  /** Lot, or the serial numbers of a SERIJSKI item; `''` for untraced items. */
  readonly lot: string
  readonly kolicina: number
  /** Unit price (KM) taken over from the old records. */
  readonly cijena: number
}

export interface PocetnoStanje {
  readonly id: string
  readonly broj: string
  /** The cut-off date the balance is taken at. */
  readonly datum: string
  readonly skladiste: string
  readonly napomena: string
  /** `''` (typed), or `CSV · naziv.csv`. */
  readonly izvor: string
  readonly status: PocetnoStanjeStatus
  readonly razlogZatvaranja: string
  readonly pripremio: Potpis | null
  readonly odobrio: Potpis | null
  readonly proknjizio: Potpis | null
  readonly stavke: readonly PocetnoStanjeStavka[]
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

// ─── skladiste/rezervacije.ts ────────────────────────────────────────────────

export type IzvorRezervacije = 'ODOBRENI_ZAHTJEV' | 'RADNI_NALOG'

export interface Rezervacija {
  readonly id: string
  readonly artikl: string
  readonly skladiste: string
  readonly izvorTip: IzvorRezervacije
  /** The source document number (`ZZN-…` or `RN-…`). */
  readonly izvorBroj: string
  readonly trazeno: number
  /** Held for the source so far. */
  readonly rezervisano: number
  /** Taken out by posted issue notes. */
  readonly izdato: number
  /** `yyyy-mm-dd`. */
  readonly kreirana: string
  /** Issued in full, or released. */
  readonly zatvorena: boolean
  /** Why it was released before being issued in full; `''` otherwise. */
  readonly razlogOtpustanja: string
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

export type RezervacijaStatus = 'OTVORENA' | 'DJELIMICNO' | 'CEKA_ZALIHU' | 'ZATVORENA' | 'OTPUSTENA'

// ─── skladiste/administracija.ts ─────────────────────────────────────────────

export interface Uloga {
  /** `= sifra`. */
  readonly id: string
  readonly sifra: string
  readonly naziv: string
  readonly domen: string
  readonly aktivna: boolean
  readonly opis: string
  /** Control points held: kreiraj (1) → odobri (2) → izdaj (3) → proknjiži (4). */
  readonly tacke: readonly number[]
}

export interface Dodjela {
  readonly id: string
  /** The person's name, as it appears on signatures. */
  readonly osoba: string
  /** A role code (`Uloga.sifra`). */
  readonly uloga: string
  /** `''` = all warehouses. */
  readonly skladiste: string
  /** `yyyy-mm-dd`. */
  readonly vaziOd: string
  /** `yyyy-mm-dd`; `''` = open. */
  readonly vaziDo: string
  readonly verzija: number
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

export type DodjelaStatus = 'AKTIVNA' | 'BUDUCA' | 'ISTEKLA'

export type PolitikaStatus = 'NACRT' | 'ODOBRENA' | 'POVUCENA'

export interface Politika {
  readonly id: string
  readonly vrsta: string
  /** `'sva skladišta'` or a warehouse code. */
  readonly obuhvat: string
  readonly verzija: number
  readonly status: PolitikaStatus
  /** `yyyy-mm-dd`; `''` until approved. */
  readonly vaziOd: string
  readonly vlasnik: string
  readonly opis: string
  readonly razlogPovlacenja: string
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

export type VrstaLega =
  | 'Ulaz zaliha'
  | 'Izlaz zaliha'
  | 'Povrat na zalihu'
  | 'Izlaz zaliha — otprema'
  | 'Korekcija'
  | 'Popisne razlike'
  | 'Storno ulaza'
  | 'Storno izlaza'
  | 'Storno povrata'
  | 'Otpis'
  | 'Početno stanje'

/** One general-ledger leg: a posted stock document and the value it moved. */
export interface OutboxLeg {
  /** `= broj`. */
  readonly id: string
  readonly broj: string
  readonly path: string
  readonly vrsta: VrstaLega
  /** Signed: stock in +, stock out −. */
  readonly iznos: number
  /** `yyyy-mm-dd`. */
  readonly datum: string
  readonly skladiste: string
}

export type LegStatus = 'BLOKIRANO' | 'SPREMNO' | 'POSLANO'

/** The finance connection: one settings record. */
export interface Integracija {
  readonly id: 'finansije'
  readonly ugovorAktivan: boolean
  /** ISO timestamp of the current activation; `''` while inactive. */
  readonly aktiviran: string
  /** Document number → ISO timestamp of the handover to the ledger. */
  readonly poslano: Readonly<Record<string, string>>
  /** Newest first. */
  readonly historija: readonly HistorijaUnos[]
}

// ─── skladiste/naljepnice-ispis.ts, skladiste/naljepnice-postavke.ts ─────────

export type VrstaKoda = 'QR_BARKOD' | 'QR' | 'BARKOD'

export interface Naljepnica {
  /** What the code carries (see `skladiste/sken.ts`). */
  readonly kod: string
  /** The big line: the key a person reads. */
  readonly naslov: string
  /** Up to three small lines under it. */
  readonly redovi: readonly string[]
}

export type ModulNaljepnica = 'skladiste' | 'stalna-sredstva'

export interface PostavkaNaljepnica {
  readonly id: ModulNaljepnica
  readonly vrsta: VrstaKoda
  readonly izmijenio?: string
  readonly izmijenjeno?: string
}

// ─── skladiste/numeracija.ts, maticni-podaci/numeracija-model.ts ─────────────

export type DokumentSkladista =
  | 'PRIJEMNICA'
  | 'IZDATNICA'
  | 'POVRATNICA'
  | 'PRENOSNICA'
  | 'OTPREMNICA'
  | 'TREBOVANJE'
  | 'POPIS_ZALIHA'
  | 'KOREKCIJA_ZALIHA'
  | 'OTPIS_ZALIHA'
  | 'POCETNO_STANJE_ZALIHA'

export type SifraSkladista = 'ARTIKAL' | 'SKLADISTE' | 'DOBAVLJAC'

/** cicak's `PredmetBroja` has ~90 kinds; the warehouse's series use only these. */
export type PredmetBroja = DokumentSkladista | SifraSkladista

/** One shape of a series and the day it starts writing. */
export interface OblikBroja {
  /** `PRJ-{GGGG}-{NNNNN}` — canonical tokens. */
  readonly obrazac: string
  /** yyyy-mm-dd. */
  readonly vaziOd: string
  readonly osnov?: string
}

export type VrstaIzmjene = 'UPIS' | 'OBLIK' | 'BROJAC' | 'AKTIVNOST' | 'IZMJENA' | 'NIJE_PRENESENO'

/** components/historija.ts */
export interface StavkaHistorije {
  readonly kad: string
  readonly ko: string
  readonly sta: string
  readonly napomena?: string
}

export interface IzmjenaSerije extends StavkaHistorije {
  readonly vrsta?: VrstaIzmjene
  readonly staro?: string
  readonly novo?: string
  readonly vaziOd?: string
  readonly osnov?: string
  readonly izvor?: string
}

export interface SerijaBrojeva {
  /** `${predmet}-${oznaka}`. */
  readonly id: string
  readonly predmet: PredmetBroja
  /** The application the series numbers for — `skladiste` here. */
  readonly aplikacija: string
  readonly podvrsta?: string
  /** What `{APL}` writes. */
  readonly oznaka: string
  /** Every shape the series was given, in date order. */
  readonly oblici: readonly OblikBroja[]
  readonly obrasciCitanja?: readonly string[]
  /** The first running number of a count. */
  readonly pocetniBroj: number
  readonly aktivna: boolean
  readonly napomena: string
  readonly historija: readonly IzmjenaSerije[]
}

/** The last number a count issued. */
export interface BrojacBrojeva {
  readonly id: string
  readonly zadnji: number
}

// ─── skladiste/zalihe.ts ─────────────────────────────────────────────────────

export interface StanjeRed {
  /** `artikl|skladiste|lokacija|lot` (custody rows: `…|<document number>`). */
  readonly kljuc: string
  readonly artikl: string
  readonly skladiste: string
  /** `''` in a warehouse without locations. */
  readonly lokacija: string
  /** Lot or serial-number hint, `''` for untraced items. */
  readonly lot: string
  readonly naStanju: number
  readonly blokirano: number
  readonly rezervisano: number
  readonly raspolozivo: number
  /** naStanju × unit price; 0 on a location without stock. */
  readonly vrijednost: number
  /** Some of the value still carries a provisional price. */
  readonly privremeno: boolean
  /** Quarantine / custody / transit rows hold goods but bear no stock. */
  readonly bezStanja: boolean
  readonly napomena: string
}

export interface StanjeArtikla {
  readonly artikl: string
  readonly skladiste: string
  readonly naStanju: number
  readonly blokirano: number
  readonly rezervisano: number
  readonly raspolozivo: number
  /** Available as the thresholds see it (a frozen position still counts). */
  readonly raspolozivoZaGranice: number
  readonly vrijednost: number
}

export interface KarticaRed {
  readonly id: string
  /** `yyyy-mm-dd` business date. */
  readonly datum: string
  readonly dokument: string
  readonly vrsta:
    | 'Početno stanje'
    | 'Prijemnica'
    | 'Izdatnica'
    | 'Povratnica'
    | 'Otpremnica'
    | 'Prenosnica'
    | 'Korekcija'
    | 'Otpis'
  readonly path: string
  readonly skladiste: string
  readonly ulaz: number
  readonly izlaz: number
  /** Running balance. */
  readonly stanje: number
  readonly cijena: number
  readonly privremeno: boolean
  readonly storno?: boolean
  readonly stornirano?: boolean
}

/** Pre-posting check of one document line (`provjeriIzdatnicu` & co.). */
export interface ProvjeraStavke {
  readonly stavkaId: string
  readonly artikl: string
  readonly trazeno: number
  readonly raspolozivo: number
  readonly dozvoljeno: number
  readonly ok: boolean
  readonly poruka: string
}

// ─── skladiste/potpisi.ts ────────────────────────────────────────────────────

export interface PotpisDokumenta {
  readonly label: string
  readonly potpis: Potpis | null
  /** A key of `POJMOVI` (pojmovi.json). */
  readonly pojam?: string
}

// ─── skladiste/pocetna.ts ────────────────────────────────────────────────────

/** One row of the home lanes / document lists, whatever the document kind. */
export interface DokumentRed {
  readonly broj: string
  readonly vrsta: string
  readonly skladiste: string
  readonly kontekst: string
  /** `yyyy-mm-dd`. */
  readonly datum: string
  readonly status: string
  readonly tone: StatusTone
  readonly path: string
}

/** A step on a document that waits for the signed-in user. */
export interface ZadatakRed {
  readonly id: string
  readonly radnja: string
  readonly dokument: DokumentRed
  /** ISO timestamp the step started waiting. */
  readonly cekaOd: string
}

export interface Pokazatelji {
  readonly ispodSignalne: number
  readonly ispodMinimuma: number
  readonly uGranicama: number
  readonly iznadMaksimuma: number
  readonly naNuli: number
  readonly uZahtjevu: number
  /** 0–100. */
  readonly pokrivenostPotreba: number
  /** 0–100. */
  readonly popisNapredak: number
  readonly popisSkladista: number
  readonly rezervisanoOtvorene: number
  readonly nepokrivene: number
  readonly nepokriveniOsnovi: number
  readonly nedostajeJedinica: number
  readonly otvoreniPopisi: number
  readonly popisStavki: number
  readonly popisPrebrojano: number
}

// ─── skladiste/shema.ts ──────────────────────────────────────────────────────

export interface Polje {
  readonly lokacija: Lokacija
  readonly prolaz: string
  readonly redovi: readonly StanjeRed[]
  readonly kolicina: number
  readonly vrijednost: number
  /** 0 empty, then 1 low · 2 medium · 3 high by rank among the occupied locations. */
  readonly nivo: 0 | 1 | 2 | 3
}

export interface ZonaSheme {
  readonly zona: string
  readonly prolazi: readonly { readonly prolaz: string; readonly polja: readonly Polje[] }[]
  readonly zauzeto: number
  readonly ukupno: number
  readonly vrijednost: number
}

export interface ShemaSkladista {
  readonly zone: readonly ZonaSheme[]
  /** Quarantine, custody and transit. */
  readonly posebne: readonly Polje[]
  readonly zauzeto: number
  readonly ukupno: number
  readonly vrijednost: number
  readonly artikala: number
}

export interface SedmicaPrometa {
  /** Monday of the week. */
  readonly od: string
  readonly ulaz: number
  readonly izlaz: number
}

// ─── skladiste/izvjestaji.ts ─────────────────────────────────────────────────

export type IzvjestajKljuc =
  | 'stanje-prema-granicama'
  | 'mrtva-zaliha'
  | 'fill-rate'
  | 'stopa-povrata'
  | 'kontrolni-signali'
  | 'privremene-vrijednosti'
  | 'pomocna-knjiga'

export interface IzvjestajDef {
  readonly kljuc: IzvjestajKljuc
  readonly naslov: string
  readonly opis: string
  /** A key of `POJMOVI`. */
  readonly pojam: string
  /** The period filter applies. */
  readonly period: boolean
}

export interface FilterIzvjestaja {
  /** `''` = every warehouse. */
  readonly skladiste: string
  readonly periodDana: number
}

export type Celija =
  | { readonly vrsta: 'artikl'; readonly sifra: string; readonly detalj?: string }
  | { readonly vrsta: 'skladiste'; readonly sifra: string }
  | { readonly vrsta: 'kolicina'; readonly n: number; readonly jm?: string }
  | { readonly vrsta: 'iznos'; readonly n: number }
  | { readonly vrsta: 'tekst'; readonly tekst: string; readonly detalj?: string; readonly mono?: boolean }
  | { readonly vrsta: 'datum'; readonly datum: string; readonly detalj?: string }
  | {
      readonly vrsta: 'oznaka'
      readonly tekst: string
      readonly ton: 'success' | 'warning' | 'danger' | 'neutral' | 'info'
    }
  | { readonly vrsta: 'broj'; readonly broj: string; readonly path?: string; readonly detalj?: string }
  | { readonly vrsta: 'na'; readonly razlog: string }

export interface KolonaIzvjestaja {
  readonly naslov: string
  readonly pojam?: string
  readonly desno?: boolean
}

export interface RedIzvjestaja {
  readonly kljuc: string
  readonly celije: readonly Celija[]
  readonly path: string
  readonly pretraga: string
  readonly radnje?: readonly { readonly label: string; readonly path: string }[]
}

export type GrafPlocice =
  | { readonly vrsta: 'stupci'; readonly vrijednosti: readonly (number | null)[]; readonly istaknut?: number }
  | { readonly vrsta: 'skala'; readonly postotak: number }
  | { readonly vrsta: 'linija'; readonly vrijednosti: readonly number[]; readonly trend?: number }

export interface CinjenicaPlocice {
  readonly label: string
  readonly value: string
}

export interface PlocicaIzvjestaja {
  readonly naslov: string
  readonly vrijednost: string
  readonly opis: string
  readonly graf?: GrafPlocice
  readonly cinjenice?: readonly CinjenicaPlocice[]
}

export interface Izvjestaj {
  readonly def: IzvjestajDef
  readonly plocice: readonly PlocicaIzvjestaja[]
  readonly kolone: readonly KolonaIzvjestaja[]
  readonly redovi: readonly RedIzvjestaja[]
  readonly napomene: readonly string[]
  readonly prazno: string
}

// ─── skladiste/records.ts / protocol/module-record.ts ────────────────────────

export interface ModuleRecord {
  readonly entity: string
  readonly id: string
  readonly title: string
  readonly reference?: string
  readonly fields: readonly { readonly label: string; readonly value: string }[]
}

// ═══ Part 2 — the export files ══════════════════════════════════════════════

/** `meta.json`. */
export interface ExportMeta {
  /** The frozen clock every relative seed date was computed against (local Sarajevo time). */
  readonly zamrznutoVrijeme: string
  /** The same instant as UTC ISO. */
  readonly zamrznutoUtc: string
  readonly vremenskaZona: string
  /** `yyyy-mm-dd` "today" of the export. */
  readonly danas: string
  readonly izvor: string
  readonly datoteke: readonly { readonly datoteka: string; readonly zapisa: number }[]
}

/** `zalihe.json` — stock is never stored in cicak; it is derived from the posted documents. */
export interface ZaliheExport {
  /** `readStanje()` — every stock row (item × warehouse × location × lot). */
  readonly pozicije: readonly StanjeRed[]
  /** `stanjePoArtiklu()` + where the pair stands against its threshold (Stanje zaliha chips). */
  readonly poArtikluISkladistu: readonly (StanjeArtikla & {
    readonly granica: Granica | null
    readonly polozaj: PolozajGranice | null
  })[]
  /** The „Po artiklu" view over every row (no filter) — `grupisiPoArtiklu` of StanjeZalihaPage. */
  readonly poArtiklu: readonly ZbirArtikla[]
}

/** One item summed over every warehouse, location and lot (StanjeZalihaPage). */
export interface ZbirArtikla {
  readonly artikl: string
  readonly naStanju: number
  readonly blokirano: number
  readonly rezervisano: number
  readonly raspolozivo: number
  readonly vrijednost: number
  readonly privremeno: boolean
  readonly pozicija: number
  readonly poSkladistu: readonly { readonly skladiste: string; readonly naStanju: number }[]
}

/** `kartice.json` — the stock card per item: every warehouse, and each warehouse it appears in. */
export type KarticeExport = Readonly<
  Record<string, { readonly sva: readonly KarticaRed[]; readonly poSkladistu: Readonly<Record<string, readonly KarticaRed[]>> }>
>

/** A dashboard tile (SkladistePocetnaPage). */
export interface PlocicaPocetne {
  readonly key: string
  readonly naslov: string
  readonly opis: string
  /** lucide icon name. */
  readonly icon: string
  readonly badge: { readonly label: string; readonly tone: StatusTone }
  readonly vrijednost: number
  readonly chart:
    | { readonly kind: 'bars'; readonly values: readonly number[]; readonly highlightedIndex: number }
    | { readonly kind: 'gradient-bar'; readonly percent: number }
  readonly facts: readonly { readonly label: string; readonly value: string }[]
  readonly path: string
}

/** `pocetna.json` — Skladište › Početna. */
export interface PocetnaExport {
  readonly danas: string
  /** `Danas 13.10.2026. · pogled administratora`. */
  readonly podnaslov: string
  readonly pokazatelji: Pokazatelji
  readonly plocice: readonly PlocicaPocetne[]
  /** Buckets: ≤1 day, 2–3 days, >3 days. */
  readonly starostZadataka: readonly number[]
  readonly zadaci: readonly (ZadatakRed & {
    /** `trajanjeCekanja(cekaOd)` — e.g. `4 dana`. */
    readonly trajanje: string
    /** `formatDatum(isoDatum(new Date(cekaOd)))`. */
    readonly odDatum: string
    readonly skladisteNaziv: string
  })[]
  readonly nedavniDokumenti: readonly (DokumentRed & { readonly datumPrikaz: string; readonly skladisteNaziv: string })[]
  readonly napomeneZadaci: readonly string[]
  readonly napomeneNedavni: readonly string[]
}

/** `izvjestaji.json` — every report for every filter the report page offers. */
export interface IzvjestajiExport {
  readonly definicije: readonly IzvjestajDef[]
  readonly periodiDana: readonly number[]
  readonly zadaniFilter: FilterIzvjestaja
  /** `''` (sva skladišta) first, then every warehouse code. */
  readonly skladista: readonly string[]
  readonly izvjestaji: readonly {
    readonly kljuc: IzvjestajKljuc
    readonly filter: FilterIzvjestaja
    /** `prijeDana(periodDana)` — the „od … do danas" line (period reports only). */
    readonly periodOd: string | null
    readonly izvjestaj: Izvjestaj
  }[]
}

/** `sheme.json` — the warehouse floor plan & visuals (`useVizualSkladista`), per warehouse. */
export type ShemeExport = Readonly<
  Record<
    string,
    {
      readonly shema: ShemaSkladista
      readonly promet: readonly SedmicaPrometa[]
      readonly otvoreni: number
      readonly popunjenost: number
      readonly podskladista: readonly { readonly skladiste: Skladiste; readonly vrijednost: number }[]
    }
  >
>

/** Common derived fields of every document (dokumenti-izvedeno.json). */
export interface IzvedenoDokumenta {
  /** The list / home-lane row (`pocetna.ts` *Red): status label, tone, context, path. */
  readonly red: DokumentRed
  readonly sljedecaRadnja: string | null
  /** When the document entered its current state (`cekaOd*`); `null` for a korekcija, which never waits. */
  readonly cekaOd: string | null
  /** „Ovjere i potpisi" — the signature chain in order (empty for a zahtjev, which has none). */
  readonly potpisi: readonly PotpisDokumenta[]
}

export interface PrijemnicaIzvedeno extends IzvedenoDokumenta {
  readonly statusGrupa: StatusGrupa
  readonly vrijednost: number
  readonly cijenaPrivremena: boolean
  readonly mozePriznatiCijene: boolean
  readonly jeZaCitanje: boolean
  readonly mozeStorno: boolean
  readonly proknjizenihStavki: number
  readonly kontrolaZbira: KontrolaZbira
  readonly stornoOznaka: StornoOznaka | null
  /** Id of the other half of a storno pair. */
  readonly parStorna: string | null
  /** `provjeriStornoPrijemnice` — only when `mozeStorno`. */
  readonly preprekeStorna: readonly Prepreka[] | null
  readonly stavke: Readonly<
    Record<string, { readonly cijena: number; readonly kolicinaZaVrijednost: number; readonly privremena: boolean }>
  >
}

export interface IzdatnicaIzvedeno extends IzvedenoDokumenta {
  readonly jeProknjizena: boolean
  readonly jeZaCitanje: boolean
  readonly mozeStorno: boolean
  readonly vrijednost: number
  readonly preostaloZaPredaju: number
  readonly ukupnoPredano: number
  readonly stornoOznaka: StornoOznaka | null
  readonly parStorna: string | null
  readonly preprekeStorna: readonly Prepreka[] | null
  /** `provjeriIzdatnicu` — while PRIPREMLJENA / OVJERENA. */
  readonly provjere: readonly ProvjeraStavke[] | null
  /** Per issue line: how much a return may still claim (`mozeVratiti`). */
  readonly mozeVratiti: Readonly<Record<string, number>>
}

export interface PovratnicaIzvedeno extends IzvedenoDokumenta {
  readonly jeZaCitanje: boolean
  readonly mozeStorno: boolean
  readonly vrijednost: number
  readonly zbir: ZbirPovrata
  readonly stornoOznaka: StornoOznaka | null
  readonly parStorna: string | null
  readonly preprekeStorna: readonly Prepreka[] | null
  readonly izvornaIzdatnicaBroj: string | null
}

export interface OtpremnicaIzvedeno extends IzvedenoDokumenta {
  readonly jeOtpremljena: boolean
  readonly jeZaCitanje: boolean
  readonly vrijednost: number
  /** `provjeriOtpremnicu` — while PRIPREMLJENA / OVJERENA. */
  readonly provjere: readonly ProvjeraStavke[] | null
}

export interface PrenosnicaIzvedeno extends IzvedenoDokumenta {
  readonly jeUnutarSkladista: boolean
  readonly jeOtpremljena: boolean
  readonly jeZaCitanje: boolean
  readonly vrijednost: number
  readonly gubitakUTranzitu: GubitakUTranzitu
  /** `provjeriPrenosnicu` — while PRIPREMLJENA / OVJERENA. */
  readonly provjere: readonly ProvjeraStavke[] | null
}

export interface PopisIzvedeno extends IzvedenoDokumenta {
  readonly jeOtvoren: boolean
  readonly zbir: ZbirPopisa
  /** `opisZbira` — `bez razlika` · `1 manjak · 2 viška · −22,80 KM`. */
  readonly opisZbira: string
  readonly opisObuhvata: string
  /** `slijepo` · `otvoreno`. */
  readonly opisSlijepog: string
  /** Counted minus book, per line. */
  readonly razlike: Readonly<Record<string, number>>
  /** `pozicijeZaPopis` — the rows starting a PLANIRAN count would snapshot. */
  readonly pozicijeZaPopis: readonly StanjeRed[] | null
}

export interface KorekcijaIzvedeno extends IzvedenoDokumenta {
  readonly jeStorno: boolean
  /** Id of the storno that reversed it. */
  readonly storno: string | null
}

export interface OtpisIzvedeno extends IzvedenoDokumenta {
  readonly jeProknjizen: boolean
  readonly jeZaCitanje: boolean
  readonly vrijednost: number
  readonly kolicina: number
  /** `provjeriOtpis` — while PRIPREMLJEN / ODOBREN. */
  readonly provjere: readonly Prepreka[] | null
}

export interface PocetnoStanjeIzvedeno extends IzvedenoDokumenta {
  readonly jeProknjizeno: boolean
  readonly vrijednost: number
  readonly kolicina: number
  /** `preprekePocetnogStanja` + `provjeriStavkePocetnog` — while NACRT / ODOBRENO. */
  readonly provjere: readonly Prepreka[] | null
}

export interface ZahtjevIzvedeno extends IzvedenoDokumenta {
  readonly jeOtvoren: boolean
  readonly naziv: string
  readonly putanja: string
  readonly odobreneStavke: readonly string[]
  readonly stavke: Readonly<
    Record<string, { readonly opisIzvora: string; readonly opisNosioca: string; readonly rezervacija: string | null }>
  >
}

export interface RezervacijaIzvedeno {
  readonly status: RezervacijaStatus
  readonly nepokriveno: number
  readonly drziSe: number
  readonly preostalo: number
  readonly jeOtvorena: boolean
  readonly putIzvora: string | null
  readonly starostDana: number
  /** `stanjeArtikla(artikl, skladiste).raspolozivo` — what the row shows as free now. */
  readonly raspolozivo: number
}

/** `dokumenti-izvedeno.json` — per document kind, keyed by document id. */
export interface DokumentiIzvedenoExport {
  readonly prijemnice: Readonly<Record<string, PrijemnicaIzvedeno>>
  readonly izdatnice: Readonly<Record<string, IzdatnicaIzvedeno>>
  readonly povratnice: Readonly<Record<string, PovratnicaIzvedeno>>
  readonly otpremnice: Readonly<Record<string, OtpremnicaIzvedeno>>
  readonly prenosnice: Readonly<Record<string, PrenosnicaIzvedeno>>
  readonly popisi: Readonly<Record<string, PopisIzvedeno>>
  readonly korekcije: Readonly<Record<string, KorekcijaIzvedeno>>
  readonly otpisi: Readonly<Record<string, OtpisIzvedeno>>
  readonly pocetnaStanja: Readonly<Record<string, PocetnoStanjeIzvedeno>>
  readonly zahtjevi: Readonly<Record<string, ZahtjevIzvedeno>>
  readonly rezervacije: Readonly<Record<string, RezervacijaIzvedeno>>
}

/** A warehouse as its list and detail page show it. */
export interface SkladistePregled {
  readonly adresa: string
  readonly grad: string
  readonly odgovornaIme: string
  /** `nazivBs · adresa` of its company location (SkladistaPage „Mjesto"). */
  readonly mjesto: string
  /** Stock-bearing locations. */
  readonly lokacija: number
  /** Stock rows (custody rows left out). */
  readonly redova: number
  readonly vrijednost: number
  readonly podskladista: readonly string[]
  readonly ispodSignalne: number
  /** Every document of the warehouse, newest first (detail page „Dokumenti"). */
  readonly dokumenti: readonly DokumentRed[]
  readonly otvoreniDokumenti: number
  readonly mozePocetnoStanje: boolean
  readonly preprekePocetnogStanja: readonly Prepreka[]
  readonly pocetnoUToku: string | null
  /** `preprekeDeaktivacijeSkladista` (empty = it can be deactivated). */
  readonly preprekeDeaktivacije: readonly Prepreka[]
}

export interface ArtiklPregled {
  /** Available over every warehouse — the one number the catalogue shows. */
  readonly raspolozivo: number
  readonly imaPrometa: boolean
  readonly grupaNaziv: string
  /** The warehouses whose stock card has rows. */
  readonly skladistaKartice: readonly string[]
  readonly granice: readonly string[]
  readonly preprekeDeaktivacije: readonly Prepreka[]
}

export interface DobavljacPregled {
  readonly prijemnica: number
  /** Value of the supplier's posted receipts. */
  readonly vrijednost: number
  readonly prijemnice: readonly string[]
  readonly preprekeBrisanja: readonly Prepreka[]
  readonly preprekeDeaktivacije: readonly Prepreka[]
}

export interface DodjelaPregled {
  readonly status: DodjelaStatus
  readonly danaDoIsteka: number | null
  readonly nazivUloge: string
  readonly opisSkladista: string
  readonly opisKontrolnihTacaka: string
}

export interface UlogaPregled {
  readonly opisKontrolnihTacaka: string
  readonly dodjela: number
  readonly preprekeBrisanja: readonly Prepreka[]
}

/** `sifrarnici-izvedeno.json`. */
export interface SifrarniciIzvedenoExport {
  readonly artikli: Readonly<Record<string, ArtiklPregled>>
  readonly skladista: Readonly<Record<string, SkladistePregled>>
  readonly dobavljaci: Readonly<Record<string, DobavljacPregled>>
  readonly uloge: Readonly<Record<string, UlogaPregled>>
  readonly dodjele: Readonly<Record<string, DodjelaPregled>>
  readonly politike: Readonly<Record<string, { readonly autorNacrta: string }>>
}

/** `outbox.json` — the finance outbox (derived, never stored) with each leg's status. */
export type OutboxExport = readonly (OutboxLeg & { readonly status: LegStatus; readonly poruka: string })[]

/** `numeracija.json`. */
export interface NumeracijaExport {
  readonly aplikacija: string
  readonly serije: readonly SerijaBrojeva[]
  readonly brojaci: readonly BrojacBrojeva[]
  /** The number the next document of each kind would get today (nothing burned). */
  readonly sljedeciBrojevi: Readonly<Record<string, { readonly ok: boolean; readonly vrijednost?: string; readonly razlog?: string }>>
  /** The code a new item / warehouse / supplier would get today. */
  readonly sljedeceSifre: Readonly<Record<string, { readonly ok: boolean; readonly vrijednost?: string; readonly razlog?: string }>>
}

/** `naljepnice.json`. */
export interface NaljepniceExport {
  readonly postavke: readonly PostavkaNaljepnica[]
  readonly artikli: Readonly<Record<string, Naljepnica>>
  readonly lokacije: Readonly<Record<string, Naljepnica>>
  /** Lot / serial labels of each posted receipt, by receipt id (only receipts that give any). */
  readonly serijePrijemnica: Readonly<Record<string, readonly Naljepnica[]>>
}

/** `korisnici.json`. */
export interface KorisniciExport {
  /** The demo's signatories by role (`OSOBE`). */
  readonly osobe: Readonly<Record<string, Akter>>
  /** `osobeZaDodjelu()` — everyone a role can be given to. */
  readonly osobeZaDodjelu: readonly string[]
  /** Work crews that take goods out (`PRIMAOCI`). */
  readonly primaoci: readonly string[]
  /** HR employees the warehouses name as responsible (`odgovorna`). */
  readonly odgovorne: readonly { readonly id: string; readonly ime: string; readonly prezime: string }[]
}

/** `opcije.json` — the option lists the forms offer. */
export interface OpcijeExport {
  readonly kandidatiPrimaoca: Readonly<Record<VrstaOtpremnice, readonly KandidatPrimaoca[]>>
  readonly skladistaZaOtpremu: readonly string[]
  readonly glavnaSkladista: readonly string[]
  /** Stock-bearing active locations per warehouse (`lokacijeSkladista`). */
  readonly lokacijeSkladista: Readonly<Record<string, readonly string[]>>
  readonly domeniUloga: readonly string[]
  readonly vrstePolitika: readonly string[]
  readonly nosilacTroskaOpcije: Readonly<Record<string, readonly string[]>>
}

/** `pojmovi.json` — the glossary and the recurring notes the screens print. */
export interface PojmoviExport {
  readonly POJMOVI: Readonly<Record<string, string>>
  readonly NAPOMENE: Readonly<Record<string, string>>
}

/** `oznake.json` — every non-function export (labels, tones, enums, lists) per cicak module. */
export type OznakeExport = Readonly<Record<string, Readonly<Record<string, unknown>>>>
