import { fetchJson } from "./apiService.js";

export async function fetchDepartments() {
  const data = await fetchJson(
    "/api/departments",
    "Failed to load departments",
  );
  return data.departments || [];
}

export async function fetchDepartmentById(id) {
  const data = await fetchJson(
    `/api/departments/${encodeURIComponent(id)}`,
    "Failed to load department",
  );
  return data.department;
}

export async function createDepartment(payload) {
  const data = await fetchJson(
    "/api/departments",
    "Failed to create department",
    {
      method: "POST",
      body: payload,
    },
  );
  return data.department;
}

export async function updateDepartment(id, payload) {
  const data = await fetchJson(
    `/api/departments/${encodeURIComponent(id)}`,
    "Failed to update department",
    {
      method: "PUT",
      body: payload,
    },
  );
  return data.department;
}

export async function deleteDepartment(id) {
  return fetchJson(
    `/api/departments/${encodeURIComponent(id)}`,
    "Failed to delete department",
    { method: "DELETE" },
  );
}
