import React from "react";

import { XSpecBox } from "./XSpecBox";
import { XSpecHeader } from "./XSpecHeader";
import { XSpecSection } from "./XSpecSection";
import { XSpecNavItem } from "./XSpecNavItem";
import { XSpecSidebarItem } from "./XSpecSidebarItem";
import { XSpecSidebar } from "./XSpecSidebar";
import { XSpecProductionRule } from "./XSpecProductionRule";
import { XSpecTableOfContents } from "./XSpecTableOfContents";

interface XSpecProps {
  children: React.ReactNode;
}

// Styles are now scoped via `.xspec` prefix in CSS
export default function XSpec({ children }: XSpecProps) {
  return <div className="xspec">{children}</div>;
}

XSpec.Box = XSpecBox;
XSpec.Header = XSpecHeader;
XSpec.Section = XSpecSection;
XSpec.NavItem = XSpecNavItem;
XSpec.SidebarItem = XSpecSidebarItem;
XSpec.Sidebar = XSpecSidebar;
XSpec.ProductionRule = XSpecProductionRule;
XSpec.TableOfContents = XSpecTableOfContents;
