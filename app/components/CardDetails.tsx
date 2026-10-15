import { Link } from "react-router";
import type { IconType } from "react-icons";
import { LuArrowLeft } from "react-icons/lu";
import { ListRow, type RowTone } from "~/components/ListRow";
import { Page } from "~/components/Page";
import { Panel } from "~/components/Panel";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { TopBar } from "~/components/TopBar";
import { SNAPSHOT } from "~/lib/snapshot";
import { formatBroj } from "~/lib/ui";

export interface CardDetailRow {
  key: string;
  /** A fixed-width prefix on the left (time, date, number). */
  leading?: string;
  icon?: IconType;
  title: string;
  meta?: string;
  /** Red/amber left bar on rows that need attention. */
  tone?: RowTone;
  /** Small uppercase verb before the badge, such as "Potpiši". */
  action?: string;
  /** A status chip at the right. */
  badge?: { label: string; tone: StatusTone };
  /** When set, the row becomes a Link to this route. */
  href?: string;
}

export interface CardDetailsProps {
  title: string;
  description: string;
  icon?: IconType;
  /** The status line under the title in the top bar. */
  topStatus: string;
  /** Overrides `topStatus` with an amber alert line in the top bar. */
  alert?: string;
  rows: CardDetailRow[];
  emptyText?: string;
  /** Where the back link points. Defaults to /home. */
  backTo?: string;
  backLabel?: string;
}

/**
 * The details page behind one card on /home: a top bar with the title and a short
 * summary, then a scrolling list of rows under a Panel. One component for every
 * card — only the `rows` and the strings change.
 */
export function CardDetails({
  title,
  description,
  icon,
  topStatus,
  alert,
  rows,
  emptyText = "Nema stavki.",
  backTo = "/home",
  backLabel = "Natrag na Moj dan",
}: CardDetailsProps) {
  return (
    <Page fill>
      <TopBar
        title={title}
        status={topStatus}
        alert={alert}
        startAt={SNAPSHOT.meta.sada}
      />
      <Panel
        fill
        icon={icon}
        title={title}
        description={description}
        badge={formatBroj(rows.length)}
        action={
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#3B9DF8] transition-colors hover:bg-[#3B9DF8]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]"
          >
            <LuArrowLeft aria-hidden className="size-4" />
            {backLabel}
          </Link>
        }
        className="flex-1"
      >
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-white/60">{emptyText}</p>
        ) : (
          <ul className="h-full overflow-y-auto pr-1">
            {rows.map((row) => {
              const content = (
                <ListRow
                  leading={row.leading}
                  icon={row.icon}
                  title={row.title}
                  meta={row.meta}
                  tone={row.tone}
                  trailing={
                    row.action || row.badge ? (
                      <div className="flex shrink-0 items-center gap-2">
                        {row.action && (
                          <span className="hidden text-xs font-semibold uppercase tracking-wider text-[#3B9DF8] sm:inline">
                            {row.action}
                          </span>
                        )}
                        {row.badge && <StatusBadge tone={row.badge.tone}>{row.badge.label}</StatusBadge>}
                      </div>
                    ) : undefined
                  }
                />
              );
              return (
                <li key={row.key} className="h-14">
                  {row.href ? (
                    <Link
                      to={row.href}
                      aria-label={row.title}
                      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </Page>
  );
}
