import { useLeaveApprovalHierarchy } from "../../controllers/leaveApprovalHierarchyController.js";
import { LEAVE_HIERARCHY_COLUMNS } from "../../models/leaveApprovalHierarchyTableModel.js";
import DataTable from "../components/DataTable.jsx";
import ListPageShell from "../components/ListPageShell.jsx";
import LeaveHierarchyFormModal from "./LeaveHierarchyFormModal.jsx";

function LeaveApprovalHierarchyPage() {
  const {
    hierarchies,
    loading,
    error,
    table,
    employees,
    formOpen,
    editing,
    form,
    fieldErrors,
    formError,
    saving,
    openEditModal,
    closeFormModal,
    updateField,
    updateStep,
    addStep,
    removeStep,
    moveStep,
    submitForm,
  } = useLeaveApprovalHierarchy();

  return (
    <>
      <ListPageShell
        pageName="Leave Approval Hierarchy"
        title="Approval chains"
        subtitle="HR leave applies only to the Human Resources department head. Everyone else uses the employee or department-head chains."
        loading={loading}
        error={error}
        loadingLabel="Loading leave hierarchies…"
      >
        <DataTable
          columns={table.visibleColumns}
          allColumns={LEAVE_HIERARCHY_COLUMNS}
          rows={hierarchies}
          fitWidth
          search={table.search}
          onSearchChange={table.onSearchChange}
          searchPlaceholder="Search hierarchies…"
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
          onColumnFilterChange={table.setColumnFilter}
          onClearFilters={table.clearColumnFilters}
          visibleColumnIds={table.visibleColumnIds}
          onToggleColumn={table.toggleColumnVisibility}
          columnsOpen={table.columnsOpen}
          onColumnsOpenChange={table.setColumnsOpen}
          onExportCsv={() => table.exportCsv("leave-approval-hierarchies.csv")}
          getActions={(hierarchy) => [
            {
              label: "Edit",
              icon: "pencil",
              onClick: () => openEditModal(hierarchy),
            },
          ]}
          emptyMessage="No leave approval hierarchies found."
        />
      </ListPageShell>

      <LeaveHierarchyFormModal
        open={formOpen}
        hierarchy={editing}
        form={form}
        fieldErrors={fieldErrors}
        error={formError}
        saving={saving}
        employees={employees}
        onClose={closeFormModal}
        onChange={updateField}
        onStepChange={updateStep}
        onAddStep={addStep}
        onRemoveStep={removeStep}
        onMoveStep={moveStep}
        onSubmit={submitForm}
      />
    </>
  );
}

export default LeaveApprovalHierarchyPage;
