import { useId } from "react";
import { motion } from "framer-motion";
import { formatBroj } from "~/lib/ui";

export interface TabItem<K extends string> {
  key: K;
  label: string;
  /** How many things the tab holds, shown after its name. */
  count?: number;
  /** A tab that cannot be opened yet, such as a part hidden until a step is done. */
  disabled?: boolean;
}

export interface TabsProps<K extends string> {
  tabs: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Accessible name of the tab list. */
  label: string;
  className?: string;
}

/**
 * Tabs over a part of a page, such as the middle column of a details page: names in
 * a row on a hairline, the open one marked by an accent line that slides to it.
 * Arrow keys move between them.
 */
export function Tabs<K extends string>({ tabs, value, onChange, label, className = "" }: TabsProps<K>) {
  const lineId = `${useId()}-line`;
  const open = tabs.filter((tab) => !tab.disabled);
  const move = (step: number) => {
    const index = open.findIndex((tab) => tab.key === value);
    onChange(open[(index + step + open.length) % open.length].key);
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") move(1);
        if (event.key === "ArrowLeft") move(-1);
      }}
      // Sideways only: the accent line sits a pixel past the bottom, which must not add a vertical scrollbar.
      className={`flex shrink-0 gap-1 overflow-x-auto overflow-y-hidden border-b border-[#e5eaf2] ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.key)}
            className={`relative -mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B9DF8] disabled:cursor-not-allowed disabled:text-gray-300 ${
              active ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${active ? "bg-[#3B9DF8]/10 text-[#3B9DF8]" : "bg-gray-100 text-gray-500"}`}
              >
                {formatBroj(tab.count)}
              </span>
            )}
            {active && (
              <motion.span
                layoutId={lineId}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#3B9DF8]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
