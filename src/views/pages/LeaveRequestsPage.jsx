import { Link } from "react-router-dom";
import { useLeaveRequests } from "../../controllers/leaveRequestsController.js";
import { LEAVE_REQUEST_COLUMNS } from "../../models/leaveRequestsTableModel.js";
import DataTable from "../components/DataTable.jsx";
import ListPageShell from "../components/ListPageShell.jsx";
import LeaveCancelModal from "./LeaveCancelModal.jsx";
import LeaveDecisionModal from "./LeaveDecisionModal.jsx";
import LeaveViewModal from "./LeaveViewModal.jsx";

function LeaveRequestsPage({ mode = "mine" }) {
  const {
    isApprovalsMode,
    leaveRequests,
    loading,
    error,
    table,
    filterDefs,
    canRequestLeave,
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
    openViewModal,
    closeViewModal,
    getLeaveActions,
  } = useLeaveRequests(mode);

  const pageName = isApprovalsMode
    ? "Employee Leave Requests"
    : "My Leave Requests";

  const emptyMessage = isApprovalsMode
    ? "No employee leave requests to review."
    : "No personal leave requests found.";

  return (
    <>
      <ListPageShell
        pageName={pageName}
        loading={loading}
        error={error}
        loadingLabel="Loading leave requests…"
        actions={
          !isApprovalsMode && canRequestLeave ? (
            <Link
              to="/leave-requests/new"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Request Leave
            </Link>
          ) : null
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
          searchPlaceholder={
            isApprovalsMode
              ? "Search employee leave requests…"
              : "Search my leave requests…"
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
          visibleColumnIds={table.visibleColumnIds}
          onToggleColumn={table.toggleColumnVisibility}
          columnsOpen={table.columnsOpen}
          onColumnsOpenChange={table.setColumnsOpen}
          onExportCsv={() =>
            table.exportCsv(
              isApprovalsMode
                ? "employee-leave-requests.csv"
                : "my-leave-requests.csv",
            )
          }
          onRowClick={openViewModal}
          getActions={getLeaveActions}
          emptyMessage={emptyMessage}
        />
      </ListPageShell>

      <LeaveViewModal request={viewTarget} onClose={closeViewModal} />

      {isApprovalsMode ? (
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
      ) : (
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
      )}
    </>
  );
}

export default LeaveRequestsPage;
