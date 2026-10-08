import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LuAlarmClock, LuBell, LuCalendarDays, LuClock, LuUser } from "react-icons/lu";
import { AccountDropdown } from "~/components/AccountDropdown";
import { NotificationsDropdown } from "~/components/NotificationsDropdown";
import { OrbitGauge } from "~/components/OrbitGauge";
import { useNow } from "~/hooks/useNow";
import { formatClock, formatDate, greetingFor } from "~/lib/home";
import { riseIn } from "~/lib/motion";
import { homeView } from "~/lib/moj-dan";
import { SNAPSHOT } from "~/lib/snapshot";
import { formatBroj } from "~/lib/ui";

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

const chip =
  "flex min-w-0 shrink-0 items-center gap-2 rounded-full border border-[#e5eaf2] bg-white/70 px-3 py-1 text-sm text-gray-700 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-[#abc2d3]";

export interface TopBarProps {
  /** A fixed page title. Without it the bar greets `name` for the time of day. */
  title?: string;
  /** First name of the person, for the greeting. */
  name?: string;
  /** Job and unit, such as "Šef servisa, Služba servisa". */
  role?: string;
  /** Week of the year. */
  week?: number;
  /** The line under the title when nothing is wrong. Defaults to "Svi sistemi rade". */
  status?: string;
  /** ISO date-time the clock starts at. It then moves with real time. */
  startAt: string;
  /** A problem the person must fix. It replaces "all systems work". */
  alert?: string;
  /** A small progress ring at the right end. */
  gauge?: { value: number; target: number; label: string; caption: string };
  className?: string;
}

/**
 * The top bar of a page, one line high so the cards get the screen: a greeting or
 * a title with a status or alert under it, the live clock, and a small progress
 * ring. Chips that do not fit a narrower screen are left out; nothing wraps.
 */
export const TopBar = ({ title, name, role, week, status = "Svi sistemi rade", startAt, alert, gauge, className = "" }: TopBarProps) => {
  const now = useNow(1000, startAt);
  const dot = alert ? "bg-amber-400" : "bg-emerald-400";
  const { obavjestenja, podsjetnici } = homeView(SNAPSHOT);

  return (
    <div className="relative z-30 flex shrink-0 items-center gap-3">
      <motion.section
        variants={riseIn}
        className={`relative min-w-0 flex-1 overflow-visible rounded-2xl border border-[#e5eaf2] bg-white/60 px-4 py-3 sm:px-5 dark:border-slate-700/70 dark:bg-slate-900/40 ${className}`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <Aurora />
        </div>
        <div className="relative z-10 flex items-center gap-4">
        <div className="min-w-0 flex-1">
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

        <span className={`hidden md:flex ${chip}`}>
          <LuClock aria-hidden className="shrink-0 text-[#3B9DF8]" />
          <span className="font-mono tabular-nums">{now ? formatClock(now) : "--:--:--"}</span>
          <span className="hidden text-gray-400 xl:inline dark:text-white/40">·</span>
          <span className="hidden whitespace-nowrap xl:inline">{now ? formatDate(now) : ""}</span>
        </span>
        {week !== undefined && (
          <span className={`hidden 2xl:flex ${chip}`}>
            <LuCalendarDays aria-hidden className="shrink-0 text-[#3B9DF8]" />
            {week}. sedmica
          </span>
        )}
        {role && (
          <span title={role} className={`hidden max-w-xs 2xl:flex ${chip}`}>
            <LuUser aria-hidden className="shrink-0 text-[#3B9DF8]" />
            <span className="truncate">{role}</span>
          </span>
        )}

        {gauge && (
          <div title={`${gauge.label}: ${gauge.caption}`} className="flex shrink-0 items-center gap-3">
            <OrbitGauge value={gauge.value} target={gauge.target} size={48} showValue={false} />
            <div className="hidden text-right sm:block">
              <p className="text-lg font-semibold leading-tight tabular-nums text-gray-900 dark:text-white">
                {formatBroj(gauge.value)}
                <span className="text-sm font-normal text-gray-500 dark:text-white/60">/{formatBroj(gauge.target)}</span>
              </p>
              <p className="text-[0.7rem] uppercase tracking-[0.14em] text-gray-500 dark:text-white/50">{gauge.label}</p>
            </div>
          </div>
        )}
        </div>
      </motion.section>
      <div className="flex shrink-0 items-center gap-1">
        <NotificationsDropdown
          items={obavjestenja}
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
  );
};
