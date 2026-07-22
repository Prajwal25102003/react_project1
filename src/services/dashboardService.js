import { fetchJson } from "./apiService.js";
import { mapDashboardData } from "../models/dashboardModel.js";

export async function fetchDashboard(
  newEmployeesPeriod = "month",
  { scope } = {},
) {
  const params = new URLSearchParams({
    newEmployeesPeriod: String(newEmployeesPeriod),
  });
  if (scope) params.set("scope", scope);

  const data = await fetchJson(
    `/api/dashboard?${params.toString()}`,
    "Failed to load dashboard",
  );
  return mapDashboardData(data, newEmployeesPeriod);
}
