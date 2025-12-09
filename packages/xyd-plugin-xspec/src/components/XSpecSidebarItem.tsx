import React from "react";

import type { NavItem as NavItemType } from "../types";

interface SidebarItemProps {
  item: NavItemType;
}

export function XSpecSidebarItem({ item }: SidebarItemProps) {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li id={`_sidebar_${item.secid}`} className="">
      <a href={item.href}>
        <span className="spec-secid">{item.secid}</span>
        {item.label}
      </a>
      {hasChildren && (
        <>
          <input
            {...({ hidden: "" } as any)}
            className="toggle"
            type="checkbox"
            id={`_toggle_${item.secid}`}
          />
          <label htmlFor={`_toggle_${item.secid}`} />
          <ol>
            {item.children!.map((child) => (
              <XSpecSidebarItem key={child.id} item={child} />
            ))}
          </ol>
        </>
      )}
    </li>
  );
}
