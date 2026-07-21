import { EMPLOYEE_GENDERS, EMPLOYEE_STATUSES } from "./employeesModel.js";

export const EMPLOYEE_SEARCH_KEYS = [
  "id",
  "name",
  "email",
  "phone",
  "gender",
  "department",
  "designation",
  "joiningDate",
  "pendingLeaveCount",
  "casualLeaveBalance",
  "sickLeaveBalance",
  "lopDays",
  "status",
];

export const EMPLOYEE_COLUMN_FILTERS = [
  {
    id: "status",
    label: "Status",
    options: EMPLOYEE_STATUSES.map((value) => ({ value, label: value })),
  },
  {
    id: "gender",
    label: "Gender",
    options: EMPLOYEE_GENDERS.map((value) => ({ value, label: value })),
  },
];

/** Compact list columns — full details open in EmployeeViewModal. */
export const EMPLOYEE_COLUMNS = [
  {
    id: "id",
    header: "Employee ID",
    accessor: "id",
    type: "primary",
    sortable: true,
    nowrap: true,
    hideable: false,
    mobilePrimary: true,
  },
  {
    id: "name",
    header: "Employee Name",
    accessor: "name",
    type: "avatar",
    sortable: true,
    mobilePrimary: true,
  },
  {
    id: "department",
    header: "Department",
    accessor: "department",
    type: "text",
    sortable: true,
  },
  {
    id: "status",
    header: "Status",
    accessor: "status",
    type: "status",
    sortable: true,
    mobilePrimary: true,
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
