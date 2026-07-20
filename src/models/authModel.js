import { EMAIL_PATTERN } from "./validationHelpers.js";

export const ROLES = {
  HR: "hr",
  EMPLOYEE: "employee",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  hr: "HR",
  employee: "Employee",
  admin: "Admin",
};

/**
 * Nav item ids allowed per role.
 * Later phases (not shown yet): payroll, system-health, security.
 */
export const ROLE_NAV_IDS = {
  hr: [
    "dashboard",
    "employees",
    "departments",
    "attendance",
    "leave-requests",
    "holidays",
    // "payroll", // later
  ],
  admin: [
    "dashboard",
    "employees",
    "departments",
    "attendance",
    "leave-requests",
    "holidays",
    // "payroll", // later
    // "system-health", // later
    // "security", // later
  ],
  employee: [
    "dashboard",
    "profile",
    "attendance",
    "leave-requests",
    "holidays",
    // "payroll", // later — My Payroll
  ],
};

export const HR_ADMIN_ROLES = [ROLES.HR, ROLES.ADMIN];

const TOKEN_KEY = "ems_auth_token";
const USER_KEY = "ems_auth_user";

function clearLegacyLocalSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

// Drop old persistent logins so opening the site shows Sign In.
clearLegacyLocalSession();

export function getStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getStoredUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persist login for this browser tab only (new tab → sign in again). */
export function storeSession(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  clearLegacyLocalSession();
}

export function clearSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
  clearLegacyLocalSession();
}

export function roleAllows(role, allowedRoles) {
  return Boolean(role && allowedRoles?.includes(role));
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "";
}

export const EMPTY_SIGN_IN_FORM = {
  email: "",
  password: "",
};

function firstFieldMessage(fieldErrors) {
  const firstKey = Object.keys(fieldErrors)[0];
  return firstKey ? fieldErrors[firstKey] : "Please fix the highlighted fields";
}

/**
 * Returns { ok: true, fieldErrors: {} } or { ok: false, fieldErrors, message }.
 */
export function validateSignInForm(form) {
  const fieldErrors = {};
  const email = String(form?.email ?? "").trim();
  const password = String(form?.password ?? "");

  if (!email) fieldErrors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(email))
    fieldErrors.email = "Enter a valid email address";

  if (!password) fieldErrors.password = "Password is required";

  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) return { ok: true, fieldErrors: {} };

  return {
    ok: false,
    fieldErrors,
    message: firstFieldMessage(fieldErrors),
  };
}
