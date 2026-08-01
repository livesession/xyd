import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { Button } from "./Button";
import { DropdownMenu, type DropdownMenuItem } from "./DropdownMenu";
import type { LinkComponent } from "./routing";

/** A Dropdown item is a {@link DropdownMenuItem}. */
export type DropdownItem = DropdownMenuItem;

export interface DropdownProps {
  label: ReactNode;
  /** Leading trigger icon. */
  icon?: IconName;
  items: DropdownItem[];
  align?: "left" | "right";
  linkComponent?: LinkComponent;
  /** Trigger styling: "select" = bordered button; "ghost" = bare button. */
  variant?: "select" | "ghost";
  /** Cap the menu height + scroll long item lists (e.g. an API's many
   * endpoints). Forwarded to {@link DropdownMenu}; a number is px, a string raw
   * CSS. Unset = grow to fit. */
  maxHeight?: number | string;
}

/**
 * A dropdown selector — just a {@link Button} trigger (with a trailing chevron)
 * composed with {@link DropdownMenu}. Because the trigger IS a Button, its
 * sizing/spacing matches other buttons placed beside it.
 */
export function Dropdown({
  label,
  icon,
  items,
  align = "left",
  linkComponent,
  variant = "select",
  maxHeight,
}: DropdownProps) {
  return (
    <DropdownMenu
      items={items}
      align={align}
      linkComponent={linkComponent}
      maxHeight={maxHeight}
      trigger={
        <Button
          variant={variant === "select" ? "secondary" : "ghost"}
          icon={icon}
          iconRight="chevronUpDown"
          iconRightSize={13}
        >
          {label}
        </Button>
      }
    />
  );
}
