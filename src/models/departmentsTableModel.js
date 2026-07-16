export const DEPARTMENT_SEARCH_KEYS = [
  "id",
  "name",
  "head",
  "employeeCount",
  "description",
];

export const DEPARTMENT_COLUMN_FILTERS = [];

export const DEPARTMENT_COLUMNS = [
  {
    id: "id",
    header: "Department ID",
    accessor: "id",
    type: "primary",
    sortable: true,
    nowrap: true,
  },
  {
    id: "name",
    header: "Department Name",
    accessor: "name",
    type: "primary",
    sortable: true,
  },
  {
    id: "head",
    header: "Department Head",
    accessor: "head",
    type: "text",
    sortable: true,
    emptyValue: "—",
  },
  {
    id: "employeeCount",
    header: "Number of Employees",
    accessor: "employeeCount",
    type: "text",
    sortable: true,
  },
  {
    id: "description",
    header: "Department Description",
    accessor: "description",
    type: "text",
    sortable: true,
    cellClassName: "min-w-[280px]",
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
