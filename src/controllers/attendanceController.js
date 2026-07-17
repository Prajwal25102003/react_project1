import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./authContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { useListData } from "./listController.js";
import { fetchEmployeeById, fetchEmployees } from "../services/employeesService.js";
import {
  createAttendance,
  deleteAttendance,
  fetchAttendanceById,
  fetchAttendanceRecords,
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
  ATTENDANCE_COLUMN_FILTERS,
  ATTENDANCE_COLUMNS,
  ATTENDANCE_SEARCH_KEYS,
} from "../models/attendanceTableModel.js";
import { ROLES } from "../models/authModel.js";
import { requestEmsRefresh } from "../utils/emsRefresh.js";

export function useAttendance() {
  const { user } = useAuth();
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const { rows, loading, error, reload } = useListData(
    fetchAttendanceRecords,
    "Failed to load attendance",
  );
  const table = useDataTable(rows, {
    columns: ATTENDANCE_COLUMNS,
    searchKeys: ATTENDANCE_SEARCH_KEYS,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
      setDeleteTarget(null);
      reload();
      requestEmsRefresh();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete attendance");
    } finally {
      setDeleting(false);
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
  };
}

export function useAttendanceForm(attendanceId) {
  const navigate = useNavigate();
  const isEdit = Boolean(attendanceId);
  const [form, setForm] = useState({ ...EMPTY_ATTENDANCE_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        setFieldErrors({});
        if (isEdit) {
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
        } else {
          const employeeRows = await fetchEmployees({
            excludeLoginRoles: ["hr", "admin"],
          });
          if (cancelled) return;

          setEmployees(employeeRows);
          setForm((current) => ({
            ...EMPTY_ATTENDANCE_FORM,
            employeeId: employeeRows[0]?.id || current.employeeId,
            date: new Date().toISOString().slice(0, 10),
          }));
        }
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
  }, [attendanceId, isEdit]);

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
      const payload = toAttendancePayload(form);
      if (isEdit) await updateAttendance(attendanceId, payload);
      else await createAttendance(payload);
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
    isEdit,
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
