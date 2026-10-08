import { useEffect, useId, useRef, useState } from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";

const WORKSPACES = [{ id: "develtiq", name: "DeveltIQ" }];

/** Workspace picker; organization data can be expanded as accounts are added. */
export function WorkspaceSwitcher() {
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
    <div ref={rootRef} className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex max-w-full items-center gap-1 rounded-md text-left text-[0.95rem] font-semibold text-gray-900 transition-colors hover:text-[#3B9DF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] dark:text-white dark:hover:text-[#3B9DF8]"
      >
        <span className="truncate">DeveltIQ</span>
        <LuChevronDown
          aria-hidden
          className={`size-4 shrink-0 text-gray-500 transition-transform dark:text-white/60 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Switch organization"
          className="absolute left-0 top-full z-40 mt-2 w-60 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-xl shadow-slate-950/15 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40"
        >
          {WORKSPACES.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              role="menuitemradio"
              aria-checked="true"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3B9DF8] dark:text-white dark:hover:bg-white/5"
            >
              <span className="size-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
                <img
                  src="/develtiq-mark.png"
                  alt=""
                  aria-hidden="true"
                  className="size-full object-cover"
                />
              </span>
              <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
              <LuCheck aria-hidden className="size-4 shrink-0 text-[#3B9DF8]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
