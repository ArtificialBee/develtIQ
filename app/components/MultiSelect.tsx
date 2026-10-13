import { useEffect, useId, useRef, useState } from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { formatBroj } from "~/lib/ui";

export interface MultiSelectOption {
  value: string;
  label: string;
  tone?: StatusTone;
  /** How many records the option holds, at the right of its row. */
  count?: number;
}

export interface MultiSelectProps {
  /** Accessible name, such as "Skladište". */
  label: string;
  options: MultiSelectOption[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  /** The button's text while nothing is picked, such as "Sve". */
  allLabel?: string;
}

/**
 * A dropdown that picks several values, for a filter with more than three options:
 * a sheet's form field (the same look as `ToolbarSelect wide`) whose menu ticks and
 * unticks values and stays open until Escape or a click outside.
 */
export function MultiSelect({ label, options, selected, onToggle, allLabel = "Sve" }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

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

  const picked = options.filter((option) => selected.has(option.value));
  const text = picked.length === 0 ? allLabel : picked.length === 1 ? picked[0].label : `${picked.length} odabrano`;

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-9 w-full items-center justify-between gap-1.5 whitespace-nowrap rounded-lg border bg-white/70 pl-2.5 pr-2 text-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]/40 ${
          picked.length > 0 ? "border-[#3B9DF8]/50 text-gray-900" : "border-slate-200 text-gray-600"
        }`}
      >
        <span className="min-w-0 truncate">{text}</span>
        <LuChevronDown aria-hidden className={`size-3.5 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          aria-multiselectable="true"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white/95 p-1 shadow-xl shadow-slate-950/10 backdrop-blur-xl"
        >
          {options.map((option) => {
            const isSelected = selected.has(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onToggle(option.value)}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B9DF8] ${
                  isSelected ? "bg-[#3B9DF8]/10 font-medium text-[#3B9DF8]" : "text-gray-700 hover:bg-slate-100"
                }`}
              >
                <LuCheck aria-hidden className={`size-3.5 shrink-0 ${isSelected ? "" : "invisible"}`} />
                <span className="min-w-0 flex-1 truncate">{option.tone ? <StatusBadge tone={option.tone}>{option.label}</StatusBadge> : option.label}</span>
                {option.count !== undefined && <span className="shrink-0 text-xs tabular-nums text-gray-400">{formatBroj(option.count)}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
