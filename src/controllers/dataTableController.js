import { useEffect, useState } from "react";
import {
  DEFAULT_PAGE_SIZE,
  defaultVisibleColumnIds,
  downloadCsv,
  getVisibleColumns,
  nextSortState,
  processTableRows,
  rowsToCsv,
} from "../models/dataTableModel.js";

export function useDataTable(rows, options = {}) {
  const {
    columns = [],
    searchKeys = [],
    pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
    initialVisibleColumnIds,
    initialColumnFilters = {},
  } = options;

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ id: null, direction: null });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [columnFilters, setColumnFilters] = useState(() => ({
    ...initialColumnFilters,
  }));
  const [visibleColumnIds, setVisibleColumnIds] = useState(
    () => initialVisibleColumnIds || defaultVisibleColumnIds(columns),
  );
  const [columnsOpen, setColumnsOpen] = useState(false);

  const table = processTableRows(rows, {
    search,
    searchKeys,
    columnFilters,
    sort,
    page,
    pageSize,
  });

  useEffect(() => {
    setPage(1);
  }, [search, sort.id, sort.direction, pageSize, columnFilters]);

  useEffect(() => {
    if (page !== table.page) setPage(table.page);
  }, [page, table.page]);

  function toggleSort(columnId) {
    setSort((current) => nextSortState(current, columnId));
  }

  function onSearchChange(value) {
    setSearch(value);
  }

  function setColumnFilter(id, value) {
    setColumnFilters((current) => {
      const next = { ...current };
      if (!value) delete next[id];
      else next[id] = value;
      return next;
    });
  }

  function clearColumnFilters() {
    setColumnFilters({});
  }

  function goToPage(nextPage) {
    setPage(nextPage);
  }

  function onPageSizeChange(size) {
    setPageSize(Number(size) || DEFAULT_PAGE_SIZE);
  }

  function toggleColumnVisibility(columnId) {
    const column = columns.find((item) => item.id === columnId);
    if (!column || column.hideable === false || column.id === "actions") return;

    setVisibleColumnIds((current) =>
      current.includes(columnId)
        ? current.filter((id) => id !== columnId)
        : [...current, columnId],
    );
  }

  function exportCsv(filename) {
    const visibleColumns = getVisibleColumns(columns, visibleColumnIds);
    const filtered = processTableRows(rows, {
      search,
      searchKeys,
      columnFilters,
      sort,
      page: 1,
      pageSize: Math.max(rows.length, 1),
    });
    downloadCsv(filename, rowsToCsv(visibleColumns, filtered.rows));
  }

  return {
    search,
    onSearchChange,
    sort,
    toggleSort,
    page: table.page,
    pageSize: table.pageSize,
    totalPages: table.totalPages,
    total: table.total,
    startIndex: table.startIndex,
    endIndex: table.endIndex,
    rows: table.rows,
    goToPage,
    onPageSizeChange,
    columnFilters,
    setColumnFilter,
    clearColumnFilters,
    visibleColumns: getVisibleColumns(columns, visibleColumnIds),
    visibleColumnIds,
    toggleColumnVisibility,
    columnsOpen,
    setColumnsOpen,
    exportCsv,
  };
}
