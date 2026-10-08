import { useState } from "react";
import { motion } from "framer-motion";
import { InsightList } from "~/components/InsightList";
import { Page } from "~/components/Page";
import { RevenueBars } from "~/components/RevenueBars";
import { SegmentedTabs } from "~/components/SegmentedTabs";
import { StatGrid } from "~/components/StatCard";
import { TopBar } from "~/components/TopBar";
import { BUSINESS_INDEX, MODULE_KPIS, MONTHS } from "~/lib/kpi";
import { EXECUTIVE_READ, KPI_STATS, PULSE } from "~/lib/kpi-page";
import { stagger } from "~/lib/motion";
import { SNAPSHOT } from "~/lib/snapshot";

type Section = "pregled" | "puls";

// Green on or above the goal, amber in the warning band (85–99), red under it.
const barTone = (value: number) =>
  value >= BUSINESS_INDEX.target ? "fill-emerald-400" : value >= BUSINESS_INDEX.target * 0.85 ? "fill-amber-400" : "fill-red-400";

const lastIndex = BUSINESS_INDEX.values[BUSINESS_INDEX.values.length - 1];

/**
 * How the business follows its plan. The overview and pulse fill the page; below
 * `lg`, tabs switch between them.
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
        ]}
      />

      <div className={`${shown("pregled")} min-h-0 flex-col lg:flex lg:flex-[3]`}>
        <StatGrid fill label="Ključni pokazatelji" stats={KPI_STATS} className="flex-1" />
      </div>

      <motion.div
        variants={stagger(0.08)}
        className={`${shownGrid("puls")} min-h-0 grid-cols-1 grid-rows-2 gap-3 lg:grid lg:flex-[4] lg:grid-cols-4 lg:grid-rows-1 lg:gap-4`}
      >
        <RevenueBars
          fill
          className="lg:col-span-3"
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

    </Page>
  );
}
