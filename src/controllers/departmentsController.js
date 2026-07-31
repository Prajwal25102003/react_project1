import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./authContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { useListData } from "./listController.js";
import { useModuleNotificationAttention } from "./moduleNotificationAttentionController.js";
import { useToast } from "./toastContext.jsx";
import { fetchEmployees } from "../services/employeesService.js";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartmentById,
  fetchDepartments,
  updateDepartment,
} from "../services/departmentsService.js";
import {
  EMPTY_DEPARTMENT_FORM,
  employeesEligibleAsDepartmentHead,
  toDepartmentFormValues,
  toDepartmentPayload,
  validateDepartmentForm,
} from "../models/departmentsModel.js";
import {
  DEPARTMENT_COLUMN_FILTERS,
  DEPARTMENT_COLUMNS,
  DEPARTMENT_SEARCH_KEYS,
} from "../models/departmentsTableModel.js";
import { requestEmsRefresh } from "../utils/emsRefresh.js";

export function useDepartments() {
  const toast = useToast();
  const { user } = useAuth();
  const seenUserKey =
    user?.id || user?.email || user?.employeeId || "";
  const [searchParams] = useSearchParams();
  const deepLinkAckedRef = useRef("");
  const { rows, loading, error, reload } = useListData(
    fetchDepartments,
    "Failed to load departments",
  );

  const { acknowledgeAttention, withAttention } = useModuleNotificationAttention({
    navId: "departments",
    role: user?.role,
    seenUserKey,
    enabled: Boolean(user),
  });

  const tableSourceRows = useMemo(
    () => withAttention(rows),
    [rows, withAttention],
  );

  const table = useDataTable(tableSourceRows, {
    columns: DEPARTMENT_COLUMNS,
    searchKeys: DEPARTMENT_SEARCH_KEYS,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const acknowledgeDepartment = useCallback(
    (department) => acknowledgeAttention(department),
    [acknowledgeAttention],
  );

  function openDeleteModal(department) {
    setDeleteError("");
    setDeleteTarget(department);
    acknowledgeDepartment(department);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  }

  function onDepartmentInteract(department) {
    acknowledgeDepartment(department);
  }

  useEffect(() => {
    const deepLinkId = String(searchParams.get("id") || "").trim();
    if (!deepLinkId || loading || !rows?.length) return;
    if (deepLinkAckedRef.current === deepLinkId) return;
    const match = rows.find((row) => String(row.id) === deepLinkId);
    if (!match) return;
    deepLinkAckedRef.current = deepLinkId;
    acknowledgeDepartment(match);
  }, [acknowledgeDepartment, loading, rows, searchParams]);

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setDeleteError("");
      await deleteDepartment(deleteTarget.id);
      toast.crudSuccess("Department", "delete");
      setDeleteTarget(null);
      reload();
      requestEmsRefresh();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete department");
    } finally {
      setDeleting(false);
    }
  }

  return {
    departments: table.rows,
    loading,
    error,
    reload,
    table,
    filterDefs: DEPARTMENT_COLUMN_FILTERS,
    deleteTarget,
    deleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    onDepartmentInteract,
  };
}

export function useDepartmentForm(departmentId) {
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(departmentId);

  const [form, setForm] = useState({ ...EMPTY_DEPARTMENT_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const headCandidates = useMemo(
    () =>
      isEdit
        ? employeesEligibleAsDepartmentHead(employees, departmentId)
        : [],
    [employees, departmentId, isEdit],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        setFieldErrors({});

        if (isEdit) {
          const [employeeRows, department] = await Promise.all([
            fetchEmployees({ excludeLoginRoles: ["admin"] }),
            fetchDepartmentById(departmentId),
          ]);
          if (cancelled) return;

          setEmployees(employeeRows);
          const nextForm = toDepartmentFormValues(department);
          const eligible = employeesEligibleAsDepartmentHead(
            employeeRows,
            departmentId,
          );
          if (
            nextForm.headEmployeeId &&
            !eligible.some(
              (employee) => employee.id === nextForm.headEmployeeId,
            )
          ) {
            nextForm.headEmployeeId = "";
          }
          setForm(nextForm);
        } else {
          if (cancelled) return;
          setEmployees([]);
          setForm({ ...EMPTY_DEPARTMENT_FORM });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load form");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [departmentId, isEdit]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validation = validateDepartmentForm(form, { headCandidates });
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setError(validation.message);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setFieldErrors({});
      const payload = toDepartmentPayload(form);

      if (isEdit) {
        await updateDepartment(departmentId, payload);
        toast.crudSuccess("Department", "update");
      } else {
        await createDepartment({ ...payload, headEmployeeId: null });
        toast.crudSuccess("Department", "create");
      }

      requestEmsRefresh();
      navigate("/departments");
    } catch (err) {
      setError(err.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    navigate("/departments");
  }

  return {
    isEdit,
    form,
    fieldErrors,
    headCandidates,
    loading,
    saving,
    error,
    updateField,
    handleSubmit,
    handleCancel,
  };
}
