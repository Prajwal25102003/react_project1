import { formatDateDisplay } from "./datePickerModel.js";

export const HIERARCHY_CATEGORIES = [
  "employee",
  "department_head",
  "hr",
];

export const CATEGORY_LABELS = {
  employee: "Employee Leave",
  department_head: "Team Lead Leave",
  hr: "HR Leave",
};

export const CATEGORY_APPLIES_TO = {
  employee: "Employees",
  department_head: "Team leads (non-HR department heads)",
  hr: "Human Resources department head only",
};

export const CATEGORY_DESCRIPTIONS = {
  employee: "Everyone who is not a department head / team lead uses this chain.",
  department_head:
    "Team leads — department heads outside Human Resources. The HR department head uses HR leave instead.",
  hr: "Only the Human Resources department head (HR). Other HR staff are employees.",
};

/** Form select values — HR/Admin map to backend `role` + `approverRole`. */
export const APPROVER_KIND_OPTIONS = [
  { value: "department_head", label: "Team Lead" },
  { value: "hr", label: "HR" },
  { value: "admin", label: "Admin" },
];

/** Select value for a step (flattens role + approverRole into hr|admin). */
export function approverTypeSelectValue(step) {
  if (step?.approverKind === "role") {
    return step.approverRole === "admin" ? "admin" : "hr";
  }
  if (step?.approverKind === "department_head") return "department_head";
  return "hr";
}

/** Apply a flat approver-type select value onto a step. */
export function applyApproverType(step, value) {
  const next = { ...step, approverEmployeeId: "" };
  if (value === "hr" || value === "admin") {
    next.approverKind = "role";
    next.approverRole = value;
  } else if (value === "department_head") {
    next.approverKind = "department_head";
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

export function formatStepLabel(step) {
  if (!step) return "—";
  if (step.approverKind === "department_head") return "Team Lead";
  if (step.approverKind === "role") {
    if (step.approverRole === "hr") return "HR";
    if (step.approverRole === "admin") return "Admin";
    return step.approverRole || "Role";
  }
  if (step.approverKind === "employee") {
    return step.approverEmployeeName || step.approverEmployeeId || "Employee";
  }
  return "—";
}

export function formatStepsSummary(steps) {
  if (!steps?.length) return "No steps";
  return steps.map((step) => formatStepLabel(step)).join(" → ");
}

export function stepsToForm(steps) {
  if (!steps?.length) return [emptyHierarchyStep()];
  return steps.map((step) => {
    // Legacy named-employee steps are not editable — default to HR.
    if (step.approverKind === "employee") {
      return emptyHierarchyStep();
    }
    return {
      approverKind: step.approverKind || "role",
      approverRole: step.approverRole || "hr",
      approverEmployeeId: "",
    };
  });
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
    if (!["department_head", "role"].includes(kind)) {
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
      if (step.approverKind === "department_head") {
        return { approverKind: "department_head" };
      }
      return {
        approverKind: "role",
        approverRole: step.approverRole,
      };
    }),
  };
}
