/** Assign leave balances from Employees (All / Department / Custom). */

export const ASSIGN_LEAVE_SCOPES = [
  { value: "all", label: "All employees" },
  { value: "department", label: "Department wise" },
  { value: "custom", label: "Custom" },
];

export const ASSIGN_LEAVE_MODES = [
  { value: "set", label: "Set (replace)" },
  { value: "add", label: "Add (credit)" },
];

export const EMPTY_ASSIGN_LEAVES_FORM = {
  scope: "all",
  mode: "set",
  departmentId: "",
  employeeIds: [],
  casualLeaveBalance: "",
  sickLeaveBalance: "",
};

function parseRequiredDays(raw, label) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { value: null, error: `${label} is required` };
  }
  const num = Number(raw);
  if (!Number.isInteger(num) || num < 0) {
    return {
      value: null,
      error: `${label} must be a whole number 0 or greater`,
    };
  }
  return { value: num, error: null };
}

export function validateAssignLeavesForm(form) {
  const fieldErrors = {};
  const scope = String(form?.scope || "").trim();
  const mode = String(form?.mode || "").trim();

  if (!["all", "department", "custom"].includes(scope)) {
    fieldErrors.scope = "Select a valid scope";
  }
  if (!["set", "add"].includes(mode)) {
    fieldErrors.mode = "Select Set or Add";
  }

  if (scope === "department" && !String(form?.departmentId || "").trim()) {
    fieldErrors.departmentId = "Select a department";
  }

  if (scope === "department" || scope === "custom") {
    const ids = Array.isArray(form?.employeeIds) ? form.employeeIds : [];
    if (ids.length === 0) {
      fieldErrors.employeeIds = "Select at least one employee";
    }
  }

  const casual = parseRequiredDays(form?.casualLeaveBalance, "Casual leave");
  if (casual.error) fieldErrors.casualLeaveBalance = casual.error;

  const sick = parseRequiredDays(form?.sickLeaveBalance, "Sick leave");
  if (sick.error) fieldErrors.sickLeaveBalance = sick.error;

  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) {
    return { ok: true, fieldErrors: {} };
  }

  return {
    ok: false,
    fieldErrors,
    message: "Please fix the highlighted fields and try again.",
  };
}

export function toAssignLeavesPayload(form) {
  const scope = String(form.scope || "").trim();
  const payload = {
    scope,
    mode: String(form.mode || "set").trim(),
    casualLeaveBalance: Number(form.casualLeaveBalance),
    sickLeaveBalance: Number(form.sickLeaveBalance),
  };

  if (scope === "department") {
    payload.departmentId = String(form.departmentId || "").trim();
    payload.employeeIds = (form.employeeIds || []).map((id) => String(id));
  }
  if (scope === "custom") {
    payload.employeeIds = (form.employeeIds || []).map((id) => String(id));
  }

  return payload;
}
