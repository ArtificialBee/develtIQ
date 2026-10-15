import { useState } from "react";
import { Link } from "react-router";
import { LuCheck, LuQrCode } from "react-icons/lu";
import { Panel } from "~/components/Panel";
import { Table, type TableColumn } from "~/components/Table";
import naljepniceData from "~/data/skladiste/naljepnice.json";
import primjeriData from "~/data/skladiste/naljepnice-primjeri.json";
import type { Screen } from "~/lib/skladiste/ekrani";
import { Uvod } from "~/lib/skladiste/ekrani/plocice";
import { oznaka } from "~/lib/skladiste/podaci";
import type { Naljepnica, NaljepniceExport, PostavkaNaljepnica, VrstaKoda } from "~/lib/skladiste/types";
import { Napomene } from "~/lib/skladiste/zajednicko";

/**
 * Skladište › Postavke › Naljepnice, from cicak's `NaljepnicePage` and its
 * `PostavkaVrsteKoda` card: which code the module's labels carry. Three choices, each
 * showing a real label of the module in that code, then every sample label in all
 * three codes. The previews are cicak's own label pages (`primjerNaljepnice`), exported.
 */

/** One sample label of the page, as `naljepnice-primjeri.json` holds it. */
interface Primjer {
  naljepnica: Naljepnica;
  /** Whether its Code 128 bars come out dense (cicak's `gustBarkod`). */
  gustBarkod: boolean;
  /** The preview page of the label in each code kind. */
  html: Record<VrstaKoda, string>;
}

const PRIMJERI = primjeriData as unknown as Primjer[];
const POSTAVKE = (naljepniceData as unknown as NaljepniceExport).postavke;
const MODUL = "skladiste/naljepnice-ispis.ts";
const VRSTE = oznaka<VrstaKoda[]>(MODUL, "VRSTE_KODA");
const LABELS = oznaka<Record<VrstaKoda, string>>(MODUL, "VRSTA_KODA_LABELS");
const OPISI = oznaka<Record<VrstaKoda, string>>(MODUL, "VRSTA_KODA_OPIS");

/** The module's setting, or cicak's default when it was never changed. */
const POSTAVKA: PostavkaNaljepnica = POSTAVKE.find((p) => p.id === "skladiste") ?? { id: "skladiste", vrsta: "QR_BARKOD" };

/** One label at its real size (70 × 37 mm = 266 × 141 px), scaled to fit where it is shown. */
const Pregled = ({ primjer, vrsta, mjera }: { primjer: Primjer; vrsta: VrstaKoda; mjera: number }) => (
  <div className="relative shrink-0 overflow-hidden" style={{ width: 266 * mjera, height: 141 * mjera }}>
    <iframe
      title={`Primjer: ${primjer.naljepnica.naslov}`}
      srcDoc={primjer.html[vrsta]}
      className="pointer-events-none absolute left-0 top-0 h-[141px] w-[266px] origin-top-left border-0"
      style={{ transform: `scale(${mjera})` }}
      tabIndex={-1}
      sandbox=""
    />
  </div>
);

const LINK = "underline underline-offset-2 hover:text-[#3B9DF8]";

function List() {
  // Picking a code here shows it at once; it is not saved anywhere (cicak saves it for the module).
  const [vrsta, setVrsta] = useState<VrstaKoda>(POSTAVKA.vrsta);
  const [prvi] = PRIMJERI;
  const gusti = vrsta === "BARKOD" ? PRIMJERI.filter((p) => p.gustBarkod) : [];

  const kolone: TableColumn<Primjer>[] = [
    {
      key: "naljepnica",
      header: "Naljepnica",
      render: ({ naljepnica }) => (
        <span className="block whitespace-nowrap">
          <span className="block text-sm text-gray-900">{naljepnica.naslov}</span>
          {naljepnica.naslov !== naljepnica.kod && <span className="block font-mono text-xs text-gray-500">{naljepnica.kod.split("|").join(" · ")}</span>}
        </span>
      ),
    },
    ...VRSTE.map(
      (v): TableColumn<Primjer> => ({
        key: v,
        header: v === vrsta ? `${LABELS[v]} · izabrano` : LABELS[v],
        render: (primjer) => <Pregled primjer={primjer} vrsta={v} mjera={0.6} />,
        className: v === vrsta ? "bg-[#3B9DF8]/5" : "",
      }),
    ),
  ];

  return (
    <>
      <Uvod napomena="Kod na naljepnicama artikala, lokacija i serija" />
      <Panel
        fill
        icon={LuQrCode}
        title="Vrsta koda na naljepnicama"
        action={
          <p className="shrink-0 text-xs text-gray-500">
            {POSTAVKA.izmijenio ? `Promijenio: ${POSTAVKA.izmijenio} · ${POSTAVKA.izmijenjeno?.replace("T", " ").slice(0, 16) ?? ""}` : "Početna postavka modula"}
          </p>
        }
        className="min-h-0 flex-1"
      >
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto">
          <p className="max-w-prose text-sm text-gray-500">
            Bira se jednom za cijeli modul. Svako dugme za štampu naljepnica štampa s ovim kodom, bez pitanja. Oba koda nose isti tekst, pa sken daje isti rezultat.
          </p>
          <div role="radiogroup" aria-label="Vrsta koda na naljepnicama" className="grid shrink-0 grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3">
            {VRSTE.map((v) => {
              const izabrano = v === vrsta;
              return (
                <label
                  key={v}
                  className={`relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-white/70 p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#3B9DF8] ${
                    izabrano ? "border-[#3B9DF8] ring-1 ring-[#3B9DF8]" : "border-[#e5eaf2] hover:border-slate-300"
                  }`}
                >
                  <input type="radio" name="vrsta-koda" value={v} checked={izabrano} onChange={() => setVrsta(v)} className="sr-only" />
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">{LABELS[v]}</span>
                    <span
                      aria-hidden
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        izabrano ? "border-[#3B9DF8] bg-[#3B9DF8] text-white" : "border-gray-300"
                      }`}
                    >
                      {izabrano && <LuCheck className="size-3.5" />}
                    </span>
                  </span>
                  {prvi && (
                    <span className="flex justify-center rounded-lg border border-[#e5eaf2] bg-white p-2">
                      <Pregled primjer={prvi} vrsta={v} mjera={0.8} />
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{OPISI[v]}</span>
                </label>
              );
            })}
          </div>
          {gusti.length > 0 && (
            <p className="text-xs text-amber-700">
              Dugi kodovi (lot, serija) daju gust barkod — štampajte ih na printeru od najmanje 300 dpi, ili odaberite „QR kod i barkod”.
            </p>
          )}
          {PRIMJERI.length > 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500">
                Sve naljepnice modula u sva tri koda (umanjeno; stvarna veličina 70 × 37 mm, 24 na listu A4). Izabrani kod je označen.
              </p>
              <Table bare columns={kolone} rows={PRIMJERI} getRowKey={(p) => p.naljepnica.kod} className="rounded-xl border border-[#e5eaf2] bg-white" />
            </div>
          )}
        </div>
      </Panel>
      <Napomene
        stavke={[
          <>
            Naljepnice se štampaju iz{" "}
            <Link to="/app/skladiste/zalihe/artikli" className={LINK}>
              Artikala
            </Link>{" "}
            (i s kartice artikla), iz{" "}
            <Link to="/app/skladiste/postavke/skladista" className={LINK}>
              Skladišta i lokacija
            </Link>{" "}
            (lokacije i regali) i s{" "}
            <Link to="/app/skladiste/prijem/prijemnice" className={LINK}>
              prijemnice
            </Link>{" "}
            (serije i lotovi, poslije knjiženja).
          </>,
          "Artikl se skenira i po barkodu proizvođača (EAN) — on je već na robi i ne štampa se ovdje.",
          "Skener u načinu tastature piše kroz raspored tastature računara: ako je podešen na američku, a računar na bosansku, i dalje se čita.",
        ]}
      />
    </>
  );
}

/** Postavke › Naljepnice ("postavke/naljepnice"). */
export const NALJEPNICE_EKRAN: Screen = { List };
