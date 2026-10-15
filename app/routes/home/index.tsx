import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router";
import { TopBar } from "~/components/TopBar";
import { Page, ScrollArea } from "~/components/Page";
import { SegmentedTabs } from "~/components/SegmentedTabs";
import { StatGrid } from "~/components/StatCard";
import { VolumeTrend } from "~/components/VolumeTrend";
import { WorkItemTable } from "~/components/WorkItemTable";
import { APPS } from "~/lib/apps";
import { PROCESSING_VOLUMES } from "~/lib/kpi";
import { stagger } from "~/lib/motion";
import { homeView } from "~/lib/moj-dan";
import { SNAPSHOT } from "~/lib/snapshot";
import { stressSnapshot } from "~/lib/stress-snapshot";
import { WORK_ITEMS } from "~/lib/work-items";

type Section = "dan" | "sluzba" | "trend";

// The person runs the service unit, so the chart is its output: completed work orders.
const NALOZI = PROCESSING_VOLUMES.find((volume) => volume.moduleKey === "nalozi");
const NALOZI_APP = APPS.find((app) => app.key === "nalozi");

/**
 * The home page's first screen fits the view: from `lg` every section shares the
 * height; below it, one section at a time fills it and tabs switch them. The
 * person's items in a table follow under it, and the area under the top bar scrolls.
 */
export default function Home() {
  // `?data=stress` swaps in the worst-case data, to check that nothing breaks.
  const [params] = useSearchParams();
  const stress = params.get("data") === "stress";
  const view = useMemo(() => homeView(stress ? stressSnapshot(SNAPSHOT) : SNAPSHOT), [stress]);
  const { osoba, prekinut } = view;
  const [section, setSection] = useState<Section>("dan");
  const shown = (s: Section) => (section === s ? "flex flex-1" : "hidden");

  return (
    <Page fill>
      <TopBar
        name={osoba.ime}
        startAt={osoba.sada}
        alert={prekinut && `Sandučić ${prekinut.adresa} je prekinut`}
      />

      <SegmentedTabs<Section>
        label="Dijelovi početne"
        className="lg:hidden"
        value={section}
        onChange={setSection}
        tabs={[
          { key: "dan", label: "Moji zadaci" },
          { key: "sluzba", label: "Po aplikacijama" },
          { key: "trend", label: "Radni nalozi" },
        ]}
      />

      <ScrollArea
        more={
          // Under the first screen: the items themselves, in the app's one table.
          <div className="flex h-[36rem] flex-col">
            <WorkItemTable items={WORK_ITEMS} className="flex-1" />
          </div>
        }
      >
        {/* Both rows count the same thing, the person's open items: by deadline, then by app.
            The cards are only as tall as their lines; the chart gets the rest of the screen. */}
        <div className={`${shown("dan")} min-h-0 flex-col lg:flex lg:flex-none`}>
          <StatGrid
            fill
            minimal
            label="Moji zadaci"
            title="Moji zadaci"
            description="Sve što traži tebe, iz svih aplikacija, po roku."
            stats={view.zadaci}
            className="flex-1"
          />
        </div>

        <div className={`${shown("sluzba")} min-h-0 flex-col lg:flex lg:flex-none`}>
          <StatGrid
            fill
            minimal
            label="Po aplikacijama"
            title="Po aplikacijama"
            description="Isti zadaci, po aplikaciji iz koje dolaze."
            stats={view.poAplikaciji}
            className="flex-1"
          />
        </div>

        {NALOZI && NALOZI_APP && (
          <motion.div
            variants={stagger(0.08)}
            className={`${section === "trend" ? "grid flex-1" : "hidden"} min-h-0 grid-cols-1 grid-rows-1 lg:grid lg:flex-1`}
          >
            <VolumeTrend
              volume={NALOZI}
              icon={NALOZI_APP.icon}
              title={`${NALOZI_APP.label} · ${NALOZI.label.toLocaleLowerCase("bs")} po mjesecu`}
              link={{ label: `Otvori ${NALOZI_APP.label}`, url: NALOZI_APP.url }}
              className="min-w-0"
            />
          </motion.div>
        )}
      </ScrollArea>
    </Page>
  );
}
