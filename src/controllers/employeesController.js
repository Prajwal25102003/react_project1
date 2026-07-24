import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./authContext.jsx";
import { useToast } from "./toastContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { useListData } from "./listController.js";
import { HR_ADMIN_ROLES } from "../models/authModel.js";
import { fetchDepartments } from "../services/departmentsService.js";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployeeById,
  fetchEmployees,
  assignEmployeeLeaveBalances,
  updateEmployee,
  uploadEmployeeAvatar,
} from "../services/employeesService.js";
import {
  EMPTY_EMPLOYEE_FORM,
  defaultJoiningDate,
  employeeFiltersFromSearch,
  toEmployeeFormValues,
  toEmployeePayload,
  validateEmployeeForm,
} from "../models/employeesModel.js";
import {
  ASSIGN_LEAVE_MODES,
  ASSIGN_LEAVE_SCOPES,
  EMPTY_ASSIGN_LEAVES_FORM,
  toAssignLeavesPayload,
  validateAssignLeavesForm,
} from "../models/assignLeavesModel.js";
import {
  EMPLOYEE_COLUMN_FILTERS,
  EMPLOYEE_COLUMNS,
  EMPLOYEE_SEARCH_KEYS,
} from "../models/employeesTableModel.js";
import { requestEmsRefresh } from "../utils/emsRefresh.js";
import { sanitizeIndianPhoneInput } from "../utils/indianPhone.js";

export function useEmployees() {
  const toast = useToast();
  const loadEmployees = useMemo(
    () => () => fetchEmployees({ excludeLoginRoles: ["admin"] }),
    [],
  );
  const { rows, loading, error, reload } = useListData(
    loadEmployees,
    "Failed to load employees",
  );
  const [searchParams] = useSearchParams();
  const initialColumnFilters = useMemo(
    () => employeeFiltersFromSearch(searchParams),
    [searchParams],
  );
  const [departmentFilterOptions, setDepartmentFilterOptions] = useState([]);
  const [assignDepartments, setAssignDepartments] = useState([]);
  const table = useDataTable(rows, {
    columns: EMPLOYEE_COLUMNS,
    searchKeys: EMPLOYEE_SEARCH_KEYS,
    initialColumnFilters,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [viewTarget, setViewTarget] = useState(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ ...EMPTY_ASSIGN_LEAVES_FORM });
  const [assignFieldErrors, setAssignFieldErrors] = useState({});
  const [assignError, setAssignError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchDepartments()
      .then((departments) => {
        if (cancelled) return;
        setAssignDepartments(departments);
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

  const assignableEmployees = useMemo(
    () =>
      (rows || []).filter(
        (employee) =>
          !employee.isAdminAccount && employee.loginRole !== "admin",
      ),
    [rows],
  );

  const scopeAssignableEmployees = useMemo(() => {
    if (assignForm.scope === "department") {
      const departmentId = String(assignForm.departmentId || "").trim();
      if (!departmentId) return [];
      return assignableEmployees.filter(
        (employee) => employee.departmentId === departmentId,
      );
    }
    return assignableEmployees;
  }, [assignableEmployees, assignForm.scope, assignForm.departmentId]);

  const filteredAssignableEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return scopeAssignableEmployees;
    return scopeAssignableEmployees.filter((employee) => {
      const haystack = [
        employee.name,
        employee.id,
        employee.department,
        employee.designation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [scopeAssignableEmployees, employeeSearch]);

  function employeesInDepartment(departmentId) {
    const id = String(departmentId || "").trim();
    if (!id) return [];
    return assignableEmployees
      .filter((employee) => employee.departmentId === id)
      .map((employee) => employee.id);
  }

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
      toast.crudSuccess("Employee", "delete");
      setDeleteTarget(null);
      reload();
      requestEmsRefresh();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete employee");
    } finally {
      setDeleting(false);
    }
  }

  function openAssignLeavesModal() {
    setAssignError("");
    setAssignFieldErrors({});
    setEmployeeSearch("");
    setAssignForm({
      ...EMPTY_ASSIGN_LEAVES_FORM,
      departmentId: assignDepartments[0]?.id || "",
    });
    setAssignOpen(true);
  }

  function closeAssignLeavesModal() {
    if (assigning) return;
    setAssignOpen(false);
    setAssignError("");
    setAssignFieldErrors({});
    setEmployeeSearch("");
  }

  function updateAssignField(field, value) {
    if (field === "scope" || field === "departmentId") {
      setEmployeeSearch("");
    }
    setAssignForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "scope") {
        if (value === "department") {
          const departmentId =
            current.departmentId || assignDepartments[0]?.id || "";
          next.departmentId = departmentId;
          next.employeeIds = employeesInDepartment(departmentId);
        } else if (value === "custom") {
          next.departmentId = "";
          next.employeeIds = [];
        } else {
          next.departmentId = "";
          next.employeeIds = [];
        }
      }
      if (field === "departmentId") {
        next.employeeIds = employeesInDepartment(value);
      }
      return next;
    });
    setAssignFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === "scope" || field === "departmentId") {
        delete next.employeeIds;
        delete next.departmentId;
      }
      return next;
    });
  }

  function toggleAssignEmployee(employeeId) {
    setAssignForm((current) => {
      const selected = new Set(current.employeeIds || []);
      if (selected.has(employeeId)) selected.delete(employeeId);
      else selected.add(employeeId);
      return { ...current, employeeIds: [...selected] };
    });
    setAssignFieldErrors((current) => {
      if (!current.employeeIds) return current;
      const next = { ...current };
      delete next.employeeIds;
      return next;
    });
  }

  function selectAllFilteredEmployees() {
    setAssignForm((current) => {
      const selected = new Set(current.employeeIds || []);
      filteredAssignableEmployees.forEach((employee) =>
        selected.add(employee.id),
      );
      return { ...current, employeeIds: [...selected] };
    });
    setAssignFieldErrors((current) => {
      if (!current.employeeIds) return current;
      const next = { ...current };
      delete next.employeeIds;
      return next;
    });
  }

  function clearAssignEmployees() {
    setAssignForm((current) => ({ ...current, employeeIds: [] }));
  }

  async function submitAssignLeaves(event) {
    event.preventDefault();
    const validation = validateAssignLeavesForm(assignForm);
    if (!validation.ok) {
      setAssignFieldErrors(validation.fieldErrors);
      setAssignError(validation.message);
      return;
    }

    try {
      setAssigning(true);
      setAssignError("");
      setAssignFieldErrors({});
      const result = await assignEmployeeLeaveBalances(
        toAssignLeavesPayload(assignForm),
      );
      toast.success(
        result.message ||
          `Leave balances updated for ${result.updatedCount} employee(s)`,
      );
      setAssignOpen(false);
      reload();
      requestEmsRefresh();
    } catch (err) {
      setAssignError(err.message || "Failed to assign leave balances");
    } finally {
      setAssigning(false);
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
    assignOpen,
    assignForm,
    assignFieldErrors,
    assignError,
    assigning,
    assignDepartments,
    assignScopes: ASSIGN_LEAVE_SCOPES,
    assignModes: ASSIGN_LEAVE_MODES,
    filteredAssignableEmployees,
    employeeSearch,
    setEmployeeSearch,
    openAssignLeavesModal,
    closeAssignLeavesModal,
    updateAssignField,
    toggleAssignEmployee,
    selectAllFilteredEmployees,
    clearAssignEmployees,
    submitAssignLeaves,
  };
}

export function useEmployeeForm(employeeId) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isEdit = Boolean(employeeId);
  const canManageCredentials = HR_ADMIN_ROLES.includes(user?.role);
  const showPasswordFields = !isEdit || canManageCredentials;

  const [form, setForm] = useState({ ...EMPTY_EMPLOYEE_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [isAdminAccount, setIsAdminAccount] = useState(false);
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
          if (employee.isAdminAccount) {
            toast.error(
              "Admin is a system manager and is not managed from Employees",
            );
            navigate("/employees", { replace: true });
            return;
          }
          setIsAdminAccount(false);
          setForm(toEmployeeFormValues(employee));
        } else {
          const departmentRows = await fetchDepartments();
          if (cancelled) return;

          setDepartments(departmentRows);
          setIsAdminAccount(false);
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
      isAdminAccount,
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
        isAdminAccount,
      });

      if (isEdit) {
        await updateEmployee(employeeId, payload);
        toast.crudSuccess("Employee", "update");
      } else {
        await createEmployee(payload);
        toast.crudSuccess("Employee", "create");
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
    isAdminAccount,
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
