import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { fetchHolidays } from "../services/holidaysService.js";
import {
  EMPTY_LEAVE_FORM,
  LEAVE_TYPES,
  MAX_MEDICAL_ATTACHMENTS,
  actorMatchesCurrentStep,
  leaveRequestNeedsAttention,
  leaveScopeNotificationCounts,
  calculateLeaveDays,
  canCancelLeaveRequest,
  hierarchyStepLabel,
  currentHierarchyStep,
  isMedicalLeave,
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
import { useModuleNotificationAttention } from "./moduleNotificationAttentionController.js";

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
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const isHr = user?.role === ROLES.HR;
  const isAdmin = user?.role === ROLES.ADMIN;
  const isDepartmentHead = Boolean(user?.isDepartmentHead);
  const isNamedLeaveApprover = Boolean(user?.isNamedLeaveApprover);
  const canApproveLeaves = userCanApproveLeaves(user?.role, {
    isDepartmentHead,
    isNamedLeaveApprover,
  });
  // Admin maintains modules and is not an employee leave requester.
  const canRequestLeave =
    Boolean(user?.employeeId) && user?.role !== ROLES.ADMIN;
  // Admin reviews leave whenever hierarchy current step is Admin (any category).
  const listApiScope = isAdmin
    ? "admin"
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
  const seenUserKey = user?.id || user?.email || user?.employeeId || "";

  const { acknowledgeAttention, withAttention } = useModuleNotificationAttention({
    navId: "leave-requests",
    role: user?.role,
    seenUserKey,
    enabled: Boolean(seenUserKey && user?.employeeId),
  });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshUser();
      } catch {
        if (!cancelled) {
          /* keep existing session */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

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

  // When this user becomes department head (e.g. after reassignment), open team queue.
  const wasDepartmentHeadRef = useRef(isDepartmentHead);
  useEffect(() => {
    const becameHead = isDepartmentHead && !wasDepartmentHeadRef.current;
    wasDepartmentHeadRef.current = isDepartmentHead;
    if (becameHead && canApproveLeaves && !isAdmin) {
      setListScope("employees");
    }
  }, [isDepartmentHead, canApproveLeaves, isAdmin]);

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

  const actorContext = useMemo(
    () => ({
      employeeId: user?.employeeId,
      role: user?.role,
    }),
    [user?.employeeId, user?.role],
  );

  const scopeBadgeCounts = useMemo(
    () => leaveScopeNotificationCounts(rows || [], actorContext),
    [rows, actorContext],
  );

  const listScopeOptionsWithBadges = useMemo(
    () =>
      (listScopeOptions || []).map((option) => ({
        ...option,
        badge:
          option.value === "mine"
            ? scopeBadgeCounts.mine
            : option.value === "employees"
              ? scopeBadgeCounts.employees
              : 0,
      })),
    [listScopeOptions, scopeBadgeCounts],
  );

  const tableRows = useMemo(
    () =>
      withAttention(
        (scopedRows || []).map((row) => ({
          ...row,
          needsAction: leaveRequestNeedsAttention(row, actorContext),
        })),
      ).map((row) => ({
        ...row,
        needsAction: Boolean(row.needsAction || row.needsAttention),
      })),
    [scopedRows, actorContext, withAttention],
  );

  const isPersonalLeaveList =
    listScope === "mine" || (!canApproveLeaves && canRequestLeave);

  const table = useDataTable(tableRows, {
    columns: LEAVE_REQUEST_COLUMNS,
    searchKeys: LEAVE_REQUEST_SEARCH_KEYS,
    initialVisibleColumnIds: getLeaveRequestDefaultVisibleIds(
      isPersonalLeaveList,
    ),
    initialColumnFilters,
  });

  const [decisionTarget, setDecisionTarget] = useState(null);
  const [decisionStatus, setDecisionStatus] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);
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
        acknowledgeAttention(detailed);
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
  }, [urlLeaveId, urlDirection, setSearchParams, acknowledgeAttention]);

  async function openViewModal(request) {
    setViewDirection(null);
    setViewTarget(request);
    if (request) acknowledgeAttention(request);
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
    setDecisionLoading(Boolean(request?.id));

    if (!request?.id) {
      setDecisionLoading(false);
      return;
    }

    fetchLeaveRequestById(request.id)
      .then((detailed) => {
        setDecisionTarget((current) =>
          current?.id === detailed.id ? detailed : current,
        );
      })
      .catch(() => {
        // Keep the list/view row if the detail fetch fails.
      })
      .finally(() => {
        setDecisionLoading(false);
      });
  }

  function openApproveModal(request) {
    openDecisionModal(request, "Approved");
  }

  function approveFromView() {
    if (!viewTarget) return;
    const request = viewTarget;
    closeViewModal();
    openApproveModal(request);
  }

  function rejectFromView() {
    if (!viewTarget) return;
    const request = viewTarget;
    closeViewModal();
    openRejectModal(request);
  }

  function openRejectModal(request) {
    openDecisionModal(request, "Rejected");
  }

  const canApproveViewTarget = Boolean(
    viewTarget &&
      actorMatchesCurrentStep(viewTarget, {
        employeeId: user?.employeeId,
        role: user?.role,
      }),
  );

  function closeDecisionModal() {
    if (deciding) return;
    setDecisionTarget(null);
    setDecisionStatus("");
    setDecisionLoading(false);
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
      const approved = decisionStatus === "Approved";
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
    const canAct = actorMatchesCurrentStep(request, {
      employeeId: user?.employeeId,
      role: user?.role,
    });

    // Match current hierarchy step (live department head), not only session flags.
    if (canAct) {
      const step = currentHierarchyStep(request);
      const label = step ? hierarchyStepLabel(step) : "Approve";
      actions.push({
        label: `Approve (${label})`,
        icon: "check-circle",
        iconSize: 32,
        onClick: () => openApproveModal(request),
      });
      actions.push({
        label: "Reject",
        icon: "x-circle",
        tone: "danger",
        onClick: () => openRejectModal(request),
      });
    }

    if (
      canCancelLeaveRequest(request, {
        employeeId: user?.employeeId,
        role: user?.role,
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
    isHr,
    isDepartmentHead,
    listScope,
    setListScope,
    listScopeOptions: listScopeOptionsWithBadges,
    leaveRequests: table.rows,
    loading,
    error,
    reload,
    table,
    filterDefs: LEAVE_REQUEST_COLUMN_FILTERS,
    canRequestLeave,
    decisionTarget,
    decisionStatus,
    decisionLoading,
    deciding,
    decisionError,
    remarks,
    remarksError,
    openApproveModal,
    approveFromView,
    rejectFromView,
    canApproveViewTarget,
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
  const [holidayDates, setHolidayDates] = useState(() => new Set());
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

        const [profile, holidaysResult] = await Promise.all([
          fetchAuthProfile(),
          fetchHolidays().catch(() => ({ holidays: [] })),
        ]);
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
          setHolidayDates(
            new Set(
              (holidaysResult.holidays || [])
                .map((item) => String(item.date || "").trim())
                .filter(Boolean),
            ),
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

  useEffect(() => {
    setForm((current) => {
      if (isMaternityLeave(current.leaveType)) return current;
      if (!current.startDate) return current;
      const duration = current.duration === "half" ? "half" : "full";
      const endDate =
        duration === "half" ? current.startDate : current.endDate;
      const leaveDays = calculateLeaveDays(
        current.startDate,
        endDate,
        duration,
        holidayDates,
      );
      if (leaveDays === current.leaveDays) return current;
      return { ...current, leaveDays };
    });
  }, [holidayDates]);

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "leaveType") {
        if (!isMedicalLeave(value)) {
          next.attachments = [];
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
              holidayDates,
            );
          } else {
            next.leaveDays = calculateLeaveDays(
              next.startDate,
              next.endDate,
              "full",
              holidayDates,
            );
          }
        }
      }

      if (field === "duration" && !isMaternityLeave(next.leaveType)) {
        if (value === "half") {
          next.endDate = next.startDate;
          next.leaveDays = calculateLeaveDays(
            next.startDate,
            next.endDate,
            "half",
            holidayDates,
          );
          if (!next.halfDaySession) next.halfDaySession = "first_half";
        } else {
          next.leaveDays = calculateLeaveDays(
            next.startDate,
            next.endDate,
            "full",
            holidayDates,
          );
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
          next.leaveDays = calculateLeaveDays(
            dateValue,
            dateValue,
            "half",
            holidayDates,
          );
        } else {
          next.leaveDays = calculateLeaveDays(
            field === "startDate" ? value : next.startDate,
            field === "endDate" ? value : next.endDate,
            "full",
            holidayDates,
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
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const currentCount = form.attachments?.length || 0;
    const slotsLeft = MAX_MEDICAL_ATTACHMENTS - currentCount;
    if (slotsLeft <= 0) {
      const message = `You can upload up to ${MAX_MEDICAL_ATTACHMENTS} documents`;
      setError(message);
      toast.error(message);
      return;
    }

    const toUpload = files.slice(0, slotsLeft);
    if (files.length > slotsLeft) {
      toast.error(
        `Only ${slotsLeft} more file${slotsLeft === 1 ? "" : "s"} can be added (max ${MAX_MEDICAL_ATTACHMENTS}).`,
      );
    }

    try {
      setUploadingAttachment(true);
      setError("");
      setFieldErrors((current) => {
        const next = { ...current };
        delete next.attachments;
        return next;
      });

      const uploaded = [];
      for (const file of toUpload) {
        const result = await uploadLeaveMedicalDocument(file);
        uploaded.push({
          url: result.url,
          name: result.originalName || file.name,
        });
      }

      setForm((current) => ({
        ...current,
        attachments: [...(current.attachments || []), ...uploaded],
      }));
    } catch (err) {
      setError(err.message || "Failed to upload medical document");
      toast.error(err.message || "Failed to upload medical document");
    } finally {
      setUploadingAttachment(false);
    }
  }

  function removeAttachment(url) {
    setForm((current) => ({
      ...current,
      attachments: (current.attachments || []).filter(
        (item) => item.url !== url,
      ),
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.attachments;
      return next;
    });
  }

  function clearAttachments() {
    setForm((current) => ({
      ...current,
      attachments: [],
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.attachments;
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validation = validateLeaveForm(form, { gender, holidayDates });
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
    removeAttachment,
    clearAttachments,
    handleSubmit,
    handleCancel,
  };
}
