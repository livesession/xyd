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
  /**
   * Interactive header content pinned to the far right (buttons, menus, links)
   * that stays reachable while the panel is collapsed. Its clicks act on their
   * own and do NOT toggle the panel (it stops propagation). The header row is a
   * clickable div — a `title` link works the same way (stop propagation on it).
   */
  headerAction?: ReactNode;
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
  headerAction,
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
      {/* A full-width clickable row (not a <button>, so it can host interactive
          children — links, action buttons). Clicking bare space toggles; the
          headerAction / any link inside stops propagation and acts on its own. */}
      {/* biome-ignore lint/a11y/useSemanticElements: needs interactive children, which a <button> can't nest */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={toggle}
        onKeyDown={(e) => {
          if (disabled || (e.key !== "Enter" && e.key !== " ")) return;
          e.preventDefault();
          toggle();
        }}
        aria-expanded={isOpen}
        aria-controls={contentId}
        aria-disabled={disabled || undefined}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-hover"
        }`}
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
        {headerAction && (
          // Interactive actions — clicks/keys here act on their own and never
          // toggle the panel.
          // biome-ignore lint/a11y/noStaticElementInteractions: intentionally stops the row's toggle
          <span
            className={`flex shrink-0 items-center gap-1.5 ${trailing ? "" : "ml-auto"}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {headerAction}
          </span>
        )}
        <Icon
          icon="chevronDown"
          size={16}
          className={`shrink-0 text-subtle transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${trailing || headerAction ? "" : "ml-auto"}`}
        />
      </div>
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
