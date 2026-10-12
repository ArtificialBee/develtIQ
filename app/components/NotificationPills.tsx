import { useState } from "react";
import type { IconType } from "react-icons";
import { Link } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface NotificationPill {
  id: string;
  /** The app the notification comes from, such as "Moj planer". */
  app: string;
  /** Where a click goes: the app. */
  url: string;
  /** The notification's title only, without its message. */
  title: string;
  icon: IconType;
  /** It asks the person to act. Shows an amber dot. */
  urgent?: boolean;
}

// Button size, gap and side padding in px. The row is six buttons wide and holds at most four.
const BUTTON = 40;
const GAP = 8;
const PAD = 6;
const SLOTS = 6;
const MAX_SHOWN = 4;
const BAR_WIDTH = SLOTS * BUTTON + (SLOTS - 1) * GAP + 2 * PAD;

/**
 * The newest notifications as icon buttons in a row six buttons wide, at most four
 * of them, with nothing behind them. Point at a button and a box as wide as the row
 * grows down under it with the app the notification came from and its title. The box
 * keeps its place whichever button is pointed at and lies over the page, so nothing
 * moves; the button it is showing gets a white background.
 */
export const NotificationPills = ({ items }: { items: NotificationPill[] }) => {
  const pills = items.slice(0, MAX_SHOWN);
  const [index, setIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const shown = index === null ? undefined : pills[index];
  if (pills.length === 0) return null;

  return (
    // Below md the bar would push the greeting out; the bell next to it lists everything there.
    <div
      className="relative hidden h-12 shrink-0 md:block"
      style={{ width: BAR_WIDTH }}
      onPointerLeave={() => setIndex(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIndex(null);
      }}
    >
      <ul aria-label="Najnovija obavještenja" className="flex h-12 items-center" style={{ gap: GAP, paddingInline: PAD }}>
        {pills.map(({ id, app, url, title, icon: Icon, urgent }, i) => (
          <li key={id}>
            <Link
              to={url}
              aria-label={`${app}: ${title}`}
              onPointerEnter={() => setIndex(i)}
              onFocus={() => setIndex(i)}
              className={`relative flex size-10 items-center justify-center rounded-full text-[#3B9DF8] transition-[background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] ${
                i === index ? "bg-white shadow-sm shadow-gray-900/10" : ""
              }`}
            >
              <Icon aria-hidden className="size-[18px]" />
              {urgent && (
                <span aria-hidden className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-400 ring-2 ring-white" />
              )}
            </Link>
          </li>
        ))}
      </ul>
      {/* The top padding bridges the gap to the row, so the pointer can reach the box without it closing. */}
      <div className="absolute inset-x-0 top-full pt-1">
        <AnimatePresence initial={false}>
          {shown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-950/10 backdrop-blur-xl"
            >
              <Link to={shown.url} tabIndex={-1} className="block px-4 pb-3.5 pt-3">
                <span className="block text-[0.65rem] font-medium uppercase tracking-[0.14em] text-gray-500">
                  {shown.app}
                </span>
                <span className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
                  {shown.title}
                </span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
