import { useState } from "react";
import { motion } from "framer-motion";
import { LuGauge, LuLayers } from "react-icons/lu";
import { CHART_COLORS, Chart, type ChartSeries } from "~/components/Chart";
import { ChartPanel } from "~/components/ChartPanel";
import { Page, ScrollArea } from "~/components/Page";
import { SegmentedTabs } from "~/components/SegmentedTabs";
import { StatGrid } from "~/components/StatCard";
import { TopBar } from "~/components/TopBar";
import { VolumeTrend } from "~/components/VolumeTrend";
import { MODULE_KPIS, MONTHS, TOTAL_PROCESSING_VOLUME } from "~/lib/kpi";
import { KPI_STATS, PULSE } from "~/lib/kpi-page";
import { stagger } from "~/lib/motion";
import { SNAPSHOT } from "~/lib/snapshot";

type Section = "pregled" | "puls";

const [indeks] = PULSE.series;
const pulseSeries: ChartSeries[] = [
  { key: "indeks", label: "Indeks", values: indeks.values, kind: "bar", color: CHART_COLORS.actual },
  { key: "cilj", label: `Cilj ${PULSE.target}`, values: indeks.values.map(() => PULSE.target), kind: "target", color: CHART_COLORS.target },
];
const last = indeks.values[indeks.values.length - 1];

/**
 * How the business follows its plan. The overview and pulse fill the first screen;
 * below `lg`, tabs switch between them. What the whole company processed each
 * month follows under it, and the area under the top bar scrolls.
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

      <ScrollArea
        more={
          // Under the first screen: the work behind the index, all apps together, against its target.
          <div className="flex h-[30rem] flex-col">
            <VolumeTrend
              volume={TOTAL_PROCESSING_VOLUME}
              icon={LuLayers}
              title="Ukupna obrada po mjesecu, sve aplikacije"
              link={{ label: "Po modulima", url: "/home/pokazatelji" }}
              className="flex-1"
            />
          </div>
        }
      >
        <div className={`${shown("pregled")} min-h-0 flex-col lg:flex lg:flex-[3]`}>
          <StatGrid fill label="Ključni pokazatelji" stats={KPI_STATS} className="flex-1" />
        </div>

        <motion.div
          variants={stagger(0.08)}
          className={`${shownGrid("puls")} min-h-0 grid-cols-1 grid-rows-1 lg:grid lg:flex-[4]`}
        >
          <ChartPanel
            icon={LuGauge}
            title="Poslovni puls — indeks kroz godinu, naspram cilja"
            description={`${MONTHS[0]}–${MONTHS[indeks.values.length - 1]} 2026 · 100 znači tačno po planu`}
            series={pulseSeries}
            summary={
              <>
                {MONTHS[indeks.values.length - 1]} <span className="font-semibold text-gray-900">{last}</span> od cilja {PULSE.target}{" "}
                <span className={last >= PULSE.target ? "text-emerald-600" : "text-amber-600"}>({Math.round((last / PULSE.target) * 100)}%)</span>
              </>
            }
            className="min-w-0"
          >
            <Chart
              label={`Poslovni indeks po mjesecu naspram cilja ${PULSE.target}`}
              labels={PULSE.categories.slice(0, indeks.values.length)}
              series={pulseSeries}
              className="h-full"
            />
          </ChartPanel>
        </motion.div>
      </ScrollArea>
    </Page>
  );
}
