import { ATTENDANCE_STATUSES } from "./attendanceModel.js";

export const ATTENDANCE_SEARCH_KEYS = [
  "id",
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
    id: "status",
    label: "Status",
    options: ATTENDANCE_STATUSES.map((value) => ({ value, label: value })),
  },
];

export const ATTENDANCE_COLUMNS = [
  {
    id: "id",
    header: "Attendance ID",
    accessor: "id",
    type: "primary",
    sortable: true,
    nowrap: true,
  },
  {
    id: "employeeId",
    header: "Employee ID",
    accessor: "employeeId",
    type: "text",
    sortable: true,
    nowrap: true,
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
