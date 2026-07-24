import { formatDateDisplay } from "./datePickerModel.js";

export const HIERARCHY_CATEGORIES = [
  "employee",
  "department_head",
  "hr",
];

export const CATEGORY_LABELS = {
  employee: "Employee Leave",
  department_head: "Department Head Leave",
  hr: "HR Leave",
};

export const CATEGORY_APPLIES_TO = {
  employee: "Employees",
  department_head: "Department heads(TL)",
  hr: "Human Resources department head only",
};

export const CATEGORY_DESCRIPTIONS = {
  employee: "Everyone who is not a department head uses this chain.",
  department_head:
    "Department heads outside Human Resources. The HR department head uses HR leave instead.",
  hr: "Only the single Human Resources department head. Other HR staff are employees.",
};

/** Form select values — HR/Admin map to backend `role` + `approverRole`. */
export const APPROVER_KIND_OPTIONS = [
  { value: "department_head", label: "Department Head" },
  { value: "hr", label: "HR" },
  { value: "admin", label: "Admin" },
  { value: "employee", label: "Specific employee" },
];

/** Select value for a step (flattens role + approverRole into hr|admin). */
export function approverTypeSelectValue(step) {
  if (step?.approverKind === "role") {
    return step.approverRole === "admin" ? "admin" : "hr";
  }
  return step?.approverKind || "hr";
}

/** Apply a flat approver-type select value onto a step. */
export function applyApproverType(step, value) {
  const next = { ...step };
  if (value === "hr" || value === "admin") {
    next.approverKind = "role";
    next.approverRole = value;
    next.approverEmployeeId = "";
  } else if (value === "department_head") {
    next.approverKind = "department_head";
    next.approverRole = "";
    next.approverEmployeeId = "";
  } else if (value === "employee") {
    next.approverKind = "employee";
    next.approverRole = "";
  }
  return next;
}

export function emptyHierarchyStep() {
  return {
    approverKind: "role",
    approverRole: "hr",
    approverEmployeeId: "",
  };
}

export function formatUpdatedAtLabel(value) {
  if (!value) return "—";
  const datePart = String(value).trim().slice(0, 10);
  return formatDateDisplay(datePart) || "—";
}

export function mapHierarchy(hierarchy) {
  if (!hierarchy) return null;
  const steps = (hierarchy.steps || []).map((step) => ({
    id: step.id,
    stepOrder: Number(step.stepOrder),
    approverKind: step.approverKind,
    approverRole: step.approverRole || "",
    approverEmployeeId: step.approverEmployeeId || "",
    approverEmployeeName: step.approverEmployeeName || "",
  }));
  const updatedAt = hierarchy.updatedAt || "";

  return {
    id: hierarchy.id,
    category: hierarchy.category,
    categoryLabel:
      CATEGORY_APPLIES_TO[hierarchy.category] || hierarchy.category,
    name: hierarchy.name || CATEGORY_LABELS[hierarchy.category] || hierarchy.category,
    isActive: Boolean(hierarchy.isActive),
    updatedAt,
    updatedAtLabel: formatUpdatedAtLabel(updatedAt),
    steps,
    stepsSummary: formatStepsSummary(steps),
  };
}

export function formatStepLabel(step, employees = []) {
  if (!step) return "—";
  if (step.approverKind === "department_head") return "Department Head";
  if (step.approverKind === "role") {
    if (step.approverRole === "hr") return "HR";
    if (step.approverRole === "admin") return "Admin";
    return step.approverRole || "Role";
  }
  if (step.approverKind === "employee") {
    if (step.approverEmployeeName) return step.approverEmployeeName;
    const match = (employees || []).find(
      (employee) => employee.id === step.approverEmployeeId,
    );
    return match?.name || step.approverEmployeeId || "Employee";
  }
  return "—";
}

export function formatStepsSummary(steps, employees = []) {
  if (!steps?.length) return "No steps";
  return steps.map((step) => formatStepLabel(step, employees)).join(" → ");
}

export function stepsToForm(steps) {
  if (!steps?.length) return [emptyHierarchyStep()];
  return steps.map((step) => ({
    approverKind: step.approverKind || "role",
    approverRole: step.approverRole || "hr",
    approverEmployeeId: step.approverEmployeeId || "",
  }));
}

export function validateHierarchyForm({ name, steps }) {
  const fieldErrors = {};
  const trimmedName = String(name || "").trim();
  if (!trimmedName) fieldErrors.name = "Name is required";

  if (!Array.isArray(steps) || steps.length === 0) {
    fieldErrors.steps = "At least one approval step is required";
    return {
      ok: false,
      fieldErrors,
      message: "Please fix the highlighted fields and try again.",
    };
  }

  const signatures = [];
  steps.forEach((step, index) => {
    const key = `step-${index}`;
    const kind = String(step?.approverKind || "").trim();
    if (!["department_head", "role", "employee"].includes(kind)) {
      fieldErrors[key] = "Select a valid approver type";
      return;
    }
    if (kind === "role") {
      const role = String(step?.approverRole || "").trim();
      if (!["hr", "admin"].includes(role)) {
        fieldErrors[key] = "Select HR or Admin";
        return;
      }
      signatures.push(`role:${role}`);
    } else if (kind === "employee") {
      const employeeId = String(step?.approverEmployeeId || "").trim();
      if (!employeeId) {
        fieldErrors[key] = "Select an employee";
        return;
      }
      signatures.push(`employee:${employeeId}`);
    } else {
      signatures.push("department_head");
    }

    if (
      signatures.length > 1 &&
      signatures[signatures.length - 1] === signatures[signatures.length - 2]
    ) {
      fieldErrors[key] = "Consecutive duplicate approvers are not allowed";
    }
  });

  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) return { ok: true, fieldErrors: {} };

  return {
    ok: false,
    fieldErrors,
    message: fieldErrors.steps || "Please fix the highlighted fields and try again.",
  };
}

export function toHierarchyPayload({ name, steps }) {
  return {
    name: String(name || "").trim(),
    steps: (steps || []).map((step) => {
      const kind = step.approverKind;
      if (kind === "department_head") {
        return { approverKind: "department_head" };
      }
      if (kind === "role") {
        return {
          approverKind: "role",
          approverRole: step.approverRole,
        };
      }
      return {
        approverKind: "employee",
        approverEmployeeId: step.approverEmployeeId,
      };
    }),
  };
}
