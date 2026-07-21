import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./authContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { useListData } from "./listController.js";
import { HR_ADMIN_ROLES } from "../models/authModel.js";
import { fetchDepartments } from "../services/departmentsService.js";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployeeById,
  fetchEmployees,
  updateEmployee,
  uploadEmployeeAvatar,
} from "../services/employeesService.js";
import {
  EMPTY_EMPLOYEE_FORM,
  defaultJoiningDate,
  toEmployeeFormValues,
  toEmployeePayload,
  validateEmployeeForm,
} from "../models/employeesModel.js";
import {
  EMPLOYEE_COLUMN_FILTERS,
  EMPLOYEE_COLUMNS,
  EMPLOYEE_SEARCH_KEYS,
} from "../models/employeesTableModel.js";
import { requestEmsRefresh } from "../utils/emsRefresh.js";
import { sanitizeIndianPhoneInput } from "../utils/indianPhone.js";

export function useEmployees() {
  const { rows, loading, error, reload } = useListData(
    fetchEmployees,
    "Failed to load employees",
  );
  const [departmentFilterOptions, setDepartmentFilterOptions] = useState([]);
  const table = useDataTable(rows, {
    columns: EMPLOYEE_COLUMNS,
    searchKeys: EMPLOYEE_SEARCH_KEYS,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [viewTarget, setViewTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchDepartments()
      .then((departments) => {
        if (cancelled) return;
        setDepartmentFilterOptions(
          departments.map((department) => ({
            value: department.name,
            label: department.name,
          })),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const filterDefs = useMemo(
    () => [
      ...EMPLOYEE_COLUMN_FILTERS,
      ...(departmentFilterOptions.length
        ? [
            {
              id: "department",
              label: "Department",
              options: departmentFilterOptions,
            },
          ]
        : []),
    ],
    [departmentFilterOptions],
  );

  function openViewModal(employee) {
    setViewTarget(employee);
  }

  function closeViewModal() {
    setViewTarget(null);
  }

  function openDeleteModal(employee) {
    setDeleteError("");
    setDeleteTarget(employee);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setDeleteError("");
      await deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
      reload();
      requestEmsRefresh();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete employee");
    } finally {
      setDeleting(false);
    }
  }

  return {
    employees: table.rows,
    loading,
    error,
    reload,
    table,
    filterDefs,
    viewTarget,
    openViewModal,
    closeViewModal,
    deleteTarget,
    deleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  };
}

export function useEmployeeForm(employeeId) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(employeeId);
  const canManageCredentials = HR_ADMIN_ROLES.includes(user?.role);
  const showPasswordFields = !isEdit || canManageCredentials;

  const [form, setForm] = useState({ ...EMPTY_EMPLOYEE_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        setFieldErrors({});

        if (isEdit) {
          const [departmentRows, employee] = await Promise.all([
            fetchDepartments(),
            fetchEmployeeById(employeeId),
          ]);
          if (cancelled) return;

          setDepartments(departmentRows);
          setForm(toEmployeeFormValues(employee));
        } else {
          const departmentRows = await fetchDepartments();
          if (cancelled) return;

          setDepartments(departmentRows);
          setForm({
            ...EMPTY_EMPLOYEE_FORM,
            departmentId: departmentRows[0]?.id || "",
            joiningDate: defaultJoiningDate(),
          });
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
  }, [employeeId, isEdit]);

  function updateField(field, value) {
    const nextValue =
      field === "phone" ? sanitizeIndianPhoneInput(value) : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFieldErrors((current) => ({
        ...current,
        avatar: "Please select an image file",
      }));
      return;
    }

    try {
      setUploadingAvatar(true);
      setFieldErrors((current) => {
        if (!current.avatar) return current;
        const next = { ...current };
        delete next.avatar;
        return next;
      });
      const url = await uploadEmployeeAvatar(file);
      updateField("avatar", url);
    } catch (err) {
      setFieldErrors((current) => ({
        ...current,
        avatar: err.message || "Failed to upload image",
      }));
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  function clearAvatar() {
    updateField("avatar", "");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validation = validateEmployeeForm(form, {
      isEdit,
      canManageCredentials,
    });
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setError(validation.message);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setFieldErrors({});

      const includeCredentials = !isEdit || canManageCredentials;
      const includePassword =
        !isEdit || (canManageCredentials && Boolean(form.password));
      const payload = toEmployeePayload(form, {
        includeCredentials,
        includePassword,
      });

      if (isEdit) {
        await updateEmployee(employeeId, payload);
      } else {
        await createEmployee(payload);
      }

      requestEmsRefresh();
      navigate("/employees");
    } catch (err) {
      setError(err.message || "Failed to save employee");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    navigate("/employees");
  }

  return {
    isEdit,
    form,
    fieldErrors,
    departments,
    loading,
    saving,
    uploadingAvatar,
    error,
    canManageCredentials,
    showPasswordFields,
    showPassword,
    setShowPassword,
    updateField,
    handleAvatarChange,
    clearAvatar,
    handleSubmit,
    handleCancel,
  };
}
