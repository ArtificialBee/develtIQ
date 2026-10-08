import { useEffect, useId, useRef, useState } from "react";
import { LuChevronDown } from "react-icons/lu";

export interface ModalSelectOption {
  value: string;
  label: string;
}

export interface ModalSelectProps {
  id?: string;
  label: string;
  value: string;
  options: ModalSelectOption[];
  onChange: (value: string) => void;
}

/** A themed single-select menu for use inside the app's modal dialogs. */
export function ModalSelect({ id: providedId, label, value, options, onChange }: ModalSelectProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const listId = `${id}-options`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

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
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="mb-2 block font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-10 text-left text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-[#3B9DF8] focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:border-slate-600"
      >
        <span>{selected?.label ?? ""}</span>
        <LuChevronDown
          aria-hidden
          className={`absolute right-3 size-4 text-slate-500 transition-transform dark:text-slate-400 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-xl shadow-slate-950/10 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/30"
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
                className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B9DF8] ${
                  isSelected
                    ? "bg-[#3B9DF8]/10 font-medium text-[#3B9DF8]"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
