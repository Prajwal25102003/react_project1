import Chart from "react-apexcharts";

function ChartOne({ options, title = "Monthly New Hires" }) {
  if (!options) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <div className="-ml-5 min-w-[650px] pl-2 xl:min-w-full">
          <div className="-ml-5 h-full min-w-[650px] pl-2 xl:min-w-full">
            <Chart
              options={options}
              series={options.series}
              type="bar"
              height={options.chart.height}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChartOne;
