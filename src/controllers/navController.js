import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  applyNavBadges,
  countNavBadgesFromNotifications,
  countPersonalLeaveBalanceBadges,
  countPersonalLeaveOutcomeBadges,
} from "../models/navBadgesModel.js";
import {
  getNavGroups,
  isNavItemActive,
  userCanApproveLeaves,
} from "../models/navModel.js";
import { countLeaveApproverAttention, leaveScopeNotificationCounts } from "../models/leaveRequestsModel.js";
import { fetchLeaveRequests } from "../services/leaveRequestsService.js";
import { NOTIFICATIONS_REFRESH_EVENT } from "../utils/notificationsRefresh.js";
import { useAuth } from "./authContext.jsx";

export function useNav(notifications = []) {
  const { user } = useAuth();
  const [leaveApprovalsBadge, setLeaveApprovalsBadge] = useState(0);
  const canApproveLeaves = userCanApproveLeaves(user?.role, {
    isDepartmentHead: Boolean(user?.isDepartmentHead),
    isNamedLeaveApprover: Boolean(user?.isNamedLeaveApprover),
  });

  const loadLeaveApprovalsBadge = useCallback(async () => {
    if (!canApproveLeaves) {
      setLeaveApprovalsBadge(0);
      return;
    }

    try {
      // Match Leave Requests page data: unified includes My + Employees.
      const scope = user?.role === "admin" ? "admin" : "unified";
      const requests = await fetchLeaveRequests(scope);
      const userContext = {
        employeeId: user?.employeeId,
        role: user?.role,
      };
      if (user?.role === "admin") {
        setLeaveApprovalsBadge(
          countLeaveApproverAttention(requests, userContext),
        );
      } else {
        setLeaveApprovalsBadge(
          leaveScopeNotificationCounts(requests, userContext).total,
        );
      }
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
    // Approvers: module badge = actionable leave + personal outcomes + balance grants.
    // Replace notification-based open-leave count so pending is not double-counted.
    if (canApproveLeaves) {
      badgeCounts["leave-requests"] =
        leaveApprovalsBadge +
        countPersonalLeaveOutcomeBadges(notifications) +
        countPersonalLeaveBalanceBadges(notifications);
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
