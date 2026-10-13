import { useLocation, useParams } from "react-router";
import { LuPlugZap } from "react-icons/lu";
import { Page } from "~/components/Page";
import { Panel } from "~/components/Panel";
import { TopBar } from "~/components/TopBar";
import { activeSection, activeSubItem, appForPath } from "~/lib/apps";
import { SCREENS } from "~/lib/skladiste/registar";
import { SNAPSHOT } from "~/lib/snapshot";

/**
 * One list screen of the warehouse, such as Prijem › Prijemnice. The top bar names
 * it from the menu; the screen's entry in `SCREENS` draws the rest.
 */
export default function SkladisteEkran() {
  const { sekcija = "", ekran = "" } = useParams();
  const { pathname } = useLocation();
  const app = appForPath(pathname);
  const section = activeSection(app, pathname);
  const screen = activeSubItem(section, pathname);
  const entry = SCREENS[`${sekcija}/${ekran}`];

  return (
    <Page fill>
      <TopBar
        title={[section?.label, screen?.label].filter(Boolean).join(" › ") || app.label}
        status={screen?.description}
        startAt={SNAPSHOT.meta.sada}
      />
      {entry ? (
        // A new screen starts with its own filters, search and page.
        <entry.List key={`${sekcija}/${ekran}`} />
      ) : (
        <Panel
          fill
          icon={LuPlugZap}
          title={`${screen?.label ?? ekran} još nije povezan`}
          description="Ekran postoji u meniju; podaci iz divetiq-cicak se tek povezuju."
          className="flex-1"
        />
      )}
    </Page>
  );
}
