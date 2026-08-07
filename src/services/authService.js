import { fetchJson } from "./apiService.js";

export async function signIn(email, password) {
  const data = await fetchJson("/api/auth/signin", "Failed to sign in", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  });
  return {
    token: data.token,
    user: data.user,
  };
}

export async function fetchCurrentUser() {
  const data = await fetchJson("/api/auth/me", "Failed to load session");
  return {
    user: data.user,
    token: data.token || null,
  };
}

export async function fetchAuthProfile() {
  const data = await fetchJson("/api/auth/profile", "Failed to load profile");
  return data.profile;
}

/** Revoke server-side session (token_version bump). Best-effort on logout. */
export async function signOut() {
  try {
    await fetchJson("/api/auth/logout", "Failed to sign out", {
      method: "POST",
      body: {},
    });
  } catch {
    /* still clear local session */
  }
}
