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
  hr: "Only the Human Resources department head. Their Team Lead is themselves, so this chain uses Admin (not HR or Team Lead).",
};

/** Form select values — HR/Admin map to backend `role` + `approverRole`. */
export const APPROVER_KIND_OPTIONS = [
  { value: "department_head", label: "Team Lead" },
  { value: "hr", label: "HR" },
  { value: "admin", label: "Admin" },
];

/** Max steps = unique approver types (Team Lead, HR, Admin). */
export const MAX_HIERARCHY_STEPS = APPROVER_KIND_OPTIONS.length;

/** Matches DB `VARCHAR(120)` on leave_approval_hierarchies.name. */
export const HIERARCHY_NAME_MAX_LENGTH = 120;

/**
 * Approver types a hierarchy category must not use for itself.
 * - HR leave: requester is the HR department head, so HR and Team Lead are
 *   the same person / self — only Admin can approve.
 * - Team-lead leave: cannot use Team Lead (self).
 */
const SELF_EXCLUDED_APPROVER_VALUES = {
  hr: new Set(["hr", "department_head"]),
  department_head: new Set(["department_head"]),
};

/** Select value for a step (flattens role + approverRole into hr|admin). */
export function approverTypeSelectValue(step) {
  if (step?.approverKind === "role") {
    return step.approverRole === "admin" ? "admin" : "hr";
  }
  if (step?.approverKind === "department_head") return "department_head";
  return "hr";
}

/** Stable signature used to block duplicate approver types. */
export function approverTypeSignature(stepOrValue) {
  if (typeof stepOrValue === "string") {
    if (stepOrValue === "department_head") return "department_head";
    if (stepOrValue === "admin") return "role:admin";
    return "role:hr";
  }
  return approverTypeSignature(approverTypeSelectValue(stepOrValue));
}

/** Approver options allowed for a hierarchy category (excludes self-role). */
export function approverOptionsForCategory(category) {
  const excluded = SELF_EXCLUDED_APPROVER_VALUES[category] || new Set();
  return APPROVER_KIND_OPTIONS.filter((option) => !excluded.has(option.value));
}

/**
 * Options for one step: category-allowed types, minus types already used
 * by other steps (current step's value stays selectable).
 */
export function approverOptionsForStep(category, steps, stepIndex) {
  const allowed = approverOptionsForCategory(category);
  const usedElsewhere = new Set();
  (steps || []).forEach((step, index) => {
    if (index === stepIndex) return;
    usedElsewhere.add(approverTypeSignature(step));
  });
  return allowed.filter(
    (option) => !usedElsewhere.has(approverTypeSignature(option.value)),
  );
}

export function maxStepsForCategory(category) {
  return Math.max(1, approverOptionsForCategory(category).length);
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

/** First unused approver type for this category (defaults to Admin / Team Lead). */
export function emptyHierarchyStep(category = "employee", steps = []) {
  const used = new Set((steps || []).map((step) => approverTypeSignature(step)));
  const options = approverOptionsForCategory(category);
  const next =
    options.find((option) => !used.has(approverTypeSignature(option.value))) ||
    options[0] ||
    APPROVER_KIND_OPTIONS[0];
  return applyApproverType(
    {
      approverKind: "role",
      approverRole: "hr",
      approverEmployeeId: "",
    },
    next.value,
  );
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

export function stepsToForm(steps, category = "employee") {
  const allowedValues = new Set(
    approverOptionsForCategory(category).map((option) => option.value),
  );
  if (!steps?.length) {
    return { steps: [emptyHierarchyStep(category)], remapped: false };
  }

  const mapped = [];
  const seen = new Set();
  let remapped = false;

  for (const step of steps) {
    // Legacy named-employee steps are not editable — pick next unused type.
    let next;
    if (step.approverKind === "employee") {
      next = emptyHierarchyStep(category, mapped);
      remapped = true;
    } else {
      next = {
        approverKind: step.approverKind || "role",
        approverRole: step.approverRole || "hr",
        approverEmployeeId: "",
      };
    }

    const value = approverTypeSelectValue(next);
    if (!allowedValues.has(value) || seen.has(approverTypeSignature(value))) {
      next = emptyHierarchyStep(category, mapped);
      remapped = true;
    }
    const signature = approverTypeSignature(next);
    if (seen.has(signature)) {
      remapped = true;
      continue;
    }
    seen.add(signature);
    mapped.push(next);
  }

  return {
    steps: mapped.length > 0 ? mapped : [emptyHierarchyStep(category)],
    remapped: remapped || mapped.length === 0,
  };
}

export function validateHierarchyForm({ name, steps }, category = "employee") {
  const fieldErrors = {};
  const trimmedName = String(name || "").trim();
  if (!trimmedName) fieldErrors.name = "Name is required";
  else if (trimmedName.length > HIERARCHY_NAME_MAX_LENGTH) {
    fieldErrors.name = `Name must be ${HIERARCHY_NAME_MAX_LENGTH} characters or fewer`;
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    fieldErrors.steps = "At least one approval step is required";
    return {
      ok: false,
      fieldErrors,
      message: "Please fix the highlighted fields and try again.",
    };
  }

  const maxSteps = maxStepsForCategory(category);
  if (steps.length > maxSteps) {
    fieldErrors.steps = `At most ${maxSteps} steps are allowed for this hierarchy`;
  }

  const allowedValues = new Set(
    approverOptionsForCategory(category).map((option) => option.value),
  );
  const seen = new Set();
  steps.forEach((step, index) => {
    const key = `step-${index}`;
    const value = approverTypeSelectValue(step);
    if (!allowedValues.has(value)) {
      if (category === "hr" && (value === "hr" || value === "department_head")) {
        fieldErrors[key] =
          "HR leave can only use Admin (HR/Team Lead would be self-approval)";
      } else if (category === "department_head" && value === "department_head") {
        fieldErrors[key] = "Team lead leave cannot use Team Lead as an approver";
      } else {
        fieldErrors[key] = "Select a valid approver type";
      }
      return;
    }

    const signature = approverTypeSignature(value);
    if (seen.has(signature)) {
      fieldErrors[key] = "Each approver type can only appear once";
    }
    seen.add(signature);
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
