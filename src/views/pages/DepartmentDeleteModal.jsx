import ConfirmModal from "../components/ConfirmModal.jsx";

function DepartmentDeleteModal({
  department,
  deleting,
  error,
  onClose,
  onConfirm,
}) {
  if (!department) return null;

  const hasEmployees = Number(department.employeeCount) > 0;

  return (
    <ConfirmModal
      title="Delete Department"
      description={
        hasEmployees
          ? `${department.name} has ${department.employeeCount} employee(s) assigned. Reassign or remove them before deleting this department.`
          : `Are you sure you want to delete ${department.name}? This action cannot be undone.`
      }
      error={error}
      confirmLabel="Delete"
      confirmingLabel="Deleting…"
      confirming={deleting}
      onClose={onClose}
      onConfirm={hasEmployees ? undefined : onConfirm}
    />
  );
}

export default DepartmentDeleteModal;
