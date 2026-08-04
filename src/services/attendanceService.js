import { fetchJson } from "./apiService.js";
import { mapAttendanceRecord } from "../models/attendanceModel.js";

function buildAttendanceQuery(params = {}) {
  const query = new URLSearchParams();
  const entries = {
    page: params.page,
    pageSize: params.pageSize,
    days: params.days,
    search: params.search,
    status: params.status,
    employeeId: params.employeeId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sortId: params.sortId,
    sortDir: params.sortDir,
  };

  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }

  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAttendanceRecords(params = {}) {
  const data = await fetchJson(
    `/api/attendance${buildAttendanceQuery(params)}`,
    "Failed to load attendance",
  );
  return {
    records: (data.records || []).map(mapAttendanceRecord),
    total: Number(data.total ?? (data.records || []).length),
    page: Number(data.page || params.page || 1),
    pageSize: Number(data.pageSize || params.pageSize || 5),
    days: data.days,
  };
}

export async function fetchAttendanceById(id) {
  const data = await fetchJson(
    `/api/attendance/${encodeURIComponent(id)}`,
    "Failed to load attendance",
  );
  return mapAttendanceRecord(data.record);
}

export async function updateAttendance(id, payload) {
  const data = await fetchJson(
    `/api/attendance/${encodeURIComponent(id)}`,
    "Failed to update attendance",
    { method: "PUT", body: payload },
  );
  return mapAttendanceRecord(data.record);
}

export async function deleteAttendance(id) {
  return fetchJson(
    `/api/attendance/${encodeURIComponent(id)}`,
    "Failed to delete attendance",
    { method: "DELETE" },
  );
}

export async function importAttendanceRecords(records, { filename } = {}) {
  const data = await fetchJson(
    "/api/attendance/import",
    "Failed to import attendance",
    {
      method: "POST",
      body: {
        records,
        filename: filename || undefined,
      },
    },
  );
  return data.stats || {};
}
