import { DATE_PERIOD_FILTER_OPTIONS } from "./datePickerModel.js";
import { LEAVE_TYPES } from "./leaveRequestsModel.js";

export const LEAVE_REQUEST_SEARCH_KEYS = [
  "employeeId",
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
    id: "startDate",
    label: "Start date",
    type: "period",
    periodOptions: DATE_PERIOD_FILTER_OPTIONS,
    defaultPeriod: "date",
  },
  {
    id: "status",
    label: "Status",
    options: [
      "Pending",
      "TeamLeadApproved",
      "Approved",
      "Rejected",
      "Cancelled",
    ].map((value) => ({
      value,
      label:
        value === "TeamLeadApproved"
          ? "Awaiting HR"
          : value,
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
    id: "employeeId",
    header: "Employee ID",
    accessor: "employeeId",
    type: "primary",
    sortable: true,
    nowrap: true,
    hideable: false,
    cellClassName: "w-[10%]",
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
    accessor: "leaveDaysLabel",
    type: "leaveDays",
    sortable: true,
    nowrap: true,
    cellClassName: "w-[12%] min-w-[7.5rem]",
  },
  {
    id: "status",
    header: "Status",
    accessor: "status",
    type: "status",
    sortable: true,
    cellClassName: "w-[12%]",
    mobilePrimary: true,
  },
  {
    id: "actions",
    header: "Actions",
    type: "actions",
    sortable: false,
    hideable: false,
    nowrap: true,
    cellClassName: "w-[16%]",
  },
];

/** Personal leave list — hide name; Employee ID stays as the identifier. */
export function getLeaveRequestDefaultVisibleIds(isPersonalList) {
  return LEAVE_REQUEST_COLUMNS.filter((column) => {
    if (isPersonalList && column.id === "employeeName") return false;
    return true;
  }).map((column) => column.id);
}