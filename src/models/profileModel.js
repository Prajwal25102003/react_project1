import { getRoleLabel } from "./authModel.js";
import { normalizeLeaveBalances } from "./leaveBalancesModel.js";

export function mapAuthProfile(profile) {
  if (!profile) return null;

  const employee = profile.employee || null;
  const leaveBalances = employee
    ? normalizeLeaveBalances(employee)
    : null;

  return {
    ...profile,
    role: getRoleLabel(profile.role),
    leaveBalances,
  };
}
