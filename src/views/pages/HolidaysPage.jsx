import { useHolidays } from "../../controllers/holidaysController.js";
import {
  calendarStatusClass,
  calendarStatusLabel,
} from "../../models/holidayCalendarModel.js";
import SelectField from "../components/forms/SelectField.jsx";
import DataTable from "../components/DataTable.jsx";
import HolidayMonthCalendar from "../components/HolidayMonthCalendar.jsx";
import UpcomingHolidays from "../components/UpcomingHolidays.jsx";
import HolidayDeleteModal from "./HolidayDeleteModal.jsx";
import HolidayFormModal from "./HolidayFormModal.jsx";
import HolidayReleaseModal from "./HolidayReleaseModal.jsx";

const COMPACT_INPUT =
  "box-border h-9 w-full min-w-0 max-w-full rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

const TOOLBAR_BTN =
  "inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50";

function HolidaysPage() {
  const {
    canManage,
    canRelease,
    year,
    yearOptions,
    releaseYearOptions,
    calendar,
    isYearReleased,
    calendarMonth,
    calendarMonthLabel,
    shiftCalendar,
    changeYear,
    holidays,
    upcoming,
    loading,
    error,
    table,
    filterDefs,
    formOpen,
    editing,
    form,
    fieldErrors,
    formError,
    saving,
    openCreateModal,
    openEditModal,
    closeFormModal,
    updateField,
    submitForm,
    deleteTarget,
    deleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    releaseOpen,
    releaseYear,
    releaseRows,
    releaseFieldErrors,
    releaseError,
    releaseInfo,
    releaseLoading,
    releasing,
    openReleaseModal,
    closeReleaseModal,
    changeReleaseYear,
    updateReleaseRow,
    addReleaseRow,
    removeReleaseRow,
    submitRelease,
    recentChanges,
  } = useHolidays();

  return (
    <>
      <div className="flex min-h-0 flex-col gap-2 overflow-hidden lg:h-[calc(100dvh-6.75rem)]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">
              Holiday Calendar
            </h2>
            <span
              className={`inline-flex max-w-full shrink-0 items-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${calendarStatusClass(calendar?.status)}`}
            >
              {isYearReleased
                ? `Released ${year}`
                : calendarStatusLabel(calendar?.status)}
            </span>
            {recentChanges.length > 0 ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {recentChanges.map((change) => (
                  <span
                    key={change.id}
                    className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${change.toneClass}`}
                    title={change.description || change.title}
                  >
                    <span className="shrink-0 font-semibold">{change.status}</span>
                    {change.description ? (
                      <span className="truncate font-normal opacity-90">
                        {change.description}
                      </span>
                    ) : (
                      <span className="truncate font-normal opacity-90">
                        {change.title}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="min-w-[120px]">
            <SelectField
              value={String(year)}
              onChange={changeYear}
              ariaLabel="Holiday year"
              options={yearOptions}
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7">
            <p className="text-theme-sm text-gray-500">Loading holidays…</p>
          </div>
        ) : null}

        {error ? (
          <div className="shrink-0 rounded-xl border border-error-500 bg-error-50 p-3">
            <p className="text-theme-sm text-error-600">{error}</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="min-w-0 w-full sm:max-w-[200px]">
                  <input
                    type="search"
                    value={table.search}
                    onChange={(event) =>
                      table.onSearchChange(event.target.value)
                    }
                    placeholder="Search holiday…"
                    className={COMPACT_INPUT}
                    aria-label="Search holiday"
                  />
                </div>
                {filterDefs.map((filter) => (
                  <div key={filter.id} className="min-w-0 w-full sm:w-32">
                    <SelectField
                      value={table.columnFilters[filter.id] || ""}
                      onChange={(nextValue) =>
                        table.setColumnFilter(filter.id, nextValue)
                      }
                      ariaLabel={filter.label}
                      placeholder={`All ${filter.label}`}
                      options={[
                        { value: "", label: `All ${filter.label}` },
                        ...filter.options.map((option) => ({
                          value: option.value,
                          label: option.label,
                        })),
                      ]}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canRelease ? (
                  <button
                    type="button"
                    onClick={openReleaseModal}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-500 px-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
                  >
                    Release Calendar
                  </button>
                ) : null}
                {canManage && isYearReleased ? (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className={TOOLBAR_BTN}
                  >
                    + Add Holiday
                  </button>
                ) : null}
                {isYearReleased ? (
                  <button
                    type="button"
                    onClick={() => table.exportCsv(`holidays-${year}.csv`)}
                    className={TOOLBAR_BTN}
                  >
                    Export CSV
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden lg:grid-cols-12">
              <div className="min-h-0 lg:col-span-4">
                <HolidayMonthCalendar
                  year={year}
                  monthIndex={calendarMonth}
                  monthLabel={calendarMonthLabel}
                  holidays={holidays}
                  onPrev={() => shiftCalendar(-1)}
                  onNext={() => shiftCalendar(1)}
                />
              </div>

              <div className="min-h-0 overflow-hidden lg:col-span-8">
                <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div className="flex shrink-0 items-center border-b border-gray-100 px-3 py-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Holiday List ({table.total})
                    </h3>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto p-2.5">
                    <DataTable
                      columns={table.visibleColumns}
                      rows={table.rows}
                      sort={table.sort}
                      onSortChange={table.toggleSort}
                      page={table.page}
                      pageSize={table.pageSize}
                      totalPages={table.totalPages}
                      total={table.total}
                      startIndex={table.startIndex}
                      endIndex={table.endIndex}
                      onPageChange={table.goToPage}
                      columnFilters={table.columnFilters}
                      filterDefs={[]}
                      getActions={
                        canManage && isYearReleased
                          ? (holiday) => [
                              {
                                label: "Edit",
                                onClick: () => openEditModal(holiday),
                              },
                              {
                                label: "Delete",
                                tone: "danger",
                                onClick: () => openDeleteModal(holiday),
                              },
                            ]
                          : undefined
                      }
                      emptyMessage={
                        canManage
                          ? canRelease
                            ? "No holidays for this year. Use Release Calendar to publish the list."
                            : "No holidays found for this year."
                          : "No holidays found for this year."
                      }
                      fitWidth
                      mobileCards={false}
                      hideToolbar
                      dense
                    />
                  </div>
                </div>
              </div>
            </div>

            {isYearReleased || canManage ? (
              <UpcomingHolidays holidays={upcoming} />
            ) : null}
          </>
        ) : null}
      </div>

      {canManage ? (
        <>
          <HolidayFormModal
            open={formOpen}
            isEdit={Boolean(editing)}
            form={form}
            fieldErrors={fieldErrors}
            error={formError}
            saving={saving}
            onClose={closeFormModal}
            onChange={updateField}
            onSubmit={submitForm}
          />
          <HolidayDeleteModal
            holiday={deleteTarget}
            deleting={deleting}
            error={deleteError}
            onClose={closeDeleteModal}
            onConfirm={confirmDelete}
          />
          <HolidayReleaseModal
            open={releaseOpen}
            year={releaseYear}
            yearOptions={releaseYearOptions}
            rows={releaseRows}
            fieldErrors={releaseFieldErrors}
            error={releaseError}
            info={releaseInfo}
            loading={releaseLoading}
            releasing={releasing}
            onClose={closeReleaseModal}
            onYearChange={changeReleaseYear}
            onRowChange={updateReleaseRow}
            onAddRow={addReleaseRow}
            onRemoveRow={removeReleaseRow}
            onSubmit={submitRelease}
          />
        </>
      ) : null}
    </>
  );
}

export default HolidaysPage;
