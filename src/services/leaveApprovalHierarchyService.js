import { fetchJson } from "./apiService.js";
import { mapHierarchy } from "../models/leaveApprovalHierarchyModel.js";

export async function fetchLeaveApprovalHierarchies() {
  const data = await fetchJson(
    "/api/leave-approval-hierarchies",
    "Failed to load leave approval hierarchies",
  );
  return (data.hierarchies || []).map(mapHierarchy);
}

export async function updateLeaveApprovalHierarchy(category, payload) {
  const data = await fetchJson(
    `/api/leave-approval-hierarchies/${encodeURIComponent(category)}`,
    "Failed to update leave approval hierarchy",
    { method: "PUT", body: payload },
  );
  return mapHierarchy(data.hierarchy);
}
