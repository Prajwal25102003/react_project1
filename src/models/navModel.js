import { ROLE_NAV_IDS } from "./authModel.js";

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
};

export function getNavGroups(role = "hr") {
  const ids = ROLE_NAV_IDS[role] || ROLE_NAV_IDS.hr;

  const items = ids
    .map((id) => {
      const item = NAV_ITEMS[id];
      if (!item) return null;
      if (role === "employee" && EMPLOYEE_LABELS[id]) {
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

  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
