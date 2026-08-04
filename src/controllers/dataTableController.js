import { useEffect, useState } from "react";
import {
  DEFAULT_PAGE_SIZE,
  defaultVisibleColumnIds,
  downloadCsv,
  getVisibleColumns,
  nextSortState,
  pageForRowId,
  processTableRows,
  rowsToCsv,
} from "../models/dataTableModel.js";

/** Stable default — a fresh `{}` each render would retrigger the sync effect forever. */
const EMPTY_COLUMN_FILTERS = Object.freeze({});

function sameColumnFilters(left, right) {
  const leftKeys = Object.keys(left || {});
  const rightKeys = Object.keys(right || {});
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => left[key] === right[key]);
}

export function useDataTable(rows, options = {}) {
  const {
    columns = [],
    searchKeys = [],
    pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
    initialVisibleColumnIds,
    initialColumnFilters = EMPTY_COLUMN_FILTERS,
    /** When set, keep this row's page in view (e.g. notification deep-link). */
    focusRowId = null,
    /**
     * Server-driven mode: `rows` is already one page.
     * Pass total row count from the API; client search/filter/sort/page still
     * update local state so the parent can refetch.
     */
    serverTotal = null,
  } = options;

  const serverMode =
    serverTotal != null && Number.isFinite(Number(serverTotal));

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

  useEffect(() => {
    setColumnFilters((current) => {
      if (sameColumnFilters(current, initialColumnFilters)) return current;
      return { ...initialColumnFilters };
    });
  }, [initialColumnFilters]);

  const table = serverMode
    ? (() => {
        const total = Math.max(0, Number(serverTotal) || 0);
        const size = Math.max(1, pageSize);
        const totalPages = Math.max(1, Math.ceil(total / size) || 1);
        const safePage = Math.min(Math.max(1, page), totalPages);
        const startIndex = total === 0 ? 0 : (safePage - 1) * size + 1;
        const endIndex = total === 0 ? 0 : Math.min(safePage * size, total);
        return {
          rows,
          page: safePage,
          pageSize: size,
          totalPages,
          total,
          startIndex,
          endIndex,
        };
      })()
    : processTableRows(rows, {
        search,
        searchKeys,
        columnFilters,
        sort,
        page,
        pageSize,
      });

  useEffect(() => {
    if (focusRowId) return;
    setPage(1);
  }, [search, sort.id, sort.direction, pageSize, columnFilters, focusRowId]);

  useEffect(() => {
    if (serverMode || !focusRowId) return;
    const targetPage = pageForRowId(rows, focusRowId, {
      search,
      searchKeys,
      columnFilters,
      sort,
      pageSize,
    });
    if (targetPage > 0) setPage(targetPage);
  }, [
    columnFilters,
    focusRowId,
    pageSize,
    rows,
    search,
    searchKeys,
    serverMode,
    sort,
  ]);

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

  function exportCsv(filename, exportRows = null) {
    const visibleColumns = getVisibleColumns(columns, visibleColumnIds);
    const sourceRows = Array.isArray(exportRows) ? exportRows : rows;
    const filtered = serverMode
      ? { rows: sourceRows }
      : processTableRows(sourceRows, {
          search,
          searchKeys,
          columnFilters,
          sort,
          page: 1,
          pageSize: Math.max(sourceRows.length, 1),
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
