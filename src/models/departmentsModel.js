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

/** Employees eligible to be head of a department (must already belong to it). */
export function employeesEligibleAsDepartmentHead(employees, departmentId) {
  if (!departmentId) return [];
  const deptId = String(departmentId);
  return (employees || [])
    .filter((employee) => String(employee.departmentId || "") === deptId)
    .slice()
    .sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, {
        sensitivity: "base",
      }),
    );
}

/**
 * Client-side department form validation (no HTML required/type constraints).
 * Returns { ok: true } or { ok: false, fieldErrors, message }.
 */
export function validateDepartmentForm(form, { headCandidates = null } = {}) {
  const fieldErrors = {};

  const name = String(form?.name ?? "").trim();

  if (!name) fieldErrors.name = "Department name is required";
  else if (name.length < 2) {
    fieldErrors.name = "Department name must be at least 2 characters";
  }

  const headId = String(form?.headEmployeeId ?? "").trim();
  if (headId && Array.isArray(headCandidates)) {
    const allowed = headCandidates.some(
      (employee) => String(employee.id) === headId,
    );
    if (!allowed) {
      fieldErrors.headEmployeeId =
        "Department head must be an employee in this department";
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
