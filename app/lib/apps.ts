import type { IconType } from "react-icons";
import { LuGauge, LuLayoutDashboard } from "react-icons/lu";
import data from "~/data/apps.json";
import { iconFor } from "~/lib/app-icons";
import { homeView } from "~/lib/moj-dan";
import { SNAPSHOT } from "~/lib/snapshot";

/**
 * The applications and their sections, exported from divetiq-cicak's
 * `navigation.ts`. Only Početna is built in edvin; every other app opens a page
 * that says so, with its real section list in the side rail.
 */

/** One item under a section, such as Arhiva → Kutije. */
export interface AppSubItem {
  key: string;
  label: string;
  url: string;
  icon: IconType;
  /** One line on what the screen is for, from cicak. */
  description?: string;
}

export interface AppSection {
  key: string;
  label: string;
  url: string;
  icon: IconType;
  /** The section's own screens. Empty when the section is a single screen. */
  children: AppSubItem[];
}

export interface AppEntry {
  key: string;
  label: string;
  url: string;
  icon: IconType;
  sections: AppSection[];
  /** A count that needs the person, shown on the dock icon. */
  badge?: number;
  /** Built in edvin. The rest open a placeholder. */
  ready: boolean;
}

const HOME_SECTIONS: AppSection[] = [
  { key: "dobrodosli", label: "Dobrodošli", url: "/home", icon: LuLayoutDashboard, children: [] },
  { key: "kpi", label: "KPI · Praćenje performansi", url: "/home/kpi", icon: LuGauge, children: [] },
];

// What waits on the person in Moj planer, counted the same way as on the home page.
const waitingOnMe = homeView(SNAPSHOT).mojDan.find((stat) => stat.key === "ceka-na-mene")?.value;

export const APPS: AppEntry[] = data.apps.map((app) =>
  app.key === "home"
    ? { key: app.key, label: app.label, url: "/home", icon: iconFor(app.icon), sections: HOME_SECTIONS, ready: true }
    : {
        key: app.key,
        label: app.label,
        url: `/app/${app.key}`,
        icon: iconFor(app.icon),
        sections: app.sections.map((section) => ({
          key: section.key,
          label: section.label,
          url: `/app/${app.key}/${section.key}`,
          icon: iconFor(section.icon),
          children: section.children.map((child) => ({
            key: child.key,
            label: child.label,
            url: `/app/${app.key}/${section.key}/${child.key}`,
            icon: iconFor(child.icon),
            description: child.description ?? undefined,
          })),
        })),
        badge: app.key === "moj-prostor" ? waitingOnMe : undefined,
        ready: false,
      },
);

/** The app a URL belongs to; Početna when none matches. */
export const appForPath = (pathname: string) =>
  APPS.find((app) => pathname === app.url || pathname.startsWith(`${app.url}/`)) ?? APPS[0];

/** The section a URL is on: the longest section URL that matches, else the app's first section. */
export const activeSectionUrl = (app: AppEntry, pathname: string) =>
  [...app.sections]
    .sort((a, b) => b.url.length - a.url.length)
    .find((section) => pathname === section.url || pathname.startsWith(`${section.url}/`))?.url ??
  app.sections[0]?.url;

/** The section a URL is on, else the app's first section. */
export const activeSection = (app: AppEntry, pathname: string) => {
  const url = activeSectionUrl(app, pathname);
  return app.sections.find((section) => section.url === url);
};

/** The sub-item a URL is on; a section opened without one lands on its first. */
export const activeSubItem = (section: AppSection | undefined, pathname: string) =>
  section?.children.find((child) => pathname === child.url || pathname.startsWith(`${child.url}/`)) ??
  section?.children[0];
