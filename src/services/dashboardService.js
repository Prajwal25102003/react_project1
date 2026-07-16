import { fetchJson } from "./apiService.js";
import { mapDashboardData } from "../models/dashboardModel.js";

export async function fetchDashboard(newEmployeesPeriod = "month") {
  const period = encodeURIComponent(newEmployeesPeriod);
  const data = await fetchJson(
    `/api/dashboard?newEmployeesPeriod=${period}`,
    "Failed to load dashboard",
  );
  return mapDashboardData(data, newEmployeesPeriod);
}
