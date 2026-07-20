import { fetchJson } from "./apiService.js";
import { mapCalendar } from "../models/holidayCalendarModel.js";
import { mapHoliday } from "../models/holidaysModel.js";

export async function fetchHolidayCalendars() {
  const data = await fetchJson(
    "/api/holidays/calendars",
    "Failed to load holiday calendars",
  );
  return (data.calendars || []).map(mapCalendar);
}

export async function fetchHolidayCalendarTemplate(year) {
  const data = await fetchJson(
    `/api/holidays/calendars/${encodeURIComponent(year)}/template`,
    "Failed to load holiday calendar template",
  );
  return {
    calendar: mapCalendar(data.calendar),
    holidays: (data.holidays || []).map(mapHoliday),
    source: "template",
    year: data.year ?? Number(year),
  };
}

export async function fetchHolidays(year) {
  const query = year ? `?year=${encodeURIComponent(year)}` : "";
  const data = await fetchJson(
    `/api/holidays${query}`,
    "Failed to load holidays",
  );
  return {
    holidays: (data.holidays || []).map(mapHoliday),
    calendar: mapCalendar(data.calendar),
    message: data.message || "",
  };
}

export async function releaseHolidayCalendar(year, holidays) {
  const data = await fetchJson(
    `/api/holidays/calendars/${encodeURIComponent(year)}/release`,
    "Failed to release holiday calendar",
    {
      method: "POST",
      body: { holidays },
    },
  );
  return {
    calendar: mapCalendar(data.calendar),
    holidays: (data.holidays || []).map(mapHoliday),
  };
}

export async function createHoliday(payload) {
  const data = await fetchJson("/api/holidays", "Failed to create holiday", {
    method: "POST",
    body: payload,
  });
  return mapHoliday(data.holiday);
}

export async function updateHoliday(id, payload) {
  const data = await fetchJson(
    `/api/holidays/${encodeURIComponent(id)}`,
    "Failed to update holiday",
    {
      method: "PUT",
      body: payload,
    },
  );
  return mapHoliday(data.holiday);
}

export async function deleteHoliday(id) {
  return fetchJson(
    `/api/holidays/${encodeURIComponent(id)}`,
    "Failed to delete holiday",
    { method: "DELETE" },
  );
}
