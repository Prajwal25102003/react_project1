import { fetchJson } from "./apiService.js";
import { mapNotifications } from "../models/headerModel.js";

export async function fetchNotifications() {
  const data = await fetchJson(
    "/api/notifications",
    "Failed to load notifications",
  );
  return mapNotifications(data.notifications || []);
}
