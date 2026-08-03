import {
  NotificationsContext,
  useNotificationsProviderValue,
} from "../../controllers/notificationsContext.jsx";

export function NotificationsProvider({ children }) {
  const value = useNotificationsProviderValue();
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
