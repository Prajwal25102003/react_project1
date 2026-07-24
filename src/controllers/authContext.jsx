import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  storeSession,
} from "../models/authModel.js";
import { fetchCurrentUser, signIn as signInRequest } from "../services/authService.js";
import { SESSION_REFRESH_EVENT } from "../utils/sessionRefresh.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  const refreshUser = useCallback(async () => {
    const activeToken = getStoredToken();
    if (!activeToken) return null;

    const me = await fetchCurrentUser();
    setUser(me);
    storeSession(activeToken, me);
    return me;
  }, []);

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

  useEffect(() => {
    if (!token) return undefined;

    async function handleSessionRefresh() {
      try {
        await refreshUser();
      } catch {
        /* keep existing session on transient failures */
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        handleSessionRefresh();
      }
    }

    window.addEventListener(SESSION_REFRESH_EVENT, handleSessionRefresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener(SESSION_REFRESH_EVENT, handleSessionRefresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [token, refreshUser]);

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
      refreshUser,
    }),
    [user, token, loading, refreshUser],
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
