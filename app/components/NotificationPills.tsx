import { useState } from "react";
import type { IconType } from "react-icons";
import { Link } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface NotificationPill {
  id: string;
  /** The app the notification comes from, such as "Moj planer". */
  app: string;
  /** Where a click goes: the item's own page, or the app for a plain notification. */
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
 * The newest notifications as icon buttons, at most four, at the right end of a
 * column six buttons wide. Point at a button and a box as wide as the column opens
 * under the row with the app the notification came from and its title. The box is
 * part of the column, so the top bar around it grows down with it; the extra width
 * of the column is on the left, toward the middle of the bar. The button whose
 * notification shows gets a white background.
 */
export const NotificationPills = ({ items }: { items: NotificationPill[] }) => {
  const pills = items.slice(0, MAX_SHOWN);
  const [index, setIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const shown = index === null ? undefined : pills[index];
  if (pills.length === 0) return null;

  return (
    // Below md the column would push the greeting out; the bell next to the bar lists everything there.
    <div
      className="hidden shrink-0 md:block"
      style={{ width: BAR_WIDTH }}
      onPointerLeave={() => setIndex(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIndex(null);
      }}
    >
      <ul aria-label="Najnovija obavještenja" className="flex h-12 items-center justify-end" style={{ gap: GAP, paddingInline: PAD }}>
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
      <AnimatePresence initial={false}>
        {shown && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <Link
              to={shown.url}
              tabIndex={-1}
              className="mt-2 block rounded-xl border border-[#3B9DF8]/25 bg-white px-4 pb-3.5 pt-3 shadow-md shadow-[#3B9DF8]/10 transition-colors hover:border-[#3B9DF8]/50"
            >
              <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#3B9DF8]">{shown.app}</span>
              <span className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">{shown.title}</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
