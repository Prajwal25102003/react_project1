import { useDashboard } from "../../controllers/dashboardController.js";
import { NEW_EMPLOYEE_PERIODS } from "../../models/dashboardModel.js";
import MetricCards from "./MetricCards.jsx";
import ChartTwo from "./ChartTwo.jsx";
import DepartmentOverview from "./DepartmentOverview.jsx";
import RecentActivitiesTable from "./RecentActivitiesTable.jsx";

function PeriodTabs({ value, onChange }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
      {NEW_EMPLOYEE_PERIODS.map((period) => {
        const active = value === period.value;

        return (
          <button
            key={period.value}
            type="button"
            onClick={() => onChange(period.value)}
            className={
              active
                ? "rounded-md bg-white px-3 py-1.5 text-theme-sm font-medium text-gray-800 shadow-theme-xs "
                : "rounded-md px-3 py-1.5 text-theme-sm font-medium text-gray-500 hover:text-gray-700"
            }
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}

function EmployeeDashboard({ primaryMetrics, chartTwo, activities }) {
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-3 overflow-x-hidden lg:h-[calc(100dvh-7.5rem)] lg:min-h-0 lg:overflow-hidden lg:gap-4">
      <div className="shrink-0">
        <h2 className="text-xl font-semibold text-gray-800">My Dashboard</h2>
        <p className="mt-0.5 text-theme-sm text-gray-500">
          Your attendance and leave at a glance
        </p>
      </div>

      <div className="shrink-0">
        <MetricCards metrics={primaryMetrics} columns={3} compact />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 min-h-0 lg:col-span-5">
          <ChartTwo chart={chartTwo} compact />
        </div>

        <div className="col-span-12 min-h-0 lg:col-span-7">
          <RecentActivitiesTable
            activities={activities}
            title="My Recent Activity"
            compact
          />
        </div>
      </div>
    </div>
  );
}

function OrgDashboard({
  primaryMetrics,
  activities,
  departments,
  newEmployeesPeriod,
  setNewEmployeesPeriod,
}) {
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-3 overflow-x-hidden lg:h-[calc(100dvh-7.5rem)] lg:min-h-0 lg:overflow-hidden lg:gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          <p className="mt-0.5 text-theme-sm text-gray-500">
            Workforce, attendance, and leave overview
          </p>
        </div>
        <PeriodTabs
          value={newEmployeesPeriod}
          onChange={setNewEmployeesPeriod}
        />
      </div>

      <div className="shrink-0">
        <MetricCards metrics={primaryMetrics} columns={3} compact />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 min-h-0 lg:col-span-5">
          <DepartmentOverview departments={departments} compact />
        </div>

        <div className="col-span-12 min-h-0 lg:col-span-7">
          <RecentActivitiesTable activities={activities} compact />
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const dashboard = useDashboard();

  if (dashboard.loading) {
    return <p className="text-theme-sm text-gray-500">Loading dashboard…</p>;
  }

  if (dashboard.error) {
    return <p className="text-theme-sm text-error-600">{dashboard.error}</p>;
  }

  if (dashboard.variant === "employee") {
    return (
      <EmployeeDashboard
        primaryMetrics={dashboard.primaryMetrics}
        chartTwo={dashboard.chartTwo}
        activities={dashboard.activities}
      />
    );
  }

  return (
    <OrgDashboard
      primaryMetrics={dashboard.primaryMetrics}
      activities={dashboard.activities}
      departments={dashboard.departments}
      newEmployeesPeriod={dashboard.newEmployeesPeriod}
      setNewEmployeesPeriod={dashboard.setNewEmployeesPeriod}
    />
  );
}

export default DashboardPage;
