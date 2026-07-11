import {
  ModalSafeConfirm,
  type ModalSafeConfirmProps,
} from "@apitoolchain/design-system";
import { type ReactNode, useState } from "react";

type DeleteConfirmProps = Pick<
  ModalSafeConfirmProps,
  | "title"
  | "description"
  | "warning"
  | "confirmText"
  | "confirmLabel"
  | "tone"
  | "confirming"
  | "busyLabel"
  | "error"
> & {
  /** Run the destructive action (e.g. a fetcher submit). */
  onConfirm: () => void;
  /**
   * Render the trigger; call `open` to reveal the confirm dialog. Lets each
   * call keep its own button style while the confirm UX stays consistent.
   */
  trigger: (open: () => void) => ReactNode;
};

/**
 * App-level wrapper that pairs a caller-rendered trigger with a
 * {@link ModalSafeConfirm} and owns the open state — the one place every
 * "delete"/"remove" flow routes through so destructive actions always confirm.
 * On success the surrounding row/page unmounts (revalidation / redirect), which
 * closes the dialog; failures keep it open with the passed `error`.
 */
export function DeleteConfirm({
  onConfirm,
  trigger,
  ...confirm
}: DeleteConfirmProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {trigger(() => setOpen(true))}
      <ModalSafeConfirm
        {...confirm}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
      />
    </>
  );
}
