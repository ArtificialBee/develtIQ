import { useEffect, useId, useRef, useState } from "react";
import type { IconType } from "react-icons";
import { LuX } from "react-icons/lu";
import { ListRow } from "~/components/ListRow";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { formatBroj } from "~/lib/ui";

export interface FeedItem {
  id: string;
  icon: IconType;
  text: string;
  tone: StatusTone;
  tag: string;
  meta?: string;
}

interface NotificationsDropdownProps {
  items: FeedItem[];
  label: string;
  emptyText: string;
  icon: IconType;
}

/** A header icon that opens a lightweight, vertically stacked item list. */
export function NotificationsDropdown({
  items,
  label,
  emptyText,
  icon: Icon,
}: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={menuId}
        title={label}
        onClick={() => setOpen((value) => !value)}
        className={`relative flex size-10 items-center justify-center text-[#3B9DF8] transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] ${
          open ? "text-cyan-300" : ""
        }`}
      >
        <Icon aria-hidden className="size-[22px]" />
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-slate-950">
            {formatBroj(items.length)}
          </span>
        )}
      </button>
      {open && (
        <section
          id={menuId}
          aria-label={label}
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-950/15 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40"
        >
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {label}
              </h2>
              <span className="text-xs tabular-nums text-gray-500 dark:text-slate-400">
                {items.length}
              </span>
            </div>
            <button
              type="button"
              aria-label={`Zatvori: ${label}`}
              title="Zatvori"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200/70 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <LuX aria-hidden className="size-4" />
            </button>
          </header>
          <ul className="max-h-[min(24rem,calc(100dvh-8rem))] overflow-y-auto p-2">
            {items.length === 0 ? (
              <li className="px-3 py-5 text-center text-sm text-gray-500 dark:text-slate-400">
                {emptyText}
              </li>
            ) : (
              items.map(({ id, icon, text, tone, tag, meta }) => (
                <li key={id} className="min-h-11">
                  <ListRow
                    icon={icon}
                    title={text}
                    meta={meta}
                    trailing={
                      <StatusBadge tone={tone} className="max-w-[42%] shrink-0">
                        {tag}
                      </StatusBadge>
                    }
                  />
                </li>
              ))
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
