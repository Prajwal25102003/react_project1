function StatusPill({ label, statusClass }) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-theme-xs font-medium leading-4 whitespace-nowrap ${statusClass}`}
    >
      {label}
    </span>
  );
}

export default StatusPill;
