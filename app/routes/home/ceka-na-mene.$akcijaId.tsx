import { useMemo } from "react";
import { Navigate, useParams } from "react-router";
import { AkcijaDetails } from "~/components/AkcijaDetails";
import { Page } from "~/components/Page";
import { TopBar } from "~/components/TopBar";
import { MODUL_LABELS, SNAPSHOT, kratkiDatum } from "~/lib/snapshot";

const modulLabel = (key: string) =>
  MODUL_LABELS[key] ??
  key.replaceAll("-", " ").replace(/^\w/, (letter) => letter.toUpperCase());

/** One of the actions behind "Čeka na mene". The id in the URL selects which. */
export default function CekaNaMeneDetalji() {
  const { akcijaId } = useParams<{ akcijaId: string }>();
  const akcija = useMemo(
    () => SNAPSHOT.akcije.find((a) => a.id === akcijaId),
    [akcijaId],
  );

  if (!akcija) {
    return <Navigate to="/home/ceka-na-mene" replace />;
  }

  const kasni = akcija.hitnost === "KASNI";

  return (
    <Page fill>
      <TopBar
        title={`${akcija.vrsta}${akcija.broj ? ` · ${akcija.broj}` : ""}`}
        status={`${modulLabel(akcija.modul)} · Primljeno ${kratkiDatum(akcija.kada)}`}
        startAt={SNAPSHOT.meta.sada}
        alert={kasni ? `${akcija.vrsta} kasni${akcija.datum ? ` od ${kratkiDatum(akcija.datum)}` : ""}` : undefined}
      />
      <AkcijaDetails
        akcija={akcija}
        backTo="/home/ceka-na-mene"
        backLabel="Natrag na listu"
      />
    </Page>
  );
}
