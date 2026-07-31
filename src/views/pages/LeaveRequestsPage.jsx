import { Link } from "react-router-dom";
import { useLeaveRequests } from "../../controllers/leaveRequestsController.js";
import { formatNavBadgeCount } from "../../models/navBadgesModel.js";
import { LEAVE_REQUEST_COLUMNS } from "../../models/leaveRequestsTableModel.js";
import DataTable from "../components/DataTable.jsx";
import ListPageShell from "../components/ListPageShell.jsx";
import { PlusIcon } from "../icons/ActionIcons.jsx";
import LeaveCancelModal from "./LeaveCancelModal.jsx";
import LeaveDecisionModal from "./LeaveDecisionModal.jsx";
import LeaveViewModal from "./LeaveViewModal.jsx";

function LeaveScopeTabs({ value, options, onChange }) {
  if (!options?.length) return null;

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
      {options.map((option) => {
        const active = value === option.value;
        const badge = formatNavBadgeCount(option.badge);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              active
                ? "inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-800 shadow-theme-xs"
                : "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-theme-sm font-medium text-gray-500 hover:text-gray-700"
            }
          >
            {option.label}
            {badge ? (
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error-50 px-1.5 text-theme-xs font-medium text-error-600"
                aria-label={`${badge} notifications`}
              >
                {badge}
              </span>
            ) : null}
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
    isHr,
    isDepartmentHead,
    decisionTarget,
    decisionStatus,
    decisionLoading,
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
    viewDirection,
    openViewModal,
    closeViewModal,
    canApproveViewTarget,
    approveFromView,
    rejectFromView,
    getLeaveActions,
  } = useLeaveRequests();

  const emptyMessage = isAdmin
    ? "No leave requests found."
    : listScope === "mine"
      ? "No personal leave requests found."
      : listScope === "employees"
        ? isDepartmentHead && !isHr
          ? "No team leave requests found."
          : "No employee leave requests found."
        : "No leave requests found.";

  const searchPlaceholder = isAdmin
    ? "Search leave approvals…"
    : listScope === "mine"
      ? "Search my leave requests…"
      : listScope === "employees"
        ? isDepartmentHead && !isHr
          ? "Search team leave requests…"
          : "Search employee leave requests…"
        : "Search leave requests…";

  const pageName = isAdmin
    ? "Leave Approvals"
    : isHr
      ? "Leave Requests"
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
                title="Request Leave"
                aria-label="Request Leave"
                className="inline-flex items-center justify-center rounded-md p-0.5 transition hover:opacity-80 hover:scale-105"
              >
                <PlusIcon />
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
          getRowClassName={(row) =>
            row.needsAction
              ? "bg-brand-25 hover:bg-brand-25"
              : "bg-white hover:bg-gray-50/80"
          }
          emptyMessage={emptyMessage}
        />
      </ListPageShell>

      <LeaveViewModal
        request={viewTarget}
        direction={viewDirection}
        onClose={closeViewModal}
        onApprove={canApproveViewTarget ? approveFromView : null}
        onReject={canApproveViewTarget ? rejectFromView : null}
      />

      <LeaveDecisionModal
        request={decisionTarget}
        status={decisionStatus}
        deciding={deciding}
        loading={decisionLoading}
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
