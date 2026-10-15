import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { riseIn, stagger } from "~/lib/motion";

export interface PageProps {
  children: ReactNode;
  /**
   * Make the page exactly the height of its box and never scroll: the children
   * share the height and must fit it.
   */
  fill?: boolean;
  className?: string;
}

/** The body of a page: a column of cards that rise in one after another. */
export const Page = ({ children, fill = false, className = "" }: PageProps) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={stagger(0.1)}
    className={`flex flex-col ${fill ? "h-full min-h-0 gap-3 overflow-hidden p-3 sm:p-4 lg:gap-4 lg:px-6" : "gap-6 p-6"} ${className}`}
  >
    {children}
  </motion.div>
);

/**
 * The part of a page under its top bar that scrolls. `children` fill the first
 * screen exactly, laid out as on a page that does not scroll, and `more` follows
 * under them. The top bar above it, the sidebar and the dock stay where they are.
 * The negative margins let the scrollbar sit at the page's edge and keep card
 * shadows from being cut off.
 */
export const ScrollArea = ({ children, more }: { children: ReactNode; more: ReactNode }) => (
  <div className="-mx-3 -mb-3 min-h-0 flex-1 overflow-y-auto px-3 pb-3 sm:-mx-4 sm:-mb-4 sm:px-4 sm:pb-4 lg:-mx-6 lg:px-6">
    <div className="flex h-full flex-col gap-3 lg:gap-4">{children}</div>
    <div className="mt-3 flex flex-col gap-3 lg:mt-4 lg:gap-4">{more}</div>
  </div>
);

/** The title of a page that has no hero. */
export const PageTitle = ({ children }: { children: ReactNode }) => (
  <motion.h1
    variants={riseIn}
    className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
  >
    {children}
  </motion.h1>
);
