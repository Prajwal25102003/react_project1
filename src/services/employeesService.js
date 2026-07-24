import { fetchFormData, fetchJson } from "./apiService.js";
import { mapEmployee } from "../models/employeesModel.js";

export async function fetchEmployees({ excludeLoginRoles = [] } = {}) {
  const params = new URLSearchParams();
  if (excludeLoginRoles.length > 0) {
    params.set("excludeLoginRoles", excludeLoginRoles.join(","));
  }
  const query = params.toString();
  const data = await fetchJson(
    query ? `/api/employees?${query}` : "/api/employees",
    "Failed to load employees",
  );
  return (data.employees || []).map(mapEmployee);
}

export async function fetchEmployeeById(id) {
  const data = await fetchJson(
    `/api/employees/${encodeURIComponent(id)}`,
    "Failed to load employee",
  );
  return mapEmployee(data.employee);
}

export async function createEmployee(payload) {
  const data = await fetchJson("/api/employees", "Failed to create employee", {
    method: "POST",
    body: payload,
  });
  return mapEmployee(data.employee);
}

export async function updateEmployee(id, payload) {
  const data = await fetchJson(
    `/api/employees/${encodeURIComponent(id)}`,
    "Failed to update employee",
    {
      method: "PUT",
      body: payload,
    },
  );
  return mapEmployee(data.employee);
}

export async function deleteEmployee(id) {
  return fetchJson(
    `/api/employees/${encodeURIComponent(id)}`,
    "Failed to delete employee",
    { method: "DELETE" },
  );
}

/** Bulk set/add leave balances (All / Department / Custom). */
export async function assignEmployeeLeaveBalances(payload) {
  return fetchJson(
    "/api/employees/leave-balances/assign",
    "Failed to assign leave balances",
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function uploadEmployeeAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const data = await fetchFormData(
    "/api/uploads/avatar",
    "Failed to upload avatar",
    formData,
  );

  return data.url;
}
