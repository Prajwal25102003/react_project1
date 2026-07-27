import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  SELECT_TRIGGER_CLASS,
  SELECT_TRIGGER_ERROR_CLASS,
} from "../../../models/formLayoutModel.js";

const LIST_MAX_HEIGHT = 240; // max-h-60
const LIST_GAP = 4;

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        d="M6 8l4 4 4-4"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SelectField({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  ariaLabel,
  hasError = false,
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const display = selected?.label ?? placeholder;

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return undefined;
    }

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - LIST_GAP;
      const spaceAbove = rect.top - LIST_GAP;
      const openUpward =
        spaceBelow < Math.min(LIST_MAX_HEIGHT, 160) && spaceAbove > spaceBelow;
      const available = Math.max(120, openUpward ? spaceAbove : spaceBelow);
      const maxHeight = Math.min(LIST_MAX_HEIGHT, available);

      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        maxHeight,
        zIndex: 100000,
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + LIST_GAP }
          : { top: rect.bottom + LIST_GAP }),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    // Capture scroll from any ancestor (AppShell, main, etc.)
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      const inTrigger = rootRef.current?.contains(event.target);
      const inList = listRef.current?.contains(event.target);
      if (!inTrigger && !inList) setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  const menu =
    open && menuStyle
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={menuStyle}
            className="overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg"
          >
            {options.map((option) => {
              const active = option.value === value;

              return (
                <li key={option.value || "__empty"} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full truncate px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                      active
                        ? "bg-brand-50 font-medium text-brand-600"
                        : "text-gray-800"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative min-w-0 w-full ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={
          hasError ? SELECT_TRIGGER_ERROR_CLASS : SELECT_TRIGGER_CLASS
        }
      >
        <span className="min-w-0 truncate">{display}</span>
        <ChevronIcon open={open} />
      </button>
      {menu}
    </div>
  );
}

export default SelectField;
