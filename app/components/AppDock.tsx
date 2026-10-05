import { useRef, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { LuLayoutGrid } from "react-icons/lu";
import { Link } from "react-router";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { AppLaunchpad } from "~/components/AppLaunchpad";
import { useElementSize } from "~/hooks/useElementSize";
import { useRevealWidth } from "~/hooks/useRevealWidth";
import { DOCK, activeTileWidth, appGradient, dockApps, dockCapacity } from "~/lib/dock";
import { formatBroj } from "~/lib/ui";

export interface DockApp {
  key: string;
  label: string;
  url: string;
  icon: IconType;
  /** A count that needs the person, shown as a red badge. */
  badge?: number;
}

// Opening: the name fades in once the tile has started to stretch. Closing: it fades out at once.
const NAME_FADE_IN = "opacity 260ms ease-out 120ms";
const NAME_FADE_OUT = "opacity 120ms ease-out";

interface DockItemProps {
  label: string;
  icon: IconType;
  gradient: string;
  pointerX: MotionValue<number>;
  reduceMotion: boolean;
  active?: boolean;
  badge?: number;
  /** A link to open. Without it the item is a button. */
  href?: string;
  onClick?: () => void;
}

/**
 * One dock icon. It grows as the pointer comes near, like the macOS dock, and shows
 * its name above. The open app's square stretches into a wider tile with its name inline.
 */
const DockItem = ({ label, icon: Icon, gradient, pointerX, reduceMotion, active = false, badge, href, onClick }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showLabel, setShowLabel] = useState(false);
  const distance = useTransform(pointerX, (x) => {
    const rect = ref.current?.getBoundingClientRect();
    return rect ? x - (rect.left + rect.width / 2) : DOCK.range;
  });
  const target = useTransform(
    distance,
    [-DOCK.range, 0, DOCK.range],
    reduceMotion ? [DOCK.base, DOCK.base, DOCK.base] : [DOCK.base, DOCK.max, DOCK.base],
  );
  const size = useSpring(target, { stiffness: 380, damping: 28, mass: 0.2 });
  // Everything in the tile scales with its height, so a tile keeps its shape as it
  // grows under the pointer. With the name hidden, padding + icon = height: a square.
  const iconSize = useTransform(size, (value) => value * 0.5);
  const padding = useTransform(size, (value) => value * 0.25);
  const radius = useTransform(size, (value) => value * 0.28);
  const fontSize = useTransform(size, (value) => value * 0.32);
  const nameRef = useRef<HTMLSpanElement>(null);
  // The name's padding (pl-2 pr-1) is outside the measured width, so it is added back.
  const nameWidth = useRevealWidth(active, nameRef, 12, reduceMotion);
  const name = badge ? `${label}, ${badge} čeka` : label;

  // One element for both states. When the app opens, the name's width animates from
  // 0 to its natural width, so the square stretches sideways into the wide tile and
  // the name fades in as it makes room; closing runs the same way back.
  const tile: ReactNode = (
    <motion.div
      ref={ref}
      style={{ height: size, paddingLeft: padding, paddingRight: padding, borderRadius: radius }}
      className={`relative flex items-center bg-linear-to-br text-white ring-1 transition-shadow duration-300 ${active ? "shadow-lg shadow-black/30 ring-white/35" : "shadow-lg shadow-black/20 ring-white/25"} ${gradient}`}
    >
      <motion.span style={{ width: iconSize, height: iconSize }} className="flex shrink-0">
        <Icon aria-hidden className="h-full w-full drop-shadow" />
      </motion.span>
      {/* The name's box opens to the name's measured width with a spring that
          follows it live, so the stretch stays smooth even while the name grows
          under the pointer, and never snaps at the end. */}
      <motion.span
        aria-hidden
        style={{ width: nameWidth, transition: reduceMotion ? "none" : active ? NAME_FADE_IN : NAME_FADE_OUT }}
        className={`block overflow-hidden ${active ? "opacity-100" : "opacity-0"}`}
      >
        <motion.span
          ref={nameRef}
          style={{ fontSize }}
          className="block w-max whitespace-nowrap pl-2 pr-1 font-semibold leading-none drop-shadow"
        >
          {label}
        </motion.span>
      </motion.span>
      {badge ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-slate-900">
          {formatBroj(badge)}
        </span>
      ) : null}
    </motion.div>
  );
  const focusProps = {
    "aria-label": name,
    onFocus: () => setShowLabel(true),
    onBlur: () => setShowLabel(false),
    className: "rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]",
  };

  return (
    <li
      className="relative flex flex-col items-center"
      onPointerEnter={() => setShowLabel(true)}
      onPointerLeave={() => setShowLabel(false)}
    >
      <AnimatePresence>
        {showLabel && !active && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute bottom-full mb-3 whitespace-nowrap rounded-md bg-gray-900/90 px-2.5 py-1 text-xs font-medium text-white shadow-lg backdrop-blur dark:bg-white/90 dark:text-slate-900"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {href ? (
        <Link to={href} aria-current={active ? "page" : undefined} {...focusProps}>
          {tile}
        </Link>
      ) : (
        <button type="button" onClick={onClick} {...focusProps}>
          {tile}
        </button>
      )}
      {/* Keeps every tile at the same distance from the dock's bottom edge. */}
      <span aria-hidden className="mt-1 size-1" />
    </li>
  );
};

export interface AppDockProps {
  apps: DockApp[];
  /** The key of the app you are in. */
  activeKey: string;
}

/**
 * The macOS-style dock for moving between applications. The open app is a wide tile
 * with its icon and name; the others are icons. It shows as many apps as its width
 * allows and always the open one; "Sve aplikacije" opens every app on one screen.
 * Inside an app, its sections live in the sidebar.
 */
export const AppDock = ({ apps, activeKey }: AppDockProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(wrapRef);
  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const pointerX = useMotionValue(Infinity);
  const reduceMotion = useReducedMotion() ?? false;
  const activeLabel = apps.find((app) => app.key === activeKey)?.label ?? "";
  const activeExtra = activeTileWidth(activeLabel) - DOCK.base;
  const shown = dockApps(apps, activeKey, width > 0 ? dockCapacity(width, activeExtra) : apps.length);
  const gradientOf = (key: string) => appGradient(apps.findIndex((app) => app.key === key));

  return (
    <div ref={wrapRef} className="relative z-30 flex shrink-0 justify-center">
      <nav
        aria-label="Aplikacije"
        onPointerMove={(event) => pointerX.set(event.clientX)}
        onPointerLeave={() => pointerX.set(Infinity)}
        style={{ height: DOCK.base + DOCK.padding * 2 }}
        className="flex items-end gap-2.5 rounded-2xl border border-white/40 bg-white/55 px-3 pb-1.5 shadow-xl shadow-black/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/55 dark:shadow-black/40"
      >
        <ul className="flex items-end gap-2.5">
          {shown.map((app) => (
            <DockItem
              key={app.key}
              label={app.label}
              icon={app.icon}
              gradient={gradientOf(app.key)}
              pointerX={pointerX}
              reduceMotion={reduceMotion}
              active={app.key === activeKey}
              badge={app.badge}
              href={app.url}
            />
          ))}
        </ul>
        <span aria-hidden className="mb-3 h-9 w-px self-end bg-gray-400/40 dark:bg-white/15" />
        <ul className="flex items-end">
          <DockItem
            label={`Sve aplikacije (${apps.length})`}
            icon={LuLayoutGrid}
            gradient="from-slate-500 to-slate-800"
            pointerX={pointerX}
            reduceMotion={reduceMotion}
            onClick={() => setLaunchpadOpen(true)}
          />
        </ul>
      </nav>
      <AppLaunchpad
        open={launchpadOpen}
        apps={apps}
        activeKey={activeKey}
        gradientOf={gradientOf}
        onClose={() => setLaunchpadOpen(false)}
      />
    </div>
  );
};
