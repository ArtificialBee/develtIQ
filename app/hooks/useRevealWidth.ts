import { useEffect, type RefObject } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { useElementSize } from "~/hooks/useElementSize";

/**
 * A springy width that opens to the live width of `contentRef` (plus `extra` px)
 * and closes to 0. It follows the content while it changes size, so a reveal
 * never jumps at its end. With `instant` it moves without animating.
 */
export function useRevealWidth(open: boolean, contentRef: RefObject<HTMLElement | null>, extra = 0, instant = false) {
  const { width } = useElementSize(contentRef);
  const target = useMotionValue(0);
  const spring = useSpring(target, { stiffness: 320, damping: 34, mass: 0.9 });

  useEffect(() => {
    const next = open && width > 0 ? width + extra : 0;
    target.set(next);
    if (instant) spring.jump(next);
  }, [open, width, extra, instant, target, spring]);

  return spring;
}
