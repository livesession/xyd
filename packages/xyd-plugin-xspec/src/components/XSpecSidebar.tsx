import React from "react";

import { XSpecSidebarItem } from "./XSpecSidebarItem";
import type { NavItem } from "../types";

interface SidebarProps {
  items: NavItem[];
}

export function XSpecSidebar({ items }: SidebarProps) {
  return (
    <div className="spec-sidebar" aria-hidden="true">
      <div className="spec-toc">
        <div className="title">
          <a href="#">Spec Markdown</a>
        </div>
        <ol>
          {items.map((item) => (
            <XSpecSidebarItem key={item.id} item={item} />
          ))}
          <li id="_sidebar_index">
            <a href="#index">
              <span className="spec-secid">§</span>Index
            </a>
          </li>
        </ol>
      </div>
    </div>
  );
}
