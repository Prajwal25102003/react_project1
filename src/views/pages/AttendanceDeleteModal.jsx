import ConfirmModal from "../components/ConfirmModal.jsx";

function AttendanceDeleteModal({
  record,
  deleting,
  error,
  onClose,
  onConfirm,
}) {
  if (!record) return null;

  return (
    <ConfirmModal
      title="Delete Attendance"
      description={`Delete attendance for ${record.employeeId || record.employeeName} on ${record.date}?`}
      error={error}
      confirmLabel="Delete"
      confirmingLabel="Deleting…"
      confirming={deleting}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

export default AttendanceDeleteModal;
