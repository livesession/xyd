import type { ReactNode } from "react";
import { useEffect } from "react";
import { Icon } from "../icons";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Footer actions (e.g. Cancel / Submit buttons), right-aligned. */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Fill a fixed tall height (body flexes + scrolls) so the dialog doesn't
   * resize with its content — for builder surfaces like the wizard. */
  fill?: boolean;
  /** Drop the body's padding so the content bleeds edge-to-edge (for embedded
   * surfaces that manage their own chrome, e.g. the API playground widget). */
  bleed?: boolean;
  /** Hide the title header + footer entirely (and the close button) — the content
   * fills the whole dialog and closes via Escape / scrim. For embedded tools that
   * carry their own toolbar (the API playground widget). Implies `bleed`. */
  chromeless?: boolean;
  /** A floating control anchored just above the dialog's TOP-LEFT corner (a bit
   * outside it, chromeless only) — the embedded tool's only chrome, e.g. the
   * playground's worktree toggle. Escape / scrim still close the dialog. */
  topLeftAction?: ReactNode;
  /** Keep the dialog mounted (hidden via `display:none`) when closed instead of
   * unmounting — so stateful embedded content (e.g. the playground widget's tabs
   * / edits / responses) survives a close→reopen. */
  keepMounted?: boolean;
}

const SIZE: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-[448px]",
  md: "max-w-[520px]",
  lg: "max-w-[720px]",
  // xl — wide builder surfaces (e.g. the two-pane sdk.json wizard). Uses most of
  // the viewport width, capped so it stays centered on very wide screens.
  xl: "max-w-[min(96vw,1440px)]",
};

/**
 * A centered modal dialog with a scrim. Renders nothing when closed (SSR-safe:
 * initial closed state → no hydration mismatch). Click-scrim + Escape close,
 * both `useEffect`/`document`-guarded.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  fill,
  bleed,
  chromeless,
  topLeftAction,
  keepMounted,
}: ModalProps) {
  // bleed/chromeless = edge-to-edge (the embedded tool fills the dialog, 0 gap,
  // and owns its own borders); default = comfortable padding.
  const bodyPadding = bleed || chromeless ? "" : "px-6 py-5";
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // `keepMounted`: stay in the DOM (hidden) when closed so stateful embedded
  // content survives close→reopen. Otherwise unmount (SSR-safe default).
  if (!open && !keepMounted) return null;

  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: overlay container, not a role target
      aria-hidden={!open || undefined}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${!open ? "hidden" : ""}`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default border-none bg-black/25 animate-[modal-fade_0.15s_ease-out]"
      />
      {/* Sizing wrapper — NOT clipped, so a chromeless `topLeftAction` can sit
          ABOVE the dialog's top edge (the dialog itself is overflow-hidden). */}
      <div
        className={`relative z-10 flex w-full ${
          fill ? "h-[88vh]" : "max-h-[90vh]"
        } ${SIZE[size]}`}
      >
        {chromeless && topLeftAction && (
          // Floats just above the dialog's top-left corner (a bit outside it).
          <div className="absolute bottom-full left-2 z-20 mb-2">
            {topLeftAction}
          </div>
        )}
        <div
          role="dialog"
          aria-modal="true"
          className={`flex w-full flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-card-hover animate-[modal-in_0.18s_ease-out] ${
            fill ? "h-full" : "max-h-full"
          }`}
        >
          {chromeless ? // Chromeless: NO header and NO close button — the embedded tool owns
          // the whole dialog (its own `topLeftAction` is the only chrome).
          // Closing is via Escape / scrim click.
          null : (
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold leading-6 text-ink">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-[13px] leading-5 text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-control border-none bg-transparent text-subtle hover:bg-hover"
              >
                <Icon icon="close" size={18} />
              </button>
            </div>
          )}

          <div
            className={`${
              fill
                ? // Fill: a non-scrolling flex column so the content fills the
                  // dialog and manages its own scroll (no body scrollbar).
                  "flex min-h-0 flex-1 flex-col overflow-hidden"
                : "overflow-y-auto"
            } ${bodyPadding}`}
          >
            {children}
          </div>

          {footer && !chromeless && (
            <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
