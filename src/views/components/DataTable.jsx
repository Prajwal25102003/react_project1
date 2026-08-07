import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getCellValue,
  PAGE_SIZE_OPTIONS,
} from "../../models/dataTableModel.js";
import {
  periodFilterPlaceholder,
  periodFilterTitle,
} from "../../models/datePickerModel.js";
import { INPUT_CLASS } from "../../models/formLayoutModel.js";
import { formatNavBadgeCount } from "../../models/navBadgesModel.js";
import { ActionIcon } from "../icons/ActionIcons.jsx";
import DateField from "./forms/DateField.jsx";
import HoverTooltip from "./HoverTooltip.jsx";
import SelectField from "./forms/SelectField.jsx";
import StatusPill from "./StatusPill.jsx";
import UserAvatar from "./UserAvatar.jsx";

const TOOLBAR_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

const TOOLBAR_BTN_ACTIVE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-500 bg-brand-50 px-3 py-2 text-theme-sm font-medium text-brand-500 shadow-theme-xs hover:bg-brand-50";

/** Keep outer table edge gap equal to the gap between columns. */
function cellPadClass({ dense, fitWidth, vertical, columnIndex, columnCount }) {
  if (dense) {
    return vertical === "head" ? "px-2.5 py-1 sm:px-3" : "px-2.5 py-1 sm:px-3";
  }

  if (!fitWidth) {
    return vertical === "head"
      ? "px-5 py-3 sm:px-6"
      : "px-5 py-4 sm:px-6";
  }

  const y = vertical === "head" ? "py-3" : "py-4";
  if (columnCount <= 1) {
    return `${y} px-4 sm:px-5`;
  }

  const isFirst = columnIndex === 0;
  const isLast = columnIndex === columnCount - 1;
  // Outer pad = mid pad × 2 so edge gap matches between-column gap.
  if (isFirst) return `${y} pl-4 pr-2 sm:pl-5 sm:pr-2.5`;
  if (isLast) return `${y} pl-2 pr-4 sm:pl-2.5 sm:pr-5`;
  return `${y} px-2 sm:px-2.5`;
}

function initialPeriodModes(filterDefs) {
  const modes = {};
  for (const filter of filterDefs) {
    if (filter.type !== "period") continue;
    modes[filter.id] = filter.defaultPeriod || filter.periodOptions?.[0]?.value || "date";
  }
  return modes;
}

function PeriodColumnFilter({
  filter,
  period,
  value,
  onPeriodChange,
  onValueChange,
}) {
  return (
    <>
      <div className="min-w-0 w-full sm:w-36">
        <SelectField
          value={period}
          onChange={onPeriodChange}
          ariaLabel={`${filter.label} period`}
          options={(filter.periodOptions || []).map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </div>
      <div className="min-w-0 w-full sm:w-48">
        <DateField
          type={period}
          value={value}
          onChange={onValueChange}
          ariaLabel={filter.label}
          placeholder={periodFilterPlaceholder(period)}
          title={periodFilterTitle(period)}
        />
      </div>
    </>
  );
}

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
    const nameClass = column.wrap
      ? "min-w-0 whitespace-normal break-words text-theme-sm font-medium leading-snug text-gray-800"
      : "min-w-0 truncate text-theme-sm font-medium text-gray-800";

    return (
      <div className="flex min-w-0 items-start gap-2">
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${row.typeDotClass || "bg-gray-400"}`}
          aria-hidden="true"
        />
        <span className={nameClass} title={String(display || "")}>
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

  if (column.type === "leaveDays") {
    const days = Number(row.leaveDays);
    const isHalf = !Number.isNaN(days) && days === 0.5;
    const session =
      row.halfDaySession === "first_half"
        ? "Morning"
        : row.halfDaySession === "second_half"
          ? "Afternoon"
          : "";

    if (isHalf && session) {
      return (
        <div className="inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap">
          <span className="text-theme-sm font-medium text-gray-800">0.5</span>
          <span className="inline-flex shrink-0 rounded-full bg-blue-light-50 px-2 py-0.5 text-theme-xs font-medium text-blue-light-700">
            {session}
          </span>
        </div>
      );
    }

    return (
      <span className="text-theme-sm text-gray-500">
        {display || (Number.isNaN(days) ? "—" : String(days))}
      </span>
    );
  }

  if (column.type === "actions") {
    const actions = getActions?.(row) || [];
    if (!actions.length) {
      return <p className="text-left text-theme-sm text-gray-400">—</p>;
    }

    return (
      <div className="flex flex-nowrap items-center justify-start gap-2.5">
        {actions.map((action) => {
          const iconNode =
            typeof action.icon === "string" ? (
              <ActionIcon name={action.icon} size={action.iconSize} />
            ) : (
              action.icon
            );
          const isIcon = Boolean(iconNode);
          const className = isIcon
            ? "inline-flex items-center justify-center rounded-md p-0.5 transition hover:opacity-80 hover:scale-105"
            : action.tone === "danger"
              ? "text-theme-sm font-medium text-error-600 hover:text-error-700"
              : "text-theme-sm font-medium text-brand-500 hover:text-brand-600";

          const content = isIcon ? (
            <>
              <span className="sr-only">{action.label}</span>
              {iconNode}
            </>
          ) : (
            action.label
          );

          if (action.to) {
            const link = (
              <Link
                to={action.to}
                className={className}
                onClick={(event) => {
                  event.stopPropagation();
                  action.onClick?.(event);
                }}
              >
                {content}
              </Link>
            );
            return isIcon ? (
              <HoverTooltip
                key={action.label}
                content={action.label}
                onlyWhenTruncated={false}
                compact
                className="inline-flex"
              >
                {link}
              </HoverTooltip>
            ) : (
              <span key={action.label}>{link}</span>
            );
          }

          const button = (
            <button
              type="button"
              onClick={action.onClick}
              className={className}
              aria-label={action.label}
            >
              {content}
            </button>
          );

          return isIcon ? (
            <HoverTooltip
              key={action.label}
              content={action.label}
              onlyWhenTruncated={false}
              compact
              className="inline-flex"
            >
              {button}
            </HoverTooltip>
          ) : (
            <span key={action.label}>{button}</span>
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

function MobileCard({ columns, row, getActions, onRowClick, rowClassName = "" }) {
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
      className={[
        "rounded-xl border border-gray-200 p-4 shadow-theme-xs",
        onRowClick ? "cursor-pointer hover:border-gray-300" : "",
        rowClassName || "bg-white",
      ]
        .filter(Boolean)
        .join(" ")}
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
  /** Extra controls rendered just left of Rows (e.g. Import). */
  toolbarStart = null,
  getActions,
  onRowClick,
  getRowClassName,
  emptyMessage = "No records found.",
  /** Fit all columns in the viewport on large screens (no horizontal scroll). */
  fitWidth = false,
  /** Use stacked cards below the md breakpoint instead of a crushed table. */
  mobileCards = true,
  /** Hide search / filters / columns / rows toolbar row. */
  hideToolbar = false,
  /** Tighter cell padding for dense layouts. */
  dense = false,
  /** Stretch to fill parent height with pagination pinned to the bottom. */
  fillHeight = false,
}) {
  const [periodModes, setPeriodModes] = useState(() =>
    initialPeriodModes(filterDefs),
  );
  const hasActiveFilters = Object.values(columnFilters).some(Boolean);
  const columnCount = columns.length;
  const showMobileCards = mobileCards;
  const showToolbar =
    !hideToolbar &&
    Boolean(
      onSearchChange ||
        filterDefs.length > 0 ||
        onExportCsv ||
        (onToggleColumn && allColumns) ||
        onPageSizeChange ||
        toolbarStart,
    );
  // Full pages space rows evenly between header and pagination (first row
  // stays flush under the header). Partial pages pack from the top.
  const stretchRows =
    fillHeight && pageSize > 0 && rows.length >= pageSize;
  const rowAlign = "align-middle";
  const tableFixedClass = fitWidth
    ? "min-w-[720px] w-full lg:min-w-0 lg:table-fixed"
    : "min-w-full";
  const stretchTableStyle = stretchRows
    ? { display: "flex", flexDirection: "column", height: "100%" }
    : undefined;
  const stretchHeadStyle = stretchRows
    ? { display: "table", width: "100%", tableLayout: "fixed" }
    : undefined;
  const stretchBodyStyle = stretchRows
    ? {
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        justifyContent: "space-between",
        minHeight: 0,
      }
    : undefined;
  const stretchRowStyle = stretchRows
    ? { display: "table", width: "100%", tableLayout: "fixed" }
    : undefined;

  function handleClearFilters() {
    setPeriodModes(initialPeriodModes(filterDefs));
    onClearFilters?.();
  }

  function handlePeriodModeChange(filterId, nextPeriod) {
    setPeriodModes((current) => ({ ...current, [filterId]: nextPeriod }));
    onColumnFilterChange?.(filterId, "");
  }

  return (
    <div
      className={[
        "min-w-0 max-w-full overflow-x-hidden",
        fillHeight ? "flex h-full min-h-0 flex-col" : "",
        showToolbar ? "space-y-4" : fillHeight ? "gap-1.5" : "space-y-3",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showToolbar ? (
      <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 w-full flex-1 flex-col gap-3">
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

          <div className="grid min-w-0 w-full grid-cols-2 gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
            {filterDefs.map((filter) => {
              if (filter.type === "period") {
                const period =
                  periodModes[filter.id] ||
                  filter.defaultPeriod ||
                  filter.periodOptions?.[0]?.value ||
                  "date";
                return (
                  <PeriodColumnFilter
                    key={filter.id}
                    filter={filter}
                    period={period}
                    value={columnFilters[filter.id] || ""}
                    onPeriodChange={(nextPeriod) =>
                      handlePeriodModeChange(filter.id, nextPeriod)
                    }
                    onValueChange={(nextValue) =>
                      onColumnFilterChange?.(filter.id, nextValue)
                    }
                  />
                );
              }

              if (filter.type === "toggle") {
                const activeValue = filter.activeValue ?? "true";
                const isActive =
                  String(columnFilters[filter.id] || "") === String(activeValue);
                const badge = formatNavBadgeCount(filter.badge);
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() =>
                      onColumnFilterChange?.(
                        filter.id,
                        isActive ? "" : activeValue,
                      )
                    }
                    aria-pressed={isActive}
                    aria-label={
                      badge
                        ? `${filter.label}, ${badge} notifications`
                        : filter.label
                    }
                    className={`w-full sm:w-auto ${isActive ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}`}
                  >
                    {filter.label}
                    {badge ? (
                      <span
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error-50 px-1.5 text-theme-xs font-medium text-error-600"
                        aria-hidden="true"
                      >
                        {badge}
                      </span>
                    ) : null}
                  </button>
                );
              }

              return (
                <div
                  key={filter.id}
                  className={`min-w-0 w-full ${
                    filter.mobileFullWidth ? "col-span-2" : ""
                  } ${
                    filter.type === "date" || filter.type === "month"
                      ? "sm:w-48"
                      : "sm:w-40"
                  }`}
                >
                  {filter.type === "date" || filter.type === "month" ? (
                    <DateField
                      type={filter.type}
                      value={columnFilters[filter.id] || ""}
                      onChange={(nextValue) =>
                        onColumnFilterChange?.(filter.id, nextValue)
                      }
                      ariaLabel={filter.label}
                      placeholder={
                        filter.type === "month" ? "Select month" : "Select date"
                      }
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
              );
            })}

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className={`col-span-2 w-full sm:w-auto ${TOOLBAR_BTN}`}
              >
                Clear filters
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
                        .filter(
                          (column) =>
                            column.id !== "actions" && column.hideable !== false,
                        )
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
        </div>

        {onExportCsv || onPageSizeChange || toolbarStart ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 sm:ml-auto">
            {onExportCsv ? (
              <button
                type="button"
                onClick={onExportCsv}
                title="Export CSV"
                aria-label="Export CSV"
                className="inline-flex items-center justify-center rounded-md p-0.5 transition hover:opacity-80 hover:scale-105"
              >
                <ActionIcon name="export" />
              </button>
            ) : null}

            {toolbarStart}

            {onPageSizeChange ? (
              <div className="flex shrink-0 items-center gap-2">
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
                rowClassName={getRowClassName?.(row) || ""}
              />
            ))
          )}
        </div>
      ) : null}

      <div
        className={[
          fillHeight
            ? "min-h-0 min-w-0 flex-1 overflow-hidden"
            : "overflow-hidden rounded-xl border border-gray-200 bg-white",
          showMobileCards ? "hidden md:block" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className={
            fillHeight
              ? "h-full min-h-0 overflow-x-auto overflow-y-hidden lg:overflow-x-visible"
              : fitWidth
                ? "w-full overflow-x-auto lg:overflow-x-visible"
                : "max-w-full overflow-x-auto"
          }
        >
          <table
            className={[tableFixedClass, stretchRows ? "h-full" : ""]
              .filter(Boolean)
              .join(" ")}
            style={stretchTableStyle}
          >
            <thead style={stretchHeadStyle}>
              <tr className="border-b border-gray-100">
                {columns.map((column, columnIndex) => {
                  const cellClass = [
                    `${cellPadClass({
                      dense,
                      fitWidth,
                      vertical: "head",
                      columnIndex,
                      columnCount,
                    })} text-left ${rowAlign}`,
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
                          className="block w-full text-left text-theme-xs font-medium text-gray-500 hover:text-gray-800"
                        >
                          {column.header}
                        </button>
                      </th>
                    );
                  }

                  return (
                    <th key={column.id} className={cellClass}>
                      <p className="text-left text-theme-xs font-medium text-gray-500">
                        {column.header}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody
              className="divide-y divide-gray-100"
              style={stretchBodyStyle}
            >
              {rows.length === 0 ? (
                <tr style={stretchRowStyle}>
                  <td
                    colSpan={columns.length}
                    className={`${cellPadClass({
                      dense,
                      fitWidth,
                      vertical: "body",
                      columnIndex: 0,
                      columnCount: 1,
                    })} py-8 text-center`}
                  >
                    <p className="text-theme-sm text-gray-500">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row[rowKey]}
                    style={stretchRowStyle}
                    className={[
                      onRowClick ? "cursor-pointer" : "",
                      getRowClassName?.(row) ||
                        (onRowClick ? "hover:bg-gray-50/80" : ""),
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((column, columnIndex) => {
                      const cellClass = [
                        `${cellPadClass({
                          dense,
                          fitWidth,
                          vertical: "body",
                          columnIndex,
                          columnCount,
                        })} text-left ${rowAlign}`,
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
                            clamp={fitWidth && Boolean(column.wrap)}
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
          className={[
            "flex min-w-0 w-full shrink-0 flex-col gap-2 max-sm:items-stretch sm:flex-row sm:items-center sm:justify-between",
            fillHeight ? "mt-auto border-t border-gray-100 pt-1.5" : "",
          ]
            .filter(Boolean)
            .join(" ")}
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
              className={
                dense
                  ? "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  : TOOLBAR_BTN
              }
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
              className={
                dense
                  ? "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  : TOOLBAR_BTN
              }
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
