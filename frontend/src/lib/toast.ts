import { toast as sonnerToast } from "sonner";

/** A button inside a toast, e.g. "Undo" after an archive. */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

// A toast with an action stays up longer, so there is time to use it.
const ACTION_DURATION_MS = 10000;

export const toast = {
  success: (message: string, action?: ToastAction) =>
    action ? sonnerToast.success(message, { action, duration: ACTION_DURATION_MS }) : sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
};
