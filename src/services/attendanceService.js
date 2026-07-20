import { fetchJson } from "./apiService.js";
import { mapAttendanceRecord } from "../models/attendanceModel.js";

export async function fetchAttendanceRecords() {
  const data = await fetchJson("/api/attendance", "Failed to load attendance");
  return (data.records || []).map(mapAttendanceRecord);
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

export async function importAttendanceRecords(records) {
  const data = await fetchJson(
    "/api/attendance/import",
    "Failed to import attendance",
    {
      method: "POST",
      body: { records },
    },
  );
  return data.stats || {};
}
