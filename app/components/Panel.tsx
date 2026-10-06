import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { Card, type CardProps } from "~/components/Card";
import { BasicChip } from "~/components/Chip";
import { CARD_DESCRIPTION, CARD_TITLE, WRAP_ANYWHERE } from "~/lib/ui";

export interface PanelProps {
  title: string;
  description?: string;
  icon?: IconType;
  /** A short tag next to the title, such as a count. */
  badge?: ReactNode;
  /** A control on the right of the header, such as a dropdown or a button. */
  action?: ReactNode;
  /** Level of the title heading. Use a higher level when the panel sits inside another titled card. */
  level?: 2 | 3 | 4;
  /**
   * Fills a box of fixed height instead of growing with its content: the header
   * keeps to one line each and the content gets exactly the height that is left.
   */
  fill?: boolean;
  children?: ReactNode;
  as?: CardProps["as"];
  className?: string;
}

/** A card with a title, a short description and an optional action over its content. */
export const Panel = ({
  title,
  description,
  icon: Icon,
  badge,
  action,
  level = 2,
  fill = false,
  children,
  as,
  className = "",
}: PanelProps) => {
  const Heading = `h${level}` as const;
  const textFit = fill ? "truncate" : WRAP_ANYWHERE;
  return (
    <Card as={as} className={`${fill ? "min-h-0 p-4" : "p-5"} ${className}`}>
      <div className={fill ? "flex h-full min-h-0 flex-col" : ""}>
        <div className="flex shrink-0 items-center justify-between gap-4">
          <div className="min-w-0">
            <Heading className={`flex items-center gap-2 ${CARD_TITLE}`}>
              {Icon && <Icon aria-hidden className="shrink-0 text-[#3B9DF8]" />}
              <span title={title} className={`min-w-0 ${textFit}`}>
                {title}
              </span>
              {badge !== undefined && <BasicChip className="shrink-0">{badge}</BasicChip>}
            </Heading>
            {description && (
              // On short screens a filled panel's rows need this line more than the description does.
              <p
                title={description}
                className={`mt-1 ${CARD_DESCRIPTION} min-w-0 ${textFit} ${fill ? "[@media(max-height:960px)]:hidden" : ""}`}
              >
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
        {children && <div className={fill ? "mt-3 min-h-0 flex-1" : "mt-4"}>{children}</div>}
      </div>
    </Card>
  );
};
