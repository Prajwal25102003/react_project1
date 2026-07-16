import { useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { getNavGroups, isNavItemActive } from "../models/navModel.js";
import { useAuth } from "./authContext.jsx";

export function useNav() {
  const { user } = useAuth();
  return {
    groups: getNavGroups(user?.role),
  };
}

export function useSidebar() {
  const [sidebarToggle, setSidebarToggle] = useState(false);

  return {
    sidebarToggle,
    toggleSidebar: () => setSidebarToggle((value) => !value),
    closeSidebar: () => setSidebarToggle(false),
  };
}

export function useSidebarNav() {
  const { pathname } = useLocation();

  const isItemActive = useCallback(
    (item) => isNavItemActive(item, pathname),
    [pathname],
  );

  return { isItemActive };
}
