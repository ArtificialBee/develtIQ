import { useEffect } from "react";
import {
  animate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { formatBroj } from "~/lib/ui";

/**
 * A number that counts up from 0 to `value` when it mounts, with the local
 * thousands separator. Render the result as a child of a `motion` element.
 * With reduced motion it shows `value` at once.
 */
export function useCountUp(value: number, duration = 1.4) {
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const display = useTransform(count, (latest) => formatBroj(Math.round(latest)));

  useEffect(() => {
    if (reduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [count, value, duration, reduceMotion]);

  return display;
}
