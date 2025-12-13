import React from "react";

import type { NavItem as NavItemType } from "../types";

interface NavItemProps {
  item: NavItemType;
}

export function XSpecNavItem({ item }: NavItemProps) {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li>
      <a href={item.href}>
        <span className="spec-secid">{item.secid}</span>
        {item.label}
      </a>
      {hasChildren && (
        <ol>
          {item.children!.map((child) => (
            <XSpecNavItem key={child.id} item={child} />
          ))}
        </ol>
      )}
    </li>
  );
}
