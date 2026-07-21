export const DEFAULT_PAGE_SIZE = 5;
export const PAGE_SIZE_OPTIONS = [5, 10, 25];

export function getCellValue(row, accessor) {
  if (!accessor) return "";
  const value = row?.[accessor];
  return value == null ? "" : value;
}

export function filterBySearch(rows, search, searchKeys) {
  const query = String(search || "")
    .trim()
    .toLowerCase();
  if (!query) return rows;

  const keys =
    searchKeys?.length > 0
      ? searchKeys
      : Object.keys(rows[0] || {}).filter(
          (key) => typeof rows[0][key] !== "object",
        );

  return rows.filter((row) =>
    keys.some((key) =>
      String(getCellValue(row, key))
        .toLowerCase()
        .includes(query),
    ),
  );
}

export function filterByColumns(rows, columnFilters = {}) {
  const entries = Object.entries(columnFilters).filter(
    ([, value]) => value != null && value !== "",
  );
  if (!entries.length) return rows;

  return rows.filter((row) =>
    entries.every(([key, value]) => {
      const filter = String(value);
      // Leave ranges: match when the period overlaps [startDate, endDate].
      if (
        key === "startDate" &&
        row?.endDate != null &&
        row.endDate !== "" &&
        (/^\d{4}$/.test(filter) ||
          /^\d{4}-\d{2}$/.test(filter) ||
          /^\d{4}-\d{2}-\d{2}$/.test(filter))
      ) {
        return dateRangeOverlapsPeriod(
          getCellValue(row, "startDate"),
          getCellValue(row, "endDate"),
          filter,
        );
      }
      const cell = String(getCellValue(row, key));
      // YYYY or YYYY-MM period filters match date prefixes.
      if (/^\d{4}$/.test(filter) || /^\d{4}-\d{2}$/.test(filter)) {
        return cell.startsWith(filter);
      }
      return cell === filter;
    }),
  );
}

/** True when [start, end] overlaps a day (YYYY-MM-DD), month (YYYY-MM), or year (YYYY). */
export function dateRangeOverlapsPeriod(start, end, period) {
  const startStr = String(start || "");
  const endStr = String(end || startStr);
  if (!startStr) return false;

  if (/^\d{4}$/.test(period)) {
    return startStr.slice(0, 4) <= period && endStr.slice(0, 4) >= period;
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    return startStr.slice(0, 7) <= period && endStr.slice(0, 7) >= period;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return startStr <= period && endStr >= period;
  }
  return false;
}

function compareValues(a, b) {
  const emptyA = a == null || a === "";
  const emptyB = b == null || b === "";
  if (emptyA && emptyB) return 0;
  if (emptyA) return 1;
  if (emptyB) return -1;

  const numA = Number(a);
  const numB = Number(b);
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && String(a).trim() !== "") {
    return numA - numB;
  }

  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortRows(rows, sort) {
  if (!sort?.id || !sort?.direction) return rows;
  const direction = sort.direction === "desc" ? -1 : 1;

  return [...rows].sort((left, right) => {
    return (
      compareValues(getCellValue(left, sort.id), getCellValue(right, sort.id)) *
      direction
    );
  });
}

export function paginateRows(rows, page, pageSize) {
  const size = Math.max(1, pageSize || DEFAULT_PAGE_SIZE);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / size) || 1);
  const safePage = Math.min(Math.max(1, page || 1), totalPages);
  const start = (safePage - 1) * size;

  return {
    rows: rows.slice(start, start + size),
    page: safePage,
    pageSize: size,
    total,
    totalPages,
    startIndex: total === 0 ? 0 : start + 1,
    endIndex: Math.min(start + size, total),
  };
}

export function nextSortState(current, columnId) {
  if (!columnId) return { id: null, direction: null };
  if (current?.id !== columnId) return { id: columnId, direction: "asc" };
  if (current.direction === "asc") return { id: columnId, direction: "desc" };
  return { id: null, direction: null };
}

export function processTableRows(
  rows,
  { search, searchKeys, columnFilters, sort, page, pageSize },
) {
  const searched = filterBySearch(rows, search, searchKeys);
  const filtered = filterByColumns(searched, columnFilters);
  const sorted = sortRows(filtered, sort);
  return paginateRows(sorted, page, pageSize);
}

export function defaultVisibleColumnIds(columns) {
  return columns.map((column) => column.id);
}

export function getVisibleColumns(columns, visibleIds) {
  if (!visibleIds?.length) return columns;
  const set = new Set(visibleIds);
  return columns.filter(
    (column) => column.id === "actions" || set.has(column.id),
  );
}

export function rowsToCsv(columns, rows) {
  const exportColumns = columns.filter(
    (column) => column.type !== "actions" && column.accessor,
  );

  const escape = (value) => {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  const header = exportColumns.map((column) => escape(column.header)).join(",");
  const body = rows
    .map((row) =>
      exportColumns
        .map((column) => escape(getCellValue(row, column.accessor)))
        .join(","),
    )
    .join("\n");

  return `${header}\n${body}`;
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
