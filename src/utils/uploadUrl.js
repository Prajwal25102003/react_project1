import { API_BASE_URL } from "../config/api.js";

/** Strip query/hash; return `/uploads/<file>` or empty string. */
export function canonicalizeUploadPath(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";

  let pathname = raw;
  try {
    if (/^https?:\/\//i.test(raw)) {
      pathname = new URL(raw).pathname;
    } else {
      pathname = raw.split("?")[0].split("#")[0];
    }
  } catch {
    pathname = raw.split("?")[0].split("#")[0];
  }

  if (!pathname.startsWith("/uploads/")) return "";
  const parts = pathname.split("/").filter(Boolean);
  const filename = parts[parts.length - 1] || "";
  if (!filename || filename === "." || filename === "..") return "";
  return `/uploads/${filename}`;
}

/**
 * Resolve upload asset URLs for <img> / <a>.
 * Prefer short-lived signed URLs from the API (?exp=&sig=).
 * Does not append the session JWT (avoids leaking tokens in URLs).
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

  try {
    const parsed = new URL(
      isRelativeUpload ? `${API_BASE_URL || ""}${raw}` : raw,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost",
    );
    // Drop legacy session-token query param if present.
    parsed.searchParams.delete("access_token");

    if (isRelativeUpload && !API_BASE_URL) {
      return `${parsed.pathname}${parsed.search}`;
    }
    return parsed.toString();
  } catch {
    return isRelativeUpload && API_BASE_URL
      ? `${API_BASE_URL}${raw.split("&access_token=")[0].split("?access_token=")[0]}`
      : raw;
  }
}
