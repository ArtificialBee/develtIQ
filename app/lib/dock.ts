/** Colors and sizes for the app dock, kept here so the dock component stays about layout. */

// Coordinated navy gradients keep dock icons consistent with the dark app shell.
const GRADIENTS = [
  "from-slate-700 to-slate-900",
  "from-slate-800 to-blue-950",
  "from-blue-900 to-slate-900",
  "from-slate-700 to-blue-950",
  "from-blue-950 to-slate-800",
  "from-slate-800 to-slate-950",
  "from-blue-900 to-slate-950",
  "from-slate-700 to-slate-950",
  "from-blue-950 to-slate-900",
  "from-slate-800 to-blue-900",
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
