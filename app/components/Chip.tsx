import type { ReactNode } from "react";

export type BasicChipSize = "sm" | "md" | "lg";

export interface BasicChipProps {
  children: ReactNode;
  size?: BasicChipSize;
  className?: string;
}

// Full class names keep Tailwind able to find them.
const sizes: Record<BasicChipSize, string> = {
  sm: "text-[0.8rem]",
  md: "text-[1.3rem]",
  lg: "text-[1.6rem]",
};

/** A rounded gray chip for a short label or tag. */
export const BasicChip = ({
  children,
  size = "sm",
  className = "",
}: BasicChipProps) => (
  <span
    className={`inline-block px-4 py-1 dark:bg-indigo-500 dark:text-white bg-[#d1d1d180] rounded-full ${sizes[size]}  ${className}`}
  >
    {children}
  </span>
);
