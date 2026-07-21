export const EMPTY_DEPARTMENT_FORM = {
  name: "",
  headEmployeeId: "",
};

export function toDepartmentFormValues(department) {
  if (!department) return { ...EMPTY_DEPARTMENT_FORM };

  return {
    name: department.name || "",
    headEmployeeId: department.headEmployeeId || "",
  };
}

export function toDepartmentPayload(form) {
  return {
    name: form.name.trim(),
    headEmployeeId: form.headEmployeeId.trim() || null,
  };
}

/**
 * Client-side department form validation (no HTML required/type constraints).
 * Returns { ok: true } or { ok: false, fieldErrors, message }.
 */
export function validateDepartmentForm(form) {
  const fieldErrors = {};

  const name = String(form?.name ?? "").trim();

  if (!name) fieldErrors.name = "Department name is required";
  else if (name.length < 2) {
    fieldErrors.name = "Department name must be at least 2 characters";
  }

  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) return { ok: true, fieldErrors: {} };

  return {
    ok: false,
    fieldErrors,
    message: "Please fix the highlighted fields and try again.",
  };
}
