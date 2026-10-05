import type { IconType } from "react-icons";

/** One thing on a day's schedule: timed (has `time`) or all-day (no `time`). */
export interface DayItem {
  key: string;
  /** "HH:MM"; left out for an all-day item. */
  time?: string;
  title: string;
  meta: string;
  icon: IconType;
}

/** One day's schedule: what has an hour and what runs all day. Nothing else. */
export interface Day {
  label: string;
  timed: DayItem[];
  allDay: DayItem[];
  /** "HH:MM" of now when the day is today, else left out. */
  now?: string;
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** The hours to draw: from 07:00 or earlier to 17:00 or later, around every item and now. */
export const dayRange = (day: Pick<Day, "timed" | "now">) => {
  const minutes = [...day.timed.map((item) => toMinutes(item.time ?? "00:00")), ...(day.now ? [toMinutes(day.now)] : [])];
  const start = Math.floor(Math.min(7 * 60, ...minutes) / 60) * 60;
  const end = Math.ceil(Math.max(17 * 60, ...minutes.map((m) => m + 60)) / 60) * 60;
  return { start, end, hours: Array.from({ length: (end - start) / 60 + 1 }, (_, i) => start / 60 + i) };
};

/** Where on the day, 0–100%, a time falls. */
export const dayPercent = (minutes: number, range: { start: number; end: number }) =>
  ((minutes - range.start) / (range.end - range.start)) * 100;

/** The day's items in reading order: timed ones by time, then the all-day ones. */
export const daySchedule = (day: Day) => [
  ...[...day.timed].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")),
  ...day.allDay,
];

/** The first item still ahead of now, if the day is today. */
export const nextItem = (day: Day) => {
  const now = day.now;
  return now === undefined ? undefined : daySchedule(day).find((item) => item.time !== undefined && item.time >= now);
};
