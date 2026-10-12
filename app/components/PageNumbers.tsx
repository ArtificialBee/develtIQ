import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { formatBroj } from "~/lib/ui";

export interface PageNumbersProps {
  /** Zero-based. */
  page: number;
  pages: number;
  /** Zero-based. */
  onPage: (page: number) => void;
  /** What the pages hold, for screen readers, such as "Pokazatelji". */
  label: string;
}

type Slot = number | "gap";

/**
 * The page numbers to show, 1-based: the first, the last, and the current one with
 * a neighbour on each side, three at either end. A skipped run of pages becomes
 * "…", but a single skipped page is shown, since "…" would take its place anyway.
 * So 7 pages read 1 2 3 … 7, and 5 or fewer show every page.
 */
const pageSlots = (current: number, pages: number): Slot[] => {
  const start = Math.max(1, Math.min(current - 1, pages - 2));
  const shown = [...new Set([1, start, start + 1, start + 2, pages])]
    .filter((page) => page >= 1 && page <= pages)
    .sort((a, b) => a - b);
  const slots: Slot[] = [];
  shown.forEach((page, index) => {
    const previous = shown[index - 1];
    if (previous !== undefined && page - previous === 2) slots.push(previous + 1);
    if (previous !== undefined && page - previous > 2) slots.push("gap");
    slots.push(page);
  });
  return slots;
};

const cell =
  "flex size-8 items-center justify-center rounded-lg text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]";
const arrow = `${cell} text-gray-500 hover:bg-[#3B9DF8]/10 hover:text-[#3B9DF8] disabled:pointer-events-none disabled:opacity-30`;

/** ‹ 1 2 3 … 7 ›: page buttons for the bottom of a list, centered. Every number opens its page. */
export const PageNumbers = ({ page, pages, onPage, label }: PageNumbersProps) => (
  <nav aria-label={`${label}: stranice`} className="flex shrink-0 items-center justify-center gap-1 pt-3">
    <button type="button" aria-label="Prethodna stranica" onClick={() => onPage(page - 1)} disabled={page === 0} className={arrow}>
      <LuChevronLeft aria-hidden />
    </button>
    {pageSlots(page + 1, pages).map((slot, index) =>
      slot === "gap" ? (
        <span key={`gap-${index}`} aria-hidden className="flex w-6 justify-center text-sm text-gray-400">
          …
        </span>
      ) : (
        <button
          key={slot}
          type="button"
          aria-label={`Stranica ${slot}`}
          aria-current={slot === page + 1 ? "page" : undefined}
          onClick={() => onPage(slot - 1)}
          className={`${cell} ${
            slot === page + 1
              ? "bg-[#3B9DF8] font-semibold text-white shadow-sm shadow-blue-500/30"
              : "text-gray-600 hover:bg-[#3B9DF8]/10 hover:text-[#3B9DF8]"
          }`}
        >
          {formatBroj(slot)}
        </button>
      ),
    )}
    <button type="button" aria-label="Sljedeća stranica" onClick={() => onPage(page + 1)} disabled={page >= pages - 1} className={arrow}>
      <LuChevronRight aria-hidden />
    </button>
  </nav>
);
