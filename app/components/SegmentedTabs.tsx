import { useId } from "react";
import { motion } from "framer-motion";

export interface SegmentedTab<K extends string> {
  key: K;
  label: string;
  /** A small count after the label. */
  count?: string;
}

export interface SegmentedTabsProps<K extends string> {
  tabs: SegmentedTab<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Accessible name of the tab list. */
  label: string;
  className?: string;
}

/** A row of tabs in one pill; the active tab's background slides to it. Used where the screen has no room to show every section. */
export function SegmentedTabs<K extends string>({ tabs, value, onChange, label, className = "" }: SegmentedTabsProps<K>) {
  const indicatorId = `${useId()}-tab`;
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`flex shrink-0 gap-1 rounded-xl border border-[#e5eaf2] bg-white/70 p-1 dark:border-slate-700/70 dark:bg-slate-900/60 ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={`relative min-w-0 flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${active ? "text-white" : "text-gray-600 hover:text-[#3B9DF8] dark:text-[#abc2d3]"}`}
          >
            {active && (
              <motion.span
                layoutId={indicatorId}
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
                className="absolute inset-0 rounded-lg bg-[#3B9DF8] shadow-[0_0_16px_rgba(59,157,248,0.45)]"
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              <span className="truncate">{tab.label}</span>
              {tab.count && <span className="shrink-0 tabular-nums opacity-80">{tab.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
