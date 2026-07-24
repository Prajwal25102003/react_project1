import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  TOAST_DURATION_MS,
  TOAST_QUEUE_MAX,
  buildToast,
  crudSuccessMessage,
} from "../models/toastModel.js";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const clearTimer = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const dismiss = useCallback(
    (id) => {
      setToasts((current) => {
        const targetId = id ?? current[0]?.id;
        if (!targetId) return current;
        clearTimer(targetId);
        return current.filter((item) => item.id !== targetId);
      });
    },
    [clearTimer],
  );

  const push = useCallback(
    (tone, message, durationMs = TOAST_DURATION_MS) => {
      const next = buildToast(tone, message);
      setToasts((current) => [next, ...current].slice(0, TOAST_QUEUE_MAX));

      if (durationMs > 0) {
        const timer = window.setTimeout(() => {
          timersRef.current.delete(next.id);
          setToasts((current) =>
            current.filter((item) => item.id !== next.id),
          );
        }, durationMs);
        timersRef.current.set(next.id, timer);
      }

      return next.id;
    },
    [],
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
      toast: toasts[0] || null,
      toasts,
      push,
      success,
      error,
      warning,
      info,
      crudSuccess,
      dismiss,
    }),
    [toasts, push, success, error, warning, info, crudSuccess, dismiss],
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
