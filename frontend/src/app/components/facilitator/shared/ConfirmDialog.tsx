import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  /** A quiet line under the title: what the action applies to. */
  subtitle?: ReactNode;
  /** What will happen, in a sentence or two. */
  children: ReactNode;
  confirmLabel: string;
  /** Shown on the confirm button while `busy`. Default: "Saving…". */
  busyLabel?: string;
  /** Default: "primary". */
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
  onClose: () => void;
  /** While true the buttons are disabled and the dialog cannot be dismissed. */
  busy?: boolean;
}

/** A yes-or-no dialog on the shared Modal: Cancel on the left, the action on the right. */
export function ConfirmDialog({
  title,
  subtitle,
  children,
  confirmLabel,
  busyLabel = "Saving…",
  confirmVariant = "primary",
  onConfirm,
  onClose,
  busy = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <Button onClick={onClose} disabled={busy} className="flex-1">Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={busy} className="flex-1">
            {busy ? busyLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[#1B1D26] text-base space-y-3">{children}</div>
    </Modal>
  );
}
