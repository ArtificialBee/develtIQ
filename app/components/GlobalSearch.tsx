import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { LuSearch } from "react-icons/lu";
import { ICON_CHIP } from "~/lib/ui";
import { searchAll, type SearchEntry } from "~/lib/search";

/**
 * The search over the whole app (open items, screens, apps, work orders, people,
 * KPIs), from two letters, accents or not. The top bar holds its state, shows the
 * field in its middle and the results across its full width, so the bar grows
 * with them while the rest of the app darkens. ⌘K or Ctrl+K jumps to the field;
 * the arrows move through the results, Enter opens one and Escape closes them.
 */
export function useGlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const groups = useMemo(() => searchAll(query), [query]);
  const flat = useMemo(() => groups.flatMap((group) => group.entries), [groups]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const close = () => {
    setOpen(false);
    inputRef.current?.blur();
  };
  const go = (entry: SearchEntry) => {
    close();
    setQuery("");
    navigate(entry.url);
  };

  return {
    inputRef,
    listId,
    query,
    groups,
    flat,
    active,
    setActive,
    go,
    close,
    /** The results show once the field is in use and holds two letters. */
    showResults: open && query.trim().length >= 2,
    onChange: (value: string) => {
      setQuery(value);
      setActive(0);
      setOpen(true);
    },
    onFocus: () => setOpen(true),
  };
}

export type GlobalSearchState = ReturnType<typeof useGlobalSearch>;

/** The field in the middle of the top bar. */
export const SearchField = ({ search, className = "" }: { search: GlobalSearchState; className?: string }) => (
  <label className={`relative flex h-10 items-center ${className}`}>
    <LuSearch aria-hidden className="pointer-events-none absolute left-3 size-4 text-gray-400" />
    <input
      ref={search.inputRef}
      type="search"
      role="combobox"
      aria-expanded={search.showResults}
      aria-controls={search.listId}
      aria-activedescendant={search.showResults && search.flat[search.active] ? `${search.listId}-${search.active}` : undefined}
      aria-label="Pretraži cijelu aplikaciju"
      placeholder="Pretraži sve…"
      value={search.query}
      onChange={(event) => search.onChange(event.currentTarget.value)}
      onFocus={search.onFocus}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          search.setActive((current) => Math.min(search.flat.length - 1, current + 1));
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          search.setActive((current) => Math.max(0, current - 1));
        } else if (event.key === "Enter" && search.flat[search.active]) {
          event.preventDefault();
          search.go(search.flat[search.active]);
        } else if (event.key === "Escape") {
          search.close();
        }
      }}
      className="h-full w-full rounded-xl border border-gray-200 bg-white pl-9 pr-16 text-sm text-gray-900 shadow-sm shadow-gray-900/5 outline-none transition placeholder:text-gray-400 focus:border-[#3B9DF8] focus:ring-2 focus:ring-[#3B9DF8]/15"
    />
    <kbd className="pointer-events-none absolute right-3 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-gray-400">
      ⌘K
    </kbd>
  </label>
);

/** The results across the full width of the bar, one column per kind of thing. */
export const SearchResults = ({ search }: { search: GlobalSearchState }) => (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: "auto", opacity: 1 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="overflow-hidden"
  >
    <div id={search.listId} role="listbox" aria-label="Rezultati pretrage" className="mt-3 border-t border-gray-200/80 pt-3">
      {search.groups.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">Nema rezultata za „{search.query.trim()}“.</p>
      ) : (
        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
          {search.groups.map((group) => (
            <div key={group.kind} className="min-w-0">
              <p className="px-3 pb-1 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-gray-500">{group.label}</p>
              {group.entries.map((entry) => {
                const index = search.flat.indexOf(entry);
                const Icon = entry.icon;
                return (
                  <button
                    key={entry.key}
                    id={`${search.listId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === search.active}
                    onPointerEnter={() => search.setActive(index)}
                    onClick={() => search.go(entry)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                      index === search.active ? "bg-[#3B9DF8]/10" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className={`size-8 ${ICON_CHIP}`}>
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">{entry.title}</span>
                      <span className="block truncate text-xs text-gray-500">{entry.context}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  </motion.div>
);
