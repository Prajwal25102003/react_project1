import { useEffect, useId, useRef, useState } from "react";
import {
  SELECT_ERROR_CLASS,
  SELECT_TRIGGER_CLASS,
  SELECT_TRIGGER_ERROR_CLASS,
} from "../../../models/formLayoutModel.js";

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
  const rootRef = useRef(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const display = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function handleSelect(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 w-full ${className}`}>
      <button
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

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg"
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
        </ul>
      ) : null}
    </div>
  );
}

export default SelectField;
