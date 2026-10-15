import { useState } from "react";
import { LuTrendingUp } from "react-icons/lu";
import { CHART_COLORS, Chart, type ChartSeries } from "~/components/Chart";
import { ChartPanel } from "~/components/ChartPanel";
import { KpiTable } from "~/components/KpiTable";
import { Page, ScrollArea } from "~/components/Page";
import { SegmentedTabs } from "~/components/SegmentedTabs";
import { TopBar } from "~/components/TopBar";
import { VolumeBreakdown } from "~/components/VolumeBreakdown";
import { MODULE_KPIS, MONTHS } from "~/lib/kpi";
import { VOLUMES } from "~/lib/kpi-page";
import { SNAPSHOT } from "~/lib/snapshot";

type Section = "pokazatelji" | "obim";

// How much more or less each module processed this month than last, in percent: one unit for the chart.
const MODULES = VOLUMES.filter((row) => row.key !== "all");
const TOTAL = VOLUMES.find((row) => row.key === "all");
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value)}%`;
const changeSeries: ChartSeries[] = [
  { key: "promjena", label: "Promjena (%)", values: MODULES.map((row) => row.changePercent), kind: "bar", color: CHART_COLORS.actual },
];

/**
 * Detailed KPI status and processing volume by module on the first screen; how this
 * month compares with the last follows under it, and the area under the top bar scrolls.
 */
export default function Pokazatelji() {
  const [section, setSection] = useState<Section>("pokazatelji");
  const shown = (item: Section) => (section === item ? "flex flex-1" : "hidden");

  return (
    <Page fill>
      <TopBar
        title="Pokazatelji i obim"
        status={`Podaci za ${MONTHS[0]}–${MONTHS[MONTHS.length - 1]} 2026 · ${MODULE_KPIS.length} praćenih pokazatelja`}
        startAt={SNAPSHOT.meta.sada}
      />

      <SegmentedTabs<Section>
        label="Podaci poslovanja"
        className="lg:hidden"
        value={section}
        onChange={setSection}
        tabs={[
          { key: "pokazatelji", label: "Pokazatelji" },
          { key: "obim", label: "Obim obrade" },
        ]}
      />

      <ScrollArea
        more={
          <div className="flex h-[28rem] flex-col">
            <ChartPanel
              icon={LuTrendingUp}
              title="Promjena obrade naspram prošlog mjeseca"
              description={`${MONTHS[MONTHS.length - 2]} → ${MONTHS[MONTHS.length - 1]} 2026 · po modulu, u postotku`}
              series={changeSeries}
              summary={
                TOTAL && (
                  <>
                    Sve aplikacije <span className="font-semibold text-gray-900">{signed(TOTAL.changePercent)}</span>
                  </>
                )
              }
              className="flex-1"
            >
              <Chart
                label="Promjena obrade po modulu naspram prošlog mjeseca, u postotku"
                labels={MODULES.map((row) => row.module)}
                series={changeSeries}
                formatValue={signed}
                className="h-full"
              />
            </ChartPanel>
          </div>
        }
      >
        <div className={`${shown("pokazatelji")} min-h-0 flex-col lg:flex lg:flex-1`}>
          <KpiTable fill className="flex-1" />
        </div>
        <div className={`${shown("obim")} min-h-0 flex-col lg:flex lg:flex-1`}>
          <VolumeBreakdown className="flex-1" />
        </div>
      </ScrollArea>
    </Page>
  );
}
