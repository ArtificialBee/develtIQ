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

/** A rounded blue chip for a short label or count, such as the count next to a card title. */
export const BasicChip = ({
  children,
  size = "sm",
  className = "",
}: BasicChipProps) => (
  <span
    className={`inline-block px-3 py-0.5 rounded-full font-medium tabular-nums bg-[#3B9DF8]/10 text-[#3B9DF8] ring-1 ring-[#3B9DF8]/25 ${sizes[size]} ${className}`}
  >
    {children}
  </span>
);
