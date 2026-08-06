import { useCallback, useState } from "react";
import { useAuth } from "./authContext.jsx";
import { useToast } from "./toastContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { useListData } from "./listController.js";
import { isAccountActive } from "../models/authModel.js";
import {
  fetchLeaveApprovalHierarchies,
  updateLeaveApprovalHierarchy,
} from "../services/leaveApprovalHierarchyService.js";
import {
  applyApproverType,
  approverOptionsForStep,
  emptyHierarchyStep,
  maxStepsForCategory,
  stepsToForm,
  toHierarchyPayload,
  validateHierarchyForm,
} from "../models/leaveApprovalHierarchyModel.js";
import {
  LEAVE_HIERARCHY_COLUMNS,
  LEAVE_HIERARCHY_SEARCH_KEYS,
} from "../models/leaveApprovalHierarchyTableModel.js";

function remapStepFieldErrors(fieldErrors, mapIndex) {
  const next = { ...fieldErrors };
  const remapped = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    const match = /^step-(\d+)$/.exec(key);
    if (!match) continue;
    delete next[key];
    const newIndex = mapIndex(Number(match[1]));
    if (newIndex != null) remapped[`step-${newIndex}`] = value;
  }
  return { ...next, ...remapped };
}

export function useLeaveApprovalHierarchy() {
  const toast = useToast();
  const { user } = useAuth();
  const canWrite = isAccountActive(user);
  const loadHierarchies = useCallback(() => fetchLeaveApprovalHierarchies(), []);
  const { rows, loading, error, reload } = useListData(
    loadHierarchies,
    "Failed to load leave approval hierarchies",
  );

  const table = useDataTable(rows, {
    columns: LEAVE_HIERARCHY_COLUMNS,
    searchKeys: LEAVE_HIERARCHY_SEARCH_KEYS,
    initialVisibleColumnIds: LEAVE_HIERARCHY_COLUMNS.map((col) => col.id),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    steps: [emptyHierarchyStep("employee")],
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function openEditModal(hierarchy) {
    if (!canWrite) return;
    const { steps, remapped } = stepsToForm(
      hierarchy.steps,
      hierarchy.category,
    );
    setEditing(hierarchy);
    setForm({
      name: hierarchy.name || "",
      steps,
    });
    setFieldErrors({});
    setFormError(
      remapped
        ? "Some steps were adjusted because they used types that are no longer allowed. Review before saving."
        : "",
    );
    setFormOpen(true);
  }

  function closeFormModal() {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setFieldErrors({});
    setFormError("");
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  }

  function updateStep(index, field, value) {
    setForm((current) => {
      const steps = current.steps.map((step, i) => {
        if (i !== index) return step;
        if (field === "approverKind") {
          return applyApproverType(step, value);
        }
        return { ...step, [field]: value };
      });
      return { ...current, steps };
    });
    const key = `step-${index}`;
    if (fieldErrors[key]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  function addStep() {
    const category = editing?.category || "employee";
    setForm((current) => {
      const maxSteps = maxStepsForCategory(category);
      if ((current.steps || []).length >= maxSteps) return current;
      return {
        ...current,
        steps: [...current.steps, emptyHierarchyStep(category, current.steps)],
      };
    });
  }

  function removeStep(index) {
    if ((form.steps || []).length <= 1) return;

    setForm((current) => ({
      ...current,
      steps: current.steps.filter((_, i) => i !== index),
    }));
    setFieldErrors((current) =>
      remapStepFieldErrors(current, (i) => {
        if (i === index) return null;
        if (i > index) return i - 1;
        return i;
      }),
    );
  }

  function moveStep(index, direction) {
    const target = index + direction;
    const stepCount = (form.steps || []).length;
    if (target < 0 || target >= stepCount) return;

    setForm((current) => {
      const steps = [...current.steps];
      const [item] = steps.splice(index, 1);
      steps.splice(target, 0, item);
      return { ...current, steps };
    });
    setFieldErrors((current) =>
      remapStepFieldErrors(current, (i) => {
        if (i === index) return target;
        if (i === target) return index;
        return i;
      }),
    );
  }

  async function submitForm(event) {
    event?.preventDefault?.();
    if (!editing?.category || !canWrite) return;

    const validation = validateHierarchyForm(form, editing.category);
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setFormError(validation.message);
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      await updateLeaveApprovalHierarchy(
        editing.category,
        toHierarchyPayload(form),
      );
      toast.success("Leave approval hierarchy updated");
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(err.message || "Failed to update hierarchy");
      toast.error(err.message || "Failed to update hierarchy");
    } finally {
      setSaving(false);
    }
  }

  const editingCategory = editing?.category || "employee";
  const stepApproverOptions = (form.steps || []).map((_, index) =>
    approverOptionsForStep(editingCategory, form.steps, index),
  );

  return {
    hierarchies: table.rows,
    loading,
    error,
    reload,
    table,
    canWrite,
    formOpen,
    editing,
    form,
    fieldErrors,
    formError,
    saving,
    openEditModal,
    closeFormModal,
    updateField,
    updateStep,
    addStep,
    canAddStep:
      canWrite &&
      (form.steps || []).length < maxStepsForCategory(editingCategory),
    stepApproverOptions,
    removeStep,
    moveStep,
    submitForm,
  };
}
