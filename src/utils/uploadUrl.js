import { API_BASE_URL } from "../config/api.js";
import { getStoredToken } from "../models/authModel.js";

/**
 * Append the session JWT so authenticated /uploads assets work in
 * <img> and <a> (they cannot send Authorization headers).
 */
export function resolveUploadUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return raw;

  const isRelativeUpload = raw.startsWith("/uploads/");
  const isAbsoluteUpload =
    /^https?:\/\//i.test(raw) && raw.includes("/uploads/");

  if (!isRelativeUpload && !isAbsoluteUpload) {
    return raw;
  }

  const token = getStoredToken();
  const base = isRelativeUpload ? `${API_BASE_URL}${raw}` : raw;
  if (!token) return base;

  try {
    const parsed = new URL(base, window.location.origin);
    parsed.searchParams.set("access_token", token);
    if (isRelativeUpload && !API_BASE_URL) {
      return `${parsed.pathname}${parsed.search}`;
    }
    return parsed.toString();
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}access_token=${encodeURIComponent(token)}`;
  }
}
