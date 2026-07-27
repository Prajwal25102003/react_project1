import ConfirmModal from "../components/ConfirmModal.jsx";

function EmployeeDeleteModal({
  employee,
  deleting,
  error,
  onClose,
  onConfirm,
}) {
  if (!employee) return null;

  const isAdminAccount =
    employee.isAdminAccount || employee.loginRole === "admin";

  return (
    <ConfirmModal
      title={isAdminAccount ? "Remove Admin" : "Delete Employee"}
      description={
        isAdminAccount
          ? `Remove admin access for ${employee.name}? Their admin login will be deleted.`
          : `Are you sure you want to delete ${employee.name}? Related attendance and leave records will also be removed.`
      }
      error={error}
      confirmLabel={isAdminAccount ? "Remove Admin" : "Delete"}
      confirmingLabel={isAdminAccount ? "Removing…" : "Deleting…"}
      confirming={deleting}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

export default EmployeeDeleteModal;
