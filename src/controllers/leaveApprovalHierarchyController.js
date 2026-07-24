import { useCallback, useEffect, useState } from "react";
import { useToast } from "./toastContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { useListData } from "./listController.js";
import {
  fetchLeaveApprovalHierarchies,
  updateLeaveApprovalHierarchy,
} from "../services/leaveApprovalHierarchyService.js";
import { fetchEmployees } from "../services/employeesService.js";
import {
  applyApproverType,
  emptyHierarchyStep,
  formatStepsSummary,
  stepsToForm,
  toHierarchyPayload,
  validateHierarchyForm,
} from "../models/leaveApprovalHierarchyModel.js";
import {
  LEAVE_HIERARCHY_COLUMNS,
  LEAVE_HIERARCHY_SEARCH_KEYS,
} from "../models/leaveApprovalHierarchyTableModel.js";

export function useLeaveApprovalHierarchy() {
  const toast = useToast();
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

  const [employees, setEmployees] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", steps: [emptyHierarchyStep()] });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadEmployees() {
      try {
        const list = await fetchEmployees();
        if (!cancelled) setEmployees(list || []);
      } catch {
        if (!cancelled) setEmployees([]);
      }
    }
    loadEmployees();
    return () => {
      cancelled = true;
    };
  }, []);

  function openEditModal(hierarchy) {
    setEditing(hierarchy);
    setForm({
      name: hierarchy.name || "",
      steps: stepsToForm(hierarchy.steps),
    });
    setFieldErrors({});
    setFormError("");
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
    setForm((current) => ({
      ...current,
      steps: [...current.steps, emptyHierarchyStep()],
    }));
  }

  function removeStep(index) {
    setForm((current) => {
      if (current.steps.length <= 1) return current;
      return {
        ...current,
        steps: current.steps.filter((_, i) => i !== index),
      };
    });
  }

  function moveStep(index, direction) {
    setForm((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.steps.length) return current;
      const steps = [...current.steps];
      const [item] = steps.splice(index, 1);
      steps.splice(target, 0, item);
      return { ...current, steps };
    });
  }

  async function submitForm(event) {
    event?.preventDefault?.();
    if (!editing?.category) return;

    const validation = validateHierarchyForm(form);
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

  const displayRows = (table.rows || []).map((row) => ({
    ...row,
    stepsSummary: formatStepsSummary(row.steps, employees),
  }));

  return {
    hierarchies: displayRows,
    loading,
    error,
    reload,
    table,
    employees,
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
    removeStep,
    moveStep,
    submitForm,
  };
}
