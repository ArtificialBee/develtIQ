import type { Snapshot } from "~/lib/snapshot";

/**
 * A worst-case copy of a snapshot for layout testing: the longest names, titles,
 * numbers and labels the real data could plausibly hold, plus long words with no
 * place to break (e-mail addresses, file links, unmapped module keys) and counts
 * in the thousands. Open the home page with `?data=stress` to see it.
 */

const LONG_FIRST = "Abdulmuhamedalija";
const LONG_PERSON = `${LONG_FIRST} Hadžimehmedović-Čengić`;
const LONG_NAMES = [
  "Muhamed-Abdurahman Hadžihasanović-Kapetanović",
  "Aleksandra-Katarina Mujezinović-Kurtagić",
  "Emina-Esmeralda Bajramović-Zukorlić",
];
const LONG_TITLE =
  "Prijava oštećenja fasade nakon intervencije na vrelovodu u ulici Maršala Tita broj 154, ulaz B, uz zahtjev za hitnu sanaciju i procjenu štete od strane ovlaštenog sudskog vještaka građevinske struke";
const UNBREAKABLE =
  "https://portal.toplanesarajevo.ba/protokol/predmeti/03-05-INT-26-002144/prilozi/zapisnik-o-ostecenju-fasade-i-procjeni-stete.pdf";
const LONG_NUMBER = "03-05/INT-26-002144-DOPUNA-03";
const LONG_EMAIL = "nabavka.i.logistika.centralnog.skladista.podrucne.jedinice@toplanesarajevo-grupacija.ba";
const LONG_ACTION_KIND = "Usaglašavanje godišnjeg odmora sa rukovodiocem organizacione jedinice";
const LONG_ACTION_VERB = "Potpiši, ovjeri i proslijedi na arhiviranje";
const LONG_MODULE = "upravljanje-dokumentima-i-arhivskom-gradjom";
const MODULES = ["protokol", "radni-nalozi", "licno", "email", "hr", "vozni-park", "plate", "finansije", "skladiste", LONG_MODULE];

/** `n` copies of each item, each with its own id. */
const many = <T extends object>(items: T[], n: number, id: (item: T, i: number) => Partial<T>) =>
  Array.from({ length: n }, (_, i) => items.map((item) => ({ ...item, ...id(item, i) }))).flat();

const stressStavke = (s: Snapshot): Snapshot["stavke"] =>
  many(s.stavke, 30, (st, i) => ({
    id: `${st.id}-${i}`,
    modul: MODULES[i % MODULES.length],
    naslov: i % 3 === 0 ? `${LONG_TITLE} ${UNBREAKABLE}` : LONG_TITLE,
    broj: LONG_NUMBER,
    datum: st.hitnost === "KASNI" ? `2023-0${(i % 9) + 1}-15` : st.datum,
  }));

const stressAkcije = (s: Snapshot): Snapshot["akcije"] =>
  many(s.akcije, 60, (a, i) => ({
    id: `${a.id}-${i}`,
    modul: a.vrsta === "Delegacija" ? a.modul : MODULES[i % MODULES.length],
    vrsta: a.vrsta === "Delegacija" ? a.vrsta : `${LONG_ACTION_KIND} ${i % 4}`,
    akcija: LONG_ACTION_VERB,
    naslov: LONG_TITLE,
    broj: a.vrsta === "Delegacija" ? LONG_NAMES[i % LONG_NAMES.length] : LONG_NUMBER,
    detalj: `${UNBREAKABLE} · ${LONG_TITLE}`,
    datum: a.hitnost === "KASNI" ? "2023-01-02" : a.datum,
  }));

/** The worst-case copy of `s`. */
export const stressSnapshot = (s: Snapshot): Snapshot => ({
  ...s,
  meta: {
    ...s.meta,
    sedmica: 53,
    osoba: {
      ...s.meta.osoba,
      ime: LONG_PERSON,
      radnoMjesto: "Rukovodilac službe za održavanje toplotnih podstanica i distributivne mreže",
      sektor: "Sektor tehničkih poslova, investicija i razvoja — Područna jedinica Zenica-Doboj",
    },
    zadaciSedmice: { otvoreni: 12345, zavrseni: 9876 },
  },
  stavke: stressStavke(s),
  akcije: stressAkcije(s),
  obavijesti: s.obavijesti.map((o) => ({ ...o, naslov: `${LONG_TITLE} ${UNBREAKABLE}`, poruka: LONG_TITLE })),
  email: {
    ...s.email,
    odSinoc: { ...s.email.odSinoc, ukupno: 99999, traziOdgovor: 45678, odobrenja: 12345, sastanci: 9999, zaZnanje: 31977, cekamOd: 12345, probijenRok: 9999 },
    cekaOdluku: 123456,
    inbox: s.email.inbox.map((m) => ({
      ...m,
      od: "Kantonalna uprava za inspekcijske poslove Kantona Sarajevo — Inspektorat za zaštitu od požara i spašavanje",
      sazetak: `${LONG_TITLE} ${UNBREAKABLE}`,
    })),
    sanducici: s.email.sanducici.map((m) => ({ ...m, adresa: LONG_EMAIL })),
  },
  nalozi: many(s.nalozi, 40, (n, i) => ({
    broj: n.broj ? `RN-2026-${String(i).padStart(6, "0")}-${n.broj}` : n.broj,
    rok: n.rok && n.rok < s.meta.danas ? "2021-03-01" : n.rok,
    predmetRada: LONG_TITLE,
    objekat: "Toplotna podstanica TPS-Alipašino Polje C-faza, blok 7, podrum ulaza 3",
    odgovorniServiser: LONG_NAMES[i % LONG_NAMES.length],
  })),
  skladiste: {
    pokazatelji: { ispodSignalne: 12345, ispodMinimuma: 6789, naNuli: 4321, uZahtjevu: 9876, uGranicama: 123456 },
    ispodGranica: s.skladiste.ispodGranica.map((a) => ({
      ...a,
      naziv: "Ventil kuglasti prirubnički DN250 PN16 od nehrđajućeg čelika sa elektromotornim pogonom i krajnjim prekidačima",
      skladiste: "Centralno skladište rezervnih dijelova i potrošnog materijala — Rajlovac, hala 4",
      raspolozivo: 123456,
      min: 999999,
    })),
  },
  tim: {
    clanovi: Array.from({ length: 1250 }, (_, i) => ({ id: `t-${i}`, ime: LONG_NAMES[i % LONG_NAMES.length], radnoMjesto: "SERVISER" })),
    odsustva: Array.from({ length: 40 }, (_, i) => ({
      zaposlenik: `t-${i}`,
      vrsta: i % 2 ? "BOLOVANJE" : "NEPLACENO",
      datumOd: "2026-01-01",
      datumDo: "2026-12-31",
      status: i % 3 ? "ODOBREN" : "PODNESEN",
    })),
  },
});
