import ModalShell from "../components/ModalShell.jsx";
import LeaveBalancePanel from "../components/LeaveBalancePanel.jsx";
import StatusPill from "../components/StatusPill.jsx";
import UserAvatar from "../components/UserAvatar.jsx";
import { normalizeLeaveBalances } from "../../models/leaveBalancesModel.js";

function DetailItem({ label, children }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/50 px-3.5 py-2.5">
      <p className="mb-1 text-theme-xs font-medium text-gray-500">{label}</p>
      <div className="text-theme-sm font-medium text-gray-800">{children}</div>
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
      panelClassName="relative mx-auto w-full min-w-0 max-w-[min(720px,calc(100vw-2.5rem))] rounded-3xl bg-white p-5 lg:p-8"
    >
      <div className="no-scrollbar max-h-[min(70vh,640px)] space-y-4 overflow-y-auto px-1">
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

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <DetailItem label="Employee ID">{employee.id || "—"}</DetailItem>
          <DetailItem label="Email">{employee.email || "—"}</DetailItem>
          <DetailItem label="Phone">{employee.phone || "—"}</DetailItem>
          <DetailItem label="Gender">{employee.gender || "—"}</DetailItem>
          <DetailItem label="Department">
            {isAdminAccount ? "—" : employee.department || "—"}
          </DetailItem>
          <DetailItem label="Designation">{employee.designation || "—"}</DetailItem>
          <DetailItem label="Joining Date">{employee.joiningDate || "—"}</DetailItem>
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
