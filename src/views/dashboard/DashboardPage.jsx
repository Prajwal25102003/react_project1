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

function EmployeeDashboard({ primaryMetrics, secondaryMetrics, chartTwo, activities }) {
  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden pb-6 md:space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">My Dashboard</h2>
        <p className="mt-0.5 text-theme-sm text-gray-500">
          Your attendance and leave at a glance
        </p>
      </div>

      <MetricCards metrics={primaryMetrics} columns={3} />
      {secondaryMetrics?.length ? (
        <MetricCards metrics={secondaryMetrics} columns={3} />
      ) : null}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 min-h-[320px] lg:col-span-5">
          <ChartTwo chart={chartTwo} />
        </div>

        <div className="col-span-12 lg:col-span-7">
          <RecentActivitiesTable
            activities={activities}
            title="My Recent Activity"
          />
        </div>
      </div>
    </div>
  );
}

function OrgDashboard({
  primaryMetrics,
  secondaryMetrics,
  activities,
  departments,
  newEmployeesPeriod,
  setNewEmployeesPeriod,
}) {
  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden pb-6 md:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

      <MetricCards metrics={primaryMetrics} columns={3} />
      {secondaryMetrics?.length ? (
        <MetricCards metrics={secondaryMetrics} columns={3} />
      ) : null}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 min-h-[360px] lg:col-span-5">
          <DepartmentOverview departments={departments} />
        </div>

        <div className="col-span-12 lg:col-span-7">
          <RecentActivitiesTable activities={activities} />
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
        secondaryMetrics={dashboard.secondaryMetrics}
        chartTwo={dashboard.chartTwo}
        activities={dashboard.activities}
      />
    );
  }

  return (
    <OrgDashboard
      primaryMetrics={dashboard.primaryMetrics}
      secondaryMetrics={dashboard.secondaryMetrics}
      activities={dashboard.activities}
      departments={dashboard.departments}
      newEmployeesPeriod={dashboard.newEmployeesPeriod}
      setNewEmployeesPeriod={dashboard.setNewEmployeesPeriod}
    />
  );
}

export default DashboardPage;
