import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";

export interface ToolbarSelectOption {
  value: string;
  label: ReactNode;
}

export interface ToolbarSelectProps {
  /** Accessible name, such as "Status". */
  label: string;
  value: string;
  options: ToolbarSelectOption[];
  /** Shown on the button when `value` is none of the options, such as "2 statusa". */
  fallback?: ReactNode;
  /** Highlights the button, for a choice that narrows the list. */
  active?: boolean;
  onChange: (value: string) => void;
  /** As wide as its box and as tall as a form field, for a sheet's form. */
  wide?: boolean;
  className?: string;
}

/**
 * A compact single-select for a panel header, as tall as the search field next to it;
 * `wide`, a full-width field of a sheet's form.
 * One click on an option picks it and closes the menu. It closes on Escape or a click outside.
 */
export function ToolbarSelect({ label, value, options, fallback, active = false, onChange, wide = false, className = "" }: ToolbarSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
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
    <div ref={rootRef} className={`relative ${wide ? "w-full" : ""} ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border bg-white/70 pl-2.5 pr-2 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]/40 ${
          wide ? "h-9 w-full justify-between text-sm" : "h-8 text-xs"
        } ${active ? "border-[#3B9DF8]/50 text-gray-900" : "border-slate-200 text-gray-600"}`}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">{selected?.label ?? fallback}</span>
        <LuChevronDown aria-hidden className={`size-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute right-0 top-full z-30 mt-1 w-max min-w-full rounded-xl border border-slate-200 bg-white/95 p-1 shadow-xl shadow-slate-950/10 backdrop-blur-xl"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-left ${wide ? "text-sm" : "text-xs"} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B9DF8] ${
                  isSelected ? "bg-[#3B9DF8]/10 font-medium text-[#3B9DF8]" : "text-gray-700 hover:bg-slate-100"
                }`}
              >
                <span className="flex flex-1 items-center gap-1.5">{option.label}</span>
                <LuCheck aria-hidden className={`size-3.5 shrink-0 ${isSelected ? "" : "invisible"}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
