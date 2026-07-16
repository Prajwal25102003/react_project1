import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./authContext.jsx";
import { useDataTable } from "./dataTableController.js";
import { useListData } from "./listController.js";
import {
  cancelLeaveRequest,
  createLeaveRequest,
  fetchLeaveRequests,
  updateLeaveRequestStatus,
} from "../services/leaveRequestsService.js";
import {
  EMPTY_LEAVE_FORM,
  calculateLeaveDays,
  toLeavePayload,
  validateLeaveForm,
} from "../models/leaveRequestsModel.js";
import {
  LEAVE_REQUEST_COLUMN_FILTERS,
  LEAVE_REQUEST_COLUMNS,
  LEAVE_REQUEST_SEARCH_KEYS,
  getLeaveRequestDefaultVisibleIds,
} from "../models/leaveRequestsTableModel.js";
import { ROLES } from "../models/authModel.js";
import { requestEmsRefresh } from "../utils/emsRefresh.js";

export function useLeaveRequests() {
  const { user } = useAuth();
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const { rows, loading, error, reload } = useListData(
    fetchLeaveRequests,
    "Failed to load leave requests",
  );
  const table = useDataTable(rows, {
    columns: LEAVE_REQUEST_COLUMNS,
    searchKeys: LEAVE_REQUEST_SEARCH_KEYS,
    initialVisibleColumnIds: getLeaveRequestDefaultVisibleIds(isEmployee),
  });
  const [decisionTarget, setDecisionTarget] = useState(null);
  const [decisionStatus, setDecisionStatus] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  function openApproveModal(request) {
    setDecisionError("");
    setDecisionStatus("Approved");
    setDecisionTarget(request);
  }

  function openRejectModal(request) {
    setDecisionError("");
    setDecisionStatus("Rejected");
    setDecisionTarget(request);
  }

  function closeDecisionModal() {
    if (deciding) return;
    setDecisionTarget(null);
    setDecisionStatus("");
    setDecisionError("");
  }

  async function confirmDecision() {
    if (!decisionTarget || !decisionStatus) return;

    try {
      setDeciding(true);
      setDecisionError("");
      await updateLeaveRequestStatus(decisionTarget.id, decisionStatus);
      setDecisionTarget(null);
      setDecisionStatus("");
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
    setCancelTarget(request);
  }

  function closeCancelModal() {
    if (cancelling) return;
    setCancelTarget(null);
    setCancelError("");
  }

  async function confirmCancel() {
    if (!cancelTarget) return;

    try {
      setCancelling(true);
      setCancelError("");
      await cancelLeaveRequest(cancelTarget.id);
      setCancelTarget(null);
      reload();
      requestEmsRefresh();
    } catch (err) {
      setCancelError(err.message || "Failed to cancel leave request");
    } finally {
      setCancelling(false);
    }
  }

  return {
    leaveRequests: table.rows,
    loading,
    error,
    reload,
    table,
    filterDefs: LEAVE_REQUEST_COLUMN_FILTERS,
    isEmployee,
    decisionTarget,
    decisionStatus,
    deciding,
    decisionError,
    openApproveModal,
    openRejectModal,
    closeDecisionModal,
    confirmDecision,
    cancelTarget,
    cancelling,
    cancelError,
    openCancelModal,
    closeCancelModal,
    confirmCancel,
  };
}

export function useLeaveForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ ...EMPTY_LEAVE_FORM });
  const [fieldErrors, setFieldErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        if (user?.role !== ROLES.EMPLOYEE) {
          throw new Error("Only employees can request leave");
        }
        if (!user?.employeeId) {
          throw new Error("Your account is not linked to an employee record");
        }

        if (!cancelled) {
          setEmployees([
            {
              id: user.employeeId,
              name: user.name,
            },
          ]);
          setForm((current) => ({
            ...current,
            employeeId: user.employeeId,
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
      if (field === "startDate" || field === "endDate") {
        next.leaveDays = calculateLeaveDays(
          field === "startDate" ? value : next.startDate,
          field === "endDate" ? value : next.endDate,
        );
      }
      return next;
    });
    setFieldErrors((current) => {
      if (!current[field] && field !== "startDate" && field !== "endDate") {
        return current;
      }
      const next = { ...current };
      delete next[field];
      if (field === "startDate" || field === "endDate") {
        delete next.leaveDays;
        delete next.endDate;
      }
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validation = validateLeaveForm(form);
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
    loading,
    saving,
    error,
    updateField,
    handleSubmit,
    handleCancel,
  };
}
