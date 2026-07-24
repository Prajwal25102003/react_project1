import { Link } from "react-router-dom";
import { useEmployees } from "../../controllers/employeesController.js";
import DataTable from "../components/DataTable.jsx";
import ListPageShell from "../components/ListPageShell.jsx";
import { PersonPlusIcon } from "../icons/ActionIcons.jsx";
import AssignLeavesModal from "./AssignLeavesModal.jsx";
import EmployeeDeleteModal from "./EmployeeDeleteModal.jsx";
import EmployeeViewModal from "./EmployeeViewModal.jsx";

function EmployeesPage() {
  const {
    employees,
    loading,
    error,
    table,
    filterDefs,
    viewTarget,
    openViewModal,
    closeViewModal,
    deleteTarget,
    deleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    assignOpen,
    assignForm,
    assignFieldErrors,
    assignError,
    assigning,
    assignDepartments,
    assignScopes,
    assignModes,
    filteredAssignableEmployees,
    employeeSearch,
    setEmployeeSearch,
    openAssignLeavesModal,
    closeAssignLeavesModal,
    updateAssignField,
    toggleAssignEmployee,
    selectAllFilteredEmployees,
    clearAssignEmployees,
    submitAssignLeaves,
  } = useEmployees();

  return (
    <>
      <ListPageShell
        pageName="Employees"
        loading={loading}
        error={error}
        loadingLabel="Loading employees…"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openAssignLeavesModal}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-500 px-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Assign Leaves
            </button>
            <Link
              to="/employees/new"
              title="Add Employee"
              aria-label="Add Employee"
              className="inline-flex items-center justify-center rounded-md p-0.5 transition hover:opacity-80 hover:scale-105"
            >
              <PersonPlusIcon />
            </Link>
          </div>
        }
      >
        <DataTable
          columns={table.visibleColumns}
          rows={employees}
          fitWidth
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
          onRowClick={openViewModal}
          getActions={(employee) => {
            if (employee.isAdminAccount || employee.loginRole === "admin") {
              return [];
            }
            return [
              {
                label: "Edit",
                icon: "pencil",
                to: `/employees/${employee.id}/edit`,
              },
              {
                label: "Delete",
                icon: "trash",
                tone: "danger",
                onClick: () => openDeleteModal(employee),
              },
            ];
          }}
          emptyMessage="No employees found."
        />
      </ListPageShell>

      <EmployeeViewModal employee={viewTarget} onClose={closeViewModal} />

      <EmployeeDeleteModal
        employee={deleteTarget}
        deleting={deleting}
        error={deleteError}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      <AssignLeavesModal
        open={assignOpen}
        form={assignForm}
        fieldErrors={assignFieldErrors}
        error={assignError}
        assigning={assigning}
        departments={assignDepartments}
        scopes={assignScopes}
        modes={assignModes}
        employees={filteredAssignableEmployees}
        employeeSearch={employeeSearch}
        onEmployeeSearchChange={setEmployeeSearch}
        onClose={closeAssignLeavesModal}
        onFieldChange={updateAssignField}
        onToggleEmployee={toggleAssignEmployee}
        onSelectAllEmployees={selectAllFilteredEmployees}
        onClearEmployees={clearAssignEmployees}
        onSubmit={submitAssignLeaves}
      />
    </>
  );
}

export default EmployeesPage;
