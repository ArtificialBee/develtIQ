/** Colors and sizes for the app dock, kept here so the dock component stays about layout. */

// Each app gets a fixed gradient, like an app icon. Full class names keep Tailwind able to find them.
const GRADIENTS = [
  "from-cyan-400 to-blue-600",
  "from-violet-400 to-indigo-600",
  "from-sky-400 to-cyan-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-rose-400 to-pink-600",
  "from-fuchsia-400 to-purple-600",
  "from-lime-400 to-green-600",
  "from-blue-400 to-indigo-700",
  "from-orange-400 to-red-600",
];

/** The icon gradient of the app at `index` in the app list. */
export const appGradient = (index: number) => GRADIENTS[index % GRADIENTS.length];

/** Icon size at rest and right under the pointer, gap between icons, and padding, in px. */
export const DOCK = { base: 44, max: 68, gap: 10, padding: 12, range: 140 };

/**
 * The apps the dock shows: the first `capacity` in list order. When the open app
 * would not make it, it takes the last place, so the dock always shows where you are.
 */
export const dockApps = <T extends { key: string }>(apps: T[], activeKey: string, capacity: number) => {
  const shown = apps.slice(0, capacity);
  const active = apps.find((app) => app.key === activeKey);
  if (!active || shown.includes(active)) return shown;
  return [...shown.slice(0, Math.max(0, capacity - 1)), active];
};

/** About how wide the open app's tile is: its icon, its name in 14px semibold, and padding. */
export const activeTileWidth = (label: string) => Math.round(DOCK.base + label.length * 7.6 + 20);

/**
 * How many app icons fit a dock this wide, leaving room for the separator, the
 * "all apps" button and the open app's wider tile (`activeExtra` px more than an
 * icon). At least 3, so the dock is never empty.
 */
export const dockCapacity = (width: number, activeExtra = 0) => {
  const slot = DOCK.base + DOCK.gap;
  const reserved = DOCK.padding * 2 + slot + 12 + activeExtra;
  return Math.max(3, Math.floor((width - reserved + DOCK.gap) / slot));
};
