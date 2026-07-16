import { API_BASE_URL } from "../config/api.js";
import { clearSession, getStoredToken } from "../models/authModel.js";

function handleUnauthorized(skipAuth) {
  if (skipAuth) return;
  clearSession();
  const path = window.location.pathname;
  if (path !== "/signin" && !path.startsWith("/signin/")) {
    window.location.assign("/signin");
  }
}

async function parseResponse(response, errorMessage, { skipAuth = false } = {}) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized(skipAuth);
    }
    throw new Error(data.message || errorMessage);
  }

  return data;
}

function authHeaders(extra = {}, { skipAuth = false } = {}) {
  const headers = { ...extra };
  if (!skipAuth) {
    const token = getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchJson(
  path,
  errorMessage,
  { method = "GET", body, headers, skipAuth = false } = {},
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: authHeaders(
      {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      { skipAuth },
    ),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse(response, errorMessage, { skipAuth });
}

/** Multipart/form-data request. Do not set Content-Type — the browser sets the boundary. */
export async function fetchFormData(
  path,
  errorMessage,
  formData,
  { method = "POST", skipAuth = false } = {},
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: authHeaders({}, { skipAuth }),
    body: formData,
  });

  return parseResponse(response, errorMessage, { skipAuth });
}
