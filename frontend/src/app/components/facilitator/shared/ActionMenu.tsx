import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MoreVertical } from "lucide-react";
import { EASE_OUT, FOCUS_RING } from "./tokens";

export interface ActionMenuItem {
  /** Unique within the menu; used as the React key. */
  key: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** "danger" for an action that takes something away, such as Archive. Default: "default". */
  tone?: "default" | "danger";
}

interface ActionMenuProps {
  /** What the menu is for, read out for the three-dot button: "Actions for Module 1". */
  label: string;
  items: ActionMenuItem[];
  /** Disables the button itself, e.g. while a request is running. */
  disabled?: boolean;
}

/**
 * A three-dot button that opens a small list of actions, in the look of the
 * shell's dropdowns. Arrow keys move through the items, Escape closes the menu
 * and returns focus to the button, and a click anywhere else closes it.
 */
export function ActionMenu({ label, items, disabled = false }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const enabledItems = () => Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? []);

  useEffect(() => {
    if (!open) return;
    enabledItems()[0]?.focus();

    const onMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // A menu left open must not outlive the request that disables it.
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    const focusable = enabledItems();
    if (focusable.length === 0) return;
    const index = focusable.indexOf(document.activeElement as HTMLButtonElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    focusable[(index + step + focusable.length) % focusable.length].focus();
  };

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`w-10 h-10 grid place-items-center hover:bg-[#F2F1ED] rounded-lg text-[#4A4F5C] transition-colors duration-150 ${EASE_OUT} ${FOCUS_RING} disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <MoreVertical className="w-5 h-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          // A menu floats, so it gets DESIGN.md's soft shadow.
          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-[0_8px_24px_rgba(27,29,38,0.08)] border border-[#E2E0DA] z-20 py-1"
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                // This item is about to disappear. Focus goes to the button first, so a
                // dialog the action opens can return focus there when it closes.
                buttonRef.current?.focus();
                item.onSelect();
              }}
              className={`w-full text-left min-h-11 px-4 py-2 text-[0.9375rem] font-medium transition-colors duration-150 ${FOCUS_RING} focus-visible:-outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${item.tone === "danger" ? "text-[#B42318] hover:bg-[#FDECEA]" : "text-[#1B1D26] hover:bg-[#F2F1ED]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
