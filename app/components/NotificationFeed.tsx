import type { IconType } from "react-icons";
import { LuBell } from "react-icons/lu";
import { FitList, FitListPager } from "~/components/FitList";
import { ListRow } from "~/components/ListRow";
import { Panel } from "~/components/Panel";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { useFitList } from "~/hooks/useFitList";

export interface FeedItem {
  id: string;
  icon: IconType;
  text: string;
  tone: StatusTone;
  /** What the notification asks for, such as "Traži akciju". */
  tag: string;
}

export interface NotificationFeedProps {
  items: FeedItem[];
  className?: string;
}

const ROW_HEIGHT = 40;

/**
 * The newest notifications from every module. It fills its box: the rows that fit
 * are shown and the page buttons in the header move through the rest.
 */
export const NotificationFeed = ({ items, className }: NotificationFeedProps) => {
  const fit = useFitList(items, ROW_HEIGHT);
  return (
    <Panel
      title="Obavještenja"
      description="Iz svih modula kojima imaš pristup."
      icon={LuBell}
      className={className}
      fill
      action={<FitListPager fit={fit} label="Obavještenja" />}
    >
      <FitList
        fit={fit}
        getKey={(item) => item.id}
        rowHeight={ROW_HEIGHT}
        emptyText="Nema novih obavještenja."
        renderItem={({ icon, text, tone, tag }) => (
          <ListRow
            icon={icon}
            title={text}
            trailing={
              <StatusBadge tone={tone} className="max-w-[40%] shrink-0">
                {tag}
              </StatusBadge>
            }
          />
        )}
      />
    </Panel>
  );
};
