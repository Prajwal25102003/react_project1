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

export const EMPLOYEE_COLUMNS = [
  {
    id: "id",
    header: "Employee ID",
    accessor: "id",
    type: "primary",
    sortable: true,
    nowrap: true,
  },
  {
    id: "name",
    header: "Employee Name",
    accessor: "name",
    type: "avatar",
    sortable: true,
  },
  {
    id: "email",
    header: "Email",
    accessor: "email",
    type: "text",
    sortable: true,
  },
  {
    id: "phone",
    header: "Phone Number",
    accessor: "phone",
    type: "text",
    sortable: true,
    nowrap: true,
  },
  {
    id: "gender",
    header: "Gender",
    accessor: "gender",
    type: "text",
    sortable: true,
  },
  {
    id: "department",
    header: "Department",
    accessor: "department",
    type: "text",
    sortable: true,
  },
  {
    id: "designation",
    header: "Designation",
    accessor: "designation",
    type: "text",
    sortable: true,
  },
  {
    id: "joiningDate",
    header: "Joining Date",
    accessor: "joiningDate",
    type: "text",
    sortable: true,
    nowrap: true,
  },
  {
    id: "status",
    header: "Status",
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
