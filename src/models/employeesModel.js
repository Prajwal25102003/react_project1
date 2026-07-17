import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";

export const EMPLOYEE_GENDERS = ["Male", "Female", "Other"];
export const EMPLOYEE_STATUSES = ["Active", "Inactive"];
export const MIN_EMPLOYEE_PASSWORD_LENGTH = 8;

/**
 * Indian mobile: exactly 10 digits.
 * Accepts 9876543210, 09876543210, +919876543210, +91 98765 43210, etc.
 * @returns {string|null} Normalized "+91 XXXXX XXXXX", or null if invalid
 */
export function normalizeIndianPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return null;

  let mobile = digits;
  if (mobile.startsWith("91") && mobile.length >= 12) {
    mobile = mobile.slice(-10);
  } else if (mobile.length === 11 && mobile.startsWith("0")) {
    mobile = mobile.slice(1);
  }

  if (!/^\d{10}$/.test(mobile)) return null;
  return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
}

export function isValidIndianPhone(value) {
  return normalizeIndianPhone(value) !== null;
}

/** Keep only digits for the phone input, max 10 (Indian mobile). */
export function sanitizeIndianPhoneInput(value) {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) {
    digits = digits.slice(-10);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

/** 10 digits for form input (strips +91 if present). */
export function toIndianPhoneInputValue(value) {
  const normalized = normalizeIndianPhone(value);
  if (normalized) return normalized.replace(/\D/g, "").slice(-10);
  return sanitizeIndianPhoneInput(value);
}

/** Local calendar date as YYYY-MM-DD (for form defaults). */
export function defaultJoiningDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const EMPTY_EMPLOYEE_FORM = {
  name: "",
  email: "",
  phone: "",
  gender: "Male",
  departmentId: "",
  designation: "",
  joiningDate: "",
  // Hidden until Payroll; kept so create/edit still persist a DB value.
  salary: "0",
  status: "Active",
  avatar: "",
  gmail: "",
  password: "",
};

const EMPLOYEE_STATUS = {
  Active: STATUS_TONE.success,
  Inactive: STATUS_TONE.error,
};

export function formatSalary(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value ?? "");
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function mapEmployee(employee) {
  return {
    ...employee,
    salaryLabel: formatSalary(employee.salary),
    statusClass: getStatusClass(EMPLOYEE_STATUS, employee.status, "Inactive"),
  };
}

export function toEmployeeFormValues(employee) {
  if (!employee) return { ...EMPTY_EMPLOYEE_FORM };

  return {
    name: employee.name || "",
    email: employee.email || "",
    phone: toIndianPhoneInputValue(employee.phone),
    gender: employee.gender || "Male",
    departmentId: employee.departmentId || "",
    designation: employee.designation || "",
    joiningDate: employee.joiningDate || "",
    salary:
      employee.salary === undefined || employee.salary === null
        ? ""
        : String(employee.salary),
    status: employee.status || "Active",
    avatar: employee.avatar || "",
    gmail: employee.loginEmail || "",
    password: "",
    hasLoginAccount: Boolean(employee.hasLoginAccount),
  };
}

/**
 * @param {object} form
 * @param {{ includeCredentials?: boolean, includePassword?: boolean }} [options]
 */
export function toEmployeePayload(form, options = {}) {
  const { includeCredentials = false, includePassword = false } = options;
  // Salary is kept in the DB but hidden in UI until Payroll is added.
  const salaryValue = Number(form.salary);
  const payload = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: normalizeIndianPhone(form.phone) || form.phone.trim(),
    gender: form.gender,
    departmentId: form.departmentId,
    designation: form.designation.trim(),
    joiningDate: form.joiningDate,
    salary: Number.isNaN(salaryValue) ? 0 : salaryValue,
    status: form.status,
    avatar: form.avatar.trim() || null,
  };

  if (includeCredentials) {
    const gmail = String(form.gmail ?? "").trim();
    if (gmail) payload.loginEmail = gmail;
  }

  if (includePassword && form.password) {
    payload.password = form.password;
  }

  return payload;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Client-side employee form validation (no HTML required/type constraints).
 * Returns { ok: true } or { ok: false, fieldErrors, message }.
 *
 * @param {object} form
 * @param {{ isEdit?: boolean, canManageCredentials?: boolean }} [options]
 */
export function validateEmployeeForm(form, options = {}) {
  const { isEdit = false, canManageCredentials = false } = options;
  const fieldErrors = {};

  const name = String(form?.name ?? "").trim();
  const email = String(form?.email ?? "").trim();
  const gmail = String(form?.gmail ?? "").trim();
  const phone = String(form?.phone ?? "").trim();
  const gender = String(form?.gender ?? "").trim();
  const departmentId = String(form?.departmentId ?? "").trim();
  const designation = String(form?.designation ?? "").trim();
  const joiningDate = String(form?.joiningDate ?? "").trim();
  const status = String(form?.status ?? "").trim();
  const avatar = String(form?.avatar ?? "").trim();
  const password = String(form?.password ?? "");

  if (!name) fieldErrors.name = "Full name is required";
  else if (name.length < 2)
    fieldErrors.name = "Full name must be at least 2 characters";

  if (!email) fieldErrors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(email))
    fieldErrors.email = "Enter a valid email address";

  if (!phone) fieldErrors.phone = "Phone number is required";
  else if (!isValidIndianPhone(phone)) {
    fieldErrors.phone =
      "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)";
  }

  if (!gender) fieldErrors.gender = "Gender is required";
  else if (!EMPLOYEE_GENDERS.includes(gender)) {
    fieldErrors.gender = "Select a valid gender";
  }

  if (!departmentId) fieldErrors.departmentId = "Department is required";

  if (!designation) fieldErrors.designation = "Designation is required";

  if (!joiningDate) fieldErrors.joiningDate = "Joining date is required";
  else if (!DATE_PATTERN.test(joiningDate)) {
    fieldErrors.joiningDate = "Joining date must be a valid date";
  }

  if (!status) fieldErrors.status = "Status is required";
  else if (!EMPLOYEE_STATUSES.includes(status)) {
    fieldErrors.status = "Select a valid status";
  }

  if (avatar && !avatar.startsWith("/") && !/^https?:\/\//i.test(avatar)) {
    fieldErrors.avatar = "Please select a valid image file";
  }

  const credentialsVisible = !isEdit || canManageCredentials;
  const passwordRequired = !isEdit;
  const gmailRequired = !isEdit;
  const passwordProvided = Boolean(password);

  if (credentialsVisible) {
    if (gmailRequired && !gmail) {
      fieldErrors.gmail = "Gmail is required for employee login";
    } else if (gmail && !EMAIL_PATTERN.test(gmail)) {
      fieldErrors.gmail = "Enter a valid Gmail address";
    }

    if (passwordRequired && !password) {
      fieldErrors.password = "Password is required for employee login";
    } else if (
      passwordProvided &&
      password.length < MIN_EMPLOYEE_PASSWORD_LENGTH
    ) {
      fieldErrors.password = `Password must be at least ${MIN_EMPLOYEE_PASSWORD_LENGTH} characters`;
    }

    if (
      isEdit &&
      canManageCredentials &&
      !form.hasLoginAccount &&
      (gmail || password) &&
      !(gmail && password)
    ) {
      if (!gmail) fieldErrors.gmail = "Gmail is required to create a login";
      if (!password)
        fieldErrors.password = "Password is required to create a login";
    }
  }

  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) return { ok: true, fieldErrors: {} };

  return {
    ok: false,
    fieldErrors,
    message: "Please fix the highlighted fields and try again.",
  };
}
