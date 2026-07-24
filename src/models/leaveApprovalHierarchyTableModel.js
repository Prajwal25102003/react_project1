export const LEAVE_HIERARCHY_COLUMNS = [
  {
    id: "name",
    header: "Hierarchy Name",
    accessor: "name",
    sortable: true,
    cellClassName: "w-[20%]",
  },
  {
    id: "categoryLabel",
    header: "Applicable Roles",
    accessor: "categoryLabel",
    sortable: true,
    cellClassName: "w-[20%]",
  },
  {
    id: "stepsSummary",
    header: "Approval Flow",
    accessor: "stepsSummary",
    sortable: false,
    wrap: true,
    cellClassName: "w-[20%]",
  },
  {
    id: "updatedAt",
    header: "Last Updated",
    accessor: "updatedAtLabel",
    sortAccessor: "updatedAt",
    sortable: true,
    nowrap: true,
    cellClassName: "w-[20%]",
  },
  {
    id: "actions",
    header: "Actions",
    type: "actions",
    sortable: false,
    hideable: false,
    nowrap: true,
    cellClassName: "w-[20%]",
  },
];

export const LEAVE_HIERARCHY_SEARCH_KEYS = [
  "name",
  "category",
  "categoryLabel",
  "stepsSummary",
  "updatedAtLabel",
];
