import type { Variants } from "framer-motion";

/** The ease of every entrance on the home page: fast start, soft landing. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** A parent that shows its children one after another. */
export const stagger = (step = 0.07, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
});

/** A child that fades in and rises a little. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};
