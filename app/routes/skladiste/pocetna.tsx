import { Page } from "~/components/Page";
import { TopBar } from "~/components/TopBar";
import { POCETNA_PODNASLOV, SkladistePocetnaView } from "~/lib/skladiste/ekrani/pocetna";
import { SNAPSHOT } from "~/lib/snapshot";

/** The warehouse's home: its four cards and the documents waiting on the person, from the cicak data. */
export default function SkladistePocetna() {
  return (
    <Page fill>
      <TopBar title="Skladište" status={POCETNA_PODNASLOV} startAt={SNAPSHOT.meta.sada} />
      <SkladistePocetnaView />
    </Page>
  );
}
