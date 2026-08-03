import {
  AuthContext,
  useAuthProviderValue,
} from "../../controllers/authContext.jsx";

export function AuthProvider({ children }) {
  const value = useAuthProviderValue();
  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
