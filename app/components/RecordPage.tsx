import { useEffect, useRef, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { LuEllipsis, LuInfo, LuRoute } from "react-icons/lu";
import {
  DetailFields,
  DetailHero,
  DetailPage,
  DetailSection,
  DetailTimeline,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  type Crumb,
  type DetailField,
  type DetailTile,
  type TimelineStep,
} from "~/components/DetailPage";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { Tabs } from "~/components/Tabs";

/**
 * Everything a record's details page shows, in one shape, whatever the record is.
 * A builder per record type fills it from the record's data; `RecordPage` draws it.
 */
export interface RecordView {
  crumbs: Crumb[];
  backTo: string;
  /** The top bar's title, such as the app's name. */
  topTitle: string;
  topStatus?: string;
  alert?: string;
  icon: IconType;
  title: string;
  subtitle?: string;
  badges?: { label: string; tone: StatusTone }[];
  /** A short line after the badges, such as who usually takes the next step. */
  hint?: string;
  /** Button labels in the record's order: step decisions, then the record's own actions, storno last. */
  actions?: string[];
  /** The filled button: the next step. Left out, the first button is filled; `null`, none is (nothing is next). */
  primary?: string | null;
  /** How many buttons show in a row; the rest are under "⋯". 3 when left out. */
  inlineActions?: number;
  /** Buttons that show but cannot be pressed yet, such as "Ovjeri" with no lines. */
  disabledActions?: string[];
  /** Notices over the fields, such as "Proknjiženo · zaliha je povećana". */
  callouts?: { tone: StatusTone; title: string; text: ReactNode }[];
  /** The document's way from first to last step, shown on the left. */
  steps?: { title: string; steps: TimelineStep[] };
  fields: DetailField[];
  /** Number tiles under the fields, such as what was received and what is left, with one line under them. */
  summary?: { tiles: DetailTile[]; note?: string };
  tabs: { key: string; label: string; count?: number; disabled?: boolean; content: ReactNode }[];
  /** Explanations under the tabs, one per line. */
  notes?: string[];
  /** Parts after the tabs, such as attachments, each with its own heading. */
  sections?: { icon: IconType; title: string; count?: number; description?: string; content: ReactNode }[];
  /** Panels on the right, such as signatures or decisions, each as a line of steps. */
  side?: { icon: IconType; title: string; count?: string; steps: TimelineStep[] }[];
}

const calloutTones: Record<StatusTone, string> = {
  neutral: "border-gray-200 bg-gray-50 text-gray-700",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-900",
};

// As in cicak: three buttons in a row, the rest in a menu.
const INLINE_ACTIONS = 3;

/**
 * The buttons that do not fit in the row, behind a "⋯" button. On narrow screens the
 * row keeps only the filled button, so the menu also holds the row's other buttons there.
 */
const MoreActions = ({ labels, narrowLabels, disabled }: { labels: string[]; narrowLabels: string[]; disabled: string[] }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div ref={rootRef} className={`relative ${labels.length === 0 ? "xl:hidden" : ""}`}>
      <button
        type="button"
        aria-label="Još radnji"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${SECONDARY_BUTTON} px-2.5`}
      >
        <LuEllipsis aria-hidden className="size-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/10">
          {[...narrowLabels, ...labels].map((label) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              disabled={disabled.includes(label)}
              className={`flex w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent ${narrowLabels.includes(label) ? "xl:hidden" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * A record's details page in the app's one layout: its way through its steps on
 * the left, its fields and its tabs in the middle (the only part that scrolls), and
 * its signatures, decisions or other side data on the right.
 */
export const RecordPage = ({ view }: { view: RecordView }) => {
  const [tab, setTab] = useState((view.tabs.find((candidate) => !candidate.disabled) ?? view.tabs[0])?.key ?? "");
  const open = view.tabs.find((candidate) => candidate.key === tab) ?? view.tabs[0];
  const actions = view.actions ?? [];
  const primary = view.primary === undefined ? actions[0] : view.primary;
  const inline = actions.slice(0, view.inlineActions ?? INLINE_ACTIONS);
  const overflow = actions.slice(inline.length);
  const narrow = inline.filter((label) => label !== primary);
  const disabled = view.disabledActions ?? [];

  return (
    <DetailPage
      topTitle={view.topTitle}
      topStatus={view.topStatus}
      alert={view.alert}
      crumbs={view.crumbs}
      backTo={view.backTo}
      icon={view.icon}
      title={view.title}
      subtitle={view.subtitle}
      badges={
        (view.badges?.length || view.hint) && (
          <>
            {view.badges?.map((badge) => (
              <StatusBadge key={badge.label} tone={badge.tone}>
                {badge.label}
              </StatusBadge>
            ))}
            {view.hint && <span title={view.hint} className="hidden min-w-0 !shrink truncate text-sm text-gray-500 xl:block">{view.hint}</span>}
          </>
        )
      }
      actions={
        actions.length > 0 && (
          <>
            {inline.map((label) =>
              label === primary ? (
                <button key={label} type="button" disabled={disabled.includes(label)} className={`${PRIMARY_BUTTON} disabled:cursor-not-allowed disabled:opacity-50`}>
                  {label}
                </button>
              ) : (
                <button
                  key={label}
                  type="button"
                  disabled={disabled.includes(label)}
                  className={`${SECONDARY_BUTTON} hidden disabled:cursor-not-allowed disabled:opacity-50 xl:inline-flex`}
                >
                  {label}
                </button>
              ),
            )}
            {(overflow.length > 0 || narrow.length > 0) && <MoreActions labels={overflow} narrowLabels={narrow} disabled={disabled} />}
          </>
        )
      }
      left={view.steps && <DetailTimeline icon={LuRoute} title={view.steps.title} steps={view.steps.steps} />}
      right={
        view.side?.length ? (
          <div className="space-y-8">
            {view.side.map((panel) => (
              <div key={panel.title}>
                <DetailTimeline
                  icon={panel.icon}
                  title={panel.count ? `${panel.title} · ${panel.count}` : panel.title}
                  steps={panel.steps}
                />
              </div>
            ))}
          </div>
        ) : undefined
      }
    >
      {/* Below 2xl the left column is hidden, so the steps show here in one line. */}
      {view.steps && (
        <ol aria-label={view.steps.title} className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs 2xl:hidden">
          {view.steps.steps.map((step, index) => (
            <li key={step.key} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden className="h-px w-4 bg-gray-300" />}
              <span
                className={
                  step.state === "current"
                    ? "font-semibold text-[#3B9DF8]"
                    : step.state === "done"
                      ? "text-gray-700"
                      : step.state === "late"
                        ? "text-red-600"
                        : "text-gray-400"
                }
              >
                {step.title}
              </span>
            </li>
          ))}
        </ol>
      )}
      {view.callouts?.map((callout) => (
        <div key={callout.title} role="status" className={`shrink-0 rounded-xl border px-4 py-3 text-sm ${calloutTones[callout.tone]}`}>
          <p className="font-semibold">{callout.title}</p>
          <p className="mt-0.5 opacity-90">{callout.text}</p>
        </div>
      ))}
      <DetailFields wide fields={view.fields} />
      {view.summary && <DetailHero tiles={view.summary.tiles} footer={view.summary.note} />}
      {view.tabs.length > 0 && (
        <section className="flex shrink-0 flex-col">
          <Tabs label="Dijelovi dokumenta" tabs={view.tabs} value={open.key} onChange={setTab} />
          <div className="pt-4">{open.content}</div>
        </section>
      )}
      {view.sections?.map((section) => (
        <DetailSection
          key={section.title}
          icon={section.icon}
          title={section.count === undefined ? section.title : `${section.title} (${section.count})`}
        >
          {section.description && <p className="-mt-1 mb-3 px-1 text-sm text-gray-500">{section.description}</p>}
          {section.content}
        </DetailSection>
      ))}
      {view.notes && view.notes.length > 0 && (
        <ul className="shrink-0 space-y-1 text-xs text-gray-500">
          {view.notes.map((note) => (
            <li key={note} className="flex items-start gap-2">
              <LuInfo aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              {note}
            </li>
          ))}
        </ul>
      )}
    </DetailPage>
  );
};
