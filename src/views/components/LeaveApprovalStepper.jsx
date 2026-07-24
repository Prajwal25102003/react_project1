function StepIcon({ state, index }) {
  if (state === "completed") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-500 text-white shadow-theme-xs ring-4 ring-success-50">
        <svg
          className="fill-current"
          width="13"
          height="13"
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.095 2.706a.75.75 0 0 1 .049 1.06l-4.5 5a.75.75 0 0 1-1.083.026l-2.25-2.25a.75.75 0 1 1 1.06-1.06l1.696 1.695 3.968-4.41a.75.75 0 0 1 1.06-.061Z"
          />
        </svg>
      </span>
    );
  }

  if (state === "rejected") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-error-500 text-white shadow-theme-xs ring-4 ring-error-50">
        <svg
          className="fill-current"
          width="11"
          height="11"
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          <path d="M1.47 1.47a.75.75 0 0 1 1.06 0L5 3.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L6.06 5l2.47 2.47a.75.75 0 1 1-1.06 1.06L5 6.06 2.53 8.53a.75.75 0 0 1-1.06-1.06L3.94 5 1.47 2.53a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </span>
    );
  }

  if (state === "cancelled") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-500 text-white shadow-theme-xs ring-4 ring-warning-50">
        <svg
          className="fill-current"
          width="11"
          height="11"
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          <path d="M1.47 1.47a.75.75 0 0 1 1.06 0L5 3.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L6.06 5l2.47 2.47a.75.75 0 1 1-1.06 1.06L5 6.06 2.53 8.53a.75.75 0 0 1-1.06-1.06L3.94 5 1.47 2.53a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </span>
    );
  }

  if (state === "current") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-success-500 bg-success-50 text-theme-xs font-semibold text-success-600 ring-4 ring-success-50">
        {index + 1}
      </span>
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-theme-xs font-medium text-gray-400">
      {index + 1}
    </span>
  );
}

function connectorClass(leftState) {
  // Green path through accepted steps; reject/cancel stops the green trail.
  if (leftState === "completed") return "bg-success-500";
  return "bg-gray-200";
}

function labelClass(state) {
  if (state === "completed") {
    return "text-success-700";
  }
  if (state === "current") {
    return "text-success-600";
  }
  if (state === "rejected") {
    return "text-error-600";
  }
  if (state === "cancelled") {
    return "text-warning-600";
  }
  return "text-gray-400";
}

function LeaveApprovalStepper({ steps = [] }) {
  if (!steps.length) return null;

  return (
    <div className="w-full min-w-0 max-w-[340px]" aria-label="Approval progress">
      {/* Icons + connectors */}
      <div className="flex items-center px-1">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <span
                    className={`h-0.5 flex-1 ${connectorClass(steps[index - 1].state)}`}
                    aria-hidden="true"
                  />
                ) : (
                  <span className="flex-1" aria-hidden="true" />
                )}
                <StepIcon state={step.state} index={index} />
                {!isLast ? (
                  <span
                    className={`h-0.5 flex-1 ${connectorClass(step.state)}`}
                    aria-hidden="true"
                  />
                ) : (
                  <span className="flex-1" aria-hidden="true" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels in equal columns so text never overlaps */}
      <ol
        className={`mt-2.5 grid gap-x-1 ${
          steps.length <= 2
            ? "grid-cols-2"
            : steps.length === 3
              ? "grid-cols-3"
              : "grid-cols-4"
        }`}
      >
        {steps.map((step) => (
          <li key={`${step.id}-label`} className="min-w-0 text-center">
            <span
              className={`block whitespace-normal break-words text-[10px] font-semibold leading-tight sm:text-theme-xs ${labelClass(step.state)}`}
              title={step.label}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default LeaveApprovalStepper;
