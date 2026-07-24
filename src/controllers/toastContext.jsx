import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  TOAST_DURATION_MS,
  buildToast,
  crudSuccessMessage,
} from "../models/toastModel.js";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  const push = useCallback(
    (tone, message, durationMs = TOAST_DURATION_MS) => {
      clearTimer();
      const next = buildToast(tone, message);
      setToast(next);

      if (durationMs > 0) {
        timerRef.current = window.setTimeout(() => {
          setToast((current) =>
            current?.id === next.id ? null : current,
          );
          timerRef.current = null;
        }, durationMs);
      }

      return next.id;
    },
    [clearTimer],
  );

  const success = useCallback((message) => push("success", message), [push]);
  const error = useCallback((message) => push("error", message), [push]);
  const warning = useCallback((message) => push("warning", message), [push]);
  const info = useCallback((message) => push("info", message), [push]);

  /** Convenience for create / update / delete success toasts. */
  const crudSuccess = useCallback(
    (entity, action) => success(crudSuccessMessage(entity, action)),
    [success],
  );

  const value = useMemo(
    () => ({
      toast,
      toasts: toast ? [toast] : [],
      push,
      success,
      error,
      warning,
      info,
      crudSuccess,
      dismiss,
    }),
    [toast, push, success, error, warning, info, crudSuccess, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
