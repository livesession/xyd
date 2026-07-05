import type { ReactNode } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";
import { DropdownMenu, type DropdownMenuItem } from "./DropdownMenu";
import type { LinkComponent } from "./routing";

export interface ButtonFilterProps {
  /**
   * Leading icon. Defaults to `plus` (the add-filter trigger). For an applied
   * rule, pass the filter's own icon — declared in the filter definition.
   */
  icon?: IconName;
  children: ReactNode;
  /**
   * Add-filter trigger: clicking opens a {@link DropdownMenu} of these filters.
   * Selecting one is how the consumer adds a rule.
   */
  items?: DropdownMenuItem[];
  /**
   * Applied-rule value picker: the pill opens this multi-select dropdown so the
   * rule can hold values (e.g. Language → go, python). Use `active` per item to
   * reflect selection and `onSelect` to toggle it.
   */
  values?: DropdownMenuItem[];
  /** Summary of the picked values shown after the label (rendered in ink). */
  valueLabel?: ReactNode;
  align?: "left" | "right";
  linkComponent?: LinkComponent;
  /** Greyer text. Applied rules (those with `onRemove`) are muted by default. */
  muted?: boolean;
  /** Hide the leading label on an applied rule — show just the icon + values. */
  hideLabel?: boolean;
  /** Trailing × that clears/deletes this applied rule. */
  onRemove?: () => void;
  onClick?: () => void;
}

const BASE =
  "inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface py-1 text-[13px] font-medium transition-colors";

/**
 * A pill filter control. As an **add trigger** (`items`) it shows a `plus` and
 * opens a dropdown of filter definitions. As an applied **rule** (`onRemove`) it
 * shows the filter's icon + greyer label, optionally opens a multi-select value
 * picker (`values`), and has a × to clear it.
 */
export function ButtonFilter({
  icon = "plus",
  children,
  items,
  values,
  valueLabel,
  align,
  linkComponent,
  muted,
  hideLabel,
  onRemove,
  onClick,
}: ButtonFilterProps) {
  const isMuted = muted ?? Boolean(onRemove);
  const tone = isMuted ? "text-muted" : "text-ink";

  // 1) Add-filter trigger.
  if (items) {
    return (
      <DropdownMenu
        items={items}
        align={align}
        linkComponent={linkComponent}
        trigger={
          <span
            className={`${BASE} ${tone} cursor-pointer px-3 hover:bg-surface-muted`}
          >
            <Icon icon={icon} size={14} className="shrink-0" />
            <span>{children}</span>
          </span>
        }
      />
    );
  }

  // 2) Applied rule — greyer label + picked values (ink) + optional picker + ×.
  if (onRemove) {
    const label = (
      <span className="inline-flex items-center gap-1.5">
        <Icon icon={icon} size={14} className="shrink-0 text-muted" />
        {!hideLabel && <span className="text-muted">{children}</span>}
        {valueLabel != null && valueLabel !== "" && (
          <span className="text-ink">{valueLabel}</span>
        )}
      </span>
    );
    const labelArea = values ? (
      <DropdownMenu
        items={values}
        align={align}
        linkComponent={linkComponent}
        closeOnSelect={false}
        trigger={
          <button
            type="button"
            className="inline-flex cursor-pointer items-center rounded-l-pill py-1 pr-2 pl-2.5"
          >
            {label}
          </button>
        }
      />
    ) : (
      <span className="inline-flex items-center py-1 pr-2 pl-2.5">{label}</span>
    );
    // Hover highlights the WHOLE pill (incl. the ×), not just one zone.
    return (
      <span className="inline-flex items-center rounded-pill border border-line bg-surface text-[13px] font-medium transition-colors hover:bg-surface-muted">
        {labelArea}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Clear filter"
          className="mr-1 inline-flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-pill text-muted transition-colors hover:text-ink"
        >
          <Icon icon="close" size={12} />
        </button>
      </span>
    );
  }

  // 3) Plain pill button.
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${BASE} ${tone} cursor-pointer px-3 hover:bg-surface-muted`}
    >
      <Icon icon={icon} size={14} className="shrink-0" />
      <span>{children}</span>
    </button>
  );
}
