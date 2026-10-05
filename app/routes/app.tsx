import { useLocation } from "react-router";
import { LuConstruction } from "react-icons/lu";
import { Page } from "~/components/Page";
import { Panel } from "~/components/Panel";
import { TopBar } from "~/components/TopBar";
import { activeSection, activeSubItem, appForPath } from "~/lib/apps";
import { SNAPSHOT } from "~/lib/snapshot";

/**
 * A screen from an app that edvin has not built yet. The sidebar already shows
 * where it sits; this page names it with its path and what it is for.
 */
export default function AppPlaceholder() {
  const { pathname } = useLocation();
  const app = appForPath(pathname);
  const section = activeSection(app, pathname);
  const screen = activeSubItem(section, pathname);
  const path = [app.label, section?.label, screen?.label].filter(Boolean).join(" › ");
  const name = screen?.label ?? section?.label ?? app.label;

  return (
    <Page fill>
      <TopBar
        title={path}
        status={screen?.description ?? "Modul još nije prenesen u edvin"}
        startAt={SNAPSHOT.meta.sada}
      />
      <Panel
        fill
        title={`${name} dolazi uskoro`}
        description="Navigacija je ista kao u divetiq-cicak. Sam ekran još nije napravljen."
        icon={LuConstruction}
        className="flex-1"
      />
    </Page>
  );
}
