/** Sizes and fitting rules for the app sidebar, so the component stays about layout. */

/** Row heights in px: a section, a screen under it, and a section in the icon-only sidebar. */
export const SIDEBAR_ROW = { section: 36, screen: 32, icon: 44 };

/** From this window width the sidebar shows names; below it, icons only. */
export const SIDEBAR_WIDE_FROM = 1180;

/**
 * Splits sections into the ones that fit `height` and the rest, which go into a
 * "Više" row at the end. `extra` is height the open section's screens take. The
 * open section always stays. Before the box is measured, everything shows.
 */
export const sidebarFit = <T>(sections: T[], activeIndex: number, height: number, rowHeight: number, extra = 0) => {
  if (height <= 0) return { visible: sections, hidden: [] as T[] };
  const capacity = Math.max(1, Math.floor((height - extra) / rowHeight));
  if (sections.length <= capacity) return { visible: sections, hidden: [] as T[] };
  const keep = Math.max(1, capacity - 1);
  const active = sections[activeIndex];
  let visible = sections.slice(0, keep);
  if (active !== undefined && !visible.includes(active)) visible = [...visible.slice(0, keep - 1), active];
  return { visible, hidden: sections.filter((section) => !visible.includes(section)) };
};
