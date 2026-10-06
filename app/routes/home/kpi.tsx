import { useState } from "react";
import { motion } from "framer-motion";
import { InsightList } from "~/components/InsightList";
import { KpiTable } from "~/components/KpiTable";
import { Page } from "~/components/Page";
import { RevenueBars } from "~/components/RevenueBars";
import { SegmentedTabs } from "~/components/SegmentedTabs";
import { StatGrid } from "~/components/StatCard";
import { TopBar } from "~/components/TopBar";
import { VolumeList } from "~/components/VolumeList";
import { BUSINESS_INDEX, MODULE_KPIS, MONTHS } from "~/lib/kpi";
import { EXECUTIVE_READ, KPI_STATS, PULSE, VOLUMES } from "~/lib/kpi-page";
import { stagger } from "~/lib/motion";
import { SNAPSHOT } from "~/lib/snapshot";

type Section = "pregled" | "puls" | "pokazatelji";

// Green on or above the goal, amber in the warning band (85–99), red under it.
const barTone = (value: number) =>
  value >= BUSINESS_INDEX.target ? "fill-emerald-400" : value >= BUSINESS_INDEX.target * 0.85 ? "fill-amber-400" : "fill-red-400";

const lastIndex = BUSINESS_INDEX.values[BUSINESS_INDEX.values.length - 1];

/**
 * How the business follows its plan. Like the home page it fills the screen and
 * never scrolls: from `lg` the 3 rows share the height; below it, tabs switch them.
 */
export default function KPI() {
  const [section, setSection] = useState<Section>("pregled");
  const shown = (s: Section) => (section === s ? "flex flex-1" : "hidden");
  const shownGrid = (s: Section) => (section === s ? "grid flex-1" : "hidden");

  return (
    <Page fill>
      <TopBar
        title="Praćenje performansi"
        status={`Podaci za ${MONTHS[0]}–${MONTHS[MONTHS.length - 1]} 2026 · ${MODULE_KPIS.length} praćenih pokazatelja`}
        startAt={SNAPSHOT.meta.sada}
        gauge={{
          value: lastIndex,
          target: BUSINESS_INDEX.target,
          label: "Poslovni indeks",
          caption: `${lastIndex} od ${BUSINESS_INDEX.target}`,
        }}
      />

      <SegmentedTabs<Section>
        label="Dijelovi stranice"
        className="lg:hidden"
        value={section}
        onChange={setSection}
        tabs={[
          { key: "pregled", label: "Pregled" },
          { key: "puls", label: "Puls" },
          { key: "pokazatelji", label: "Pokazatelji" },
        ]}
      />

      <div className={`${shown("pregled")} min-h-0 flex-col lg:flex lg:flex-[3]`}>
        <StatGrid fill label="Ključni pokazatelji" stats={KPI_STATS} className="flex-1" />
      </div>

      <motion.div
        variants={stagger(0.08)}
        className={`${shownGrid("puls")} min-h-0 grid-cols-1 grid-rows-2 gap-3 lg:grid lg:flex-[3] lg:grid-cols-3 lg:grid-rows-1 lg:gap-4`}
      >
        <RevenueBars
          fill
          className="lg:col-span-2"
          title="Poslovni puls — indeks kroz godinu, naspram cilja"
          categories={PULSE.categories}
          series={PULSE.series}
          ticks={[0, 25, 50, 75, 100, 125]}
          target={PULSE.target}
          barTone={barTone}
          notes={PULSE.notes}
          formatValue={(value) => String(value)}
          seriesGroupLabel="Godina"
          categoryHeading="Mjesec"
          valueHeading="Indeks"
          unitNote="100 znači tačno po planu"
          showValue={false}
        />
        <InsightList title="Izvršni pregled" description="Šta brojke znače, iz istih podataka." items={EXECUTIVE_READ} />
      </motion.div>

      <motion.div
        variants={stagger(0.08)}
        className={`${shownGrid("pokazatelji")} min-h-0 grid-cols-1 grid-rows-[3fr_2fr] gap-3 lg:grid lg:flex-[5] lg:grid-cols-3 lg:grid-rows-1 lg:gap-4`}
      >
        <KpiTable fill className="lg:col-span-2" />
        <VolumeList
          title="Obim obrade po modulu"
          description="Ovaj mjesec naspram prošlog; godina naspram cilja."
          rows={VOLUMES}
        />
      </motion.div>
    </Page>
  );
}
