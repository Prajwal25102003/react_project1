import { STATUS_TONE, getStatusClass } from "./statusStylesModel.js";
import { EMAIL_PATTERN } from "./validationHelpers.js";
import {
  isValidIndianPhone,
  normalizeIndianPhone,
  toIndianPhoneInputValue,
} from "../utils/indianPhone.js";

export const EMPLOYEE_GENDERS = ["Male", "Female"];
export const EMPLOYEE_STATUSES = ["Active", "Inactive"];
export const EMPLOYEE_HIRED_PERIODS = ["month", "quarter", "year"];
export const MIN_EMPLOYEE_PASSWORD_LENGTH = 8;

const HIRED_PERIOD_SET = new Set(EMPLOYEE_HIRED_PERIODS);

/** Match dashboard new-hire buckets (month / quarter / year vs today). */
export function isJoiningInHiredPeriod(joiningDate, period) {
  const value = String(period || "").toLowerCase();
  if (!HIRED_PERIOD_SET.has(value)) return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(joiningDate || "").trim());
  if (!match) return false;

  const joinYear = Number(match[1]);
  const joinMonthIndex = Number(match[2]) - 1;
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonthIndex = now.getMonth();

  if (value === "year") return joinYear === nowYear;
  if (value === "month") {
    return joinYear === nowYear && joinMonthIndex === nowMonthIndex;
  }

  const joinQuarter = Math.floor(joinMonthIndex / 3);
  const nowQuarter = Math.floor(nowMonthIndex / 3);
  return joinYear === nowYear && joinQuarter === nowQuarter;
}

export function employeeFiltersFromSearch(searchParams) {
  const filters = {};
  const status = String(searchParams?.get?.("status") || "").trim();
  if (status && EMPLOYEE_STATUSES.includes(status)) {
    filters.status = status;
  }

  const hiredPeriod = String(searchParams?.get?.("hiredPeriod") || "")
    .trim()
    .toLowerCase();
  if (HIRED_PERIOD_SET.has(hiredPeriod)) {
    filters.hiredPeriod = hiredPeriod;
  }

  return filters;
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

export function mapEmployee(employee) {
  const isAdminAccount = employee?.loginRole === "admin";
  return {
    ...employee,
    isAdminAccount,
    department: isAdminAccount ? "" : employee.department || "",
    departmentId: isAdminAccount ? "" : employee.departmentId || "",
    casualLeaveBalance: isAdminAccount
      ? 0
      : Number(employee?.casualLeaveBalance ?? 0),
    sickLeaveBalance: isAdminAccount
      ? 0
      : Number(employee?.sickLeaveBalance ?? 0),
    lopDays: isAdminAccount ? 0 : Number(employee?.lopDays ?? 0),
    pendingLeaveCount: isAdminAccount
      ? 0
      : Number(employee?.pendingLeaveCount ?? 0),
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
  const {
    includeCredentials = false,
    includePassword = false,
    isAdminAccount = false,
  } = options;
  // Salary is kept in the DB but hidden in UI until Payroll is added.
  const salaryValue = Number(form.salary);
  const payload = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: normalizeIndianPhone(form.phone) || form.phone.trim(),
    gender: form.gender,
    departmentId: isAdminAccount ? null : form.departmentId,
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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Client-side employee form validation (no HTML required/type constraints).
 * Returns { ok: true } or { ok: false, fieldErrors, message }.
 *
 * @param {object} form
 * @param {{ isEdit?: boolean, canManageCredentials?: boolean, isAdminAccount?: boolean }} [options]
 */
export function validateEmployeeForm(form, options = {}) {
  const {
    isEdit = false,
    canManageCredentials = false,
    isAdminAccount = false,
  } = options;
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
    fieldErrors.phone = "Enter a 10-digit mobile number";
  }

  if (!gender) fieldErrors.gender = "Gender is required";
  else if (!EMPLOYEE_GENDERS.includes(gender)) {
    fieldErrors.gender = "Select a valid gender";
  }

  if (!isAdminAccount && !departmentId) {
    fieldErrors.departmentId = "Department is required";
  }

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
