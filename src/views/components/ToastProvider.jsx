import {
  ToastContext,
  useToastProviderValue,
} from "../../controllers/toastContext.jsx";

export function ToastProvider({ children }) {
  const value = useToastProviderValue();
  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}
