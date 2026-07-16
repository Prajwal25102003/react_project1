import Chart from "react-apexcharts";
import { useState } from "react";

function ChartThree({ options }) {
  const tabs = options?.tabs || [];
  const [selectedTab, setSelectedTab] = useState(tabs[0]?.id || "overview");

  if (!options) return null;

  const series =
    selectedTab === "hires"
      ? [options.series[0]]
      : selectedTab === "leave"
        ? [options.series[1]]
        : options.series;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-5 sm:px-6 sm:pt-6">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800">
            {options.title || "Workforce Statistics"}
          </h3>
          <p className="text-theme-sm mt-1 text-gray-500">
            {options.description || "Monthly new hires and leave requests"}
          </p>
        </div>

        <div className="flex w-full items-start gap-3 sm:justify-end">
          <div className="inline-flex w-fit items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id)}
                className={`text-theme-sm rounded-md px-3 py-2 font-medium hover:text-gray-900 ${
                  selectedTab === tab.id
                    ? "shadow-theme-xs bg-white text-gray-900 "
                    : "text-gray-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <div className="-ml-4 min-w-[700px] pl-2">
          <Chart
            options={options}
            series={series}
            type="area"
            height={options.chart.height}
          />
        </div>
      </div>
    </div>
  );
}

export default ChartThree;
