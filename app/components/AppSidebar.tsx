import { useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router";
import {
  LuChevronRight,
  LuEllipsis,
  LuPanelLeftClose,
  LuPanelLeftOpen,
} from "react-icons/lu";
import { RailMenu, type RailMenuItem } from "~/components/RailMenu";
import { WorkspaceSwitcher } from "~/components/WorkspaceSwitcher";
import { useElementSize } from "~/hooks/useElementSize";
import type { AppEntry, AppSection } from "~/lib/apps";
import { SIDEBAR_ROW, sidebarFit } from "~/lib/sidebar";

export interface AppSidebarProps {
  app: AppEntry;
  activeSectionUrl?: string;
  activeScreenUrl?: string;
}

/** Where a section opens: its first screen, or the section itself when it has none. */
const landing = (section: AppSection) =>
  section.children[0]?.url ?? section.url;

const rowIdle =
  "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white";
const rowCurrent = "bg-[#3B9DF8]/12 font-medium text-[#3B9DF8]";

/** The pointer and focus handlers that open a row's submenu, from `AppSidebar`. */
type HoverMenuProps = Pick<HTMLAttributes<HTMLLIElement>, "onPointerEnter" | "onPointerLeave" | "onFocus" | "onBlur">;

interface SectionRowProps {
  section: AppSection;
  active: boolean;
  menuOpen: boolean;
  hover?: HoverMenuProps;
  /** The section's screens, in a menu beside the sidebar. */
  menu?: ReactNode;
}

/**
 * One section with its name, one line high: it never unfolds inside the sidebar.
 * Clicking it opens its first screen; pointing at it shows its screens at once in
 * a menu beside the sidebar, with the screen you are on marked.
 */
const SectionRow = ({ section, active, menuOpen, hover, menu }: SectionRowProps) => {
  const Icon = section.icon;
  const hasScreens = section.children.length > 0;
  return (
    <li className="relative" {...hover}>
      <Link
        to={landing(section)}
        aria-current={active ? (hasScreens ? "true" : "page") : undefined}
        aria-haspopup={hover ? "menu" : undefined}
        aria-expanded={hover ? menuOpen : undefined}
        className={`flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors ${active ? rowCurrent : rowIdle}`}
      >
        <Icon aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{section.label}</span>
        {hasScreens && (
          <LuChevronRight
            aria-hidden
            className={`size-3.5 shrink-0 ${active ? "" : "text-gray-400 dark:text-slate-500"}`}
          />
        )}
      </Link>
      <AnimatePresence>{menu}</AnimatePresence>
    </li>
  );
};

interface IconRowProps {
  section: AppSection;
  active: boolean;
  menuOpen: boolean;
  hover?: HoverMenuProps;
  menu?: ReactNode;
}

/**
 * One section as an icon only, for the narrow sidebar. Clicking it opens its first
 * screen; pointing at a section with screens shows them at once in a menu beside it.
 */
const IconRow = ({ section, active, menuOpen, hover, menu }: IconRowProps) => {
  const Icon = section.icon;
  const hasScreens = section.children.length > 0;
  const tile = `flex size-10 items-center justify-center rounded-xl transition-colors ${active ? "bg-[#3B9DF8] text-white shadow-[0_0_16px_rgba(59,157,248,0.45)]" : rowIdle}`;
  return (
    <li className="relative" {...hover}>
      <Link
        to={landing(section)}
        title={hasScreens ? undefined : section.label}
        aria-label={section.label}
        aria-current={active && !hasScreens ? "page" : undefined}
        aria-haspopup={hover ? "menu" : undefined}
        aria-expanded={hover ? menuOpen : undefined}
        className={tile}
      >
        <Icon aria-hidden className="size-[18px]" />
      </Link>
      <AnimatePresence>{menu}</AnimatePresence>
    </li>
  );
};

const toMenuItems = (sections: AppSection[]): RailMenuItem[] =>
  sections.map((section) => ({
    id: landing(section),
    label: section.label,
    icon: section.icon,
  }));

/**
 * The sidebar of the open app, like the macOS Finder sidebar: the app's name and its
 * sections. It starts closed, as icons only; the button at the bottom shows the names.
 * Pointing at a section shows its screens at once in a menu beside the sidebar; nothing
 * unfolds inside it. It never scrolls: sections that do not fit go into "Više".
 */
export const AppSidebar = ({
  app,
  activeSectionUrl,
  activeScreenUrl,
}: AppSidebarProps) => {
  const navigate = useNavigate();
  // It starts closed, as icons only; the button at the bottom shows the names.
  const [wide, setWide] = useState(false);
  // The section (or the "more" row) whose menu is open, and whether it opens upward.
  const [menu, setMenu] = useState<{ id: string; up: boolean } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { height } = useElementSize(listRef);

  const activeIndex = app.sections.findIndex(
    (section) => section.url === activeSectionUrl,
  );
  const { visible, hidden } = sidebarFit(
    app.sections,
    activeIndex,
    height,
    wide ? SIDEBAR_ROW.section : SIDEBAR_ROW.icon,
  );
  // Menus open the moment the pointer or focus reaches a row, with no delay, and close
  // when both leave it. The menu is inside the row, so moving onto it keeps it open.
  const openMenu = (id: string, row: HTMLElement) =>
    setMenu((current) =>
      current?.id === id ? current : { id, up: row.getBoundingClientRect().top > window.innerHeight / 2 },
    );
  const closeMenu = (id: string) => setMenu((current) => (current?.id === id ? null : current));
  const hoverMenu = (id: string): HoverMenuProps => ({
    onPointerEnter: (event) => openMenu(id, event.currentTarget),
    onPointerLeave: () => closeMenu(id),
    onFocus: (event) => openMenu(id, event.currentTarget),
    onBlur: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeMenu(id);
    },
  });
  const screensOf = (section: AppSection): RailMenuItem[] =>
    section.children.map((screen) => ({
      id: screen.url,
      label: screen.label,
      icon: screen.icon,
      description: screen.description,
    }));
  const pick = (url: string) => {
    setMenu(null);
    navigate(url);
  };
  const menuFor = (
    id: string,
    title: string,
    items: RailMenuItem[],
    activeId?: string,
  ) =>
    menu?.id === id ? (
      <RailMenu
        key="menu"
        title={title}
        items={items}
        activeId={activeId}
        up={menu.up}
        onPick={pick}
        onClose={() => setMenu(null)}
      />
    ) : undefined;

  return (
    <nav
      aria-label={app.label}
      className={`relative z-40 flex h-full shrink-0 flex-col border-r border-gray-200 bg-gray-50/80 py-4 transition-[width] duration-300 dark:border-slate-800 dark:bg-slate-900/70 ${wide ? "w-64 px-3" : "w-[4.5rem] items-center px-2"}`}
    >
      <div className={`mb-4 flex shrink-0 items-center gap-3 ${wide ? "px-1" : ""}`} title={app.label}>
        <span
          className="size-10 shrink-0 overflow-hidden rounded-xl shadow-md ring-1 ring-gray-200"
        >
          <img
            src="/develtiq-mark.png"
            alt=""
            aria-hidden="true"
            className="size-full object-cover"
          />
        </span>
        {wide && (
          <div className="min-w-0 flex-1">
            <WorkspaceSwitcher />
            <p className="truncate text-xs text-gray-500">
              {app.label}
            </p>
          </div>
        )}
      </div>

      <div ref={listRef} className="min-h-0 w-full flex-1">
        <ul
          className={`flex flex-col ${wide ? "gap-0.5" : "items-center gap-1"}`}
        >
          {visible.map((section) => {
            const hasScreens = section.children.length > 0;
            const Row = wide ? SectionRow : IconRow;
            return (
              <Row
                key={section.key}
                section={section}
                active={section.url === activeSectionUrl}
                menuOpen={menu?.id === section.url}
                hover={hasScreens ? hoverMenu(section.url) : undefined}
                menu={hasScreens ? menuFor(section.url, section.label, screensOf(section), activeScreenUrl) : undefined}
              />
            );
          })}
          {hidden.length > 0 && (
            <li className="relative" {...hoverMenu("more")}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menu?.id === "more"}
                aria-label={`Još ${hidden.length} sekcija`}
                title={`Još ${hidden.length} sekcija`}
                onClick={(event) => openMenu("more", event.currentTarget)}
                className={
                  wide
                    ? `flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm ${rowIdle}`
                    : `flex size-10 items-center justify-center rounded-xl ${rowIdle}`
                }
              >
                <LuEllipsis aria-hidden className="size-4 shrink-0" />
                {wide && <span>Još {hidden.length}</span>}
              </button>
              <AnimatePresence>
                {menuFor("more", "Ostale sekcije", toMenuItems(hidden))}
              </AnimatePresence>
            </li>
          )}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setWide(!wide)}
        aria-label={wide ? "Prikaži samo ikone" : "Prikaži nazive"}
        title={wide ? "Prikaži samo ikone" : "Prikaži nazive"}
        className={`mt-2 flex size-9 shrink-0 items-center justify-center rounded-lg ${rowIdle} ${wide ? "self-start" : ""}`}
      >
        {wide ? (
          <LuPanelLeftClose aria-hidden className="size-4" />
        ) : (
          <LuPanelLeftOpen aria-hidden className="size-4" />
        )}
      </button>

    </nav>
  );
};
