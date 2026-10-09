import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MoreVertical } from "lucide-react";

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
        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1"
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
              className={`w-full text-left px-3 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${item.tone === "danger" ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
