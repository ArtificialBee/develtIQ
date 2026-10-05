import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { riseIn } from "~/lib/motion";

export interface CardProps {
  children: ReactNode;
  /** The HTML element of the card. */
  as?: "div" | "section" | "article";
  /** Id of the element that names the card. */
  labelledBy?: string;
  className?: string;
}

const elements = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
};

// Far outside the card, so no light shows until the pointer comes in.
const OFFSCREEN = -1000;

// Shows the background only in a 1px band along the edge, so the glow reads as a lit border.
const borderOnly: CSSProperties = {
  padding: 1,
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

/**
 * The one card of the app: a glass surface whose border and surface light up under
 * the pointer. Every other card (Panel, StatCard, Accordion items, charts, tables)
 * is built on it. It rises in when a `stagger` parent shows it.
 */
export const Card = ({ children, as = "div", labelledBy, className = "" }: CardProps) => {
  const Element = elements[as];
  const x = useMotionValue(OFFSCREEN);
  const y = useMotionValue(OFFSCREEN);
  const surface = useMotionTemplate`radial-gradient(360px circle at ${x}px ${y}px, rgba(59,157,248,0.12), transparent 70%)`;
  const edge = useMotionTemplate`radial-gradient(240px circle at ${x}px ${y}px, rgba(59,157,248,0.9), transparent 70%)`;

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  };

  const handlePointerLeave = () => {
    x.set(OFFSCREEN);
    y.set(OFFSCREEN);
  };

  return (
    <Element
      variants={riseIn}
      aria-labelledby={labelledBy}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`group relative rounded-2xl border border-[#e5eaf2] bg-white/80 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/60 dark:shadow-black/30 ${className}`}
    >
      <motion.div
        aria-hidden
        style={{ ...borderOnly, background: edge }}
        className="pointer-events-none absolute -inset-px rounded-2xl"
      />
      <motion.div
        aria-hidden
        style={{ background: surface }}
        className="pointer-events-none absolute inset-0 rounded-2xl"
      />
      <div className="relative h-full">{children}</div>
    </Element>
  );
};
