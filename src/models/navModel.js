import { ROLE_NAV_IDS, ROLES } from "./authModel.js";

const NAV_ITEMS = {
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    path: "/dashboard",
  },
  employees: {
    id: "employees",
    label: "Employees",
    icon: "profile",
    path: "/employees",
  },
  departments: {
    id: "departments",
    label: "Departments",
    icon: "tables",
    path: "/departments",
  },
  attendance: {
    id: "attendance",
    label: "Attendance",
    icon: "calendar",
    path: "/attendance",
  },
  "leave-requests": {
    id: "leave-requests",
    label: "My Leave Requests",
    icon: "forms",
    path: "/leave-requests",
  },
  "leave-approvals": {
    id: "leave-approvals",
    label: "Employee Leave Requests",
    icon: "forms",
    path: "/leave-approvals",
  },
  holidays: {
    id: "holidays",
    label: "Holiday Calendar",
    icon: "calendar",
    path: "/holidays",
  },
  profile: {
    id: "profile",
    label: "My Profile",
    icon: "profile",
    path: "/profile",
  },
};

const EMPLOYEE_LABELS = {
  attendance: "My Attendance",
  "leave-requests": "My Leave Requests",
  "leave-approvals": "Team Leave Approvals",
};

/**
 * @param {string} role
 * @param {{ isDepartmentHead?: boolean, employeeId?: string|null }} [options]
 */
export function getNavGroups(role = "hr", options = {}) {
  const { isDepartmentHead = false, employeeId = null } = options;
  const baseIds = [...(ROLE_NAV_IDS[role] || ROLE_NAV_IDS.hr)];

  // Insert leave-approvals after leave-requests for heads / HR / Admin.
  const leaveIdx = baseIds.indexOf("leave-requests");
  const canApproveLeaves =
    role === ROLES.HR ||
    role === ROLES.ADMIN ||
    (role === ROLES.EMPLOYEE && isDepartmentHead);

  if (canApproveLeaves && leaveIdx !== -1 && !baseIds.includes("leave-approvals")) {
    baseIds.splice(leaveIdx + 1, 0, "leave-approvals");
  }

  // HR/Admin without linked employee still see approvals; personal leave needs employeeId.
  if (
    (role === ROLES.HR || role === ROLES.ADMIN) &&
    !employeeId &&
    baseIds.includes("leave-requests")
  ) {
    const idx = baseIds.indexOf("leave-requests");
    baseIds.splice(idx, 1);
    if (!baseIds.includes("leave-approvals")) {
      baseIds.splice(idx, 0, "leave-approvals");
    }
  }

  const items = baseIds
    .map((id) => {
      const item = NAV_ITEMS[id];
      if (!item) return null;
      if (role === ROLES.EMPLOYEE && EMPLOYEE_LABELS[id]) {
        return { ...item, label: EMPLOYEE_LABELS[id] };
      }
      return item;
    })
    .filter(Boolean);

  return [
    {
      id: "menu",
      title: "MENU",
      items,
    },
  ];
}

export function isNavItemActive(item, pathname) {
  if (item.path === "/") {
    return pathname === "/";
  }

  // Avoid /leave-requests matching /leave-requests/new incorrectly for sibling routes.
  if (item.path === "/leave-requests") {
    return (
      pathname === "/leave-requests" || pathname.startsWith("/leave-requests/")
    );
  }

  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
