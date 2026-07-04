import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";
import { DropdownMenu, type DropdownMenuItem } from "./DropdownMenu";
import type { LinkComponent } from "./routing";

const VARIANT: Record<"primary" | "secondary", string> = {
  primary: "border-transparent bg-ink text-white hover:bg-body",
  secondary: "border-line bg-surface text-ink hover:bg-surface-muted",
};

const BASE =
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap border text-[13px] font-medium leading-5 transition-[background-color,transform] active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

export interface ButtonGroupProps {
  label: ReactNode;
  icon?: IconName;
  variant?: "primary" | "secondary";
  /** Disables the MAIN action; the caret dropdown stays usable. */
  disabled?: boolean;
  /** Tooltip on the main action (e.g. an onboarding hint when disabled). */
  title?: string;
  onClick?: () => void;
  /** Dropdown options revealed by the caret. */
  items: DropdownMenuItem[];
  align?: "left" | "right";
  linkComponent?: LinkComponent;
}

/**
 * A grouped button: a primary action joined with a caret {@link DropdownMenu}.
 * The primary can be disabled (truly inert) while the caret stays usable — e.g.
 * a not-yet-available primary with an "Import" fallback in the dropdown.
 */
export function ButtonGroup({
  label,
  icon,
  variant = "primary",
  disabled,
  title,
  onClick,
  items,
  align = "right",
  linkComponent,
}: ButtonGroupProps) {
  const v = VARIANT[variant];
  return (
    <div className="inline-flex">
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        title={title}
        className={`${BASE} ${v} gap-1.5 rounded-l-control rounded-r-none px-3 py-[5px]`}
      >
        {icon && <Icon icon={icon} size={16} />}
        {label}
      </button>
      <DropdownMenu
        items={items}
        align={align}
        linkComponent={linkComponent}
        trigger={
          <button
            type="button"
            aria-label="More actions"
            className={`${BASE} ${v} -ml-px rounded-l-none rounded-r-control border-l-white/20 px-1.5 py-[5px]`}
          >
            <Icon icon="more-down" size={16} />
          </button>
        }
      />
    </div>
  );
}
