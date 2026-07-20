import { Link } from "react-router-dom";
import { useEmployees } from "../../controllers/employeesController.js";
import DataTable from "../components/DataTable.jsx";
import ListPageShell from "../components/ListPageShell.jsx";
import EmployeeDeleteModal from "./EmployeeDeleteModal.jsx";

function EmployeesPage() {
  const {
    employees,
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
  } = useEmployees();

  return (
    <>
      <ListPageShell
        pageName="Employees"
        loading={loading}
        error={error}
        loadingLabel="Loading employees…"
        actions={
          <Link
            to="/employees/new"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Add Employee
          </Link>
        }
      >
        <DataTable
          columns={table.visibleColumns}
          rows={employees}
          search={table.search}
          onSearchChange={table.onSearchChange}
          searchPlaceholder="Search employees…"
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
          onExportCsv={() => table.exportCsv("employees.csv")}
          getActions={(employee) => [
            {
              label: "Edit",
              to: `/employees/${employee.id}/edit`,
            },
            {
              label: "Delete",
              tone: "danger",
              onClick: () => openDeleteModal(employee),
            },
          ]}
          emptyMessage="No employees found."
        />
      </ListPageShell>

      <EmployeeDeleteModal
        employee={deleteTarget}
        deleting={deleting}
        error={deleteError}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </>
  );
}

export default EmployeesPage;
