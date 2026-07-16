import ConfirmModal from "../components/ConfirmModal.jsx";

function EmployeeDeleteModal({
  employee,
  deleting,
  error,
  onClose,
  onConfirm,
}) {
  if (!employee) return null;

  return (
    <ConfirmModal
      title="Delete Employee"
      description={`Are you sure you want to delete ${employee.name}? Related attendance and leave records will also be removed.`}
      error={error}
      confirmLabel="Delete"
      confirmingLabel="Deleting…"
      confirming={deleting}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

export default EmployeeDeleteModal;
