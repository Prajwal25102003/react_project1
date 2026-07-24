import { HOLIDAY_TYPES, MONTH_FILTER_OPTIONS } from "./holidaysModel.js";

export const HOLIDAY_SEARCH_KEYS = [
  "name",
  "date",
  "dateLabel",
  "day",
  "type",
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
      wrap: true,
      cellClassName: canManage ? "w-[34%]" : "w-[40%]",
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
      cellClassName: canManage ? "w-[16%]" : "w-[22%]",
      mobilePrimary: true,
    },
    {
      id: "day",
      header: "Day",
      accessor: "day",
      type: "text",
      sortable: true,
      nowrap: true,
      cellClassName: canManage ? "w-[14%]" : "w-[18%]",
    },
    {
      id: "type",
      header: "Type",
      accessor: "type",
      type: "status",
      sortable: true,
      cellClassName: canManage ? "w-[16%]" : "w-[20%]",
      mobilePrimary: true,
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
      cellClassName: "w-[20%]",
    });
  }

  return columns;
}
