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
    label: "Leave Requests",
    icon: "forms",
    path: "/leave-requests",
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
};

const DEPARTMENT_HEAD_LABELS = {
  "leave-requests": "Leave Approvals",
};

/**
 * HR, Admin, and any department head can act on leave approvals.
 * @param {string} role
 * @param {{ isDepartmentHead?: boolean, employeeId?: string|null }} [options]
 */
export function userCanApproveLeaves(role, options = {}) {
  const { isDepartmentHead = false } = options;
  return (
    role === ROLES.HR ||
    role === ROLES.ADMIN ||
    Boolean(isDepartmentHead)
  );
}

/**
 * @param {string} role
 * @param {{ isDepartmentHead?: boolean, employeeId?: string|null }} [options]
 */
export function getNavGroups(role = "hr", options = {}) {
  const { isDepartmentHead = false, employeeId = null } = options;
  const baseIds = [...(ROLE_NAV_IDS[role] || ROLE_NAV_IDS.hr)];

  // HR without linked employee still sees the unified leave list.
  if (
    role === ROLES.HR &&
    !employeeId &&
    !baseIds.includes("leave-requests")
  ) {
    const holidaysIdx = baseIds.indexOf("holidays");
    baseIds.splice(
      holidaysIdx === -1 ? baseIds.length : holidaysIdx,
      0,
      "leave-requests",
    );
  }

  const items = baseIds
    .map((id) => {
      const item = NAV_ITEMS[id];
      if (!item) return null;
      if (role === ROLES.EMPLOYEE && isDepartmentHead && DEPARTMENT_HEAD_LABELS[id]) {
        return { ...item, label: DEPARTMENT_HEAD_LABELS[id] };
      }
      if (role === ROLES.EMPLOYEE && EMPLOYEE_LABELS[id]) {
        return { ...item, label: EMPLOYEE_LABELS[id] };
      }
      // Admin only reviews HR leave — keep the same nav id/path.
      if (role === ROLES.ADMIN && id === "leave-requests") {
        return { ...item, label: "HR Leave Approvals" };
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
      pathname === "/leave-requests" ||
      pathname.startsWith("/leave-requests/") ||
      pathname === "/leave-approvals" ||
      pathname.startsWith("/leave-approvals/")
    );
  }

  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
