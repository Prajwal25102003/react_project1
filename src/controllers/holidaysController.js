import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./authContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { ROLES } from "../models/authModel.js";
import {
  buildReleaseYearOptions,
  buildYearOptions,
  CALENDAR_STATUS,
  EMPTY_RELEASE_ROW,
  HOLIDAY_RELEASE_MAX_YEAR,
  releaseRowsToPayload,
  toReleaseRow,
  validateReleaseRows,
} from "../models/holidayCalendarModel.js";
import {
  EMPTY_HOLIDAY_FORM,
  getUpcomingHolidays,
  toHolidayFormValues,
  toHolidayPayload,
  validateHolidayForm,
} from "../models/holidaysModel.js";
import {
  getHolidayColumns,
  HOLIDAY_COLUMN_FILTERS,
  HOLIDAY_SEARCH_KEYS,
} from "../models/holidaysTableModel.js";
import {
  createHoliday,
  deleteHoliday,
  fetchHolidayCalendarTemplate,
  fetchHolidayCalendars,
  fetchHolidays,
  releaseHolidayCalendar,
  updateHoliday,
} from "../services/holidaysService.js";
import { requestEmsRefresh } from "../utils/emsRefresh.js";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function useHolidays() {
  const { user } = useAuth();
  const canManage = user?.role === ROLES.ADMIN;
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [holidays, setHolidays] = useState([]);
  const [calendar, setCalendar] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const columns = useMemo(() => getHolidayColumns(canManage), [canManage]);
  const table = useDataTable(holidays, {
    columns,
    searchKeys: HOLIDAY_SEARCH_KEYS,
    pageSize: 5,
  });

  const yearOptions = useMemo(
    () => buildYearOptions(currentYear, calendars, { canManage }),
    [calendars, canManage, currentYear],
  );

  const releaseYearOptions = useMemo(
    () => buildReleaseYearOptions(currentYear, calendars),
    [calendars, currentYear],
  );

  const canRelease = canManage && releaseYearOptions.length > 0;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_HOLIDAY_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseYear, setReleaseYear] = useState(() => new Date().getFullYear());
  const [releaseRows, setReleaseRows] = useState([]);
  const [releaseFieldErrors, setReleaseFieldErrors] = useState({});
  const [releaseError, setReleaseError] = useState("");
  const [releaseInfo, setReleaseInfo] = useState("");
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const releaseYearRef = useRef(releaseYear);
  releaseYearRef.current = releaseYear;

  const loadCalendars = useCallback(async () => {
    try {
      const rows = await fetchHolidayCalendars();
      setCalendars(rows);
    } catch {
      setCalendars([]);
    }
  }, []);

  const yearRef = useRef(year);
  yearRef.current = year;

  const loadHolidays = useCallback(async (yearOverride) => {
    const requestedYear = yearOverride ?? yearRef.current;
    try {
      setLoading(true);
      setError("");
      const result = await fetchHolidays(requestedYear);
      // Only apply results for the year currently shown on the calendar.
      if (requestedYear !== yearRef.current) return;
      setHolidays(result.holidays);
      setCalendar(result.calendar);
    } catch (err) {
      if (requestedYear !== yearRef.current) return;
      setError(err.message || "Failed to load holidays");
      setHolidays([]);
      setCalendar(null);
    } finally {
      if (requestedYear === yearRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHolidays(year);
  }, [year, loadHolidays]);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  const upcoming = useMemo(() => getUpcomingHolidays(holidays), [holidays]);
  const isYearReleased = calendar?.status === CALENDAR_STATUS.RELEASED;

  function changeYear(nextYear) {
    const value = Number(nextYear);
    if (
      !Number.isFinite(value) ||
      value < currentYear ||
      value > HOLIDAY_RELEASE_MAX_YEAR
    ) {
      return;
    }
    setYear(value);
    setCalendarMonth((current) => {
      if (value === year) return current;
      return 0;
    });
  }

  function shiftCalendar(delta) {
    let nextMonth = calendarMonth + delta;
    let nextYear = year;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    // Do not navigate outside current year … 2030.
    if (nextYear < currentYear || nextYear > HOLIDAY_RELEASE_MAX_YEAR) return;
    setCalendarMonth(nextMonth);
    if (nextYear !== year) setYear(nextYear);
  }

  function openCreateModal() {
    if (!canManage || !isYearReleased) return;
    setEditing(null);
    setForm({ ...EMPTY_HOLIDAY_FORM, date: `${year}-01-01` });
    setFieldErrors({});
    setFormError("");
    setFormOpen(true);
  }

  function openEditModal(holiday) {
    if (!canManage || !isYearReleased) return;
    setEditing(holiday);
    setForm(toHolidayFormValues(holiday));
    setFieldErrors({});
    setFormError("");
    setFormOpen(true);
  }

  function closeFormModal() {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setForm({ ...EMPTY_HOLIDAY_FORM });
    setFieldErrors({});
    setFormError("");
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submitForm(event) {
    event?.preventDefault?.();
    if (!canManage) return;

    const result = validateHolidayForm(form);
    if (!result.ok) {
      setFieldErrors(result.fieldErrors);
      setFormError(result.message);
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      const payload = toHolidayPayload(form);
      if (editing) {
        await updateHoliday(editing.id, payload);
      } else {
        await createHoliday(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await loadHolidays();
      await loadCalendars();
      requestEmsRefresh();
    } catch (err) {
      setFormError(err.message || "Failed to save holiday");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal(holiday) {
    if (!canManage || !isYearReleased) return;
    setDeleteError("");
    setDeleteTarget(holiday);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!deleteTarget || !canManage) return;
    try {
      setDeleting(true);
      setDeleteError("");
      await deleteHoliday(deleteTarget.id);
      setDeleteTarget(null);
      await loadHolidays();
      await loadCalendars();
      requestEmsRefresh();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete holiday");
    } finally {
      setDeleting(false);
    }
  }

  async function loadReleaseTemplate(nextYear = releaseYearRef.current) {
    const targetYear = Number(nextYear);
    try {
      setReleaseLoading(true);
      setReleaseError("");
      setReleaseInfo("");
      // Clear previous year's rows immediately so the form never shows
      // another year's holiday listing while the calendar year loads.
      setReleaseRows([]);
      const result = await fetchHolidayCalendarTemplate(targetYear);
      if (targetYear !== releaseYearRef.current) return;
      const rows = (result.holidays || []).map((item) =>
        toReleaseRow(item, targetYear),
      );
      setReleaseRows(rows);
      setReleaseInfo(
        `Loaded ${rows.length} holidays from the ${targetYear} calendar.`,
      );
    } catch (err) {
      if (targetYear !== releaseYearRef.current) return;
      setReleaseError(err.message || "Failed to load holiday template");
      setReleaseRows([]);
    } finally {
      if (targetYear === releaseYearRef.current) setReleaseLoading(false);
    }
  }

  function openReleaseModal() {
    if (!canRelease) return;
    // Prefer the year on the calendar if it is still releasable; otherwise first open year.
    const selected = releaseYearOptions.find(
      (option) => Number(option.value) === year,
    );
    const nextYear = Number(selected?.value || releaseYearOptions[0]?.value);
    if (!Number.isFinite(nextYear)) return;

    releaseYearRef.current = nextYear;
    setReleaseYear(nextYear);
    setReleaseRows([]);
    setReleaseFieldErrors({});
    setReleaseError("");
    setReleaseInfo("");
    setReleaseOpen(true);
    loadReleaseTemplate(nextYear);
  }

  function closeReleaseModal() {
    if (releasing || releaseLoading) return;
    setReleaseOpen(false);
    setReleaseRows([]);
    setReleaseFieldErrors({});
    setReleaseError("");
    setReleaseInfo("");
  }

  function changeReleaseYear(nextYear) {
    const value = Number(nextYear);
    if (!Number.isFinite(value) || value < currentYear) return;
    const allowed = releaseYearOptions.some(
      (option) => Number(option.value) === value,
    );
    if (!allowed) {
      setReleaseError(`${value} is already released and cannot be released again.`);
      return;
    }
    releaseYearRef.current = value;
    setReleaseYear(value);
    setReleaseRows([]);
    setReleaseFieldErrors({});
    setReleaseError("");
    setReleaseInfo("");
    loadReleaseTemplate(value);
  }

  function updateReleaseRow(index, field, value) {
    setReleaseRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
    setReleaseFieldErrors((current) => {
      if (!current[index]?.[field]) return current;
      const next = { ...current };
      const rowErrors = { ...(next[index] || {}) };
      delete rowErrors[field];
      if (Object.keys(rowErrors).length === 0) delete next[index];
      else next[index] = rowErrors;
      return next;
    });
  }

  function addReleaseRow() {
    setReleaseRows((current) => [
      ...current,
      { ...EMPTY_RELEASE_ROW, date: `${releaseYear}-01-01` },
    ]);
  }

  function removeReleaseRow(index) {
    setReleaseRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setReleaseFieldErrors((current) => {
      const next = {};
      Object.entries(current).forEach(([key, value]) => {
        const rowIndex = Number(key);
        if (rowIndex < index) next[rowIndex] = value;
        else if (rowIndex > index) next[rowIndex - 1] = value;
      });
      return next;
    });
  }

  async function submitRelease(event) {
    event?.preventDefault?.();
    if (!canManage) return;

    const result = validateReleaseRows(releaseRows, releaseYear);
    if (!result.ok) {
      setReleaseFieldErrors(result.fieldErrors);
      setReleaseError(result.message);
      return;
    }

    try {
      setReleasing(true);
      setReleaseError("");
      await releaseHolidayCalendar(releaseYear, releaseRowsToPayload(releaseRows));
      setReleaseOpen(false);
      setYear(releaseYear);
      await loadHolidays();
      await loadCalendars();
      requestEmsRefresh();
    } catch (err) {
      setReleaseError(err.message || "Failed to release holiday calendar");
    } finally {
      setReleasing(false);
    }
  }

  return {
    canManage,
    canRelease,
    year,
    yearOptions,
    releaseYearOptions,
    calendar,
    isYearReleased,
    calendarMonth,
    calendarMonthLabel: `${MONTH_NAMES[calendarMonth]} ${year}`,
    shiftCalendar,
    changeYear,
    holidays,
    upcoming,
    loading,
    error,
    table,
    columns,
    filterDefs: HOLIDAY_COLUMN_FILTERS,
    formOpen,
    editing,
    form,
    fieldErrors,
    formError,
    saving,
    openCreateModal,
    openEditModal,
    closeFormModal,
    updateField,
    submitForm,
    deleteTarget,
    deleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    releaseOpen,
    releaseYear,
    releaseRows,
    releaseFieldErrors,
    releaseError,
    releaseInfo,
    releaseLoading,
    releasing,
    openReleaseModal,
    closeReleaseModal,
    changeReleaseYear,
    updateReleaseRow,
    addReleaseRow,
    removeReleaseRow,
    submitRelease,
  };
}
