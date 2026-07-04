import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { Button } from "./Button";
import { DropdownMenu, type DropdownMenuItem } from "./DropdownMenu";
import type { LinkComponent } from "./routing";

/** Back-compat alias — a Menu item is a {@link DropdownMenuItem}. */
export type MenuItem = DropdownMenuItem;

export interface MenuProps {
  label: ReactNode;
  /** Leading trigger icon. */
  icon?: IconName;
  items: MenuItem[];
  align?: "left" | "right";
  linkComponent?: LinkComponent;
  /** Trigger styling: "select" = bordered button; "ghost" = bare button. */
  variant?: "select" | "ghost";
}

/**
 * A dropdown selector — just a {@link Button} trigger (with a trailing chevron)
 * composed with {@link DropdownMenu}. Because the trigger IS a Button, its
 * sizing/spacing matches other buttons placed beside it.
 */
export function Menu({
  label,
  icon,
  items,
  align = "left",
  linkComponent,
  variant = "select",
}: MenuProps) {
  return (
    <DropdownMenu
      items={items}
      align={align}
      linkComponent={linkComponent}
      trigger={
        <Button
          variant={variant === "select" ? "secondary" : "ghost"}
          icon={icon}
          iconRight="chevronDown"
        >
          {label}
        </Button>
      }
    />
  );
}
