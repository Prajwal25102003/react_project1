import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./authContext.jsx";
import { useToast } from "./toastContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { useListData } from "./listController.js";
import { fetchEmployeeById, fetchEmployees } from "../services/employeesService.js";
import {
  deleteAttendance,
  fetchAttendanceById,
  fetchAttendanceRecords,
  importAttendanceRecords,
  updateAttendance,
} from "../services/attendanceService.js";
import {
  EMPTY_ATTENDANCE_FORM,
  calculateWorkingHours,
  toAttendanceFormValues,
  toAttendancePayload,
  validateAttendanceForm,
} from "../models/attendanceModel.js";
import {
  parseAttendanceImportFile,
  summarizeImportResult,
} from "../models/attendanceImportModel.js";
import {
  ATTENDANCE_COLUMN_FILTERS,
  ATTENDANCE_COLUMNS,
  ATTENDANCE_SEARCH_KEYS,
  getAttendanceDefaultVisibleIds,
} from "../models/attendanceTableModel.js";
import { ROLES } from "../models/authModel.js";
import { requestEmsRefresh } from "../utils/emsRefresh.js";

export function useAttendance() {
  const { user } = useAuth();
  const toast = useToast();
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const { rows, loading, error, reload } = useListData(
    fetchAttendanceRecords,
    "Failed to load attendance",
  );
  const table = useDataTable(rows, {
    columns: ATTENDANCE_COLUMNS,
    searchKeys: ATTENDANCE_SEARCH_KEYS,
    initialVisibleColumnIds: getAttendanceDefaultVisibleIds(isEmployee),
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importStats, setImportStats] = useState(null);
  const fileInputRef = useRef(null);

  function openDeleteModal(record) {
    setDeleteError("");
    setDeleteTarget(record);
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
      await deleteAttendance(deleteTarget.id);
      toast.crudSuccess("Attendance", "delete");
      setDeleteTarget(null);
      reload();
      requestEmsRefresh();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete attendance");
    } finally {
      setDeleting(false);
    }
  }

  function openImportPicker() {
    setImportError("");
    fileInputRef.current?.click();
  }

  function clearImportStats() {
    setImportStats(null);
    setImportError("");
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isEmployee) return;

    try {
      setImporting(true);
      setImportError("");
      setImportStats(null);

      const buffer = await file.arrayBuffer();
      const parsed = parseAttendanceImportFile(buffer);
      if (!parsed.ok) {
        setImportError(parsed.errors[0] || "Failed to parse Excel file");
        return;
      }

      const stats = summarizeImportResult(
        await importAttendanceRecords(parsed.rows),
      );
      if (parsed.errors.length) {
        stats.errors = [...parsed.errors.slice(0, 10), ...(stats.errors || [])].slice(
          0,
          20,
        );
      }
      setImportStats(stats);
      toast.success(
        `Attendance imported · ${stats.imported} record(s) processed`,
      );
      reload();
      requestEmsRefresh();
    } catch (err) {
      setImportError(err.message || "Failed to import attendance");
      toast.error(err.message || "Failed to import attendance");
    } finally {
      setImporting(false);
    }
  }

  return {
    records: table.rows,
    loading,
    error,
    reload,
    table,
    filterDefs: ATTENDANCE_COLUMN_FILTERS,
    isEmployee,
    deleteTarget,
    deleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    importing,
    importError,
    importStats,
    fileInputRef,
    openImportPicker,
    handleImportFile,
    clearImportStats,
  };
}

export function useAttendanceForm(attendanceId) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ ...EMPTY_ATTENDANCE_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!attendanceId) {
        navigate("/attendance", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError("");
        setFieldErrors({});
        const [employeeRows, record] = await Promise.all([
          fetchEmployees({
            excludeLoginRoles: ["hr", "admin"],
          }),
          fetchAttendanceById(attendanceId),
        ]);
        if (cancelled) return;

        const options = [...employeeRows];
        if (
          record.employeeId &&
          !options.some((employee) => employee.id === record.employeeId)
        ) {
          try {
            const current = await fetchEmployeeById(record.employeeId);
            options.unshift(current);
          } catch {
            /* keep filtered list if lookup fails */
          }
        }
        setEmployees(options);
        setForm(toAttendanceFormValues(record));
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load form");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [attendanceId, navigate]);

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "status" && value === "Absent") {
        next.checkIn = "—";
        next.checkOut = "—";
        next.workingHours = "0";
        return next;
      }
      if (field === "checkIn" || field === "checkOut" || field === "status") {
        if (next.status === "Absent") {
          next.workingHours = "0";
        } else {
          next.workingHours = calculateWorkingHours(
            next.checkIn,
            next.checkOut,
          );
        }
      }
      return next;
    });
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!attendanceId) return;

    const validation = validateAttendanceForm(form);
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setError(validation.message);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setFieldErrors({});
      await updateAttendance(attendanceId, toAttendancePayload(form));
      toast.crudSuccess("Attendance", "update");
      requestEmsRefresh();
      navigate("/attendance");
    } catch (err) {
      setError(err.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    navigate("/attendance");
  }

  return {
    form,
    fieldErrors,
    employees,
    loading,
    saving,
    error,
    updateField,
    handleSubmit,
    handleCancel,
  };
}
