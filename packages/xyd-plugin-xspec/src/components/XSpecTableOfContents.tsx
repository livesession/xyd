import React from "react";

import { XSpecNavItem } from "./XSpecNavItem";
import type { NavItem as NavItemType } from "../types";

interface TableOfContentsProps {
  items: NavItemType[];
}

export function XSpecTableOfContents({ items }: TableOfContentsProps) {
  return (
    <nav className="spec-toc">
      <div className="title">Contents</div>
      <ol>
        {items.map((item) => (
          <XSpecNavItem key={item.id} item={item} />
        ))}
      </ol>
    </nav>
  );
}
