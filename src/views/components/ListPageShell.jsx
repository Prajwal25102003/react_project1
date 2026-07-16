import PageCard from "./PageCard.jsx";

function ListPageShell({
  pageName,
  title,
  subtitle,
  loading,
  error,
  loadingLabel,
  actions,
  children,
}) {
  return (
    <>
      <div className="mb-6 flex min-w-0 max-w-full flex-wrap items-center justify-between gap-3">
        <h2 className="min-w-0 text-xl font-semibold text-gray-800">{pageName}</h2>
        {actions ? (
          <div className="ml-auto shrink-0">{actions}</div>
        ) : null}
      </div>
      <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
        <PageCard title={title} subtitle={subtitle} bodyClassName="p-5 sm:p-6">
          {loading ? (
            <p className="text-theme-sm text-gray-500">{loadingLabel}</p>
          ) : null}

          {error ? (
            <p className="text-theme-sm text-error-600">{error}</p>
          ) : null}

          {!loading && !error ? children : null}
        </PageCard>
      </div>
    </>
  );
}

export default ListPageShell;
