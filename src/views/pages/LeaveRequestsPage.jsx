import { Link } from "react-router-dom";
import { useLeaveRequests } from "../../controllers/leaveRequestsController.js";
import { LEAVE_REQUEST_COLUMNS } from "../../models/leaveRequestsTableModel.js";
import DataTable from "../components/DataTable.jsx";
import ListPageShell from "../components/ListPageShell.jsx";
import LeaveCancelModal from "./LeaveCancelModal.jsx";
import LeaveDecisionModal from "./LeaveDecisionModal.jsx";

function LeaveRequestsPage() {
  const {
    leaveRequests,
    loading,
    error,
    table,
    filterDefs,
    isEmployee,
    decisionTarget,
    decisionStatus,
    deciding,
    decisionError,
    openApproveModal,
    openRejectModal,
    closeDecisionModal,
    confirmDecision,
    cancelTarget,
    cancelling,
    cancelError,
    openCancelModal,
    closeCancelModal,
    confirmCancel,
  } = useLeaveRequests();

  const pageName = isEmployee ? "My Leave Requests" : "Leave Requests";

  return (
    <>
      <ListPageShell
        pageName={pageName}
        loading={loading}
        error={error}
        loadingLabel="Loading leave requests…"
        actions={
          isEmployee ? (
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
          searchPlaceholder="Search leave requests…"
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
          getActions={(request) => {
            if (request.status !== "Pending") return [];
            if (isEmployee) {
              return [
                {
                  label: "Cancel",
                  tone: "danger",
                  onClick: () => openCancelModal(request),
                },
              ];
            }
            return [
              {
                label: "Approve",
                onClick: () => openApproveModal(request),
              },
              {
                label: "Reject",
                tone: "danger",
                onClick: () => openRejectModal(request),
              },
            ];
          }}
          emptyMessage="No leave requests found."
        />
      </ListPageShell>

      {!isEmployee ? (
        <LeaveDecisionModal
          request={decisionTarget}
          status={decisionStatus}
          deciding={deciding}
          error={decisionError}
          onClose={closeDecisionModal}
          onConfirm={confirmDecision}
        />
      ) : (
        <LeaveCancelModal
          request={cancelTarget}
          cancelling={cancelling}
          error={cancelError}
          onClose={closeCancelModal}
          onConfirm={confirmCancel}
        />
      )}
    </>
  );
}

export default LeaveRequestsPage;
