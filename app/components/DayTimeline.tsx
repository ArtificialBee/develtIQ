import type { IconType } from "react-icons";
import { FitList, FitListPager } from "~/components/FitList";
import { ListRow } from "~/components/ListRow";
import { Panel } from "~/components/Panel";
import { useFitList } from "~/hooks/useFitList";
import { dayPercent, dayRange, daySchedule, nextItem, toMinutes, type Day } from "~/lib/day";

export interface DayTimelineProps {
  day: Day;
  title: string;
  description?: string;
  icon?: IconType;
  className?: string;
}

const ROW = 46;
// A list column needs about this much room; a wide card holds several side by side.
const COLUMN = 300;

/**
 * The day at a glance: a thin line across the day's hours, filled up to now, with a
 * dot at each item's time. The list under it says what the dots are.
 */
const DayStrip = ({ day }: { day: Day }) => {
  const range = dayRange(day);
  const at = (minutes: number) => `${dayPercent(minutes, range)}%`;
  const nowMinutes = day.now ? toMinutes(day.now) : null;
  const labels = range.hours.filter((hour, i) => i === 0 || i === range.hours.length - 1 || hour % 2 === 0);

  return (
    <div aria-hidden className="relative mb-3 h-7 shrink-0">
      {labels.map((hour, i) => (
        <span
          key={hour}
          style={{ left: at(hour * 60) }}
          className={`absolute top-0 font-mono text-[10px] tabular-nums text-gray-400 dark:text-white/40 ${i === 0 ? "" : i === labels.length - 1 ? "-translate-x-full" : "-translate-x-1/2"} ${nowMinutes !== null && Math.abs(hour * 60 - nowMinutes) < 40 ? "invisible" : ""}`}
        >
          {String(hour).padStart(2, "0")}
        </span>
      ))}
      <div className="absolute inset-x-0 top-[19px] h-1 rounded-full bg-gray-200 dark:bg-white/[0.07]" />
      {nowMinutes !== null && (
        <div className="absolute left-0 top-[19px] h-1 rounded-full bg-linear-to-r from-cyan-400 to-[#3B9DF8]" style={{ width: at(nowMinutes) }} />
      )}
      {day.timed.map((item) => {
        const time = item.time ?? "00:00";
        const past = day.now !== undefined && time < day.now;
        return (
          <span
            key={item.key}
            style={{ left: at(toMinutes(time)) }}
            className={`absolute top-[16px] size-2.5 -translate-x-1/2 rounded-full ring-2 ring-white dark:ring-slate-900 ${past ? "bg-gray-400 dark:bg-slate-500" : "bg-[#3B9DF8]"}`}
          />
        );
      })}
      {nowMinutes !== null && (
        <>
          <span style={{ left: at(nowMinutes) }} className="absolute top-0 -translate-x-1/2 font-mono text-[10px] font-semibold tabular-nums text-[#3B9DF8]">
            {day.now}
          </span>
          <span
            style={{ left: at(nowMinutes) }}
            className="absolute top-[14px] size-3.5 -translate-x-1/2 rounded-full bg-white ring-[3px] ring-[#3B9DF8] shadow-[0_0_12px_2px_rgba(59,157,248,0.6)] dark:bg-slate-950"
          />
        </>
      )}
    </div>
  );
};

/**
 * One day's schedule in a card, and only that: a strip showing where the day's
 * items fall and where now is, and the items as a list in time order, in as many
 * columns as the card's width allows. Past items are faded; the next one is marked.
 * It fills its box and never scrolls; the rest is paged.
 */
export const DayTimeline = ({ day, title, description, icon, className }: DayTimelineProps) => {
  const schedule = daySchedule(day);
  const next = nextItem(day);
  const fit = useFitList(schedule, ROW, 0, COLUMN);

  return (
    <Panel title={title} description={description} icon={icon} className={className} fill action={<FitListPager fit={fit} label={title} />}>
      <div className="flex h-full min-h-0 flex-col">
        <DayStrip day={day} />
        <div className="min-h-0 flex-1">
          <FitList
            fit={fit}
            getKey={(item) => item.key}
            rowHeight={ROW}
            emptyText="Ništa nije zakazano."
            renderItem={(item) => (
              <ListRow
                leading={item.time ?? "Dan"}
                icon={item.icon}
                title={item.title}
                meta={item === next ? `Sljedeće · ${item.meta}` : item.meta}
                tone={item === next ? "accent" : undefined}
                muted={day.now !== undefined && item.time !== undefined && item.time < day.now}
              />
            )}
          />
        </div>
      </div>
    </Panel>
  );
};
