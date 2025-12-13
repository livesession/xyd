import type React from "react";

export interface NavItem {
  id: string;
  label: string;
  secid: string;
  href: string;
  children?: NavItem[];
  hasToggle?: boolean;
}

export interface SpecBoxProps {
  type: "note" | "todo" | "example" | "counter-example";
  id: string;
  children: React.ReactNode;
  source?: string;
}

export interface ProductionItem {
  name: string;
  alternatives?: string[][];
  useGrid?: boolean;
  columns?: number;
  gridItems?: string[];
}

export interface SpecSectionProps {
  id: string;
  secid: number | string;
  title: string;
  headingLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  dataSource?: string;
  children: React.ReactNode;
  className?: string;
  indexSpec?: boolean;
}

export interface SpecHeaderProps {
  id: string;
  secid: number | string;
  title: string;
  level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  dataSource?: string;
}
