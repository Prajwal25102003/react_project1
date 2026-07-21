import { Link } from "react-router-dom";
import { useDepartments } from "../../controllers/departmentsController.js";
import { DEPARTMENT_COLUMNS } from "../../models/departmentsTableModel.js";
import DataTable from "../components/DataTable.jsx";
import ListPageShell from "../components/ListPageShell.jsx";
import DepartmentDeleteModal from "./DepartmentDeleteModal.jsx";

function DepartmentsPage() {
  const {
    departments,
    loading,
    error,
    table,
    filterDefs,
    deleteTarget,
    deleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  } = useDepartments();

  return (
    <>
      <ListPageShell
        pageName="Departments"
        loading={loading}
        error={error}
        loadingLabel="Loading departments…"
        actions={
          <Link
            to="/departments/new"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Add Department
          </Link>
        }
      >
        <DataTable
          columns={table.visibleColumns}
          allColumns={DEPARTMENT_COLUMNS}
          rows={departments}
          fitWidth
          search={table.search}
          onSearchChange={table.onSearchChange}
          searchPlaceholder="Search departments…"
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
          onExportCsv={() => table.exportCsv("departments.csv")}
          getActions={(department) => [
            {
              label: "Edit",
              to: `/departments/${department.id}/edit`,
            },
            {
              label: "Delete",
              tone: "danger",
              onClick: () => openDeleteModal(department),
            },
          ]}
          emptyMessage="No departments found."
        />
      </ListPageShell>

      <DepartmentDeleteModal
        department={deleteTarget}
        deleting={deleting}
        error={deleteError}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </>
  );
}

export default DepartmentsPage;
