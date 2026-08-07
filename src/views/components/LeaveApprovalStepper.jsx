import { useEffect, useState } from "react";

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

  if (state === "rejected" || state === "inactive") {
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
  // Green path through accepted steps; reject/cancel/inactive stops the green trail.
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
  if (state === "rejected" || state === "inactive") {
    return "text-error-600";
  }
  if (state === "cancelled") {
    return "text-warning-600";
  }
  return "text-gray-400";
}

function chipShellClass(state) {
  if (state === "completed") {
    return "border-success-200 bg-success-50";
  }
  if (state === "current") {
    return "border-success-200 bg-success-50";
  }
  if (state === "rejected" || state === "inactive") {
    return "border-error-200 bg-error-50";
  }
  if (state === "cancelled") {
    return "border-warning-200 bg-warning-50";
  }
  return "border-gray-200 bg-gray-50";
}

function chipPrefix(state, label) {
  if (state === "rejected") return "Rejected";
  if (state === "inactive") return "Unavailable";
  if (state === "cancelled") {
    return label === "Cancelled" ? null : "Cancelled";
  }
  if (state === "current") return "Awaiting";
  return null;
}

/** Prefer outcome / current action over completed “Requested”. */
function defaultFocusIndex(steps) {
  const failed = steps.findIndex((step) =>
    ["rejected", "inactive", "cancelled"].includes(step.state),
  );
  if (failed >= 0) return failed;

  const current = steps.findIndex((step) => step.state === "current");
  if (current >= 0) return current;

  let lastCompleted = 0;
  steps.forEach((step, index) => {
    if (step.state === "completed") lastCompleted = index;
  });
  return lastCompleted;
}

function stepAriaLabel(step) {
  const prefix = chipPrefix(step.state, step.label);
  return [prefix, step.label, step.name].filter(Boolean).join(" · ");
}

function LeaveApprovalStepper({ steps = [] }) {
  const defaultIndex = defaultFocusIndex(steps);
  const [focusIndex, setFocusIndex] = useState(defaultIndex);

  useEffect(() => {
    setFocusIndex(defaultIndex);
  }, [defaultIndex, steps.length]);

  if (!steps.length) return null;

  const columnClass =
    steps.length <= 2
      ? "grid-cols-2"
      : steps.length === 3
        ? "grid-cols-3"
        : steps.length === 4
          ? "grid-cols-4"
          : steps.length === 5
            ? "grid-cols-5"
            : steps.length === 6
              ? "grid-cols-6"
              : "grid-cols-7";

  const inactiveError = steps.find((step) => step.error)?.error || null;
  const safeFocusIndex = steps[focusIndex] ? focusIndex : 0;
  const focusedStep = steps[safeFocusIndex];
  const stepPrefix = chipPrefix(focusedStep.state, focusedStep.label);
  const stepTitle = [stepPrefix, focusedStep.label, focusedStep.name]
    .filter(Boolean)
    .join(" · ");
  // Map focus across the track so edge chips stay inside the form.
  const chipAlignPct =
    steps.length <= 1 ? 0 : (safeFocusIndex / (steps.length - 1)) * 100;

  return (
    <div
      className="w-full min-w-0 max-w-[min(640px,100%)]"
      aria-label="Approval progress"
    >
      {/* Icons + connectors */}
      <div className="flex items-center px-1">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isFocused = index === safeFocusIndex;
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
                <button
                  type="button"
                  className="relative shrink-0 rounded-full focus:outline-hidden sm:pointer-events-none sm:cursor-default"
                  aria-label={stepAriaLabel(step)}
                  aria-pressed={isFocused}
                  onClick={() => setFocusIndex(index)}
                >
                  <StepIcon state={step.state} index={index} />
                  <span
                    className={`absolute -bottom-2 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full transition-opacity sm:hidden ${
                      isFocused ? "bg-gray-700 opacity-100" : "opacity-0"
                    }`}
                    aria-hidden="true"
                  />
                </button>
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

      {/* Mobile: chip under focused step, clamped inside the form */}
      <div className="relative mt-3 min-h-8 sm:hidden">
        <div
          className={`absolute top-0 inline-flex max-w-full items-center gap-1.5 truncate rounded-full border px-3 py-1 ${chipShellClass(focusedStep.state)}`}
          style={{
            left: `${chipAlignPct}%`,
            transform: `translateX(-${chipAlignPct}%)`,
          }}
          title={stepTitle}
        >
          {stepPrefix ? (
            <span
              className={`shrink-0 text-theme-xs font-semibold ${labelClass(focusedStep.state)}`}
            >
              {stepPrefix}
            </span>
          ) : null}
          {stepPrefix ? (
            <span
              className="shrink-0 text-theme-xs text-gray-300"
              aria-hidden="true"
            >
              ·
            </span>
          ) : null}
          <span
            className={`min-w-0 truncate text-theme-xs font-semibold ${labelClass(focusedStep.state)}`}
          >
            {focusedStep.label}
          </span>
          {focusedStep.name ? (
            <>
              <span
                className="shrink-0 text-theme-xs text-gray-300"
                aria-hidden="true"
              >
                ·
              </span>
              <span className="min-w-0 truncate text-theme-xs font-medium text-gray-500">
                {focusedStep.name}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* Desktop / tablet: labels under each step */}
      <ol className={`mt-2.5 hidden gap-x-1 sm:grid ${columnClass}`}>
        {steps.map((step) => (
          <li
            key={`${step.id}-label`}
            className="min-w-0 overflow-hidden text-center"
          >
            <span
              className={`block truncate px-0.5 text-[10px] font-semibold leading-tight sm:text-theme-xs ${labelClass(step.state)}`}
              title={step.label}
            >
              {step.label}
            </span>
            {step.name ? (
              <span
                className="mt-0.5 block truncate px-0.5 text-[10px] font-medium leading-tight text-gray-500 sm:text-theme-xs"
                title={step.name}
              >
                {step.name}
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      {inactiveError ? (
        <div
          className="mt-3 rounded-xl border border-error-500 bg-error-50 px-3 py-2 text-center"
          role="alert"
        >
          <p className="text-theme-xs font-medium text-error-700 sm:text-theme-sm">
            {inactiveError}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default LeaveApprovalStepper;
