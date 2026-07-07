import { type ReactNode, useId, useState } from "react";
import { Icon, type IconName } from "../icons";

export interface CollapseProps {
  /** The header label (the clickable disclosure trigger). */
  title: ReactNode;
  /** Optional supporting line under the title. */
  description?: ReactNode;
  /** Leading icon in the header. */
  icon?: IconName;
  /**
   * Right-aligned header content (e.g. a Badge / StatusPill), shown whether
   * open or closed. Keep it display-only — it lives inside the header button,
   * so a click toggles the panel.
   */
  trailing?: ReactNode;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Controlled open state — pair with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
  /**
   * A footer inside the collapsible region, below the content — a muted strip
   * for meta info (author, timestamps, links). Revealed with the content.
   */
  footer?: ReactNode;
}

/**
 * A bordered disclosure panel: a clickable header (title + optional icon,
 * description and trailing badge) that expands to reveal long content. Height
 * animates with a pure-CSS `grid-template-rows` transition (no measuring, so
 * it's SSR-safe). Works controlled (`open`/`onOpenChange`) or uncontrolled
 * (`defaultOpen`). Stack several in a `flex flex-col gap-2` for a release list.
 */
export function Collapse({
  title,
  description,
  icon,
  trailing,
  defaultOpen = false,
  open,
  onOpenChange,
  disabled = false,
  children,
  footer,
}: CollapseProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const contentId = useId();

  const toggle = () => {
    if (disabled) return;
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className="overflow-hidden rounded-panel border border-line bg-surface">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {icon && <Icon icon={icon} size={18} className="text-subtle" />}
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-ink">{title}</span>
          {description && (
            <span className="truncate text-xs text-subtle">{description}</span>
          )}
        </span>
        {trailing && (
          <span className="ml-auto flex items-center gap-2">{trailing}</span>
        )}
        <Icon
          icon="chevronDown"
          size={16}
          className={`shrink-0 text-subtle transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${trailing ? "" : "ml-auto"}`}
        />
      </button>
      <div
        id={contentId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-line px-4 py-3 text-sm text-ink">
            {children}
          </div>
          {footer && (
            <div className="border-t border-line bg-surface-muted px-4 py-2.5 text-xs text-subtle">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
