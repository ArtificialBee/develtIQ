import { useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router";
import type { DockApp } from "~/components/AppDock";
import { useEscape } from "~/hooks/useEscape";
import { ACTIVE_GRADIENT } from "~/lib/dock";
import { formatBroj } from "~/lib/ui";

export interface AppLaunchpadProps {
  open: boolean;
  apps: DockApp[];
  activeKey: string;
  gradientOf: (key: string) => string;
  onClose: () => void;
}

/**
 * Every application on one screen, like macOS Launchpad. It opens over the page,
 * closes on Escape, on a click outside the icons, or when an app is picked.
 */
export const AppLaunchpad = ({ open, apps, activeKey, gradientOf, onClose }: AppLaunchpadProps) => {
  const close = useCallback(() => onClose(), [onClose]);
  useEscape(open, close);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Sve aplikacije"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(event) => event.target === event.currentTarget && close()}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white/60 p-6 backdrop-blur-2xl"
        >
          <motion.ul
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="grid w-full max-w-5xl grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:grid-cols-7"
          >
            {apps.map((app) => {
              const Icon = app.icon;
              const active = app.key === activeKey;
              return (
                <li key={app.key} className="flex justify-center">
                  <Link
                    to={app.url}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className="group flex w-28 flex-col items-center gap-2 rounded-2xl p-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]"
                  >
                    <span
                      className={`relative flex size-14 items-center justify-center rounded-[28%] bg-linear-to-br shadow-lg transition-transform group-hover:scale-110 sm:size-16 ${active ? `text-white shadow-blue-500/30 ring-2 ring-[#3B9DF8]/60 ${ACTIVE_GRADIENT}` : `text-slate-600 shadow-gray-900/10 ring-1 ring-gray-200 group-hover:text-[#3B9DF8] ${gradientOf(app.key)}`}`}
                    >
                      <Icon aria-hidden className="size-1/2 drop-shadow" />
                      {app.badge ? (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                          {formatBroj(app.badge)}
                        </span>
                      ) : null}
                    </span>
                    <span className="line-clamp-2 text-xs font-medium text-gray-800">{app.label}</span>
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
