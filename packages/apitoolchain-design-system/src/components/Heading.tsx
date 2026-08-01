import { createElement, type ReactNode } from "react";

export interface HeadingProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  as?: "h1" | "h2" | "h3";
}

const SIZE: Record<NonNullable<HeadingProps["size"]>, string> = {
  sm: "text-[15px] leading-5",
  md: "text-section",
  lg: "text-[24px] leading-7",
};

/** A section heading in the design-system type scale. */
export function Heading({ children, size = "md", as = "h2" }: HeadingProps) {
  return createElement(
    as,
    { className: `m-0 mb-3.5 font-semibold tracking-[-0.01em] text-ink ${SIZE[size]}` },
    children,
  );
}
