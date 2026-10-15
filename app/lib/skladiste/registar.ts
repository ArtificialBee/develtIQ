import type { Screen } from "~/lib/skladiste/ekrani";
import { ARTIKLI_EKRAN } from "~/lib/skladiste/ekrani/artikli";
import { DOBAVLJACI_EKRAN } from "~/lib/skladiste/ekrani/dobavljaci";
import { INTEGRACIJE_EKRAN } from "~/lib/skladiste/ekrani/integracije";
import { IZDATNICE_EKRAN } from "~/lib/skladiste/ekrani/izdatnice";
import { IZVJESTAJI_EKRANI } from "~/lib/skladiste/ekrani/izvjestaji";
import { KOREKCIJE_EKRAN } from "~/lib/skladiste/ekrani/korekcije";
import { KORISNICI_ULOGE_EKRAN } from "~/lib/skladiste/ekrani/korisnici-uloge";
import { NALJEPNICE_EKRAN } from "~/lib/skladiste/ekrani/naljepnice";
import { OTPISI_EKRAN } from "~/lib/skladiste/ekrani/otpisi";
import { OTPREMNICE_EKRAN } from "~/lib/skladiste/ekrani/otpremnice";
import { OTVORENE_POTREBE_EKRAN } from "~/lib/skladiste/ekrani/otvorene-potrebe";
import { POCETNA_STANJA_EKRAN } from "~/lib/skladiste/ekrani/pocetna-stanja";
import { POLITIKE_EKRAN } from "~/lib/skladiste/ekrani/politike";
import { POPISI_EKRAN } from "~/lib/skladiste/ekrani/popisi";
import { POVRATNICE_EKRAN } from "~/lib/skladiste/ekrani/povratnice";
import { PRENOSNICE_EKRAN } from "~/lib/skladiste/ekrani/prenosnice";
import { PRIJEMNICE_EKRAN } from "~/lib/skladiste/ekrani/prijemnice";
import { REZERVACIJE_EKRAN } from "~/lib/skladiste/ekrani/rezervacije";
import { SKLADISTA_EKRAN } from "~/lib/skladiste/ekrani/skladista";
import { STANJE_EKRAN } from "~/lib/skladiste/ekrani/stanje";
import { TREBOVANJA_EKRAN, ZAHTJEVI_EKRAN } from "~/lib/skladiste/ekrani/zahtjevi";

/** Every connected warehouse screen, keyed "section/screen" as in the URL. */
export const SCREENS: Record<string, Screen> = {
  "prijem/prijemnice": PRIJEMNICE_EKRAN,
  "prijem/povratnice": POVRATNICE_EKRAN,
  "izdavanje/izdatnice": IZDATNICE_EKRAN,
  "izdavanje/otpremnice": OTPREMNICE_EKRAN,
  "interno/prenosnice": PRENOSNICE_EKRAN,
  "interno/popisi": POPISI_EKRAN,
  "interno/korekcije": KOREKCIJE_EKRAN,
  "interno/otpisi": OTPISI_EKRAN,
  "postavke/pocetna-stanja": POCETNA_STANJA_EKRAN,
  "izdavanje/trebovanja": TREBOVANJA_EKRAN,
  "nabavka/zahtjevi": ZAHTJEVI_EKRAN,
  "zalihe/rezervacije": REZERVACIJE_EKRAN,
  "nabavka/otvorene-potrebe": OTVORENE_POTREBE_EKRAN,
  "nabavka/dobavljaci": DOBAVLJACI_EKRAN,
  "zalihe/stanje": STANJE_EKRAN,
  "zalihe/artikli": ARTIKLI_EKRAN,
  "postavke/skladista": SKLADISTA_EKRAN,
  "postavke/politike": POLITIKE_EKRAN,
  "postavke/naljepnice": NALJEPNICE_EKRAN,
  "postavke/integracije": INTEGRACIJE_EKRAN,
  "postavke/korisnici-i-uloge": KORISNICI_ULOGE_EKRAN,
  // The seven reports share one builder, already keyed "izvjestaji/…".
  ...IZVJESTAJI_EKRANI,
};
