import * as XLSX from "xlsx";
import { ATTENDANCE_STATUSES, calculateWorkingHours } from "./attendanceModel.js";

const HEADER_ALIASES = {
  employeeid: "employeeId",
  employee_id: "employeeId",
  empid: "employeeId",
  emp_id: "employeeId",
  date: "date",
  attendance_date: "date",
  attendancedate: "date",
  status: "status",
  checkin: "checkIn",
  check_in: "checkIn",
  checkout: "checkOut",
  check_out: "checkOut",
};

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function excelDateToIso(value) {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return "";
    const month = String(parsed.m).padStart(2, "0");
    const day = String(parsed.d).padStart(2, "0");
    return `${parsed.y}-${month}-${day}`;
  }

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) {
    const day = slash[1].padStart(2, "0");
    const month = slash[2].padStart(2, "0");
    return `${slash[3]}-${month}-${day}`;
  }

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
}

function normalizeClock(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "-" || text === "—") return "—";
  return text;
}

function normalizeStatus(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  if (lower === "present") return "Present";
  if (lower === "absent") return "Absent";
  if (lower === "half day" || lower === "halfday" || lower === "half-day") {
    return "Half Day";
  }
  return text;
}

/**
 * Parse an Excel/CSV attendance file into validated rows + parse errors.
 * Expected columns: employeeId, date, status, checkIn, checkOut
 */
export function parseAttendanceImportFile(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { ok: false, rows: [], errors: ["Excel file has no sheets."] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: true,
  });

  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return { ok: false, rows: [], errors: ["Excel file has no data rows."] };
  }

  const sampleKeys = Object.keys(rawRows[0] || {});
  const mappedKeys = {};
  for (const key of sampleKeys) {
    const alias = HEADER_ALIASES[normalizeHeader(key)];
    if (alias) mappedKeys[key] = alias;
  }

  if (!Object.values(mappedKeys).includes("employeeId") || !Object.values(mappedKeys).includes("date")) {
    return {
      ok: false,
      rows: [],
      errors: [
        "Excel must include employeeId and date columns (optional: status, checkIn, checkOut).",
      ],
    };
  }

  const rows = [];
  const errors = [];

  rawRows.forEach((raw, index) => {
    const line = index + 2;
    const mapped = {};
    for (const [key, alias] of Object.entries(mappedKeys)) {
      mapped[alias] = raw[key];
    }

    const employeeId = String(mapped.employeeId ?? "").trim().toUpperCase();
    const date = excelDateToIso(mapped.date);
    const status = normalizeStatus(mapped.status) || "Present";
    const checkIn = normalizeClock(mapped.checkIn);
    const checkOut = normalizeClock(mapped.checkOut);

    if (!employeeId) {
      errors.push(`Row ${line}: employeeId is required`);
      return;
    }
    if (!date) {
      errors.push(`Row ${line}: invalid date`);
      return;
    }
    if (!ATTENDANCE_STATUSES.includes(status)) {
      errors.push(`Row ${line}: status must be Present, Absent, or Half Day`);
      return;
    }

    let workingHours = calculateWorkingHours(checkIn, checkOut);
    if (workingHours === "") workingHours = "0";
    if (status === "Absent") {
      workingHours = "0";
    }

    rows.push({
      employeeId,
      date,
      status,
      checkIn: status === "Absent" ? "—" : checkIn,
      checkOut: status === "Absent" ? "—" : checkOut,
      workingHours: Number(workingHours) || 0,
    });
  });

  if (rows.length === 0) {
    return {
      ok: false,
      rows: [],
      errors: errors.length ? errors : ["No valid attendance rows found."],
    };
  }

  return { ok: true, rows, errors };
}

export function summarizeImportResult(result) {
  return {
    imported: Number(result?.imported ?? 0),
    updated: Number(result?.updated ?? 0),
    skipped: Number(result?.skipped ?? 0),
    failed: Number(result?.failed ?? 0),
    total: Number(result?.total ?? 0),
    present: Number(result?.present ?? 0),
    absent: Number(result?.absent ?? 0),
    halfDay: Number(result?.halfDay ?? 0),
    errors: result?.errors || [],
  };
}
