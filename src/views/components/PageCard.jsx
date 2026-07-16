function PageCard({ title, subtitle, children, bodyClassName = "", actions }) {
  const hasHeaderText = Boolean(title || subtitle);
  const hasHeader = hasHeaderText || Boolean(actions);

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {hasHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-5">
          {hasHeaderText ? (
            <div>
              {title ? (
                <h3 className="text-base font-medium text-gray-800">{title}</h3>
              ) : null}
              {subtitle ? (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              ) : null}
            </div>
          ) : (
            <span />
          )}
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      <div
        className={`${hasHeader ? "border-t border-gray-100" : ""} ${bodyClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

export default PageCard;
