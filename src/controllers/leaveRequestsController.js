import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./authContext.jsx";
import { useToast } from "./toastContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { useListData } from "./listController.js";
import {
  cancelLeaveRequest,
  createLeaveRequest,
  fetchLeaveRequestById,
  fetchLeaveRequests,
  updateLeaveRequestStatus,
  uploadLeaveMedicalDocument,
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
  isMedicalLeave,
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
import { ROLES } from "../models/authModel.js";
import { userCanApproveLeaves } from "../models/navModel.js";
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

export function useLeaveRequests() {
  const { user } = useAuth();
  const toast = useToast();
  const isHr = user?.role === ROLES.HR;
  const isAdmin = user?.role === ROLES.ADMIN;
  const isDepartmentHead = Boolean(user?.isDepartmentHead);
  const canApproveLeaves = userCanApproveLeaves(user?.role, {
    isDepartmentHead,
  });
  // Admin maintains modules and is not an employee leave requester.
  const canRequestLeave =
    Boolean(user?.employeeId) && user?.role !== ROLES.ADMIN;
  // Admin only reviews HR leave; HR / department heads use the unified queue.
  const listApiScope = isAdmin
    ? "admin-hr"
    : canApproveLeaves
      ? "unified"
      : "mine";
  const [searchParams, setSearchParams] = useSearchParams();
  const initialColumnFilters = useMemo(
    () => statusFilterFromSearch(searchParams),
    [searchParams],
  );
  const urlLeaveId = searchParams.get("id");
  const urlDirection = searchParams.get("direction"); // sent | received

  // Department heads land on their team queue so approvals are visible first.
  const [listScope, setListScope] = useState(() => {
    if (isDepartmentHead || (canApproveLeaves && !canRequestLeave)) {
      return "employees";
    }
    return canRequestLeave ? "mine" : "employees";
  });

  const listScopeOptions = useMemo(() => {
    if (isAdmin) return [];
    if (!canApproveLeaves) return [];
    const options = [];
    if (canRequestLeave) {
      options.push({ value: "mine", label: "My" });
    }
    options.push({
      value: "employees",
      label: isDepartmentHead && !isHr ? "My Team" : "Employees",
    });
    return options;
  }, [canApproveLeaves, canRequestLeave, isAdmin, isDepartmentHead, isHr]);

  useEffect(() => {
    if (!canApproveLeaves || isAdmin) return;
    if (!canRequestLeave && listScope === "mine") {
      setListScope("employees");
    }
  }, [canApproveLeaves, canRequestLeave, isAdmin, listScope]);

  const loadLeaveRequests = useCallback(
    () => fetchLeaveRequests(listApiScope),
    [listApiScope],
  );

  const { rows, loading, error, reload } = useListData(
    loadLeaveRequests,
    "Failed to load leave requests",
  );

  const scopedRows = useMemo(() => {
    if (isAdmin) return rows || [];
    if (!canApproveLeaves) return rows || [];
    const myId = user?.employeeId;
    if (listScope === "mine") {
      if (!myId) return [];
      return (rows || []).filter((row) => row.employeeId === myId);
    }
    // employees
    if (!myId) return rows || [];
    return (rows || []).filter((row) => row.employeeId !== myId);
  }, [canApproveLeaves, isAdmin, listScope, rows, user?.employeeId]);

  const table = useDataTable(scopedRows, {
    columns: LEAVE_REQUEST_COLUMNS,
    searchKeys: LEAVE_REQUEST_SEARCH_KEYS,
    initialVisibleColumnIds: getLeaveRequestDefaultVisibleIds(true),
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
  const [viewDirection, setViewDirection] = useState(null); // sent | received | null

  // Auto-open the matching leave modal when arriving from a Sent/Received notification
  useEffect(() => {
    if (!urlLeaveId) return;

    let cancelled = false;

    async function openFromUrl() {
      try {
        setViewLoading(true);
        const detailed = await fetchLeaveRequestById(urlLeaveId);
        if (cancelled) return;
        setViewTarget(detailed);
        setViewDirection(
          urlDirection === "sent" || urlDirection === "received"
            ? urlDirection
            : null,
        );
        // Clear deep-link params after opening so refresh doesn't re-open
        setSearchParams(
          (current) => {
            const next = new URLSearchParams(current);
            next.delete("id");
            next.delete("direction");
            return next;
          },
          { replace: true },
        );
      } catch {
        if (cancelled) return;
        setSearchParams(
          (current) => {
            const next = new URLSearchParams(current);
            next.delete("id");
            next.delete("direction");
            return next;
          },
          { replace: true },
        );
      } finally {
        if (!cancelled) setViewLoading(false);
      }
    }

    openFromUrl();
    return () => {
      cancelled = true;
    };
  }, [urlLeaveId, urlDirection, setSearchParams]);

  async function openViewModal(request) {
    setViewDirection(null);
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
    setViewDirection(null);
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
      const approved =
        decisionStatus === "Approved" || decisionStatus === "TeamLeadApproved";
      toast.success(
        approved
          ? "Leave request approved successfully"
          : "Leave request rejected successfully",
      );
      setDecisionTarget(null);
      setDecisionStatus("");
      setRemarks("");
      reload();
      requestEmsRefresh();
    } catch (err) {
      setDecisionError(err.message || "Failed to update leave request");
      toast.error(err.message || "Failed to update leave request");
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
      toast.success("Leave request cancelled successfully");
      setCancelTarget(null);
      setCancelReason("");
      reload();
      requestEmsRefresh();
    } catch (err) {
      setCancelError(err.message || "Failed to cancel leave request");
      toast.error(err.message || "Failed to cancel leave request");
    } finally {
      setCancelling(false);
    }
  }

  function getLeaveActions(request) {
    const actions = [];
    const asTeamLead = isTeamLeadForRequest(request, user?.employeeId);

    if (canApproveLeaves) {
      if (request.status === "Pending" && asTeamLead) {
        actions.push({
          label: "Approve (Head)",
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

      if (isHr && canHrApproveRequest(request)) {
        actions.push({
          label: "Approve (HR)",
          onClick: () => openDecisionModal(request, "Approved"),
        });
      }

      if (isHr && canHrRejectRequest(request)) {
        actions.push({
          label: "Reject",
          tone: "danger",
          onClick: () => openRejectModal(request),
        });
      }
    }

    if (
      canCancelLeaveRequest(request, {
        employeeId: user?.employeeId,
      })
    ) {
      actions.push({
        label: "Cancel",
        tone: "danger",
        onClick: () => openCancelModal(request),
      });
    }

    return actions;
  }

  return {
    canApproveLeaves,
    isAdmin,
    isDepartmentHead,
    listScope,
    setListScope,
    listScopeOptions,
    leaveRequests: table.rows,
    loading,
    error,
    reload,
    table,
    filterDefs: LEAVE_REQUEST_COLUMN_FILTERS,
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
    viewDirection,
    openViewModal,
    closeViewModal,
    getLeaveActions,
  };
}

export function useLeaveForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ ...EMPTY_LEAVE_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [gender, setGender] = useState("");
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [error, setError] = useState("");

  const availableLeaveTypes = leaveTypesForGender(gender, LEAVE_TYPES);
  const maternitySelected = isMaternityLeave(form.leaveType);
  const medicalSelected = isMedicalLeave(form.leaveType);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        if (user?.role === ROLES.ADMIN) {
          throw new Error("Admin accounts cannot submit leave requests");
        }

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
        if (!isMedicalLeave(value)) {
          next.attachmentUrl = "";
          next.attachmentName = "";
        }
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

  async function handleAttachmentChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setUploadingAttachment(true);
      setError("");
      setFieldErrors((current) => {
        const next = { ...current };
        delete next.attachmentUrl;
        return next;
      });
      const uploaded = await uploadLeaveMedicalDocument(file);
      setForm((current) => ({
        ...current,
        attachmentUrl: uploaded.url,
        attachmentName: uploaded.originalName || file.name,
      }));
    } catch (err) {
      setError(err.message || "Failed to upload medical document");
      toast.error(err.message || "Failed to upload medical document");
    } finally {
      setUploadingAttachment(false);
    }
  }

  function clearAttachment() {
    setForm((current) => ({
      ...current,
      attachmentUrl: "",
      attachmentName: "",
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.attachmentUrl;
      return next;
    });
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
      toast.crudSuccess("Leave request", "create");
      requestEmsRefresh();
      navigate("/leave-requests");
    } catch (err) {
      setError(err.message || "Failed to create leave request");
      toast.error(err.message || "Failed to create leave request");
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
    medicalSelected,
    halfDaySelected: !maternitySelected && form.duration === "half",
    maternityHelp: MATERNITY_LEAVE_HELP,
    balances,
    loading,
    saving,
    uploadingAttachment,
    error,
    updateField,
    handleAttachmentChange,
    clearAttachment,
    handleSubmit,
    handleCancel,
  };
}
