import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router";
import {
  LuChevronRight,
  LuEllipsis,
  LuPanelLeftClose,
  LuPanelLeftOpen,
} from "react-icons/lu";
import { RailMenu, type RailMenuItem } from "~/components/RailMenu";
import { useElementSize } from "~/hooks/useElementSize";
import { useViewportWidth } from "~/hooks/useViewportWidth";
import type { AppEntry, AppSection } from "~/lib/apps";
import { SIDEBAR_ROW, SIDEBAR_WIDE_FROM, sidebarFit } from "~/lib/sidebar";

export interface AppSidebarProps {
  app: AppEntry;
  /** The app's icon gradient, the same as in the dock. */
  gradient: string;
  activeSectionUrl?: string;
  activeScreenUrl?: string;
}

/** Where a section opens: its first screen, or the section itself when it has none. */
const landing = (section: AppSection) => section.children[0]?.url ?? section.url;

const rowIdle =
  "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white";
const rowCurrent = "bg-[#3B9DF8]/12 font-medium text-[#3B9DF8]";

interface SectionRowProps {
  section: AppSection;
  active: boolean;
  activeScreenUrl?: string;
}

/**
 * One section with its name. Clicking it opens its first screen; while it is the
 * open section its screens unfold under it, and a blue bar marks the one you are on.
 */
const SectionRow = ({ section, active, activeScreenUrl }: SectionRowProps) => {
  const Icon = section.icon;
  const hasScreens = section.children.length > 0;
  const current = active && !hasScreens;
  return (
    <li>
      <Link
        to={landing(section)}
        aria-current={current ? "page" : undefined}
        className={`flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors ${current ? rowCurrent : active ? "font-medium text-gray-900 dark:text-white" : rowIdle}`}
      >
        <Icon aria-hidden className={`size-4 shrink-0 ${active ? "text-[#3B9DF8]" : ""}`} />
        <span className="min-w-0 flex-1 truncate">{section.label}</span>
        {hasScreens && (
          <LuChevronRight
            aria-hidden
            className={`size-3.5 shrink-0 text-gray-400 transition-transform dark:text-slate-500 ${active ? "rotate-90" : ""}`}
          />
        )}
      </Link>
      <AnimatePresence initial={false}>
        {active && hasScreens && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="ml-[1.2rem] mt-0.5 border-l border-gray-200 pl-2 dark:border-slate-700"
          >
            {section.children.map((screen) => {
              const on = screen.url === activeScreenUrl;
              return (
                <li key={screen.key} className="relative">
                  {on && (
                    <motion.span
                      layoutId="sidebar-screen"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      className="absolute -left-[9.5px] bottom-1.5 top-1.5 w-[3px] rounded-full bg-[#3B9DF8]"
                    />
                  )}
                  <Link
                    to={screen.url}
                    title={screen.description}
                    aria-current={on ? "page" : undefined}
                    className={`flex h-8 items-center rounded-md px-2.5 text-sm transition-colors ${on ? rowCurrent : "text-gray-500 hover:bg-gray-200/70 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"}`}
                  >
                    <span className="truncate">{screen.label}</span>
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
};

interface IconRowProps {
  section: AppSection;
  active: boolean;
  menuOpen: boolean;
  onOpenMenu: (button: HTMLElement) => void;
  menu?: ReactNode;
}

/** One section as an icon only, for the narrow sidebar. A section with screens opens them in a menu beside it. */
const IconRow = ({ section, active, menuOpen, onOpenMenu, menu }: IconRowProps) => {
  const Icon = section.icon;
  const tile = `flex size-10 items-center justify-center rounded-xl transition-colors ${active ? "bg-[#3B9DF8] text-white shadow-[0_0_16px_rgba(59,157,248,0.45)]" : rowIdle}`;
  return (
    <li className="relative">
      {section.children.length > 0 ? (
        <button
          type="button"
          title={section.label}
          aria-label={section.label}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={(event) => onOpenMenu(event.currentTarget)}
          className={tile}
        >
          <Icon aria-hidden className="size-[18px]" />
        </button>
      ) : (
        <Link to={section.url} title={section.label} aria-label={section.label} aria-current={active ? "page" : undefined} className={tile}>
          <Icon aria-hidden className="size-[18px]" />
        </Link>
      )}
      <AnimatePresence>{menu}</AnimatePresence>
    </li>
  );
};

const toMenuItems = (sections: AppSection[]): RailMenuItem[] =>
  sections.map((section) => ({ id: landing(section), label: section.label, icon: section.icon }));

/**
 * The sidebar of the open app, like the macOS Finder sidebar: the app's name, its
 * sections by name, and the open section's screens unfolded under it. On narrow
 * windows, or after the collapse button, it shows icons only and opens a section's
 * screens in a menu. It never scrolls: sections that do not fit go into "Više".
 */
export const AppSidebar = ({ app, gradient, activeSectionUrl, activeScreenUrl }: AppSidebarProps) => {
  const navigate = useNavigate();
  const viewport = useViewportWidth();
  // "auto" follows the window width; the button pins names on or off.
  const [mode, setMode] = useState<"auto" | "icons" | "names">("auto");
  // The section (or the "more" row) whose menu is open, and whether it opens upward.
  const [menu, setMenu] = useState<{ id: string; up: boolean } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { height } = useElementSize(listRef);

  const wide = mode === "auto" ? (viewport ?? SIDEBAR_WIDE_FROM) >= SIDEBAR_WIDE_FROM : mode === "names";
  const activeIndex = app.sections.findIndex((section) => section.url === activeSectionUrl);
  const openScreens = wide ? (app.sections[activeIndex]?.children.length ?? 0) * SIDEBAR_ROW.screen : 0;
  const { visible, hidden } = sidebarFit(app.sections, activeIndex, height, wide ? SIDEBAR_ROW.section : SIDEBAR_ROW.icon, openScreens);
  const AppIcon = app.icon;

  const toggleMenu = (id: string, button: HTMLElement) =>
    setMenu(menu?.id === id ? null : { id, up: button.getBoundingClientRect().top > window.innerHeight / 2 });
  const pick = (url: string) => {
    setMenu(null);
    navigate(url);
  };
  const menuFor = (id: string, title: string, items: RailMenuItem[], activeId?: string) =>
    menu?.id === id ? (
      <RailMenu key="menu" title={title} items={items} activeId={activeId} up={menu.up} onPick={pick} onClose={() => setMenu(null)} />
    ) : undefined;

  return (
    <nav
      aria-label={app.label}
      className={`relative flex h-full shrink-0 flex-col border-r border-gray-200 bg-gray-50/80 py-4 transition-[width] duration-300 dark:border-slate-800 dark:bg-slate-900/70 ${wide ? "w-64 px-3" : "w-[4.5rem] items-center px-2"}`}
    >
      <div className={`mb-4 flex shrink-0 items-center gap-3 ${wide ? "px-1" : ""}`} title={app.label}>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-[28%] bg-linear-to-br text-white shadow-md ring-1 ring-white/25 ${gradient}`}>
          <AppIcon aria-hidden className="size-[18px]" />
        </span>
        {wide && <span className="min-w-0 truncate text-[0.95rem] font-semibold text-gray-900 dark:text-white">{app.label}</span>}
      </div>

      <div ref={listRef} className="min-h-0 w-full flex-1">
        <ul className={`flex flex-col ${wide ? "gap-0.5" : "items-center gap-1"}`}>
          {visible.map((section) =>
            wide ? (
              <SectionRow key={section.key} section={section} active={section.url === activeSectionUrl} activeScreenUrl={activeScreenUrl} />
            ) : (
              <IconRow
                key={section.key}
                section={section}
                active={section.url === activeSectionUrl}
                menuOpen={menu?.id === section.url}
                onOpenMenu={(button) => toggleMenu(section.url, button)}
                menu={menuFor(
                  section.url,
                  section.label,
                  section.children.map((screen) => ({ id: screen.url, label: screen.label, icon: screen.icon, description: screen.description })),
                  activeScreenUrl,
                )}
              />
            ),
          )}
          {hidden.length > 0 && (
            <li className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menu?.id === "more"}
                aria-label={`Još ${hidden.length} sekcija`}
                title={`Još ${hidden.length} sekcija`}
                onClick={(event) => toggleMenu("more", event.currentTarget)}
                className={wide ? `flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm ${rowIdle}` : `flex size-10 items-center justify-center rounded-xl ${rowIdle}`}
              >
                <LuEllipsis aria-hidden className="size-4 shrink-0" />
                {wide && <span>Još {hidden.length}</span>}
              </button>
              <AnimatePresence>{menuFor("more", "Ostale sekcije", toMenuItems(hidden))}</AnimatePresence>
            </li>
          )}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setMode(wide ? "icons" : "names")}
        aria-label={wide ? "Prikaži samo ikone" : "Prikaži nazive"}
        title={wide ? "Prikaži samo ikone" : "Prikaži nazive"}
        className={`mt-2 flex size-9 shrink-0 items-center justify-center rounded-lg ${rowIdle} ${wide ? "self-start" : ""}`}
      >
        {wide ? <LuPanelLeftClose aria-hidden className="size-4" /> : <LuPanelLeftOpen aria-hidden className="size-4" />}
      </button>
    </nav>
  );
};
