import { Link } from "react-router-dom";
import {
  getCellValue,
  PAGE_SIZE_OPTIONS,
} from "../../models/dataTableModel.js";
import { INPUT_CLASS } from "../../models/formLayoutModel.js";
import SelectField from "./forms/SelectField.jsx";
import StatusPill from "./StatusPill.jsx";
import UserAvatar from "./UserAvatar.jsx";

const TOOLBAR_BTN =
  "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

function TableCell({ column, row, getActions, clamp = false }) {
  const value = getCellValue(row, column.accessor);
  const display =
    value === "" || value == null ? (column.emptyValue ?? "") : value;

  if (column.type === "avatar") {
    const avatarName = String(display || row.name || "");
    return (
      <div className="flex items-center gap-3">
        <UserAvatar src={row.avatar} name={avatarName} size="sm" />
        <span className="text-theme-sm font-medium text-gray-800">
          {display}
        </span>
      </div>
    );
  }

  if (column.type === "dotName") {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${row.typeDotClass || "bg-gray-400"}`}
          aria-hidden="true"
        />
        <span className="truncate text-theme-sm font-medium text-gray-800">
          {display}
        </span>
      </div>
    );
  }

  if (column.type === "status") {
    return (
      <StatusPill
        label={row.statusLabel || row.status}
        statusClass={row.statusClass}
      />
    );
  }

  if (column.type === "actions") {
    const actions = getActions?.(row) || [];
    if (!actions.length) {
      return <p className="text-theme-sm text-gray-400">—</p>;
    }

    return (
      <div className="flex flex-wrap items-center gap-3">
        {actions.map((action) => {
          const className =
            action.tone === "danger"
              ? "text-theme-sm font-medium text-error-600 hover:text-error-700"
              : "text-theme-sm font-medium text-brand-500 hover:text-brand-600";

          if (action.to) {
            return (
              <Link key={action.label} to={action.to} className={className}>
                {action.label}
              </Link>
            );
          }

          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={className}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    );
  }

  const textClass =
    column.type === "primary"
      ? "text-theme-sm font-medium text-gray-800"
      : "text-theme-sm text-gray-500";
  const wrapClass = column.wrap
    ? clamp
      ? "line-clamp-2 break-words"
      : "whitespace-normal break-words"
    : "";

  return (
    <p className={[textClass, wrapClass].filter(Boolean).join(" ")}>
      {display}
    </p>
  );
}

function MobileCard({ columns, row, getActions, onRowClick }) {
  const statusColumn = columns.find((column) => column.type === "status");
  const actionColumn = columns.find((column) => column.type === "actions");
  const detailColumns = columns.filter(
    (column) => column.type !== "status" && column.type !== "actions",
  );
  const primaryColumns = detailColumns.filter((column) => column.mobilePrimary);
  const secondaryColumns = detailColumns.filter(
    (column) => !column.mobilePrimary,
  );
  const titleColumn = primaryColumns[0] || detailColumns[0];
  const subtitleColumns = primaryColumns.slice(1);

  return (
    <article
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs ${
        onRowClick ? "cursor-pointer hover:border-gray-300" : ""
      }`}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      onKeyDown={
        onRowClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onRowClick(row);
              }
            }
          : undefined
      }
      role={onRowClick ? "button" : undefined}
      tabIndex={onRowClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {titleColumn ? (
            <p className="text-theme-sm font-semibold text-gray-800">
              {getCellValue(row, titleColumn.accessor)}
            </p>
          ) : null}
          {subtitleColumns.length > 0 ? (
            <p className="mt-0.5 text-theme-xs text-gray-500">
              {subtitleColumns
                .map((column) => getCellValue(row, column.accessor))
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>
        {statusColumn ? (
          <StatusPill
            label={row.statusLabel || row.status}
            statusClass={row.statusClass}
          />
        ) : null}
      </div>

      <dl className="mt-3 space-y-2">
        {secondaryColumns.map((column) => {
          const value = getCellValue(row, column.accessor);
          if (value === "" || value == null) return null;

          return (
            <div key={column.id} className="flex gap-3">
              <dt className="w-20 shrink-0 text-theme-xs font-medium text-gray-500">
                {column.header}
              </dt>
              <dd
                className={
                  column.wrap
                    ? "min-w-0 flex-1 text-theme-sm text-gray-700 break-words"
                    : "min-w-0 flex-1 text-theme-sm text-gray-700"
                }
              >
                {value}
              </dd>
            </div>
          );
        })}
      </dl>

      {actionColumn ? (
        <div
          className="mt-3 border-t border-gray-100 pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          <TableCell column={actionColumn} row={row} getActions={getActions} />
        </div>
      ) : null}
    </article>
  );
}

function DataTable({
  columns,
  allColumns,
  rows,
  rowKey = "id",
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  sort,
  onSortChange,
  page,
  pageSize,
  totalPages,
  total,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  columnFilters = {},
  filterDefs = [],
  onColumnFilterChange,
  onClearFilters,
  visibleColumnIds,
  onToggleColumn,
  columnsOpen,
  onColumnsOpenChange,
  onExportCsv,
  getActions,
  onRowClick,
  emptyMessage = "No records found.",
  /** Fit all columns in the viewport on large screens (no horizontal scroll). */
  fitWidth = false,
  /** Use stacked cards below the md breakpoint instead of a crushed table. */
  mobileCards = true,
  /** Hide search / filters / columns / rows toolbar row. */
  hideToolbar = false,
  /** Tighter cell padding for dense layouts. */
  dense = false,
}) {
  const hasActiveFilters = Object.values(columnFilters).some(Boolean);
  const cellPad = dense
    ? "px-3 py-1.5 sm:px-3"
    : fitWidth
      ? "px-3 py-3 sm:px-4"
      : "px-5 py-3 sm:px-6";
  const bodyPad = dense
    ? "px-3 py-1.5 sm:px-3"
    : fitWidth
      ? "px-3 py-3 sm:px-4"
      : "px-5 py-4 sm:px-6";
  const showMobileCards = mobileCards;
  const showToolbar =
    !hideToolbar &&
    Boolean(
      onSearchChange ||
        filterDefs.length > 0 ||
        onExportCsv ||
        (onToggleColumn && allColumns) ||
        onPageSizeChange,
    );

  return (
    <div
      className={`min-w-0 max-w-full overflow-x-hidden ${showToolbar ? "space-y-4" : "space-y-3"}`}
    >
      {showToolbar ? (
      <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 w-full flex-col gap-3 max-sm:flex-col sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
          {onSearchChange ? (
            <div className="min-w-0 w-full sm:max-w-xs">
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className={INPUT_CLASS}
                aria-label={searchPlaceholder}
              />
            </div>
          ) : null}

          {filterDefs.map((filter) => (
            <div
              key={filter.id}
              className={`min-w-0 w-full max-sm:w-full ${
                filter.type === "date" || filter.type === "month"
                  ? "sm:w-44"
                  : "sm:w-40"
              }`}
            >
              {filter.type === "date" || filter.type === "month" ? (
                <input
                  type={filter.type}
                  value={columnFilters[filter.id] || ""}
                  onChange={(event) =>
                    onColumnFilterChange?.(filter.id, event.target.value)
                  }
                  className={INPUT_CLASS}
                  aria-label={filter.label}
                  title={
                    filter.type === "month"
                      ? "Filter by month and year"
                      : "Filter by date (day, month, year)"
                  }
                />
              ) : (
                <SelectField
                  value={columnFilters[filter.id] || ""}
                  onChange={(nextValue) =>
                    onColumnFilterChange?.(filter.id, nextValue)
                  }
                  ariaLabel={filter.label}
                  placeholder={`All ${filter.label}`}
                  options={[
                    { value: "", label: `All ${filter.label}` },
                    ...(filter.options || []).map((option) => ({
                      value: option.value,
                      label: option.label,
                    })),
                  ]}
                />
              )}
            </div>
          ))}

          {hasActiveFilters ? (
            <button type="button" onClick={onClearFilters} className={TOOLBAR_BTN}>
              Clear filters
            </button>
          ) : null}

          {onExportCsv ? (
            <button type="button" onClick={onExportCsv} className={TOOLBAR_BTN}>
              Export CSV
            </button>
          ) : null}

          {onToggleColumn && allColumns ? (
            <div className="relative min-w-0">
              <button
                type="button"
                onClick={() => onColumnsOpenChange?.(!columnsOpen)}
                className={TOOLBAR_BTN}
              >
                Columns
              </button>
              {columnsOpen ? (
                <div className="absolute left-0 z-20 mt-2 w-[min(14rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-3 shadow-theme-lg sm:w-56">
                  <p className="mb-2 text-theme-xs font-medium text-gray-500">
                    Toggle columns
                  </p>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {allColumns
                      .filter((column) => column.id !== "actions")
                      .map((column) => (
                        <label
                          key={column.id}
                          className="flex cursor-pointer items-center gap-2 text-theme-sm text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumnIds?.includes(column.id)}
                            onChange={() => onToggleColumn(column.id)}
                            className="rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                          />
                          {column.header}
                        </label>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {onPageSizeChange ? (
          <div className="flex shrink-0 items-center justify-end gap-2 sm:ml-auto">
            <label
              htmlFor="data-table-page-size"
              className="shrink-0 text-theme-sm text-gray-500"
            >
              Rows
            </label>
            <div className="min-w-0 w-20">
              <SelectField
                value={String(pageSize)}
                onChange={onPageSizeChange}
                ariaLabel="Rows per page"
                options={PAGE_SIZE_OPTIONS.map((size) => ({
                  value: String(size),
                  label: String(size),
                }))}
                className="w-20"
              />
            </div>
          </div>
        ) : null}
      </div>
      ) : null}

      {showMobileCards ? (
        <div className="space-y-3 md:hidden">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center">
              <p className="text-theme-sm text-gray-500">{emptyMessage}</p>
            </div>
          ) : (
            rows.map((row) => (
              <MobileCard
                key={row[rowKey]}
                columns={columns}
                row={row}
                getActions={getActions}
                onRowClick={onRowClick}
              />
            ))
          )}
        </div>
      ) : null}

      <div
        className={
          showMobileCards
            ? "hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block"
            : "overflow-hidden rounded-xl border border-gray-200 bg-white"
        }
      >
        <div
          className={
            fitWidth
              ? "w-full overflow-x-auto lg:overflow-x-visible"
              : "max-w-full overflow-x-auto"
          }
        >
          <table
            className={
              fitWidth
                ? "min-w-[720px] w-full lg:min-w-0 lg:table-fixed"
                : "min-w-full"
            }
          >
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map((column) => {
                  const cellClass = [
                    `${cellPad} text-left align-top`,
                    column.nowrap && !column.wrap ? "whitespace-nowrap" : "",
                    column.cellClassName || "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  if (column.sortable && onSortChange) {
                    return (
                      <th key={column.id} className={cellClass}>
                        <button
                          type="button"
                          onClick={() => onSortChange(column.id)}
                          className="text-theme-xs font-medium text-gray-500 hover:text-gray-800"
                        >
                          {column.header}
                        </button>
                      </th>
                    );
                  }

                  return (
                    <th key={column.id} className={cellClass}>
                      <p className="text-theme-xs font-medium text-gray-500">
                        {column.header}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className={`${bodyPad} py-8 text-center`}
                  >
                    <p className="text-theme-sm text-gray-500">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row[rowKey]}
                    className={
                      onRowClick
                        ? "cursor-pointer hover:bg-gray-50/80"
                        : undefined
                    }
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column) => {
                      const cellClass = [
                        `${bodyPad} align-top`,
                        column.nowrap && !column.wrap
                          ? "whitespace-nowrap"
                          : "",
                        column.cellClassName || "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      const stopRowClick = column.type === "actions";

                      return (
                        <td
                          key={column.id}
                          className={cellClass}
                          onClick={
                            stopRowClick
                              ? (event) => event.stopPropagation()
                              : undefined
                          }
                        >
                          <TableCell
                            column={column}
                            row={row}
                            getActions={getActions}
                            clamp={fitWidth && column.wrap}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {onPageChange ? (
        <div
          className={`flex min-w-0 w-full flex-col gap-2 max-sm:items-stretch sm:flex-row sm:items-center sm:justify-between ${dense ? "pt-1" : ""}`}
        >
          <p className="min-w-0 text-theme-xs text-gray-500 sm:text-theme-sm">
            {total === 0
              ? "0 results"
              : `Showing ${startIndex}–${endIndex} of ${total}`}
          </p>

          <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className={TOOLBAR_BTN}
            >
              Previous
            </button>
            <span className="text-theme-xs text-gray-500 sm:text-theme-sm">
              Page {page} of {Math.max(totalPages, 1)}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className={TOOLBAR_BTN}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DataTable;
