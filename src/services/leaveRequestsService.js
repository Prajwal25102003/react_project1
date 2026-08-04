import { fetchFormData, fetchJson } from "./apiService.js";
import { mapLeaveRequest } from "../models/leaveRequestsModel.js";

/** Short-lived shared cache so nav badges and leave page share one in-flight request. */
const CACHE_TTL_MS = 8000;
let leaveListCache = {
  scope: null,
  promise: null,
  data: null,
  at: 0,
};

export function invalidateLeaveRequestsCache() {
  leaveListCache = {
    scope: null,
    promise: null,
    data: null,
    at: 0,
  };
}

export async function fetchLeaveRequests(scope = "mine") {
  const key = String(scope || "mine");
  const now = Date.now();

  if (
    leaveListCache.scope === key &&
    leaveListCache.data &&
    now - leaveListCache.at < CACHE_TTL_MS
  ) {
    return leaveListCache.data;
  }

  if (leaveListCache.scope === key && leaveListCache.promise) {
    return leaveListCache.promise;
  }

  leaveListCache.scope = key;
  leaveListCache.promise = (async () => {
    const query = key ? `?scope=${encodeURIComponent(key)}` : "";
    const data = await fetchJson(
      `/api/leave-requests${query}`,
      "Failed to load leave requests",
    );
    const mapped = (data.leaveRequests || []).map(mapLeaveRequest);
    leaveListCache.data = mapped;
    leaveListCache.at = Date.now();
    leaveListCache.promise = null;
    return mapped;
  })().catch((error) => {
    if (leaveListCache.scope === key) {
      leaveListCache.promise = null;
      leaveListCache.data = null;
      leaveListCache.at = 0;
    }
    throw error;
  });

  return leaveListCache.promise;
}

export async function fetchLeaveRequestById(id) {
  const data = await fetchJson(
    `/api/leave-requests/${encodeURIComponent(id)}`,
    "Failed to load leave request",
  );
  return mapLeaveRequest(data.leaveRequest);
}

export async function createLeaveRequest(payload) {
  invalidateLeaveRequestsCache();
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
  invalidateLeaveRequestsCache();
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
  invalidateLeaveRequestsCache();
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
