import { useCallback, useId, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LuX } from "react-icons/lu";
import { useEscape } from "~/hooks/useEscape";

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
}

/** A reusable dialog with caller-provided content and action controls. */
export function Modal({ open, title, children, actions, onClose }: ModalProps) {
  const titleId = useId();
  const close = useCallback(() => onClose(), [onClose]);
  useEscape(open, close);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && close()}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close dialog"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <LuX aria-hidden className="size-4" />
              </button>
            </div>
            <div className="text-sm leading-6 text-slate-600 dark:text-slate-300">{children}</div>
            {actions && (
              <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
