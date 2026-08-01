import { type ReactNode, useEffect, useId, useState } from "react";
import { Button } from "./Button";
import { Callout, type CalloutTone } from "./Callout";
import { Input } from "./Input";
import { Modal } from "./Modal";
import { Mono } from "./Mono";

/** Button tone for the confirm action — most confirms gate a destructive op. */
export type ModalSafeConfirmTone = "danger" | "warning" | "primary";

const CALLOUT_TONE: Record<ModalSafeConfirmTone, CalloutTone> = {
  danger: "error",
  warning: "warning",
  primary: "info",
};

export interface ModalSafeConfirmProps {
  open: boolean;
  onClose: () => void;
  /** Run the guarded action. The parent owns `open` (close on success). */
  onConfirm: () => void;
  title: string;
  /** What's about to happen (and why it matters). */
  description?: ReactNode;
  /** Primary button label. Default `Confirm`. For deletes, e.g. `Delete`. */
  confirmLabel?: string;
  /** Cancel button label. Default `Cancel`. */
  cancelLabel?: string;
  /** Primary button tone. Default `danger`. */
  tone?: ModalSafeConfirmTone;
  /** A prominent warning line (e.g. "This can't be undone.") in a Callout. */
  warning?: ReactNode;
  /**
   * Type-to-confirm guard: when set, the user must type this exact string
   * (e.g. the resource name) to enable the confirm button — the extra
   * safeguard for irreversible actions.
   */
  confirmText?: string;
  /** Busy state — disables the actions and shows a working label. */
  confirming?: boolean;
  /** Busy label shown on the confirm button. Default `Working…`. */
  busyLabel?: string;
  /** An error to surface (e.g. a failed delete) in a Callout. */
  error?: ReactNode;
}

/**
 * A confirmation dialog for applying / destructive ("delete") actions. Composes
 * {@link Modal} with a danger-toned confirm button and an optional
 * type-to-confirm guard: pass `confirmText` (e.g. the resource name) and the
 * confirm button stays disabled until the user types it exactly.
 */
export function ModalSafeConfirm({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  warning,
  confirmText,
  confirming = false,
  busyLabel = "Working…",
  error,
}: ModalSafeConfirmProps) {
  const [typed, setTyped] = useState("");
  const inputId = useId();

  // Clear the type-to-confirm entry each time the dialog opens.
  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  const guarded = !!confirmText;
  const canConfirm = !guarded || typed === confirmText;

  const confirm = () => {
    if (!canConfirm || confirming) return;
    onConfirm();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={confirming}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone}
            onClick={confirm}
            disabled={!canConfirm || confirming}
          >
            {confirming ? busyLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {description && (
          <div className="text-sm leading-5 text-subtle">{description}</div>
        )}

        {warning && <Callout tone={CALLOUT_TONE[tone]}>{warning}</Callout>}

        {guarded && (
          <div className="flex flex-col gap-2">
            <label htmlFor={inputId} className="text-[13px] text-subtle">
              To confirm, type <Mono>{confirmText}</Mono> below.
            </label>
            <Input
              id={inputId}
              value={typed}
              onChange={setTyped}
              placeholder={confirmText}
              autoComplete="off"
              disabled={confirming}
            />
          </div>
        )}

        {error && <Callout tone="error">{error}</Callout>}
      </div>
    </Modal>
  );
}
