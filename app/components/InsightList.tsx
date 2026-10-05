import { LuCompass } from "react-icons/lu";
import { FitList, FitListPager } from "~/components/FitList";
import { Panel } from "~/components/Panel";
import type { StatusTone } from "~/components/StatusBadge";
import { useFitList } from "~/hooks/useFitList";

export interface Insight {
  key: string;
  tone: StatusTone;
  /** The short lead, such as "Obratiti pažnju". */
  lead: string;
  text: string;
}

export interface InsightListProps {
  title: string;
  description?: string;
  items: Insight[];
  className?: string;
}

// Full class names keep Tailwind able to find them.
const dots: Record<StatusTone, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-sky-400",
  neutral: "bg-gray-400",
};

// Two lines of text and a little room between rows.
const ROW_HEIGHT = 46;

/** Short findings, each with a colored dot for its tone. It fills its box and pages the rest. */
export const InsightList = ({ title, description, items, className }: InsightListProps) => {
  const fit = useFitList(items, ROW_HEIGHT);
  return (
    <Panel
      title={title}
      description={description}
      icon={LuCompass}
      className={className}
      fill
      action={<FitListPager fit={fit} label={title} />}
    >
      <FitList
        fit={fit}
        getKey={(item) => item.key}
        rowHeight={ROW_HEIGHT}
        renderItem={({ tone, lead, text }) => (
          <div className="flex h-full gap-3">
            <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${dots[tone]}`} />
            <p title={`${lead}: ${text}`} className="line-clamp-2 self-start text-sm text-gray-700 dark:text-[#abc2d3]">
              <span className="font-semibold text-gray-900 dark:text-white">{lead}:</span> {text}
            </p>
          </div>
        )}
      />
    </Panel>
  );
};
