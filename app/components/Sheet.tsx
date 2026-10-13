import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LuX } from "react-icons/lu";
import { useEscape } from "~/hooks/useEscape";

export interface SheetProps {
  open: boolean;
  title: string;
  /** A short line under the title, such as how many rows the filters leave. */
  description?: string;
  children: ReactNode;
  /** Pinned to the bottom of the sheet, such as a "clear" button. */
  footer?: ReactNode;
  onClose: () => void;
}

/**
 * A panel that slides in from the right over the page, for filters and settings.
 * The page stays visible beside it, so changes made in the sheet show at once.
 * It closes on Escape, on the X, or on a click outside it. It is drawn at the end of
 * the document, so a table deep in a page, such as in a details page's tab, still
 * opens it over the whole window and not inside its own column.
 */
export function Sheet({ open, title, description, children, footer, onClose }: SheetProps) {
  const titleId = useId();
  const close = useCallback(() => onClose(), [onClose]);
  const reduceMotion = useReducedMotion();
  useEscape(open, close);
  // The document exists only in the browser, after the first render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => event.target === event.currentTarget && close()}
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/15"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ x: reduceMotion ? 0 : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: reduceMotion ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="flex h-full w-full max-w-sm flex-col border-l border-gray-200 bg-white shadow-2xl shadow-gray-900/15"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
                {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
              </div>
              <button
                type="button"
                autoFocus
                onClick={close}
                aria-label="Zatvori"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]"
              >
                <LuX aria-hidden className="size-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <footer className="shrink-0 border-t border-gray-200 px-5 py-4">{footer}</footer>}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
