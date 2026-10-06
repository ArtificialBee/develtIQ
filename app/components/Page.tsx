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

/** The title of a page that has no hero. */
export const PageTitle = ({ children }: { children: ReactNode }) => (
  <motion.h1
    variants={riseIn}
    className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
  >
    {children}
  </motion.h1>
);
