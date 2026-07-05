import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { IconName } from "../icons";
import { Icon } from "../icons";
import { AnchorLink, type LinkComponent } from "./routing";

export interface DropdownMenuItem {
  key: string;
  label: ReactNode;
  icon?: IconName;
  /** Renders the row as a router link instead of a button. */
  href?: string;
  onSelect?: () => void;
  /** Marks the row as selected (bold + trailing check). */
  active?: boolean;
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
  linkComponent?: LinkComponent;
  /** Keep the panel open after selecting an item (for multi-select). Default true. */
  closeOnSelect?: boolean;
}

/**
 * A headless-ish dropdown: bring your own trigger, get a positioned item panel
 * with click-outside + Escape close (SSR-guarded). {@link Menu} and
 * {@link ButtonGroup} are thin compositions over this.
 */
export function DropdownMenu({
  trigger,
  items,
  align = "left",
  linkComponent,
  closeOnSelect = true,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={ref} className="relative inline-flex">
      {/* Capture the trigger's click by bubbling (not prop injection) so ANY
          element works as a trigger — incl. non-interactive ones (Badge, text)
          that don't forward onClick. An interactive trigger inside (a Button)
          still gets keyboard support: Enter/Space fires a click that bubbles. */}
      {/* biome-ignore lint/a11y: the interactive trigger owns keyboard/focus; a non-interactive trigger is the caller's choice. */}
      <div className="inline-flex" onClick={() => setOpen((o) => !o)}>
        {trigger}
      </div>
      {open && (
        <div
          className={`absolute top-[calc(100%+6px)] z-40 min-w-[220px] rounded-tile border border-line bg-surface p-1.5 shadow-card-hover ${align === "right" ? "right-0" : "left-0"}`}
        >
          {items.map((it) => (
            <DropdownMenuRow
              key={it.key}
              item={it}
              Link={Link}
              onClose={() => setOpen(false)}
              closeOnSelect={closeOnSelect}
            />
          ))}
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
