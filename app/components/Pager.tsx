import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { formatBroj } from "~/lib/ui";

export interface PagerProps {
  /** Zero-based. */
  page: number;
  pages: number;
  /** All items across all pages, for the "N ukupno" text. */
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  /** What the pages hold, for screen readers, such as "Tok dana". */
  label: string;
}

const arrow =
  "flex size-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-[#3B9DF8]/10 hover:text-[#3B9DF8] disabled:pointer-events-none disabled:opacity-30 dark:text-white/60";

/** "2/5 ◀ ▶": moves through a list page by page, so the box never has to scroll. Small enough for a panel header. */
export const Pager = ({ page, pages, total, onPrevious, onNext, label }: PagerProps) => (
  <nav aria-label={`${label}: stranice`} className="flex shrink-0 items-center justify-end gap-0.5 text-xs text-gray-500 dark:text-white/60">
    <span className="mr-1 whitespace-nowrap tabular-nums" aria-live="polite" title={`${formatBroj(total)} ukupno`}>
      {formatBroj(page + 1)}/{formatBroj(pages)}
    </span>
    <button type="button" aria-label="Prethodna stranica" onClick={onPrevious} disabled={page === 0} className={arrow}>
      <LuChevronLeft aria-hidden />
    </button>
    <button type="button" aria-label="Sljedeća stranica" onClick={onNext} disabled={page >= pages - 1} className={arrow}>
      <LuChevronRight aria-hidden />
    </button>
  </nav>
);
