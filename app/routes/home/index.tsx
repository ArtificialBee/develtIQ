import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router";
import { LuCalendarClock } from "react-icons/lu";
import { TopBar } from "~/components/TopBar";
import { NotificationFeed } from "~/components/NotificationFeed";
import { Page } from "~/components/Page";
import { SegmentedTabs } from "~/components/SegmentedTabs";
import { StatGrid } from "~/components/StatCard";
import { DayTimeline } from "~/components/DayTimeline";
import { stagger } from "~/lib/motion";
import { homeView } from "~/lib/moj-dan";
import { SNAPSHOT } from "~/lib/snapshot";
import { stressSnapshot } from "~/lib/stress-snapshot";

type Section = "dan" | "sluzba" | "tok";

/**
 * The home page fills the screen and never scrolls. From `lg` every section shares
 * the height; below it, one section at a time fills the screen and tabs switch them.
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
        role={osoba.uloga}
        week={osoba.sedmica}
        startAt={osoba.sada}
        alert={prekinut && `Sandučić ${prekinut.adresa} je prekinut`}
        gauge={{
          value: osoba.zadaci.zavrseni,
          target: osoba.zadaci.ukupno,
          label: "Zadaci sedmice",
          caption: `${osoba.zadaci.zavrseni} od ${osoba.zadaci.ukupno} završeno`,
        }}
      />

      <SegmentedTabs<Section>
        label="Dijelovi početne"
        className="lg:hidden"
        value={section}
        onChange={setSection}
        tabs={[
          { key: "dan", label: "Moj dan" },
          { key: "sluzba", label: "Služba" },
          { key: "tok", label: "Tok dana" },
        ]}
      />

      <div className={`${shown("dan")} min-h-0 flex-col lg:flex lg:flex-[3]`}>
        <StatGrid fill label="Moj dan" title="Moj dan" description="Šta traži tebe, šta kasni i šta je danas." stats={view.mojDan} className="flex-1" />
      </div>

      <div className={`${shown("sluzba")} min-h-0 flex-col lg:flex lg:flex-[3]`}>
        <StatGrid
          fill
          label={osoba.sektor}
          title={osoba.sektor}
          description="Nalozi, ljudi, dijelovi i ono što si predao drugima."
          stats={view.mojaSluzba}
          className="flex-1"
        />
      </div>

      <motion.div
        variants={stagger(0.08)}
        className={`${section === "tok" ? "grid flex-1" : "hidden"} min-h-0 grid-cols-1 grid-rows-2 gap-3 lg:grid lg:flex-[4] [@media(max-height:960px)]:lg:flex-[3] lg:grid-cols-3 lg:grid-rows-1 lg:gap-4`}
      >
        <DayTimeline
          day={view.danas}
          title="Tok dana"
          description="Današnji raspored po satima."
          icon={LuCalendarClock}
          className="lg:col-span-2"
        />
        <NotificationFeed items={view.obavjestenja} />
      </motion.div>
    </Page>
  );
}
