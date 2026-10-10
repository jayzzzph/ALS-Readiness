import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { canReturnFocus, dialogOpener } from "../../../../lib/focusReturn";
import { DISPLAY_FONT, EASE_OUT, FOCUS_RING } from "./tokens";

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
    <div className="fixed inset-0 bg-[#1B1D26]/40 flex items-center justify-center z-50 p-4" onClick={close}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
        // A dialog floats, so it is the one panel that gets DESIGN.md's soft shadow.
        className={`bg-white rounded-2xl border border-[#E2E0DA] shadow-[0_8px_24px_rgba(27,29,38,0.08)] w-full ${SIZE[size]} max-h-full flex flex-col focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-3 p-6 border-b border-[#E2E0DA] flex-shrink-0">
          <div className="min-w-0">
            <h3 id={titleId} className="text-[1.5rem] leading-[1.25] text-[#1B1D26]" style={DISPLAY_FONT}>{title}</h3>
            {subtitle && <p className="text-[#4A4F5C] text-[0.9375rem] mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close"
            className={`w-10 h-10 grid place-items-center hover:bg-[#F2F1ED] rounded-lg disabled:opacity-40 flex-shrink-0 transition-colors duration-150 ${EASE_OUT} ${FOCUS_RING}`}
          >
            <X className="w-5 h-5 text-[#4A4F5C]" aria-hidden="true" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-base leading-[1.55] text-[#1B1D26]">{children}</div>
        {footer && <div className="flex gap-3 p-6 pt-0 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
