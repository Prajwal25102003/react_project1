import { LEAVE_TYPES } from "./leaveRequestsModel.js";

export const LEAVE_REQUEST_SEARCH_KEYS = [
  "id",
  "employeeName",
  "leaveType",
  "startDate",
  "endDate",
  "leaveDays",
  "reason",
  "status",
];

export const LEAVE_REQUEST_COLUMN_FILTERS = [
  {
    id: "status",
    label: "Status",
    options: ["Pending", "Approved", "Rejected", "Cancelled"].map((value) => ({
      value,
      label: value,
    })),
  },
  {
    id: "leaveType",
    label: "Leave Type",
    options: LEAVE_TYPES.map((value) => ({ value, label: value })),
  },
];

/** Compact columns so the leave table fits without horizontal scroll on desktop. */
export const LEAVE_REQUEST_COLUMNS = [
  {
    id: "id",
    header: "ID",
    accessor: "id",
    type: "primary",
    sortable: true,
    nowrap: true,
    cellClassName: "w-[8%]",
    mobilePrimary: true,
  },
  {
    id: "employeeName",
    header: "Employee",
    accessor: "employeeName",
    type: "primary",
    sortable: true,
    cellClassName: "w-[12%]",
  },
  {
    id: "leaveType",
    header: "Type",
    accessor: "leaveType",
    type: "text",
    sortable: true,
    cellClassName: "w-[11%]",
    mobilePrimary: true,
  },
  {
    id: "startDate",
    header: "Start",
    accessor: "startDate",
    type: "text",
    sortable: true,
    nowrap: true,
    cellClassName: "w-[9%]",
  },
  {
    id: "endDate",
    header: "End",
    accessor: "endDate",
    type: "text",
    sortable: true,
    nowrap: true,
    cellClassName: "w-[9%]",
  },
  {
    id: "leaveDays",
    header: "Days",
    accessor: "leaveDays",
    type: "text",
    sortable: true,
    nowrap: true,
    cellClassName: "w-[6%]",
  },
  {
    id: "reason",
    header: "Reason",
    accessor: "reason",
    type: "text",
    sortable: true,
    wrap: true,
    cellClassName: "w-[22%]",
  },
  {
    id: "status",
    header: "Status",
    accessor: "status",
    type: "status",
    sortable: true,
    cellClassName: "w-[10%]",
    mobilePrimary: true,
  },
  {
    id: "actions",
    header: "Actions",
    type: "actions",
    sortable: false,
    hideable: false,
    nowrap: true,
    cellClassName: "w-[13%]",
  },
];

/** Employees only see their own requests — hide the Employee column by default. */
export function getLeaveRequestDefaultVisibleIds(isEmployee) {
  return LEAVE_REQUEST_COLUMNS.filter(
    (column) => !(isEmployee && column.id === "employeeName"),
  ).map((column) => column.id);
}