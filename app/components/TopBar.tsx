import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LuAlarmClock, LuBell } from "react-icons/lu";
import { AccountDropdown } from "~/components/AccountDropdown";
import { SearchField, SearchResults, useGlobalSearch } from "~/components/GlobalSearch";
import { NotificationPills } from "~/components/NotificationPills";
import { NotificationsDropdown, type FeedItem } from "~/components/NotificationsDropdown";
import { useNow } from "~/hooks/useNow";
import { appForModul } from "~/lib/apps";
import { greetingFor } from "~/lib/home";
import { riseIn } from "~/lib/motion";
import { homeView } from "~/lib/moj-dan";
import { SNAPSHOT } from "~/lib/snapshot";

// A faint blueprint grid that fades out toward the edges.
const grid: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(59,157,248,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,157,248,0.09) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
  maskImage: "radial-gradient(ellipse at 70% 50%, #000 20%, transparent 80%)",
  WebkitMaskImage: "radial-gradient(ellipse at 70% 50%, #000 20%, transparent 80%)",
};

const blobs = [
  { className: "-left-16 -top-24 size-64 bg-cyan-400/25", drift: { x: [0, 60, 0], y: [0, 20, 0] }, seconds: 18 },
  { className: "right-24 -top-28 size-72 bg-indigo-500/25", drift: { x: [0, -50, 0], y: [0, 30, 0] }, seconds: 22 },
  { className: "-bottom-32 left-1/3 size-64 bg-[#3B9DF8]/20", drift: { x: [0, 40, 0], y: [0, -20, 0] }, seconds: 20 },
];

/** Soft colored lights that drift slowly behind the bar. They stand still with reduced motion. */
const Aurora = () => {
  const reduceMotion = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {blobs.map((blob) => (
        <motion.div
          key={blob.className}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
          animate={reduceMotion ? undefined : blob.drift}
          transition={{ duration: blob.seconds, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute inset-0" style={grid} />
      {!reduceMotion && (
        <motion.div
          className="absolute inset-y-0 w-1/4 bg-linear-to-r from-transparent via-[#3B9DF8]/10 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "500%" }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
        />
      )}
    </div>
  );
};

export interface TopBarProps {
  /** A fixed page title. Without it the bar greets `name` for the time of day. */
  title?: string;
  /** First name of the person, for the greeting. */
  name?: string;
  /** The line under the title when nothing is wrong. Defaults to "Svi sistemi rade". */
  status?: string;
  /** ISO date-time the greeting's clock starts at. It then moves with real time. */
  startAt: string;
  /** A problem the person must fix. It replaces "all systems work". */
  alert?: string;
  className?: string;
}

/**
 * The top bar of a page, one line high so the cards get the screen: a greeting or
 * a title with a status or alert under it, a search over the whole app in the
 * middle, and the newest notifications as buttons. Nothing wraps; an open
 * notification grows the bar down over the page.
 */
export const TopBar = ({ title, name, status = "Svi sistemi rade", startAt, alert, className = "" }: TopBarProps) => {
  // Only the greeting reads the time, so once a minute is enough.
  const now = useNow(60_000, startAt);
  const dot = alert ? "bg-amber-400" : "bg-emerald-400";
  const { obavjestenja, podsjetnici } = homeView(SNAPSHOT);
  // The bell and the bar show the same notifications, each with its app's icon from the dock.
  const sAppom = obavjestenja.map((obavjestenje) => ({ obavjestenje, app: appForModul(obavjestenje.modul) }));
  const zvono: FeedItem[] = sAppom.map(({ obavjestenje, app }) => ({
    id: obavjestenje.id,
    icon: app.icon,
    text: obavjestenje.poruka ? `${obavjestenje.naslov} — ${obavjestenje.poruka}` : obavjestenje.naslov,
    tone: obavjestenje.traziAkciju ? "warning" : "info",
    tag: obavjestenje.traziAkciju ? "Traži akciju" : "Info",
    meta: app.label,
  }));
  // The bar has room for four; the bell holds all of them.
  const pills = sAppom
    .slice(0, 4)
    .map(({ obavjestenje, app }) => ({
      id: obavjestenje.id,
      app: app.label,
      url: obavjestenje.url ?? app.url,
      title: obavjestenje.naslov,
      icon: app.icon,
      urgent: obavjestenje.traziAkciju,
    }));

  const search = useGlobalSearch();

  return (
    <>
      {/* While results show, the rest of the app darkens and the bar sits above it. */}
      {search.showResults && (
        <div aria-hidden onPointerDown={search.close} className="fixed inset-0 z-[45] bg-slate-950/40 backdrop-blur-[2px]" />
      )}
      <div className={`relative flex shrink-0 items-start gap-3 ${search.showResults ? "z-50" : "z-30"}`}>
        {/* The bar keeps one line's place in the page. When a notification opens under its
            buttons, the bar itself grows down over the page, so nothing below it moves. */}
        <div className="relative h-[78px] min-w-0 flex-1">
          <motion.section
            variants={riseIn}
            className={`absolute inset-x-0 top-0 min-h-full rounded-2xl border border-[#e5eaf2] bg-white px-4 py-3 sm:px-5 dark:border-slate-700/70 dark:bg-slate-900/40 ${className}`}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <Aurora />
            </div>
            <div className="relative z-10 flex items-start gap-4">
              {/* The greeting and the notifications share what the search leaves, so the search stays in the middle. */}
              <div className="min-w-0 flex-1 basis-0">
                <h1 className="truncate text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-white">
                  {title ?? (
                    <>
                      {now ? greetingFor(now) : "Dobrodošli"},{" "}
                      <span className="bg-linear-to-r from-cyan-400 via-[#3B9DF8] to-indigo-500 bg-clip-text text-transparent">
                        {name}
                      </span>
                    </>
                  )}
                </h1>
                <p
                  title={alert}
                  className={`mt-0.5 flex min-w-0 items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] ${alert ? "text-amber-600 dark:text-amber-300" : "text-[#3B9DF8]"}`}
                >
                  <span className="relative flex size-2 shrink-0">
                    <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:hidden ${dot}`} />
                    <span className={`relative inline-flex size-2 rounded-full ${dot}`} />
                  </span>
                  <span className="truncate">{alert ?? status}</span>
                </p>
              </div>

              <SearchField search={search} className="mt-1.5 hidden w-full min-w-0 lg:flex lg:max-w-[16rem] xl:max-w-sm 2xl:max-w-md" />

              <div className="mt-0.5 flex min-w-fit flex-1 basis-0 justify-end">
                <NotificationPills items={pills} />
              </div>
            </div>
            {search.showResults && <SearchResults search={search} />}
          </motion.section>
        </div>
        {/* Over the darkened app, the accent blue would sink in; white stays readable. */}
        <div className={`flex h-[78px] shrink-0 items-center gap-1 ${search.showResults ? "[&_button]:text-white" : ""}`}>
          <NotificationsDropdown
            items={zvono}
            label="Obavještenja"
            emptyText="Nema novih obavještenja."
            icon={LuBell}
          />
          <NotificationsDropdown
            items={podsjetnici}
            label="Podsjetnici"
            emptyText="Nema aktivnih podsjetnika."
            icon={LuAlarmClock}
          />
          <AccountDropdown />
        </div>
      </div>
    </>
  );
};
