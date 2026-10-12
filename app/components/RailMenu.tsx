import type { ComponentType, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { useEscape } from "~/hooks/useEscape";

export interface RailMenuItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  description?: string;
}

export interface RailMenuProps {
  title: string;
  items: RailMenuItem[];
  /** The item you are on, marked in the list. */
  activeId?: string;
  /** Opens upward from the rail item, for items in the lower half of the screen. */
  up: boolean;
  onPick: (id: string) => void;
  onClose: () => void;
}

/** Moves focus to the next or previous item of the menu with the arrow keys. */
const handleArrows = (event: KeyboardEvent<HTMLUListElement>) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button")];
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  const step = event.key === "ArrowDown" ? 1 : -1;
  buttons[(index + step + buttons.length) % buttons.length]?.focus();
};

/**
 * The submenu of a sidebar section: its screens, each with a one-line description.
 * It opens beside the sidebar while the pointer or focus is on the section, moves
 * with the arrow keys, and closes on Escape or when a screen is picked. Its left
 * padding fills the gap to the sidebar, so the pointer can cross over without
 * leaving the section.
 */
export const RailMenu = ({ title, items, activeId, up, onPick, onClose }: RailMenuProps) => {
  useEscape(true, onClose);
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -4 }}
      transition={{ duration: 0.12 }}
      className={`absolute left-full z-30 pl-4 ${up ? "bottom-0" : "top-0"}`}
    >
      <div
        role="menu"
        aria-label={title}
        className="w-72 rounded-xl border border-gray-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
      >
        <p className="px-2.5 pb-1.5 pt-1 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-gray-500 dark:text-white/50">
          {title}
        </p>
        <ul onKeyDown={handleArrows}>
          {items.map(({ id, label, icon: Icon, description }) => {
            const active = id === activeId;
            return (
              <li key={id}>
                <button
                  type="button"
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onPick(id)}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] ${active ? "bg-[#3B9DF8]/10 text-[#3B9DF8]" : "text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"}`}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{label}</span>
                    {description && (
                      <span title={description} className="block truncate text-xs text-gray-500 dark:text-white/50">
                        {description}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
};
