import { Link } from "react-router-dom";
import { useLeaveRequests } from "../../controllers/leaveRequestsController.js";
import { LEAVE_REQUEST_COLUMNS } from "../../models/leaveRequestsTableModel.js";
import DataTable from "../components/DataTable.jsx";
import ListPageShell from "../components/ListPageShell.jsx";
import LeaveCancelModal from "./LeaveCancelModal.jsx";
import LeaveDecisionModal from "./LeaveDecisionModal.jsx";
import LeaveViewModal from "./LeaveViewModal.jsx";

function LeaveScopeTabs({ value, options, onChange }) {
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
                ? "rounded-md bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-800 shadow-theme-xs"
                : "rounded-md px-3 py-1.5 text-theme-sm font-medium text-gray-500 hover:text-gray-700"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function LeaveRequestsPage() {
  const {
    listScope,
    setListScope,
    listScopeOptions,
    leaveRequests,
    loading,
    error,
    table,
    filterDefs,
    canRequestLeave,
    isAdmin,
    isDepartmentHead,
    decisionTarget,
    decisionStatus,
    deciding,
    decisionError,
    remarks,
    remarksError,
    closeDecisionModal,
    updateRemarks,
    confirmDecision,
    cancelTarget,
    cancelReason,
    cancelReasonError,
    cancelling,
    cancelError,
    closeCancelModal,
    updateCancelReason,
    confirmCancel,
    viewTarget,
    viewLoading,
    viewDirection,
    openViewModal,
    closeViewModal,
    getLeaveActions,
  } = useLeaveRequests();

  const emptyMessage = isAdmin
    ? "No HR leave requests found."
    : listScope === "mine"
      ? "No personal leave requests found."
      : listScope === "employees"
        ? isDepartmentHead
          ? "No team leave requests found."
          : "No employee leave requests found."
        : "No leave requests found.";

  const searchPlaceholder = isAdmin
    ? "Search HR leave requests…"
    : listScope === "mine"
      ? "Search my leave requests…"
      : listScope === "employees"
        ? isDepartmentHead
          ? "Search team leave requests…"
          : "Search employee leave requests…"
        : "Search leave requests…";

  const pageName = isAdmin
    ? "HR Leave Approvals"
    : isDepartmentHead
      ? "Leave Approvals"
      : "Leave Requests";

  return (
    <>
      <ListPageShell
        pageName={pageName}
        loading={loading}
        error={error}
        loadingLabel="Loading leave requests…"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <LeaveScopeTabs
              value={listScope}
              options={listScopeOptions}
              onChange={setListScope}
            />
            {canRequestLeave ? (
              <Link
                to="/leave-requests/new"
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Request Leave
              </Link>
            ) : null}
          </div>
        }
      >
        <DataTable
          columns={table.visibleColumns}
          allColumns={LEAVE_REQUEST_COLUMNS}
          rows={leaveRequests}
          fitWidth
          mobileCards
          search={table.search}
          onSearchChange={table.onSearchChange}
          searchPlaceholder={searchPlaceholder}
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
          onExportCsv={() => table.exportCsv("leave-requests.csv")}
          onRowClick={openViewModal}
          getActions={getLeaveActions}
          emptyMessage={emptyMessage}
        />
      </ListPageShell>

      <LeaveViewModal
        request={viewTarget}
        direction={viewDirection}
        onClose={closeViewModal}
      />

      <LeaveDecisionModal
        request={decisionTarget}
        status={decisionStatus}
        deciding={deciding}
        error={decisionError}
        remarks={remarks}
        remarksError={remarksError}
        onRemarksChange={updateRemarks}
        onClose={closeDecisionModal}
        onConfirm={confirmDecision}
      />

      <LeaveCancelModal
        request={cancelTarget}
        reason={cancelReason}
        reasonError={cancelReasonError}
        cancelling={cancelling}
        error={cancelError}
        onClose={closeCancelModal}
        onReasonChange={updateCancelReason}
        onConfirm={confirmCancel}
      />
    </>
  );
}

export default LeaveRequestsPage;
