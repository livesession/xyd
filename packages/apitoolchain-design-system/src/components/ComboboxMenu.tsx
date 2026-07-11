import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "../icons";

export interface ComboboxMenuOption {
  value: string;
  label?: string;
  /** Optional leading icon — handy for a special/exclusive option. */
  icon?: IconName;
  /**
   * Rendered set apart — pinned at the top of the list, above a separator. For a
   * "catch-all"/"none" style choice (e.g. "All dist-tags", "No dist-tag"). The
   * selection SEMANTICS (does picking it clear the rest?) are the caller's — this
   * only affects placement.
   */
  exclusive?: boolean;
}

export interface ComboboxMenuProps {
  /** Preset, checkable options. */
  options?: ComboboxMenuOption[];
  /** Values shown with a check. */
  selected?: string[];
  /** Pick an option OR (with `allowCustom`) a typed value — the caller applies
   * it however it wants (single- or multi-select). */
  onSelect: (value: string) => void;
  /** Offer an `Add "<typed>"` row for values not already in `options`. */
  allowCustom?: boolean;
  /** Close the menu after a pick — for single-select triggers. */
  closeOnSelect?: boolean;
  /** Filter input placeholder. */
  searchPlaceholder?: string;
  disabled?: boolean;
  /** Start open on mount — for previews / Storybook (the menu is otherwise
   * toggled from the trigger). */
  defaultOpen?: boolean;
  /**
   * The trigger. Its look is entirely yours (a chip field, a plain input, a
   * button, …) — wire `onClick={toggle}`; `open` reflects the menu state.
   */
  children: (api: { open: boolean; toggle: () => void }) => ReactNode;
}

/**
 * The searchable "choose from options / type your own" popover — with a CUSTOM
 * trigger. The trigger (the `children` render prop) can look like anything while
 * the menu always looks the same: a filter input, checkable rows, an optional
 * `Add "<typed>"` row, and `exclusive` options pinned above a separator. Portaled
 * to `<body>` so a modal's overflow never clips it; closes on click-outside +
 * Escape. {@link Combobox} is built on this.
 */
export function ComboboxMenu({
  options = [],
  selected = [],
  onSelect,
  allowCustom = false,
  closeOnSelect = false,
  searchPlaceholder,
  disabled,
  defaultOpen = false,
  children,
}: ComboboxMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const toggle = () => {
    if (!disabled) setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const place = () =>
      setRect(wrapRef.current?.getBoundingClientRect() ?? null);
    place();
    requestAnimationFrame(() => inputRef.current?.focus());
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !panelRef.current?.contains(t))
        close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  const sel = new Set(selected);
  const optFor = (v: string) => options.find((o) => o.value === v);
  const labelFor = (v: string) => optFor(v)?.label ?? v;
  const q = query.trim();
  const ql = q.toLowerCase();
  const values = options.map((o) => o.value);
  const filtered = values.filter(
    (v) =>
      labelFor(v).toLowerCase().includes(ql) || v.toLowerCase().includes(ql),
  );
  const canAdd =
    allowCustom && q.length > 0 && !values.some((v) => v.toLowerCase() === ql);

  function pick(v: string) {
    onSelect(v);
    if (closeOnSelect) close();
    else {
      setQuery("");
      inputRef.current?.focus();
    }
  }

  // Exclusive options render pinned above a separator, set apart from the rest.
  const exclusiveFiltered = filtered.filter((v) => optFor(v)?.exclusive);
  const regularFiltered = filtered.filter((v) => !optFor(v)?.exclusive);
  const renderRow = (v: string) => {
    const o = optFor(v);
    return (
      <button
        key={v}
        type="button"
        onClick={() => pick(v)}
        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-control border-none bg-transparent px-2.5 py-2 text-left text-sm hover:bg-hover ${
          sel.has(v) ? "font-semibold text-ink" : "font-normal text-body"
        }`}
      >
        {o?.icon && <Icon icon={o.icon} size={16} className="text-muted" />}
        <span className="min-w-0 flex-1 truncate">{labelFor(v)}</span>
        {sel.has(v) && <Icon icon="check" size={16} />}
      </button>
    );
  };

  return (
    <div ref={wrapRef} className="relative">
      {children({ open, toggle })}
      {open &&
        !disabled &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              left: rect.left,
              top: rect.bottom + 6,
              width: rect.width,
              zIndex: 70,
            }}
            className="max-h-64 overflow-auto rounded-tile border border-line bg-surface p-1.5 shadow-card-hover"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAdd) {
                  e.preventDefault();
                  pick(q);
                }
              }}
              placeholder={
                searchPlaceholder ??
                (allowCustom ? "Filter or type to add…" : "Filter…")
              }
              className="mb-1 w-full rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none placeholder:text-muted"
            />
            {exclusiveFiltered.map(renderRow)}
            {exclusiveFiltered.length > 0 && regularFiltered.length > 0 && (
              <div role="separator" className="my-1 h-px bg-line-soft" />
            )}
            {regularFiltered.map(renderRow)}
            {canAdd && (
              <button
                type="button"
                onClick={() => pick(q)}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-control border-none bg-transparent px-2.5 py-2 text-left text-sm text-body hover:bg-hover"
              >
                <Icon icon="plus" size={16} />
                <span>
                  Add "<span className="font-medium text-ink">{q}</span>"
                </span>
              </button>
            )}
            {filtered.length === 0 && !canAdd && (
              <div className="px-2.5 py-2 text-sm text-muted">No matches.</div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
