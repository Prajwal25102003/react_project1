import ConfirmModal from "../components/ConfirmModal.jsx";

function LeaveCancelModal({
  request,
  cancelling,
  error,
  onClose,
  onConfirm,
}) {
  if (!request) return null;

  return (
    <ConfirmModal
      title="Cancel Leave Request"
      description={`Cancel your ${request.leaveType} request (${request.startDate} to ${request.endDate})? This cannot be undone.`}
      error={error}
      confirmLabel="Cancel Request"
      confirmingLabel="Cancelling…"
      confirming={cancelling}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

export default LeaveCancelModal;
