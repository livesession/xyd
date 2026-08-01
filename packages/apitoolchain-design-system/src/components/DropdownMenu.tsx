import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";
import { AnchorLink, type LinkComponent } from "./routing";

export interface DropdownMenuItem {
  key: string;
  label?: ReactNode;
  icon?: IconName;
  /** Renders the row as a router link instead of a button. */
  href?: string;
  onSelect?: () => void;
  /** Marks the row as selected (bold + trailing check). */
  active?: boolean;
  /** `separator` = a divider; `header` = a non-interactive section label. */
  kind?: "item" | "separator" | "header";
}

export interface DropdownMenuProps {
  /**
   * The clickable trigger — ANY element (a Button, an icon button, a badge, a
   * bare text span). DropdownMenu injects the open/close click handler onto it,
   * so the trigger doesn't manage its own state.
   */
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: "left" | "right";
  /** Which way the panel opens. Default `bottom`; use `top` for a footer menu. */
  side?: "top" | "bottom";
  /** Full-width trigger + root (e.g. a sidebar row). */
  block?: boolean;
  linkComponent?: LinkComponent;
  /** Keep the panel open after selecting an item (for multi-select). Default true. */
  closeOnSelect?: boolean;
  /**
   * Start open on mount (uncontrolled). Read once at mount, so it opens a
   * freshly-mounted menu — e.g. a just-added filter's value picker — without
   * re-opening on later re-renders.
   */
  defaultOpen?: boolean;
  /**
   * Cap the panel height and scroll its items when they'd exceed it — for long
   * lists (e.g. an API's many endpoints) that would otherwise run off-screen. A
   * number is px; a string is raw CSS (e.g. `"60vh"`, `"min(360px,50vh)"`).
   * Unset = the panel grows to fit every item.
   */
  maxHeight?: number | string;
}

/**
 * A headless-ish dropdown: bring your own trigger, get a positioned item panel
 * with click-outside + Escape close (SSR-guarded). {@link Dropdown} and
 * {@link ButtonGroup} are thin compositions over this.
 */
export function DropdownMenu({
  trigger,
  items,
  align = "left",
  side = "bottom",
  block = false,
  linkComponent,
  closeOnSelect = true,
  defaultOpen = false,
  maxHeight,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement | null>(null);
  const Link = linkComponent ?? AnchorLink;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sideCls =
    side === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]";
  return (
    <div
      ref={ref}
      className={`relative ${block ? "flex w-full" : "inline-flex"}`}
    >
      {/* Capture the trigger's click by bubbling (not prop injection) so ANY
          element works as a trigger — incl. non-interactive ones (Badge, text)
          that don't forward onClick. An interactive trigger inside (a Button)
          still gets keyboard support: Enter/Space fires a click that bubbles. */}
      {/* biome-ignore lint/a11y: the interactive trigger owns keyboard/focus; a non-interactive trigger is the caller's choice. */}
      <div
        className={block ? "flex w-full" : "inline-flex"}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </div>
      {open && (
        <div
          className={`absolute z-40 min-w-[220px] rounded-tile border border-line bg-surface p-1.5 shadow-card-hover ${sideCls} ${align === "right" ? "right-0" : "left-0"} ${maxHeight != null ? "overflow-y-auto overscroll-contain" : ""}`}
          style={maxHeight != null ? { maxHeight } : undefined}
        >
          {items.map((it) =>
            it.kind === "separator" ? (
              <div
                key={it.key}
                role="separator"
                className="my-1 h-px bg-line-soft"
              />
            ) : it.kind === "header" ? (
              <div
                key={it.key}
                className="truncate px-2.5 py-1.5 text-xs font-medium text-subtle"
              >
                {it.label}
              </div>
            ) : (
              <DropdownMenuRow
                key={it.key}
                item={it}
                Link={Link}
                onClose={() => setOpen(false)}
                closeOnSelect={closeOnSelect}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function DropdownMenuRow({
  item,
  Link,
  onClose,
  closeOnSelect,
}: {
  item: DropdownMenuItem;
  Link: LinkComponent;
  onClose: () => void;
  closeOnSelect: boolean;
}) {
  const cls = `flex w-full cursor-pointer items-center gap-2.5 rounded-control border-none bg-transparent px-2.5 py-2 text-left text-sm no-underline hover:bg-hover ${
    item.active ? "font-semibold text-ink" : "font-normal text-body"
  }`;
  const inner = (
    <>
      {item.icon && <Icon icon={item.icon} size={16} />}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.active && <Icon icon="check" size={16} />}
    </>
  );
  if (item.href) {
    return (
      <Link href={item.href} className={cls} onClick={onClose}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        item.onSelect?.();
        if (closeOnSelect) onClose();
      }}
      className={cls}
    >
      {inner}
    </button>
  );
}
