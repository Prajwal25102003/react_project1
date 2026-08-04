import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./authContext.jsx";
import { useToast } from "./toastContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { useModuleNotificationAttention } from "./moduleNotificationAttentionController.js";
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
  getAttendanceDisplayColumns,
} from "../models/attendanceTableModel.js";
import { ROLES } from "../models/authModel.js";
import { requestEmsRefresh } from "../utils/emsRefresh.js";

/** Map DataTable period filter values to inclusive SQL date bounds. */
function periodFilterToDateBounds(period) {
  const value = String(period || "").trim();
  if (!value) return { dateFrom: null, dateTo: null };
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { dateFrom: value, dateTo: value };
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return {
      dateFrom: `${value}-01`,
      dateTo: `${value}-${String(lastDay).padStart(2, "0")}`,
    };
  }
  if (/^\d{4}$/.test(value)) {
    return { dateFrom: `${value}-01-01`, dateTo: `${value}-12-31` };
  }
  return { dateFrom: null, dateTo: null };
}

export function useAttendance() {
  const { user } = useAuth();
  const toast = useToast();
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const isHr = user?.role === ROLES.HR;
  const isAdmin = user?.role === ROLES.ADMIN;
  const myEmployeeId = user?.employeeId || null;
  const canFilterMyAttendance = isHr && Boolean(myEmployeeId);
  const canFilterByEmployee = (isHr || isAdmin) && !isEmployee;
  const [listScope, setListScope] = useState("all");
  const [employeeFilterOptions, setEmployeeFilterOptions] = useState([]);
  const seenUserKey =
    user?.id || user?.email || user?.employeeId || "";
  const [searchParams] = useSearchParams();
  const deepLinkAckedRef = useRef("");
  const [rows, setRows] = useState([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const {
    acknowledgeAttention,
    markAllAsRead,
    hasUnread,
    withAttention,
  } = useModuleNotificationAttention({
    navId: "attendance",
    role: user?.role,
    seenUserKey,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!canFilterMyAttendance && listScope === "mine") {
      setListScope("all");
    }
  }, [canFilterMyAttendance, listScope]);

  useEffect(() => {
    if (!canFilterByEmployee) {
      setEmployeeFilterOptions([]);
      return undefined;
    }

    let cancelled = false;
    fetchEmployees({ excludeLoginRoles: ["admin"] })
      .then((employees) => {
        if (cancelled) return;
        setEmployeeFilterOptions(
          (employees || []).map((employee) => ({
            value: employee.id,
            label: employee.id,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setEmployeeFilterOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [canFilterByEmployee]);

  const listScopeOptions = useMemo(() => {
    if (!canFilterMyAttendance) return [];
    return [
      { value: "mine", label: "My Attendance" },
      { value: "all", label: "All" },
    ];
  }, [canFilterMyAttendance]);

  const showingMyAttendance = isEmployee || listScope === "mine";

  const filterDefs = useMemo(() => {
    const defs = [...ATTENDANCE_COLUMN_FILTERS];
    if (
      canFilterByEmployee &&
      !showingMyAttendance &&
      employeeFilterOptions.length > 0
    ) {
      defs.push({
        id: "employeeId",
        label: "Employee",
        options: employeeFilterOptions,
      });
    }
    return defs;
  }, [canFilterByEmployee, employeeFilterOptions, showingMyAttendance]);

  const canManageRecord = useCallback(
    (record) => {
      if (isEmployee) return false;
      if (isHr && myEmployeeId && record?.employeeId === myEmployeeId) {
        return false;
      }
      return true;
    },
    [isEmployee, isHr, myEmployeeId],
  );

  const tableSourceRows = useMemo(
    () => withAttention(rows || []),
    [rows, withAttention],
  );

  const table = useDataTable(tableSourceRows, {
    columns: ATTENDANCE_COLUMNS,
    searchKeys: ATTENDANCE_SEARCH_KEYS,
    initialVisibleColumnIds: getAttendanceDefaultVisibleIds(showingMyAttendance),
    serverTotal,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(table.search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [table.search]);

  const listQuery = useMemo(() => {
    const { dateFrom, dateTo } = periodFilterToDateBounds(
      table.columnFilters?.date,
    );
    const filterEmployeeId = showingMyAttendance
      ? myEmployeeId
      : table.columnFilters?.employeeId || null;

    return {
      page: table.page,
      pageSize: table.pageSize,
      search: debouncedSearch,
      status: table.columnFilters?.status || null,
      employeeId: filterEmployeeId || null,
      dateFrom,
      dateTo,
      sortId: table.sort?.id || "date",
      sortDir: table.sort?.direction || "desc",
    };
  }, [
    debouncedSearch,
    myEmployeeId,
    showingMyAttendance,
    table.columnFilters,
    table.page,
    table.pageSize,
    table.sort?.direction,
    table.sort?.id,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchAttendanceRecords(listQuery);
        if (cancelled) return;
        setRows(data.records || []);
        setServerTotal(data.total || 0);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load attendance");
          setRows([]);
          setServerTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRows();
    return () => {
      cancelled = true;
    };
  }, [listQuery, reloadToken]);

  function reload() {
    setReloadToken((token) => token + 1);
  }

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importStats, setImportStats] = useState(null);
  const fileInputRef = useRef(null);

  const handleListScopeChange = useCallback(
    (nextScope) => {
      setListScope(nextScope);
      if (nextScope === "mine" && table.columnFilters?.employeeId) {
        table.setColumnFilter("employeeId", "");
      }
    },
    [table],
  );

  const acknowledgeRecord = useCallback(
    (record) => acknowledgeAttention(record),
    [acknowledgeAttention],
  );

  function openDeleteModal(record) {
    if (!canManageRecord(record)) return;
    setDeleteError("");
    setDeleteTarget(record);
    acknowledgeRecord(record);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  }

  function onRecordInteract(record) {
    acknowledgeRecord(record);
  }

  useEffect(() => {
    const recordId = String(searchParams.get("id") || "").trim();
    const employeeId = String(searchParams.get("employeeId") || "").trim();
    const key = recordId || employeeId;
    if (!key || loading) return;
    if (deepLinkAckedRef.current === key) return;

    const match = recordId
      ? rows.find((row) => String(row.id) === recordId)
      : rows.find((row) => String(row.employeeId) === employeeId);

    if (match) {
      deepLinkAckedRef.current = key;
      acknowledgeRecord(match);
      return;
    }

    if (!recordId) return;

    let cancelled = false;
    fetchAttendanceById(recordId)
      .then((record) => {
        if (cancelled || !record) return;
        deepLinkAckedRef.current = key;
        acknowledgeRecord(record);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [acknowledgeRecord, loading, rows, searchParams]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setDeleteError("");
      await deleteAttendance(deleteTarget.id);
      toast.success("Attendance record deleted");
      setDeleteTarget(null);
      reload();
      requestEmsRefresh();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete attendance");
      toast.error(err.message || "Failed to delete attendance");
    } finally {
      setDeleting(false);
    }
  }

  function openImportPicker() {
    setImportErrors([]);
    fileInputRef.current?.click();
  }

  useEffect(() => {
    if (!importStats) return undefined;
    const timer = window.setTimeout(() => {
      setImportStats(null);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [importStats]);

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isEmployee) return;

    try {
      setImporting(true);
      setImportErrors([]);
      setImportStats(null);

      const buffer = await file.arrayBuffer();
      const parsed = await parseAttendanceImportFile(buffer);
      if (!parsed.ok) {
        setImportErrors(
          parsed.errors?.length
            ? parsed.errors
            : ["Failed to parse Excel file"],
        );
        return;
      }

      const stats = summarizeImportResult(
        await importAttendanceRecords(parsed.rows, {
          filename: file.name,
        }),
      );

      setImportStats(stats);
      reload();
      requestEmsRefresh();
    } catch (err) {
      setImportErrors(
        Array.isArray(err.errors) && err.errors.length > 0
          ? err.errors
          : [err.message || "Failed to import attendance"],
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleExportCsv() {
    try {
      const pageSize = 100;
      let page = 1;
      let all = [];
      let total = Infinity;
      while (all.length < total) {
        const data = await fetchAttendanceRecords({
          ...listQuery,
          page,
          pageSize,
        });
        total = data.total || 0;
        all = all.concat(data.records || []);
        if (!data.records?.length) break;
        page += 1;
        if (page > 200) break;
      }
      table.exportCsv("attendance.csv", all);
    } catch (err) {
      toast.error(err.message || "Failed to export attendance");
    }
  }

  const displayColumns = useMemo(
    () =>
      getAttendanceDisplayColumns(table.visibleColumns, {
        showingMyAttendance,
        isEmployee,
      }),
    [table.visibleColumns, showingMyAttendance, isEmployee],
  );

  return {
    records: table.rows,
    loading,
    error,
    reload,
    table,
    displayColumns,
    filterDefs,
    isEmployee,
    listScope,
    setListScope: handleListScopeChange,
    listScopeOptions,
    showingMyAttendance,
    canManageRecord,
    hasUnread,
    markAllAsRead,
    deleteTarget,
    deleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    onRecordInteract,
    importing,
    importErrors,
    importStats,
    fileInputRef,
    openImportPicker,
    handleImportFile,
    handleExportCsv,
  };
}

export function useAttendanceForm(attendanceId) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
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
            excludeLoginRoles: ["admin"],
          }),
          fetchAttendanceById(attendanceId),
        ]);
        if (cancelled) return;

        if (
          user?.role === ROLES.HR &&
          user?.employeeId &&
          record.employeeId === user.employeeId
        ) {
          toast.error("You cannot edit your own attendance");
          navigate("/attendance", { replace: true });
          return;
        }

        const options = [...employeeRows].filter(
          (employee) =>
            !(
              user?.role === ROLES.HR &&
              user?.employeeId &&
              employee.id === user.employeeId
            ),
        );
        if (
          record.employeeId &&
          !options.some((employee) => employee.id === record.employeeId)
        ) {
          try {
            const current = await fetchEmployeeById(record.employeeId);
            if (
              !(
                user?.role === ROLES.HR &&
                user?.employeeId &&
                current.id === user.employeeId
              )
            ) {
              options.unshift(current);
            }
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
  }, [attendanceId, navigate, toast, user?.employeeId, user?.role]);

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
