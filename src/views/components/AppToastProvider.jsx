import { ToastProvider, useToast } from "../../controllers/toastContext.jsx";
import ToastStack from "../components/ToastStack.jsx";

function ToastHost() {
  const { toasts, dismiss } = useToast();
  return <ToastStack toasts={toasts} onDismiss={dismiss} />;
}

/** Wraps the app with toast context + fixed toast stack. */
export function AppToastProvider({ children }) {
  return (
    <ToastProvider>
      {children}
      <ToastHost />
    </ToastProvider>
  );
}
