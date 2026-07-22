import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./authContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { useListData } from "./listController.js";
import {
  cancelLeaveRequest,
  createLeaveRequest,
  fetchLeaveRequestById,
  fetchLeaveRequests,
  updateLeaveRequestStatus,
} from "../services/leaveRequestsService.js";
import { fetchAuthProfile } from "../services/authService.js";
import {
  EMPTY_LEAVE_FORM,
  LEAVE_TYPES,
  calculateLeaveDays,
  canAdminApproveRequest,
  canAdminRejectRequest,
  canCancelLeaveRequest,
  canHrApproveRequest,
  canHrRejectRequest,
  isTeamLeadForRequest,
  toLeavePayload,
  validateLeaveForm,
} from "../models/leaveRequestsModel.js";
import { normalizeLeaveBalances } from "../models/leaveBalancesModel.js";
import {
  isMaternityLeave,
  leaveTypesForGender,
  maternityDatesFromDelivery,
  MATERNITY_LEAVE_HELP,
} from "../models/maternityLeaveModel.js";
import {
  LEAVE_REQUEST_COLUMN_FILTERS,
  LEAVE_REQUEST_COLUMNS,
  LEAVE_REQUEST_SEARCH_KEYS,
  getLeaveRequestDefaultVisibleIds,
} from "../models/leaveRequestsTableModel.js";
import { HR_ADMIN_ROLES, ROLES } from "../models/authModel.js";
import { requestEmsRefresh } from "../utils/emsRefresh.js";

const LEAVE_STATUS_FILTERS = new Set([
  "Pending",
  "TeamLeadApproved",
  "Approved",
  "Rejected",
  "Cancelled",
]);

function statusFilterFromSearch(searchParams) {
  const status = String(searchParams.get("status") || "").trim();
  if (!status || !LEAVE_STATUS_FILTERS.has(status)) return {};
  return { status };
}

export function useLeaveRequests(mode = "mine") {
  const { user } = useAuth();
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const isHrAdmin = HR_ADMIN_ROLES.includes(user?.role);
  const isAdmin = user?.role === ROLES.ADMIN;
  const isApprovalsMode = mode === "approvals";
  const canRequestLeave = Boolean(user?.employeeId);
  const [searchParams] = useSearchParams();
  const initialColumnFilters = useMemo(
    () => statusFilterFromSearch(searchParams),
    [searchParams],
  );

  const loadLeaveRequests = useCallback(
    () => fetchLeaveRequests(isApprovalsMode ? "approvals" : "mine"),
    [isApprovalsMode],
  );

  const { rows, loading, error, reload } = useListData(
    loadLeaveRequests,
    "Failed to load leave requests",
  );
  const table = useDataTable(rows, {
    columns: LEAVE_REQUEST_COLUMNS,
    searchKeys: LEAVE_REQUEST_SEARCH_KEYS,
    initialVisibleColumnIds: getLeaveRequestDefaultVisibleIds(!isApprovalsMode),
    initialColumnFilters,
  });
  const [decisionTarget, setDecisionTarget] = useState(null);
  const [decisionStatus, setDecisionStatus] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [viewTarget, setViewTarget] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  async function openViewModal(request) {
    setViewTarget(request);
    if (!request?.id) return;
    try {
      setViewLoading(true);
      const detailed = await fetchLeaveRequestById(request.id);
      setViewTarget(detailed);
    } catch {
      // Keep list row details if history fetch fails.
    } finally {
      setViewLoading(false);
    }
  }

  function closeViewModal() {
    setViewTarget(null);
    setViewLoading(false);
  }

  function openDecisionModal(request, nextStatus) {
    setDecisionError("");
    setRemarks("");
    setRemarksError("");
    setDecisionStatus(nextStatus);
    setDecisionTarget(request);
  }

  function openApproveModal(request) {
    const nextStatus = isTeamLeadForRequest(request, user?.employeeId)
      ? "TeamLeadApproved"
      : "Approved";
    openDecisionModal(request, nextStatus);
  }

  function openRejectModal(request) {
    openDecisionModal(request, "Rejected");
  }

  function closeDecisionModal() {
    if (deciding) return;
    setDecisionTarget(null);
    setDecisionStatus("");
    setDecisionError("");
    setRemarks("");
    setRemarksError("");
  }

  function updateRemarks(value) {
    setRemarks(value);
    if (remarksError) setRemarksError("");
  }

  async function confirmDecision() {
    if (!decisionTarget || !decisionStatus) return;

    const trimmed = remarks.trim();
    if (decisionStatus === "Rejected" && !trimmed) {
      setRemarksError("Remarks are required when rejecting");
      return;
    }

    try {
      setDeciding(true);
      setDecisionError("");
      setRemarksError("");
      await updateLeaveRequestStatus(
        decisionTarget.id,
        decisionStatus,
        trimmed,
      );
      setDecisionTarget(null);
      setDecisionStatus("");
      setRemarks("");
      reload();
      requestEmsRefresh();
    } catch (err) {
      setDecisionError(err.message || "Failed to update leave request");
    } finally {
      setDeciding(false);
    }
  }

  function openCancelModal(request) {
    setCancelError("");
    setCancelReason("");
    setCancelReasonError("");
    setCancelTarget(request);
  }

  function closeCancelModal() {
    if (cancelling) return;
    setCancelTarget(null);
    setCancelReason("");
    setCancelReasonError("");
    setCancelError("");
  }

  function updateCancelReason(value) {
    setCancelReason(value);
    if (cancelReasonError) setCancelReasonError("");
  }

  async function confirmCancel() {
    if (!cancelTarget) return;

    const reason = cancelReason.trim();
    if (!reason) {
      setCancelReasonError("Cancellation reason is required");
      return;
    }

    try {
      setCancelling(true);
      setCancelError("");
      setCancelReasonError("");
      await cancelLeaveRequest(cancelTarget.id, reason);
      setCancelTarget(null);
      setCancelReason("");
      reload();
      requestEmsRefresh();
    } catch (err) {
      setCancelError(err.message || "Failed to cancel leave request");
    } finally {
      setCancelling(false);
    }
  }

  function getLeaveActions(request) {
    const actions = [];
    const ownRequest = request.employeeId === user?.employeeId;
    const asTeamLead = isTeamLeadForRequest(request, user?.employeeId);

    if (isApprovalsMode) {
      if (request.status === "Pending" && asTeamLead) {
        actions.push({
          label: "Approve (TL)",
          onClick: () => openDecisionModal(request, "TeamLeadApproved"),
        });
        actions.push({
          label: "Reject",
          tone: "danger",
          onClick: () => openRejectModal(request),
        });
      }

      if (isAdmin && canAdminApproveRequest(request)) {
        actions.push({
          label: "Approve (Admin)",
          onClick: () => openDecisionModal(request, "Approved"),
        });
      }

      if (isAdmin && canAdminRejectRequest(request)) {
        actions.push({
          label: "Reject",
          tone: "danger",
          onClick: () => openRejectModal(request),
        });
      }

      if (isHrAdmin && canHrApproveRequest(request)) {
        actions.push({
          label: "Approve (HR)",
          onClick: () => openDecisionModal(request, "Approved"),
        });
      }

      if (isHrAdmin && canHrRejectRequest(request)) {
        actions.push({
          label: "Reject",
          tone: "danger",
          onClick: () => openRejectModal(request),
        });
      }

      return actions;
    }

    // Personal leave list: cancel only (no approve actions on own list).
    if (canCancelLeaveRequest(request) && (ownRequest || isHrAdmin)) {
      actions.push({
        label: "Cancel",
        tone: "danger",
        onClick: () => openCancelModal(request),
      });
    }

    return actions;
  }

  return {
    mode,
    isApprovalsMode,
    leaveRequests: table.rows,
    loading,
    error,
    reload,
    table,
    filterDefs: LEAVE_REQUEST_COLUMN_FILTERS,
    isEmployee,
    isHrAdmin,
    canRequestLeave,
    decisionTarget,
    decisionStatus,
    deciding,
    decisionError,
    remarks,
    remarksError,
    openApproveModal,
    openRejectModal,
    closeDecisionModal,
    updateRemarks,
    confirmDecision,
    cancelTarget,
    cancelReason,
    cancelReasonError,
    cancelling,
    cancelError,
    openCancelModal,
    closeCancelModal,
    updateCancelReason,
    confirmCancel,
    viewTarget,
    viewLoading,
    openViewModal,
    closeViewModal,
    getLeaveActions,
  };
}

export function useLeaveForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ ...EMPTY_LEAVE_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [gender, setGender] = useState("");
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableLeaveTypes = leaveTypesForGender(gender, LEAVE_TYPES);
  const maternitySelected = isMaternityLeave(form.leaveType);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        if (!user?.employeeId) {
          throw new Error("Your account is not linked to an employee record");
        }

        const profile = await fetchAuthProfile();
        const employee = profile?.employee;
        if (!cancelled) {
          const nextGender = employee?.gender || "";
          setGender(nextGender);
          setEmployees([
            {
              id: user.employeeId,
              name: employee?.name || user.name,
              gender: nextGender,
            },
          ]);
          setBalances(
            employee
              ? normalizeLeaveBalances(employee)
              : normalizeLeaveBalances({}),
          );
          const allowedTypes = leaveTypesForGender(nextGender, LEAVE_TYPES);
          setForm((current) => ({
            ...current,
            employeeId: user.employeeId,
            leaveType: allowedTypes.includes(current.leaveType)
              ? current.leaveType
              : allowedTypes[0] || "Casual Leave",
          }));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load form");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.role, user?.employeeId, user?.name]);

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "leaveType") {
        if (isMaternityLeave(value)) {
          next.duration = "full";
          next.halfDaySession = "first_half";
          const maternity = maternityDatesFromDelivery(
            next.expectedDeliveryDate,
          );
          if (maternity) {
            next.startDate = maternity.startDate;
            next.endDate = maternity.endDate;
            next.leaveDays = maternity.leaveDays;
          } else {
            next.startDate = "";
            next.endDate = "";
            next.leaveDays = "";
          }
        } else {
          next.expectedDeliveryDate = "";
          if (next.duration === "half") {
            next.endDate = next.startDate;
            next.leaveDays = calculateLeaveDays(
              next.startDate,
              next.endDate,
              "half",
            );
          } else {
            next.leaveDays = calculateLeaveDays(next.startDate, next.endDate);
          }
        }
      }

      if (field === "duration" && !isMaternityLeave(next.leaveType)) {
        if (value === "half") {
          next.endDate = next.startDate;
          next.leaveDays = calculateLeaveDays(next.startDate, next.endDate, "half");
          if (!next.halfDaySession) next.halfDaySession = "first_half";
        } else {
          next.leaveDays = calculateLeaveDays(next.startDate, next.endDate);
        }
      }

      if (field === "expectedDeliveryDate" && isMaternityLeave(next.leaveType)) {
        const maternity = maternityDatesFromDelivery(value);
        if (maternity) {
          next.startDate = maternity.startDate;
          next.endDate = maternity.endDate;
          next.leaveDays = maternity.leaveDays;
        } else {
          next.startDate = "";
          next.endDate = "";
          next.leaveDays = "";
        }
      }

      if (
        (field === "startDate" || field === "endDate") &&
        !isMaternityLeave(next.leaveType)
      ) {
        if (next.duration === "half") {
          const dateValue = field === "startDate" ? value : next.startDate;
          next.startDate = dateValue;
          next.endDate = dateValue;
          next.leaveDays = calculateLeaveDays(dateValue, dateValue, "half");
        } else {
          next.leaveDays = calculateLeaveDays(
            field === "startDate" ? value : next.startDate,
            field === "endDate" ? value : next.endDate,
          );
        }
      }
      return next;
    });
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === "duration" || field === "startDate") {
        delete next.endDate;
        delete next.leaveDays;
        delete next.halfDaySession;
      }
      return next;
    });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validation = validateLeaveForm(form, { gender });
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setError(validation.message);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setFieldErrors({});
      await createLeaveRequest(toLeavePayload(form));
      requestEmsRefresh();
      navigate("/leave-requests");
    } catch (err) {
      setError(err.message || "Failed to create leave request");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    navigate("/leave-requests");
  }

  return {
    form,
    fieldErrors,
    employees,
    gender,
    availableLeaveTypes,
    maternitySelected,
    halfDaySelected: !maternitySelected && form.duration === "half",
    maternityHelp: MATERNITY_LEAVE_HELP,
    balances,
    loading,
    saving,
    error,
    updateField,
    handleSubmit,
    handleCancel,
  };
}
