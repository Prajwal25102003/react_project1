import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  isAccountActive,
  storeSession,
} from "../models/authModel.js";
import {
  fetchCurrentUser,
  signIn as signInRequest,
  signOut as signOutRequest,
} from "../services/authService.js";
import { AUTH_UNAUTHORIZED_EVENT } from "../utils/authEvents.js";
import { SESSION_REFRESH_EVENT } from "../utils/sessionRefresh.js";
import { requestEmsRefresh } from "../utils/emsRefresh.js";

const AuthContext = createContext(null);

/** Auth state + actions for AuthProvider (view shell owns JSX). */
export function useAuthProviderValue() {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  const refreshUser = useCallback(async () => {
    const activeToken = getStoredToken();
    if (!activeToken) return null;

    const { user: me, token: nextToken } = await fetchCurrentUser();
    setUser(me);
    if (nextToken) {
      setToken(nextToken);
      storeSession(nextToken, me);
    } else {
      storeSession(activeToken, me);
    }
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
        const { user: me, token: nextToken } = await fetchCurrentUser();
        if (!cancelled) {
          setUser(me);
          if (nextToken) {
            setToken(nextToken);
            storeSession(nextToken, me);
          } else {
            storeSession(token, me);
          }
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
        // Re-sign avatars/attachments via fresh API payloads after long idle.
        requestEmsRefresh();
      }
    }

    window.addEventListener(SESSION_REFRESH_EVENT, handleSessionRefresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener(SESSION_REFRESH_EVENT, handleSessionRefresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [token, refreshUser]);

  const logout = useCallback(async () => {
    try {
      await signOutRequest();
    } finally {
      clearSession();
      setToken("");
      setUser(null);
    }
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setToken("");
      setUser(null);
      const path = window.location.pathname;
      if (path !== "/signin" && !path.startsWith("/signin/")) {
        window.location.assign("/signin");
      }
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await signInRequest(email, password);
    storeSession(result.token, result.user);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  return useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      accountActive: isAccountActive(user),
      login,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, logout, refreshUser],
  );
}

export { AuthContext };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
