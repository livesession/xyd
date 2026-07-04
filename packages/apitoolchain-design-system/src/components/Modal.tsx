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
  size?: "md" | "lg";
}

const SIZE: Record<NonNullable<ModalProps["size"]>, string> = {
  md: "max-w-[520px]",
  lg: "max-w-[720px]",
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
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default border-none bg-black/25 animate-[modal-fade_0.15s_ease-out]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-card-hover animate-[modal-in_0.18s_ease-out] ${SIZE[size]}`}
      >
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

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
