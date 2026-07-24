import { useAttendance } from "../../controllers/attendanceController.js";
import DataTable from "../components/DataTable.jsx";
import ListPageShell from "../components/ListPageShell.jsx";
import AttendanceDeleteModal from "./AttendanceDeleteModal.jsx";

function ImportStatsBanner({ stats, onDismiss }) {
  if (!stats) return null;

  const saved = (stats.imported || 0) + (stats.updated || 0);
  const tone =
    stats.failed > 0
      ? "border-warning-500 bg-warning-50 text-warning-700"
      : "border-success-500 bg-success-50 text-success-700";

  return (
    <div className={`mb-4 rounded-xl border p-4 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
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
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function AttendancePage() {
  const {
    records,
    loading,
    error,
    table,
    filterDefs,
    isEmployee,
    deleteTarget,
    deleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    importing,
    importError,
    importStats,
    fileInputRef,
    openImportPicker,
    handleImportFile,
    clearImportStats,
  } = useAttendance();

  const pageName = isEmployee ? "My Attendance" : "Attendance";
  const columns = isEmployee
    ? table.visibleColumns.filter((column) => column.id !== "actions")
    : table.visibleColumns;

  return (
    <>
      <ListPageShell
        pageName={pageName}
        loading={loading}
        error={error}
        loadingLabel="Loading attendance…"
        actions={
          isEmployee ? null : (
            <div className="flex flex-wrap items-center gap-2">
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
            </div>
          )
        }
      >
        {!isEmployee && importError ? (
          <div className="mb-4 rounded-xl border border-error-500 bg-error-50 p-4">
            <p className="text-sm text-error-700">{importError}</p>
          </div>
        ) : null}

        {!isEmployee ? (
          <ImportStatsBanner stats={importStats} onDismiss={clearImportStats} />
        ) : null}

        <DataTable
          columns={columns}
          rows={records}
          search={table.search}
          onSearchChange={table.onSearchChange}
          searchPlaceholder="Search attendance…"
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
          onExportCsv={() => table.exportCsv("attendance.csv")}
          getActions={
            isEmployee
              ? undefined
              : (record) => [
                  {
                    label: "Edit",
                    icon: "pencil",
                    to: `/attendance/${record.id}/edit`,
                  },
                  {
                    label: "Delete",
                    icon: "trash",
                    tone: "danger",
                    onClick: () => openDeleteModal(record),
                  },
                ]
          }
          emptyMessage="No attendance records found."
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
