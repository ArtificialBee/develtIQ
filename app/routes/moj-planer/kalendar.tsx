import { useMemo } from "react";
import { LuCalendarClock, LuCalendarDays } from "react-icons/lu";
import { DayTimeline } from "~/components/DayTimeline";
import { Page } from "~/components/Page";
import { TopBar } from "~/components/TopBar";
import { formatDate } from "~/lib/home";
import { homeView } from "~/lib/moj-dan";
import { SNAPSHOT } from "~/lib/snapshot";

const dateLabel = (iso: string) => formatDate(new Date(`${iso}T12:00:00`));

/**
 * Moj planer › Kalendar: today and tomorrow, each on the day timeline the home page
 * uses for "Tok dana", with more room for rows. Fills the screen, never scrolls.
 */
export default function MojPlanerKalendar() {
  const view = useMemo(() => homeView(SNAPSHOT), []);
  const today = SNAPSHOT.meta.danas;
  const tomorrow = new Date(Date.parse(today) + 86_400_000).toISOString().slice(0, 10);

  return (
    <Page fill>
      <TopBar
        title="Moj planer › Kalendar"
        status={`${view.osoba.ime} · ${view.osoba.uloga}`}
        startAt={SNAPSHOT.meta.sada}
      />
      {/* grid-cols-1 caps the column at the page width; an automatic column would grow to fit the longest title. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[3fr_2fr] gap-3 lg:gap-4">
        <DayTimeline day={view.danas} title={`Danas · ${dateLabel(today)}`} description="Raspored po satima." icon={LuCalendarClock} />
        <DayTimeline day={view.sutra} title={`Sutra · ${dateLabel(tomorrow)}`} description="Ono što je već zakazano." icon={LuCalendarDays} />
      </div>
    </Page>
  );
}
