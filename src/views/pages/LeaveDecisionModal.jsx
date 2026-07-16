import ConfirmModal from "../components/ConfirmModal.jsx";

function LeaveDecisionModal({
  request,
  status,
  deciding,
  error,
  onClose,
  onConfirm,
}) {
  if (!request || !status) return null;

  const isApprove = status === "Approved";

  return (
    <ConfirmModal
      title={isApprove ? "Approve Leave Request" : "Reject Leave Request"}
      description={
        isApprove
          ? `Approve ${request.leaveType} for ${request.employeeName} (${request.startDate} to ${request.endDate})?`
          : `Reject ${request.leaveType} for ${request.employeeName} (${request.startDate} to ${request.endDate})?`
      }
      error={error}
      confirmLabel={isApprove ? "Approve" : "Reject"}
      confirmingLabel="Saving…"
      confirming={deciding}
      confirmVariant={isApprove ? "primary" : "danger"}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

export default LeaveDecisionModal;
