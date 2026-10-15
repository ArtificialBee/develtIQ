import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { Link } from "react-router";
import { Panel } from "~/components/Panel";
import type { ChartSeries } from "~/components/Chart";

export interface ChartPanelProps {
  icon: IconType;
  title: string;
  description: string;
  /** The series, for the legend in the header. A chart with its own legend leaves it out. */
  series?: ChartSeries[];
  /** One line on where it stands, such as the year so far against the plan. */
  summary?: ReactNode;
  link?: { label: string; url: string };
  children: ReactNode;
  className?: string;
}

/** The legend's mark for a series: a line, a bar or a dashed target. */
const Swatch = ({ kind, color }: Pick<ChartSeries, "kind" | "color">) =>
  kind === "target" ? (
    <span aria-hidden className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: color }} />
  ) : kind === "bar" ? (
    <span aria-hidden className="size-3 rounded-[3px] border" style={{ borderColor: color, background: `${color}40` }} />
  ) : (
    <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: color }} />
  );

/**
 * The card every chart sits in: a title and what it covers on the left; the legend,
 * a one-line summary and a link to the source app on the right; the chart filling
 * the rest.
 */
export const ChartPanel = ({ icon, title, description, series = [], summary, link, children, className = "" }: ChartPanelProps) => (
  <Panel
    fill
    icon={icon}
    title={title}
    description={description}
    action={
      <div className="flex shrink-0 items-center gap-5 text-sm">
        <span className="hidden items-center gap-4 text-gray-600 md:flex">
          {series.map((line) => (
            <span key={line.key} className="flex items-center gap-1.5">
              <Swatch kind={line.kind} color={line.color} />
              {line.label}
            </span>
          ))}
        </span>
        {summary && <span className="tabular-nums text-gray-600">{summary}</span>}
        {link && (
          <Link to={link.url} className="font-medium text-[#3B9DF8] hover:underline">
            {link.label}
          </Link>
        )}
      </div>
    }
    className={className}
  >
    {children}
  </Panel>
);
