import { useAttendance } from "../../controllers/attendanceController.js";
import DataTable from "../components/DataTable.jsx";
import ListPageShell from "../components/ListPageShell.jsx";
import AttendanceDeleteModal from "./AttendanceDeleteModal.jsx";

function AttendanceScopeTabs({ value, options, onChange }) {
  if (!options?.length) return null;

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              active
                ? "inline-flex items-center rounded-md bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-800 shadow-theme-xs"
                : "inline-flex items-center rounded-md px-3 py-1.5 text-theme-sm font-medium text-gray-500 hover:text-gray-700"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ImportStatsBanner({ stats }) {
  if (!stats) return null;

  const saved = (stats.imported || 0) + (stats.updated || 0);
  const tone =
    stats.failed > 0
      ? "border-warning-500 bg-warning-50 text-warning-700"
      : "border-success-500 bg-success-50 text-success-700";

  return (
    <div className={`mb-4 rounded-xl border p-4 ${tone}`}>
      <p className="text-sm font-medium">
        Import complete — {saved} saved
        {stats.failed ? `, ${stats.failed} failed` : ""}
        {stats.skipped ? `, ${stats.skipped} skipped` : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-3 text-theme-sm">
        <span>New: {stats.imported}</span>
        <span>Updated: {stats.updated}</span>
        <span>Present: {stats.present}</span>
        <span>Absent: {stats.absent}</span>
        <span>Half Day: {stats.halfDay}</span>
      </div>
      {stats.errors?.length ? (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-theme-xs">
          {stats.errors.slice(0, 5).map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AttendancePage() {
  const {
    records,
    loading,
    error,
    table,
    displayColumns,
    filterDefs,
    isEmployee,
    listScope,
    setListScope,
    listScopeOptions,
    showingMyAttendance,
    canManageRecord,
    canImportAttendance,
    hasUnread,
    markAllAsRead,
    deleteTarget,
    deleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    importing,
    importErrors,
    importStats,
    fileInputRef,
    openImportPicker,
    handleImportFile,
    handleExportCsv,
    onRecordInteract,
  } = useAttendance();

  const pageName = showingMyAttendance ? "My Attendance" : "Attendance";

  return (
    <>
      <ListPageShell
        pageName={pageName}
        loading={loading}
        error={error}
        loadingLabel="Loading attendance…"
        actions={
          hasUnread || listScopeOptions.length ? (
            <div className="flex flex-wrap items-center gap-3">
              {hasUnread ? (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800"
                >
                  Mark as read
                </button>
              ) : null}
              <AttendanceScopeTabs
                value={listScope}
                options={listScopeOptions}
                onChange={setListScope}
              />
            </div>
          ) : null
        }
      >
        {!isEmployee && importErrors?.length ? (
          <div className="mb-4 rounded-xl border border-error-500 bg-error-50 p-4 text-error-700">
            <p className="text-sm font-medium">
              Import rejected
              {importErrors.length > 1
                ? ` — ${importErrors.length} errors`
                : ""}
            </p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-theme-sm">
              {importErrors.slice(0, 20).map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
            {importErrors.length > 20 ? (
              <p className="mt-2 text-theme-xs">
                Showing first 20 of {importErrors.length} errors.
              </p>
            ) : null}
          </div>
        ) : null}

        {!isEmployee ? (
          <ImportStatsBanner stats={importStats} />
        ) : null}

        <DataTable
          columns={displayColumns}
          rows={records}
          search={table.search}
          onSearchChange={table.onSearchChange}
          searchPlaceholder={
            showingMyAttendance
              ? "Search my attendance…"
              : "Search attendance…"
          }
          sort={table.sort}
          onSortChange={table.toggleSort}
          page={table.page}
          pageSize={table.pageSize}
          totalPages={table.totalPages}
          total={table.total}
          startIndex={table.startIndex}
          endIndex={table.endIndex}
          onPageChange={table.goToPage}
          onPageSizeChange={table.onPageSizeChange}
          columnFilters={table.columnFilters}
          filterDefs={filterDefs}
          onColumnFilterChange={table.setColumnFilter}
          onClearFilters={table.clearColumnFilters}
          onExportCsv={handleExportCsv}
          onRowClick={onRecordInteract}
          getRowClassName={(row) =>
            row.needsAttention
              ? "bg-brand-25 hover:bg-brand-25"
              : "bg-white hover:bg-gray-50/80"
          }
          toolbarStart={
            canImportAttendance ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  className="sr-only"
                  onChange={handleImportFile}
                />
                <button
                  type="button"
                  onClick={openImportPicker}
                  disabled={importing}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-60"
                >
                  {importing ? "Importing…" : "Import Excel"}
                </button>
              </>
            ) : null
          }
          getActions={
            isEmployee || showingMyAttendance
              ? undefined
              : (record) => {
                  if (!canManageRecord(record)) return [];
                  return [
                    {
                      label: "Edit",
                      icon: "pencil",
                      to: `/attendance/${record.id}/edit`,
                      onClick: () => onRecordInteract(record),
                    },
                    {
                      label: "Delete",
                      icon: "trash",
                      tone: "danger",
                      onClick: () => openDeleteModal(record),
                    },
                  ];
                }
          }
          emptyMessage={
            showingMyAttendance
              ? "No personal attendance records found."
              : "No attendance records found."
          }
        />
      </ListPageShell>

      {!isEmployee ? (
        <AttendanceDeleteModal
          record={deleteTarget}
          deleting={deleting}
          error={deleteError}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
        />
      ) : null}
    </>
  );
}

export default AttendancePage;
