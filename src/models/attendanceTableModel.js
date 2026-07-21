import { ATTENDANCE_STATUSES } from "./attendanceModel.js";
import { DATE_PERIOD_FILTER_OPTIONS } from "./datePickerModel.js";

export const ATTENDANCE_SEARCH_KEYS = [
  "employeeId",
  "employeeName",
  "date",
  "checkIn",
  "checkOut",
  "workingHours",
  "status",
];

export const ATTENDANCE_COLUMN_FILTERS = [
  {
    id: "date",
    label: "Date",
    type: "period",
    periodOptions: DATE_PERIOD_FILTER_OPTIONS,
    defaultPeriod: "date",
  },
  {
    id: "status",
    label: "Status",
    options: ATTENDANCE_STATUSES.map((value) => ({ value, label: value })),
  },
];

export const ATTENDANCE_COLUMNS = [
  {
    id: "employeeId",
    header: "Employee ID",
    accessor: "employeeId",
    type: "primary",
    sortable: true,
    nowrap: true,
    hideable: false,
  },
  {
    id: "employeeName",
    header: "Employee Name",
    accessor: "employeeName",
    type: "primary",
    sortable: true,
  },
  {
    id: "date",
    header: "Date",
    accessor: "date",
    type: "text",
    sortable: true,
    nowrap: true,
  },
  {
    id: "checkIn",
    header: "Check-In Time",
    accessor: "checkIn",
    type: "text",
    sortable: true,
    nowrap: true,
  },
  {
    id: "checkOut",
    header: "Check-Out Time",
    accessor: "checkOut",
    type: "text",
    sortable: true,
    nowrap: true,
  },
  {
    id: "workingHours",
    header: "Working Hours",
    accessor: "workingHoursLabel",
    type: "text",
    sortable: true,
    nowrap: true,
  },
  {
    id: "status",
    header: "Attendance Status",
    accessor: "status",
    type: "status",
    sortable: true,
  },
  {
    id: "actions",
    header: "Actions",
    type: "actions",
    sortable: false,
    hideable: false,
    nowrap: true,
  },
];

/** Personal attendance — hide name; Employee ID is the identifier. */
export function getAttendanceDefaultVisibleIds(isPersonalList) {
  return ATTENDANCE_COLUMNS.filter((column) => {
    if (isPersonalList && column.id === "employeeName") return false;
    if (isPersonalList && column.id === "actions") return false;
    return true;
  }).map((column) => column.id);
}
