import { fetchJson } from "./apiService.js";
import { mapLeaveRequest } from "../models/leaveRequestsModel.js";

export async function fetchLeaveRequests() {
  const data = await fetchJson(
    "/api/leave-requests",
    "Failed to load leave requests",
  );
  return (data.leaveRequests || []).map(mapLeaveRequest);
}

export async function createLeaveRequest(payload) {
  const data = await fetchJson(
    "/api/leave-requests",
    "Failed to create leave request",
    { method: "POST", body: payload },
  );
  return mapLeaveRequest(data.leaveRequest);
}

export async function updateLeaveRequestStatus(id, status) {
  const data = await fetchJson(
    `/api/leave-requests/${encodeURIComponent(id)}/status`,
    "Failed to update leave request",
    {
      method: "PATCH",
      body: { status },
    },
  );
  return mapLeaveRequest(data.leaveRequest);
}

export async function cancelLeaveRequest(id) {
  const data = await fetchJson(
    `/api/leave-requests/${encodeURIComponent(id)}/cancel`,
    "Failed to cancel leave request",
    { method: "PATCH" },
  );
  return mapLeaveRequest(data.leaveRequest);
}
