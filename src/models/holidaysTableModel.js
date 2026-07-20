import { HOLIDAY_TYPES, MONTH_FILTER_OPTIONS } from "./holidaysModel.js";

export const HOLIDAY_SEARCH_KEYS = [
  "name",
  "date",
  "dateLabel",
  "day",
  "type",
  "description",
];

export const HOLIDAY_COLUMN_FILTERS = [
  {
    id: "type",
    label: "Types",
    options: HOLIDAY_TYPES.map((value) => ({ value, label: value })),
  },
  {
    id: "month",
    label: "Months",
    options: MONTH_FILTER_OPTIONS,
  },
];

export function getHolidayColumns(canManage) {
  const columns = [
    {
      id: "name",
      header: "Holiday Name",
      accessor: "name",
      type: "dotName",
      sortable: true,
      mobilePrimary: true,
    },
    {
      id: "date",
      header: "Date",
      accessor: "dateLabel",
      type: "text",
      sortable: true,
      sortAccessor: "date",
      nowrap: true,
      mobilePrimary: true,
    },
    {
      id: "day",
      header: "Day",
      accessor: "day",
      type: "text",
      sortable: true,
      nowrap: true,
    },
    {
      id: "type",
      header: "Type",
      accessor: "type",
      type: "status",
      sortable: true,
      mobilePrimary: true,
    },
    {
      id: "description",
      header: "Description",
      accessor: "description",
      type: "text",
      sortable: true,
      wrap: true,
    },
  ];

  if (canManage) {
    columns.push({
      id: "actions",
      header: "Actions",
      type: "actions",
      sortable: false,
      hideable: false,
      nowrap: true,
    });
  }

  return columns;
}
