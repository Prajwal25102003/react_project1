function Breadcrumb({ pageName }) {
  return (
    <div className="mb-6 flex min-w-0 max-w-full flex-wrap items-center justify-between gap-3">
      <h2 className="min-w-0 text-xl font-semibold text-gray-800">{pageName}</h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          <li>
            <span className="text-sm text-gray-500">Home</span>
          </li>
          <li>
            <svg
              className="stroke-current"
              width="17"
              height="16"
              viewBox="0 0 17 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                stroke=""
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </li>
          <li>
            <span className="text-sm text-gray-800">{pageName}</span>
          </li>
        </ol>
      </nav>
    </div>
  );
}

export default Breadcrumb;
