import ConfirmModal from "../components/ConfirmModal.jsx";

function HolidayDeleteModal({
  holiday,
  deleting,
  error,
  onClose,
  onConfirm,
}) {
  if (!holiday) return null;

  return (
    <ConfirmModal
      title="Delete Holiday"
      description={`Delete ${holiday.name} on ${holiday.dateLabel}? This cannot be undone.`}
      error={error}
      confirmLabel="Delete"
      confirmingLabel="Deleting…"
      confirming={deleting}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

export default HolidayDeleteModal;
