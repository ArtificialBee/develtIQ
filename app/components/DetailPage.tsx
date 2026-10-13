import { Fragment, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { Link } from "react-router";
import { LuArrowLeft, LuCheck, LuChevronRight, LuTriangleAlert } from "react-icons/lu";
import { Card } from "~/components/Card";
import { Page } from "~/components/Page";
import { TopBar } from "~/components/TopBar";
import { SNAPSHOT } from "~/lib/snapshot";
import { ICON_CHIP } from "~/lib/ui";

/**
 * The details page of one record or one home card, laid out like a record page in
 * divetiq: a path of links, a header with a back button, the title and the main
 * actions, then three columns. Related records on the left, the record itself in
 * the middle (a summary box with number tiles, then its sections) and its timeline
 * on the right. The rails drop out on narrower screens, the left one first, and
 * the summary box loses its line of facts on short ones.
 */

export interface Crumb {
  label: string;
  /** Leave it out for the page you are on. */
  to?: string;
}

export interface DetailPageProps {
  /** The top bar's title, status line and alert. */
  topTitle: string;
  topStatus?: string;
  alert?: string;
  crumbs: Crumb[];
  backTo: string;
  icon: IconType;
  title: string;
  subtitle?: string;
  /** Status chips after the title, such as the document's state. */
  badges?: ReactNode;
  /** Buttons at the right of the header, the main one first. */
  actions?: ReactNode;
  /** Related records, shown from `2xl`. */
  left?: ReactNode;
  /** The timeline, shown from `lg`. */
  right?: ReactNode;
  children: ReactNode;
}

const RULE = "border-[#e5eaf2] dark:border-slate-700/70";

// The grid per side column present: the left one shows from 2xl, the right one from lg.
const columnsFor = (left: boolean, right: boolean) =>
  left && right
    ? "lg:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[16rem_minmax(0,1fr)_20rem]"
    : right
      ? "lg:grid-cols-[minmax(0,1fr)_20rem]"
      : left
        ? "2xl:grid-cols-[16rem_minmax(0,1fr)]"
        : "";

export const DetailPage = ({
  topTitle,
  topStatus,
  alert,
  crumbs,
  backTo,
  icon: Icon,
  title,
  subtitle,
  badges,
  actions,
  left,
  right,
  children,
}: DetailPageProps) => (
  <Page fill>
    <TopBar title={topTitle} status={topStatus} alert={alert} startAt={SNAPSHOT.meta.sada} />
    <Card as="section" className="min-h-0 flex-1">
      <div className="flex h-full min-h-0 flex-col">
        {/* On short screens the back button is enough; the rows need the room. */}
        <nav aria-label="Putanja" className={`flex shrink-0 items-center gap-1.5 border-b px-6 py-3 text-sm text-gray-500 [@media(max-height:820px)]:hidden ${RULE}`}>
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb.label}>
              {index > 0 && <LuChevronRight aria-hidden className="size-3.5 shrink-0 text-gray-400" />}
              {crumb.to ? (
                <Link to={crumb.to} className="truncate rounded transition-colors hover:text-[#3B9DF8]">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-medium text-gray-900 dark:text-white">
                  {crumb.label}
                </span>
              )}
            </Fragment>
          ))}
        </nav>

        <header className={`flex shrink-0 items-center gap-4 border-b px-6 py-4 ${RULE}`}>
          <Link
            to={backTo}
            aria-label="Natrag"
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] ${RULE}`}
          >
            <LuArrowLeft aria-hidden className="size-4" />
          </Link>
          <span className={`size-10 rounded-xl ${ICON_CHIP}`}>
            <Icon aria-hidden className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              {/* The title keeps its width; a long line after the badges gives way first. */}
              <h2 title={title} className="max-w-[70%] shrink-0 truncate text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              {badges && <div className="flex min-w-0 items-center gap-2 overflow-hidden [&>*]:shrink-0">{badges}</div>}
            </div>
            {subtitle && (
              <p title={subtitle} className="truncate text-sm text-gray-500 dark:text-white/60">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>

        {/* Only the columns that have content, so a page with no left column keeps its middle wide. */}
        <div className={`grid min-h-0 flex-1 grid-cols-1 ${columnsFor(Boolean(left), Boolean(right))}`}>
          {left && <aside className={`hidden min-h-0 overflow-y-auto border-r p-5 2xl:block ${RULE}`}>{left}</aside>}
          {/* A size container, so the tiles follow the column's width, not the window's. */}
          <div className="@container flex min-h-0 flex-col gap-6 overflow-y-auto p-6 [@media(max-height:820px)]:gap-4 [@media(max-height:820px)]:p-4">
            {children}
          </div>
          {right && <aside className={`hidden min-h-0 overflow-y-auto border-l p-5 lg:block ${RULE}`}>{right}</aside>}
        </div>
      </div>
    </Card>
  </Page>
);

// Header buttons, in the app's button styles.
export const PRIMARY_BUTTON =
  "inline-flex items-center gap-2 rounded-lg bg-[#3B9DF8] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] focus-visible:ring-offset-2";
export const SECONDARY_BUTTON =
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]";

export type DetailTone = "danger" | "warning" | "success";

const toneText: Record<DetailTone, string> = {
  danger: "text-red-600",
  warning: "text-amber-600",
  success: "text-emerald-600",
};

export interface DetailFact {
  icon: IconType;
  text: string;
  tone?: DetailTone;
}

export interface DetailTile {
  icon?: IconType;
  label: string;
  value: ReactNode;
  /** A short line under the value. */
  note?: string;
  tone?: DetailTone;
}

/** The summary box of the middle column: a line of facts with icons, then number tiles, then an optional line under them. */
export const DetailHero = ({ facts = [], tiles, footer }: { facts?: DetailFact[]; tiles: DetailTile[]; footer?: string }) => (
  <div className="shrink-0 rounded-2xl bg-gray-50 p-4 dark:bg-slate-800/50">
    {facts.length > 0 && (
      // On short screens the list under the box needs this line more.
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-1.5 px-1 text-sm text-gray-700 dark:text-white/80 [@media(max-height:820px)]:hidden">
        {facts.map(({ icon: Icon, text, tone }) => (
          <li key={text} title={text} className={`flex min-w-0 items-center gap-1.5 ${tone ? toneText[tone] : ""}`}>
            <Icon aria-hidden className={`size-4 shrink-0 ${tone ? "" : "text-gray-400"}`} />
            <span className="truncate">{text}</span>
          </li>
        ))}
      </ul>
    )}
    <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3">
      {tiles.map(({ icon: Icon, label, value, note, tone }) => (
        <div key={label} className="min-w-0 rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:bg-slate-900/60 [@media(max-height:820px)]:p-3">
          <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/60">
            {Icon && <Icon aria-hidden className="size-3.5 shrink-0" />}
            <span className="truncate">{label}</span>
          </p>
          <p className="mt-1.5 truncate text-xl font-semibold tabular-nums text-gray-900 dark:text-white">{value}</p>
          {note && (
            <p title={note} className={`mt-0.5 truncate text-xs [@media(max-height:820px)]:hidden ${tone ? toneText[tone] : "text-gray-500 dark:text-white/60"}`}>
              {note}
            </p>
          )}
        </div>
      ))}
    </div>
    {footer && <p className="mt-3 px-1 text-xs text-gray-500 dark:text-white/60">{footer}</p>}
  </div>
);

export interface DetailSectionProps {
  icon: IconType;
  title: string;
  /** A link or count at the right of the heading. */
  action?: ReactNode;
  /** Take the height left in the column, for a list that pages. */
  fill?: boolean;
  children: ReactNode;
}

/** One titled part of the middle column, such as the record's fields or its list. */
export const DetailSection = ({ icon: Icon, title, action, fill = false, children }: DetailSectionProps) => (
  <section className={`flex flex-col ${fill ? "min-h-0 flex-1" : "shrink-0"}`}>
    <div className="mb-3 flex shrink-0 items-center gap-3">
      <span className={`size-8 ${ICON_CHIP}`}>
        <Icon aria-hidden className="size-4" />
      </span>
      <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

export interface DetailField {
  label: string;
  value: ReactNode;
  /** Spans both columns, for long text. */
  wide?: boolean;
}

/** The record's fields as label over value, in two columns, or four where the middle column is wide. */
export const DetailFields = ({ fields, wide = false }: { fields: DetailField[]; wide?: boolean }) => (
  <dl className={`grid grid-cols-1 gap-x-8 gap-y-4 px-1 sm:grid-cols-2 ${wide ? "@3xl:grid-cols-4" : ""}`}>
    {fields.map(({ label, value, wide }) => (
      <div key={label} className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
        <dt className="text-xs text-gray-500 dark:text-white/60">{label}</dt>
        <dd className="mt-0.5 break-words text-sm text-gray-900 dark:text-white">{value}</dd>
      </div>
    ))}
  </dl>
);

export interface RailItem {
  key: string;
  icon?: IconType;
  title: string;
  meta?: string;
  /** A number or short value at the right. */
  value?: string;
  tone?: DetailTone;
  to?: string;
  active?: boolean;
}

/** A titled list for the left rail: related records, the one you are on marked. */
export const DetailRail = ({ title, items, more }: { title: string; items: RailItem[]; more?: ReactNode }) => (
  <section>
    <h3 className="mb-2 px-2.5 text-xs font-medium uppercase tracking-[0.14em] text-gray-500 dark:text-white/50">{title}</h3>
    <ul className="space-y-0.5">
      {items.map(({ key, icon: Icon, title: itemTitle, meta, value, tone, to, active }) => {
        const body = (
          <>
            {Icon && <Icon aria-hidden className={`size-4 shrink-0 ${active ? "text-[#3B9DF8]" : "text-gray-400"}`} />}
            <span className="min-w-0 flex-1">
              <span title={itemTitle} className={`block truncate text-sm ${active ? "font-medium text-[#3B9DF8]" : "text-gray-800 dark:text-white/90"}`}>
                {itemTitle}
              </span>
              {meta && (
                <span title={meta} className="block truncate text-xs text-gray-500 dark:text-white/60">
                  {meta}
                </span>
              )}
            </span>
            {value && (
              <span className={`shrink-0 text-sm font-semibold tabular-nums ${tone ? toneText[tone] : "text-gray-700 dark:text-white/80"}`}>
                {value}
              </span>
            )}
          </>
        );
        const row = `flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${active ? "bg-[#3B9DF8]/10" : "hover:bg-gray-50 dark:hover:bg-white/5"}`;
        return (
          <li key={key}>
            {to && !active ? (
              <Link to={to} className={`${row} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]`}>
                {body}
              </Link>
            ) : (
              <div aria-current={active ? "page" : undefined} className={row}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
    {more && <div className="mt-2 px-2.5 text-sm">{more}</div>}
  </section>
);

export interface TimelineStep {
  key: string;
  title: string;
  date?: string;
  note?: string;
  /** Done is behind you, current is where it stands, late is a missed date, next is ahead. */
  state: "done" | "current" | "late" | "next";
  to?: string;
}

const markers: Record<TimelineStep["state"], string> = {
  done: "bg-[#3B9DF8] text-white",
  current: "bg-white text-[#3B9DF8] ring-2 ring-[#3B9DF8] dark:bg-slate-900",
  late: "bg-red-500 text-white",
  next: "bg-white text-gray-300 ring-1 ring-gray-300 dark:bg-slate-900",
};

/** The right rail: what happened to the record and what comes next, as a line of steps. */
export const DetailTimeline = ({ icon: Icon, title, steps }: { icon: IconType; title: string; steps: TimelineStep[] }) => (
  <section>
    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
      <Icon aria-hidden className="size-4 text-[#3B9DF8]" />
      {title}
    </h3>
    <ol>
      {steps.map((step, index) => (
        <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
          {index < steps.length - 1 && <span aria-hidden className="absolute bottom-0 left-[11px] top-7 w-px bg-gray-200 dark:bg-slate-700" />}
          <span className={`relative mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${markers[step.state]}`}>
            {step.state === "done" && <LuCheck aria-hidden className="size-3.5" />}
            {step.state === "late" && <LuTriangleAlert aria-hidden className="size-3.5" />}
            {step.state === "current" && <span aria-hidden className="size-2 rounded-full bg-[#3B9DF8]" />}
          </span>
          <div className="min-w-0 flex-1">
            {/* The name keeps its line; the time and the note go under it, so nothing is cut off. */}
            {step.to ? (
              <Link to={step.to} title={step.title} className="block truncate text-sm font-medium text-gray-900 hover:text-[#3B9DF8] dark:text-white">
                {step.title}
              </Link>
            ) : (
              <p className="break-words text-sm font-medium text-gray-900 dark:text-white">{step.title}</p>
            )}
            {step.date && <p className="font-mono text-xs tabular-nums text-gray-500 dark:text-white/60">{step.date}</p>}
            {step.note && (
              <p title={step.note} className={`break-words text-xs ${step.state === "late" ? "text-red-600" : "text-gray-500 dark:text-white/60"}`}>
                {step.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  </section>
);
