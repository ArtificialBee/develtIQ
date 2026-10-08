import { useState } from "react";
import { KpiTable } from "~/components/KpiTable";
import { Page } from "~/components/Page";
import { SegmentedTabs } from "~/components/SegmentedTabs";
import { TopBar } from "~/components/TopBar";
import { VolumeList } from "~/components/VolumeList";
import { BUSINESS_INDEX, MODULE_KPIS, MONTHS } from "~/lib/kpi";
import { VOLUMES } from "~/lib/kpi-page";
import { SNAPSHOT } from "~/lib/snapshot";

type Section = "pokazatelji" | "obim";

const lastIndex = BUSINESS_INDEX.values[BUSINESS_INDEX.values.length - 1];

/** Detailed KPI status and processing volume by module. */
export default function Pokazatelji() {
  const [section, setSection] = useState<Section>("pokazatelji");
  const shown = (item: Section) => (section === item ? "flex flex-1" : "hidden");

  return (
    <Page fill>
      <TopBar
        title="Pokazatelji i obim"
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
        label="Podaci poslovanja"
        className="lg:hidden"
        value={section}
        onChange={setSection}
        tabs={[
          { key: "pokazatelji", label: "Pokazatelji" },
          { key: "obim", label: "Obim obrade" },
        ]}
      />

      <div className={`${shown("pokazatelji")} min-h-0 flex-col lg:flex lg:flex-1`}>
        <KpiTable fill className="flex-1" />
      </div>
      <div className={`${shown("obim")} min-h-0 flex-col lg:flex lg:flex-1`}>
        <VolumeList
          title="Obim obrade po modulu"
          description="Ovaj mjesec naspram prošlog; godina naspram cilja."
          rows={VOLUMES}
          className="flex-1"
        />
      </div>
    </Page>
  );
}
