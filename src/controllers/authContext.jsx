import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  storeSession,
} from "../models/authModel.js";
import { fetchCurrentUser, signIn as signInRequest } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await fetchCurrentUser();
        if (!cancelled) {
          setUser(me);
          storeSession(token, me);
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setToken("");
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function login(email, password) {
    const result = await signInRequest(email, password);
    storeSession(result.token, result.user);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }

  function logout() {
    clearSession();
    setToken("");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
