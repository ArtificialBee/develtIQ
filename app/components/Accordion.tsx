import { useId, useState } from "react";
import type { ReactNode } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { Card } from "~/components/Card";
import { CARD_TITLE } from "~/lib/ui";

export interface AccordionItem {
  id?: string;
  title: string;
  content: ReactNode;
}

export interface DefaultOpenAccordionProps {
  items: AccordionItem[];
  /** Id of the open item, or null when all are closed. Pass it with `onValueChange` to control the accordion. */
  value?: string | null;
  /** Item open on first render when uncontrolled. Defaults to the first item. */
  defaultValue?: string | null;
  /** Called with the id of the item that opened, or null when the open item closed. */
  onValueChange?: (value: string | null) => void;
  className?: string;
}

/** An accordion with divider lines that opens one item at a time and starts with the first item open. */
const Accordion = ({
  items,
  value,
  defaultValue,
  onValueChange,
  className = "",
}: DefaultOpenAccordionProps) => {
  const baseId = useId();
  const [internalValue, setInternalValue] = useState<string | null>(
    defaultValue !== undefined ? defaultValue : (items[0]?.id ?? null),
  );
  const openId = value !== undefined ? value : internalValue;

  const toggle = (id: string) => {
    const next = openId === id ? null : id;
    setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <div className={`flex gap-3 flex-col w-full ${className}`}>
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        const buttonId = `${baseId}-button-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <Card as="article" key={item.id} className="p-5">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex gap-2 cursor-pointer items-center justify-between w-full text-left"
                onClick={() => item.id && toggle(item.id)}
              >
                <span className={CARD_TITLE}>{item.title}</span>
                <FaChevronDown
                  aria-hidden
                  className={`shrink-0 text-[1.2rem] dark:text-slate-600 transition-all duration-300 ${
                    isOpen
                      ? "rotate-[180deg] !text-[#3B9DF8]"
                      : "text-[#424242]"
                  }`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              // The side and bottom padding gives the shadows of cards inside room, so they are not cut off.
              className={`grid -mx-2 px-2 transition-all duration-300 overflow-hidden ease-in-out ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100 mt-2"
                  : "grid-rows-[0fr] opacity-0 invisible"
              }`}
            >
              <div className="-mx-2 overflow-hidden px-2 pt-2 pb-3 text-[#424242] dark:text-[#abc2d3] text-[0.9rem]">
                {item.content}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default Accordion;
