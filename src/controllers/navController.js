import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  applyNavBadges,
  countNavBadgesFromNotifications,
} from "../models/navBadgesModel.js";
import { getNavGroups, isNavItemActive } from "../models/navModel.js";
import { countActionableLeaveApprovals } from "../models/leaveRequestsModel.js";
import { ROLES } from "../models/authModel.js";
import { fetchLeaveRequests } from "../services/leaveRequestsService.js";
import { NOTIFICATIONS_REFRESH_EVENT } from "../utils/notificationsRefresh.js";
import { useAuth } from "./authContext.jsx";

function userCanApproveLeaves(user) {
  if (!user) return false;
  if (user.role === ROLES.HR || user.role === ROLES.ADMIN) return true;
  return user.role === ROLES.EMPLOYEE && Boolean(user.isDepartmentHead);
}

export function useNav(notifications = []) {
  const { user } = useAuth();
  const [leaveApprovalsBadge, setLeaveApprovalsBadge] = useState(0);
  const canApproveLeaves = userCanApproveLeaves(user);

  const loadLeaveApprovalsBadge = useCallback(async () => {
    if (!canApproveLeaves) {
      setLeaveApprovalsBadge(0);
      return;
    }

    try {
      const requests = await fetchLeaveRequests("approvals");
      setLeaveApprovalsBadge(countActionableLeaveApprovals(requests));
    } catch {
      setLeaveApprovalsBadge(0);
    }
  }, [canApproveLeaves, user?.employeeId, user?.role]);

  useEffect(() => {
    loadLeaveApprovalsBadge();
  }, [loadLeaveApprovalsBadge, notifications]);

  useEffect(() => {
    function handleRefresh() {
      loadLeaveApprovalsBadge();
    }

    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, handleRefresh);
    };
  }, [loadLeaveApprovalsBadge]);

  const groups = useMemo(() => {
    const baseGroups = getNavGroups(user?.role, {
      isDepartmentHead: Boolean(user?.isDepartmentHead),
      employeeId: user?.employeeId || null,
    });
    const availableNavIds = baseGroups.flatMap((group) =>
      (group.items || []).map((item) => item.id),
    );
    const badgeCounts = {
      ...countNavBadgesFromNotifications(notifications, availableNavIds, {
        role: user?.role,
      }),
    };
    if (canApproveLeaves && leaveApprovalsBadge > 0) {
      badgeCounts["leave-approvals"] = leaveApprovalsBadge;
    }
    return applyNavBadges(baseGroups, badgeCounts);
  }, [user, notifications, canApproveLeaves, leaveApprovalsBadge]);

  return { groups };
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
