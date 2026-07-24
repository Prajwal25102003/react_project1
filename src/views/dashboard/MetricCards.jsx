import { Link } from "react-router-dom";
import { getMetricToneStyles } from "../../models/dashboardModel.js";

function EmployeesIcon({ className = "fill-current" }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.80443 5.60156C7.59109 5.60156 6.60749 6.58517 6.60749 7.79851C6.60749 9.01185 7.59109 9.99545 8.80443 9.99545C10.0178 9.99545 11.0014 9.01185 11.0014 7.79851C11.0014 6.58517 10.0178 5.60156 8.80443 5.60156ZM5.10749 7.79851C5.10749 5.75674 6.76267 4.10156 8.80443 4.10156C10.8462 4.10156 12.5014 5.75674 12.5014 7.79851C12.5014 9.84027 10.8462 11.4955 8.80443 11.4955C6.76267 11.4955 5.10749 9.84027 5.10749 7.79851ZM4.86252 15.3208C4.08769 16.0881 3.70377 17.0608 3.51705 17.8611C3.48384 18.0034 3.5211 18.1175 3.60712 18.2112C3.70161 18.3141 3.86659 18.3987 4.07591 18.3987H13.4249C13.6343 18.3987 13.7992 18.3141 13.8937 18.2112C13.9797 18.1175 14.017 18.0034 13.9838 17.8611C13.7971 17.0608 13.4132 16.0881 12.6383 15.3208C11.8821 14.572 10.6899 13.955 8.75042 13.955C6.81096 13.955 5.61877 14.572 4.86252 15.3208ZM3.8071 14.2549C4.87163 13.2009 6.45602 12.455 8.75042 12.455C11.0448 12.455 12.6292 13.2009 13.6937 14.2549C14.7397 15.2906 15.2207 16.5607 15.4446 17.5202C15.7658 18.8971 14.6071 19.8987 13.4249 19.8987H4.07591C2.89369 19.8987 1.73504 18.8971 2.05628 17.5202C2.28015 16.5607 2.76117 15.2906 3.8071 14.2549ZM15.3042 11.4955C14.4702 11.4955 13.7006 11.2193 13.0821 10.7533C13.3742 10.3314 13.6054 9.86419 13.7632 9.36432C14.1597 9.75463 14.7039 9.99545 15.3042 9.99545C16.5176 9.99545 17.5012 9.01185 17.5012 7.79851C17.5012 6.58517 16.5176 5.60156 15.3042 5.60156C14.7039 5.60156 14.1597 5.84239 13.7632 6.23271C13.6054 5.73284 13.3741 5.26561 13.082 4.84371C13.7006 4.37777 14.4702 4.10156 15.3042 4.10156C17.346 4.10156 19.0012 5.75674 19.0012 7.79851C19.0012 9.84027 17.346 11.4955 15.3042 11.4955ZM19.9248 19.8987H16.3901C16.7014 19.4736 16.9159 18.969 16.9827 18.3987H19.9248C20.1341 18.3987 20.2991 18.3141 20.3936 18.2112C20.4796 18.1175 20.5169 18.0034 20.4837 17.861C20.2969 17.0607 19.913 16.088 19.1382 15.3208C18.4047 14.5945 17.261 13.9921 15.4231 13.9566C15.2232 13.6945 14.9995 13.437 14.7491 13.1891C14.5144 12.9566 14.262 12.7384 13.9916 12.5362C14.3853 12.4831 14.8044 12.4549 15.2503 12.4549C17.5447 12.4549 19.1291 13.2008 20.1936 14.2549C21.2395 15.2906 21.7206 16.5607 21.9444 17.5202C22.2657 18.8971 21.107 19.8987 19.9248 19.8987Z"
      />
    </svg>
  );
}

function ActiveIcon({ className = "fill-current" }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.665 3.75621C11.8762 3.65064 12.1247 3.65064 12.3358 3.75621L18.7807 6.97856L12.3358 10.2009C12.1247 10.3065 11.8762 10.3065 11.665 10.2009L5.22014 6.97856L11.665 3.75621ZM4.29297 8.19203V16.0946C4.29297 16.3787 4.45347 16.6384 4.70757 16.7654L11.25 20.0366V11.6513C11.1631 11.6205 11.0777 11.5843 10.9942 11.5426L4.29297 8.19203ZM12.75 20.037L19.2933 16.7654C19.5474 16.6384 19.7079 16.3787 19.7079 16.0946V8.19202L13.0066 11.5426C12.9229 11.5844 12.8372 11.6208 12.75 11.6516V20.037ZM13.0066 2.41456C12.3732 2.09786 11.6277 2.09786 10.9942 2.41456L4.03676 5.89319C3.27449 6.27432 2.79297 7.05342 2.79297 7.90566V16.0946C2.79297 16.9469 3.27448 17.726 4.03676 18.1071L10.9942 21.5857L11.3296 20.9149L10.9942 21.5857C11.6277 21.9024 12.3732 21.9024 13.0066 21.5857L19.9641 18.1071C20.7264 17.726 21.2079 16.9469 21.2079 16.0946V7.90566C21.2079 7.05342 20.7264 6.27432 19.9641 5.89319L13.0066 2.41456Z"
      />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg
      className="fill-current"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.56462 1.62393C5.70193 1.47072 5.90135 1.37432 6.12329 1.37432C6.1236 1.37432 6.12391 1.37432 6.12422 1.37432C6.31631 1.37415 6.50845 1.44731 6.65505 1.59381L9.65514 4.5918C9.94814 4.88459 9.94831 5.35947 9.65552 5.65246C9.36273 5.94546 8.88785 5.94562 8.59486 5.65283L6.87329 3.93247L6.87329 10.125C6.87329 10.5392 6.53751 10.875 6.12329 10.875C5.70908 10.875 5.37329 10.5392 5.37329 10.125L5.37329 3.93578L3.65516 5.65282C3.36218 5.94562 2.8873 5.94547 2.5945 5.65248C2.3017 5.35949 2.30185 4.88462 2.59484 4.59182L5.56462 1.62393Z"
      />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg
      className="fill-current"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C5.8736 10.6257 5.8739 10.6257 5.87421 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z"
      />
    </svg>
  );
}

function MessagesIcon({ className = "fill-current" }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 6.5C4 5.11929 5.11929 4 6.5 4H17.5C18.8807 4 20 5.11929 20 6.5V14.5C20 15.8807 18.8807 17 17.5 17H13.4142L9.70711 20.7071C9.07714 21.3371 8 20.8909 8 20V17H6.5C5.11929 17 4 15.8807 4 14.5V6.5ZM6.5 5.5C5.94772 5.5 5.5 5.94772 5.5 6.5V14.5C5.5 15.0523 5.94772 15.5 6.5 15.5H9.5V18.3787L12.4393 15.4393C12.7197 15.1589 13.1022 15 13.5 15H17.5C18.0523 15 18.5 14.5523 18.5 14V6.5C18.5 5.94772 18.0523 5.5 17.5 5.5H6.5ZM8 9C8 8.72386 8.22386 8.5 8.5 8.5H15.5C15.7761 8.5 16 8.72386 16 9C16 9.27614 15.7761 9.5 15.5 9.5H8.5C8.22386 9.5 8 9.27614 8 9ZM8.5 11.5C8.22386 11.5 8 11.7239 8 12C8 12.2761 8.22386 12.5 8.5 12.5H12.5C12.7761 12.5 13 12.2761 13 12C13 11.7239 12.7761 11.5 12.5 11.5H8.5Z"
      />
    </svg>
  );
}

function LeaveIcon({ className = "fill-current" }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2.25C8.41421 2.25 8.75 2.58579 8.75 3V4H15.25V3C15.25 2.58579 15.5858 2.25 16 2.25C16.4142 2.25 16.75 2.58579 16.75 3V4H18.5C19.7426 4 20.75 5.00736 20.75 6.25V19.75C20.75 20.9926 19.7426 22 18.5 22H5.5C4.25736 22 3.25 20.9926 3.25 19.75V6.25C3.25 5.00736 4.25736 4 5.5 4H7.25V3C7.25 2.58579 7.58579 2.25 8 2.25ZM5.5 5.5C5.08579 5.5 4.75 5.83579 4.75 6.25V8.5H19.25V6.25C19.25 5.83579 18.9142 5.5 18.5 5.5H5.5ZM19.25 10H4.75V19.75C4.75 20.1642 5.08579 20.5 5.5 20.5H18.5C18.9142 20.5 19.25 20.1642 19.25 19.75V10ZM8 13.25C8 12.8358 8.33579 12.5 8.75 12.5H11.25C11.6642 12.5 12 12.8358 12 13.25V15.75C12 16.1642 11.6642 16.5 11.25 16.5H8.75C8.33579 16.5 8 16.1642 8 15.75V13.25Z"
      />
    </svg>
  );
}

const METRIC_ICONS = {
  "total-employees": EmployeesIcon,
  "active-employees": ActiveIcon,
  "new-employees": EmployeesIcon,
  "pending-leave": LeaveIcon,
  "inactive-employees": EmployeesIcon,
  "unread-messages": MessagesIcon,
  "days-present": ActiveIcon,
  "leave-approved": LeaveIcon,
  "total-leave": LeaveIcon,
  "casual-leave": LeaveIcon,
  "sick-leave": LeaveIcon,
  "lop-days": LeaveIcon,
};

function MetricCardBody({ metric, Icon, compact, tone }) {
  return (
    <>
      <div
        className={`flex items-center justify-center rounded-xl ${tone.iconWrap} ${tone.icon} ${
          compact ? "h-10 w-10" : "h-12 w-12"
        }`}
      >
        <Icon className="fill-current" />
      </div>

      <div
        className={
          compact
            ? "mt-3 flex items-end justify-between"
            : "mt-5 flex items-end justify-between"
        }
      >
        <div>
          <span className="text-sm text-gray-500">{metric.label}</span>
          <h4
            className={
              compact
                ? "mt-1 text-xl font-bold text-gray-800"
                : "mt-2 text-title-sm font-bold text-gray-800"
            }
          >
            {metric.value}
          </h4>
        </div>

        {metric.trend ? (
          <span
            className={`flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium ${
              metric.trendUp
                ? "bg-success-50 text-success-600 "
                : "bg-error-50 text-error-600"
            }`}
          >
            {metric.trendUp ? <TrendUpIcon /> : <TrendDownIcon />}
            {metric.trend}
          </span>
        ) : null}
      </div>
    </>
  );
}

function MetricCards({ metrics, columns = 2, compact = false, onMetricAction }) {
  const gridClass =
    columns === 3
      ? "grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4"
      : "grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6";

  const cardPadding = compact ? "p-4" : "p-5 md:p-6";

  return (
    <div className={gridClass}>
      {metrics.map((metric) => {
        const Icon = METRIC_ICONS[metric.id] || EmployeesIcon;
        const tone = getMetricToneStyles(metric.id);
        const cardClass = `rounded-2xl border ${tone.card} ${cardPadding}`;
        const interactiveClass = `${cardClass} block w-full text-left transition hover:shadow-theme-xs focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-brand-500/20`;

        if (metric.href) {
          return (
            <Link
              key={metric.id}
              to={metric.href}
              className={interactiveClass}
              aria-label={`Open ${metric.label}`}
            >
              <MetricCardBody
                metric={metric}
                Icon={Icon}
                compact={compact}
                tone={tone}
              />
            </Link>
          );
        }

        if (metric.action && onMetricAction) {
          return (
            <button
              key={metric.id}
              type="button"
              className={interactiveClass}
              aria-label={`Open ${metric.label}`}
              onClick={() => onMetricAction(metric)}
            >
              <MetricCardBody
                metric={metric}
                Icon={Icon}
                compact={compact}
                tone={tone}
              />
            </button>
          );
        }

        return (
          <article key={metric.id} className={cardClass}>
            <MetricCardBody
              metric={metric}
              Icon={Icon}
              compact={compact}
              tone={tone}
            />
          </article>
        );
      })}
    </div>
  );
}

export function MetricCardsSkeleton({ columns = 3, count = 5 }) {
  const gridClass =
    columns === 3
      ? "grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4"
      : "grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6";

  return (
    <div className={gridClass} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
        >
          <div className="h-12 w-12 rounded-xl bg-gray-100" />
          <div className="mt-5 space-y-2">
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-7 w-16 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default MetricCards;
