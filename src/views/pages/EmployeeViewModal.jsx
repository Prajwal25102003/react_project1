import ModalShell from "../components/ModalShell.jsx";
import LeaveBalancePanel from "../components/LeaveBalancePanel.jsx";
import StatusPill from "../components/StatusPill.jsx";
import UserAvatar from "../components/UserAvatar.jsx";
import { formatDateDisplay } from "../../models/datePickerModel.js";
import { normalizeLeaveBalances } from "../../models/leaveBalancesModel.js";

function DetailItem({ label, children }) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-gray-100 bg-gray-50/50 px-3.5 py-2.5 text-left">
      <p className="mb-1 text-theme-xs font-medium text-gray-500">{label}</p>
      <div className="break-words text-theme-sm font-medium text-gray-800">
        {children}
      </div>
    </div>
  );
}

function EmployeeViewModal({ employee, onClose }) {
  if (!employee) return null;

  const isAdminAccount = Boolean(employee.isAdminAccount);
  const balances = isAdminAccount
    ? null
    : normalizeLeaveBalances({
        ...employee,
        pendingLeaveCount: employee.pendingLeaveCount,
      });

  return (
    <ModalShell
      onClose={onClose}
      title="Employee Details"
      description={`${employee.id || "Employee"}${employee.name ? ` · ${employee.name}` : ""}`}
      panelClassName="relative mx-auto my-6 flex max-h-[calc(100vh-6rem)] w-full min-w-0 max-w-[min(700px,calc(100vw-3rem))] flex-col overflow-hidden rounded-3xl bg-white p-5 sm:p-6"
    >
      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-1">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
          <UserAvatar src={employee.avatar} name={employee.name || ""} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-gray-800">
              {employee.name || "—"}
            </p>
            <p className="mt-0.5 truncate text-theme-sm text-gray-500">
              {employee.designation || "No designation"}
            </p>
            <div className="mt-2">
              <StatusPill
                label={employee.status}
                statusClass={employee.statusClass}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 items-stretch gap-2.5 sm:grid-cols-3">
          <DetailItem label="Employee ID">{employee.id || "—"}</DetailItem>
          <DetailItem label="Email">
            {employee.loginEmail || employee.email || "—"}
          </DetailItem>
          {isAdminAccount ? (
            <DetailItem label="Role">Admin</DetailItem>
          ) : (
            <>
              <DetailItem label="Phone">{employee.phone || "—"}</DetailItem>
              <DetailItem label="Gender">{employee.gender || "—"}</DetailItem>
              <DetailItem label="Department">
                {employee.department || "—"}
              </DetailItem>
              <DetailItem label="Designation">
                {employee.designation || "—"}
              </DetailItem>
              <DetailItem label="Joining Date">
                {formatDateDisplay(employee.joiningDate) || "—"}
              </DetailItem>
            </>
          )}
          <DetailItem label="Country">
            {employee.country || "—"}
          </DetailItem>
          <DetailItem label="City / State">
            {employee.cityState || "—"}
          </DetailItem>
          <DetailItem label="Postal Code">
            {employee.postalCode || "—"}
          </DetailItem>
          <DetailItem label="Status">
            <StatusPill
              label={employee.status}
              statusClass={employee.statusClass}
            />
          </DetailItem>
        </div>

        {balances ? (
          <LeaveBalancePanel
            balances={balances}
            showPreview={false}
            compact
            title="Leave Balance"
          />
        ) : null}
      </div>
    </ModalShell>
  );
}

export default EmployeeViewModal;
