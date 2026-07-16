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
    // "payroll", // later
  ],
  admin: [
    "dashboard",
    "employees",
    "departments",
    "attendance",
    "leave-requests",
    // "payroll", // later
    // "system-health", // later
    // "security", // later
  ],
  employee: [
    "dashboard",
    "profile",
    "attendance",
    "leave-requests",
    // "payroll", // later — My Payroll
  ],
}

export const HR_ADMIN_ROLES = [ROLES.HR, ROLES.ADMIN];

const TOKEN_KEY = "ems_auth_token";
const USER_KEY = "ems_auth_user";

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
