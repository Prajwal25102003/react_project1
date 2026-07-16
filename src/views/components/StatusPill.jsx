function StatusPill({ label, statusClass }) {
  return (
    <p
      className={`inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium ${statusClass}`}
    >
      {label}
    </p>
  );
}

export default StatusPill;
