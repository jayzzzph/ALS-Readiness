import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { canReturnFocus, dialogOpener } from "../../../../lib/focusReturn";

interface ModalProps {
  title: string;
  /** A quiet line under the title, e.g. who or what the dialog is about. */
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Buttons pinned under the body. */
  footer?: ReactNode;
  /** While true the dialog cannot be dismissed (Escape, backdrop, the X) - use it during a save. */
  busy?: boolean;
  /** Default: "md" (the width of the existing mockup dialogs). */
  size?: "md" | "lg";
  /** The element to focus when the dialog opens, e.g. a form's first field. Default: the dialog itself. */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

const SIZE = { md: "max-w-lg", lg: "max-w-2xl" } as const;

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The control last pressed with a pointer. Some browsers do not focus a button
// when it is clicked, and then document.activeElement cannot say what opened a dialog.
let lastPressed: HTMLElement | null = null;
if (typeof document !== "undefined") {
  document.addEventListener(
    "pointerdown",
    (event) => {
      lastPressed = event.target instanceof Element ? event.target.closest<HTMLElement>(FOCUSABLE) : null;
    },
    true,
  );
}

/**
 * The dialog the mockups hand-write (dimmed backdrop, white rounded panel,
 * title row with an X), with the keyboard behaviour they lack: the title
 * labels the dialog, focus moves into it when it opens and returns to where it
 * was when it closes, Tab stays inside, and Escape closes it.
 */
export function Modal({ title, subtitle, onClose, children, footer, busy = false, size = "md", initialFocusRef }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const opener = dialogOpener(active, document.body, lastPressed);
    (initialFocusRef?.current ?? panelRef.current)?.focus();
    return () => {
      // The opener may be gone by now, e.g. a table row the dialog's action removed.
      if (opener && canReturnFocus(opener)) opener.focus();
    };
    // Focus moves once, when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (!busy) onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;

    // Keep Tab inside the dialog.
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={close}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
        className={`bg-white rounded-2xl shadow-2xl w-full ${SIZE[size]} max-h-full flex flex-col focus:outline-none`}
      >
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <h3 id={titleId} className="text-gray-800 font-bold">{title}</h3>
            {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close"
            className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-40 flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="flex gap-3 p-5 pt-0 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
