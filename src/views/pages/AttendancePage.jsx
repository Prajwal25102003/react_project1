import { Link } from "react-router-dom";
import { useAttendance } from "../../controllers/attendanceController.js";
import { ATTENDANCE_COLUMNS } from "../../models/attendanceTableModel.js";
import DataTable from "../components/DataTable.jsx";
import ListPageShell from "../components/ListPageShell.jsx";
import AttendanceDeleteModal from "./AttendanceDeleteModal.jsx";

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
  } = useAttendance();

  const pageName = isEmployee ? "My Attendance" : "Attendance";
  const columns = isEmployee
    ? table.visibleColumns.filter((column) => column.id !== "actions")
    : table.visibleColumns;
  const allColumns = isEmployee
    ? ATTENDANCE_COLUMNS.filter((column) => column.id !== "actions")
    : ATTENDANCE_COLUMNS;

  return (
    <>
      <ListPageShell
        pageName={pageName}
        loading={loading}
        error={error}
        loadingLabel="Loading attendance…"
        actions={
          isEmployee ? null : (
            <Link
              to="/attendance/new"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Mark Attendance
            </Link>
          )
        }
      >
        <DataTable
          columns={columns}
          allColumns={allColumns}
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
          visibleColumnIds={table.visibleColumnIds}
          onToggleColumn={table.toggleColumnVisibility}
          columnsOpen={table.columnsOpen}
          onColumnsOpenChange={table.setColumnsOpen}
          onExportCsv={() => table.exportCsv("attendance.csv")}
          getActions={
            isEmployee
              ? undefined
              : (record) => [
                  {
                    label: "Edit",
                    to: `/attendance/${record.id}/edit`,
                  },
                  {
                    label: "Delete",
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
