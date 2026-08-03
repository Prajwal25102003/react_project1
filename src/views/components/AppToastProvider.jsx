import { useToast } from "../../controllers/toastContext.jsx";
import ToastStack from "../components/ToastStack.jsx";
import { ToastProvider } from "./ToastProvider.jsx";

function ToastHost() {
  const { toasts } = useToast();
  return <ToastStack toasts={toasts} />;
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
