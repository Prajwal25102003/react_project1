import { fetchFormData, fetchJson } from "./apiService.js";
import { mapLeaveRequest } from "../models/leaveRequestsModel.js";

export async function fetchLeaveRequests(scope = "mine") {
  const query = scope ? `?scope=${encodeURIComponent(scope)}` : "";
  const data = await fetchJson(
    `/api/leave-requests${query}`,
    "Failed to load leave requests",
  );
  return (data.leaveRequests || []).map(mapLeaveRequest);
}

export async function fetchLeaveRequestById(id) {
  const data = await fetchJson(
    `/api/leave-requests/${encodeURIComponent(id)}`,
    "Failed to load leave request",
  );
  return mapLeaveRequest(data.leaveRequest);
}

export async function createLeaveRequest(payload) {
  const data = await fetchJson(
    "/api/leave-requests",
    "Failed to create leave request",
    { method: "POST", body: payload },
  );
  return mapLeaveRequest(data.leaveRequest);
}

export async function uploadLeaveMedicalDocument(file) {
  const formData = new FormData();
  formData.append("document", file);

  const data = await fetchFormData(
    "/api/uploads/leave-medical",
    "Failed to upload medical document",
    formData,
  );

  return {
    url: data.url,
    originalName: data.originalName || file?.name || "",
  };
}

export async function updateLeaveRequestStatus(id, status, remarks) {
  const data = await fetchJson(
    `/api/leave-requests/${encodeURIComponent(id)}/status`,
    "Failed to update leave request",
    {
      method: "PATCH",
      body: { status, remarks, rejectionReason: remarks },
    },
  );
  return mapLeaveRequest(data.leaveRequest);
}

export async function cancelLeaveRequest(id, cancellationReason) {
  const data = await fetchJson(
    `/api/leave-requests/${encodeURIComponent(id)}/cancel`,
    "Failed to cancel leave request",
    {
      method: "PATCH",
      body: { cancellationReason },
    },
  );
  return mapLeaveRequest(data.leaveRequest);
}
