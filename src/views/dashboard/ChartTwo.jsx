import Chart from "react-apexcharts";
import { useMemo } from "react";

function TrendIcon({ trend }) {
  if (trend === "down") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.26816 13.6632C7.4056 13.8192 7.60686 13.9176 7.8311 13.9176C7.83148 13.9176 7.83187 13.9176 7.83226 13.9176C8.02445 13.9178 8.21671 13.8447 8.36339 13.6981L12.3635 9.70076C12.6565 9.40797 12.6567 8.9331 12.3639 8.6401C12.0711 8.34711 11.5962 8.34694 11.3032 8.63973L8.5811 11.36L8.5811 2.5C8.5811 2.08579 8.24531 1.75 7.8311 1.75C7.41688 1.75 7.0811 2.08579 7.0811 2.5L7.0811 11.3556L4.36354 8.63975C4.07055 8.34695 3.59568 8.3471 3.30288 8.64009C3.01008 8.93307 3.01023 9.40794 3.30321 9.70075L7.26816 13.6632Z"
          fill="#D92D20"
        />
      </svg>
    );
  }

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.60141 2.33683C7.73885 2.18084 7.9401 2.08243 8.16435 2.08243C8.16475 2.08243 8.16516 2.08243 8.16556 2.08243C8.35773 2.08219 8.54998 2.15535 8.69664 2.30191L12.6968 6.29924C12.9898 6.59203 12.9899 7.0669 12.6971 7.3599C12.4044 7.6529 11.9295 7.65306 11.6365 7.36027L8.91435 4.64004L8.91435 13.5C8.91435 13.9142 8.57856 14.25 8.16435 14.25C7.75013 14.25 7.41435 13.9142 7.41435 13.5L7.41435 4.64442L4.69679 7.36025C4.4038 7.65305 3.92893 7.6529 3.63613 7.35992C3.34333 7.06693 3.34348 6.59206 3.63646 6.29926L7.60141 2.33683Z"
        fill="#039855"
      />
    </svg>
  );
}

function ChartTwo({ chart, compact = false }) {
  const options = useMemo(() => {
    if (!chart?.options) return null;

    return {
      ...chart.options,
      plotOptions: {
        ...chart.options.plotOptions,
        radialBar: {
          ...chart.options.plotOptions?.radialBar,
          dataLabels: {
            name: { show: false },
            value: { show: false },
          },
        },
      },
    };
  }, [chart]);

  if (!options || !chart?.meta) return null;

  const { meta } = chart;
  const activeRate = Number(chart.options.series?.[0] ?? 0);
  const displayRate = Number.isInteger(activeRate)
    ? String(activeRate)
    : activeRate.toFixed(1);

  return (
    <div
      className={
        compact
          ? "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
          : "rounded-2xl border border-gray-200 bg-gray-100"
      }
    >
      <div
        className={
          compact
            ? "shadow-default flex min-h-0 flex-1 flex-col rounded-2xl bg-white px-4 pb-3 pt-4 sm:px-5"
            : "shadow-default rounded-2xl bg-white px-5 pb-6 pt-5 sm:px-6 sm:pt-6"
        }
      >
        <div className="shrink-0">
          <h3
            className={
              compact
                ? "text-base font-semibold text-gray-800"
                : "text-lg font-semibold text-gray-800"
            }
          >
            {chart.title || "Active Workforce"}
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500">
            {chart.description ||
              "Share of employees currently marked active"}
          </p>
        </div>

        <div
          className={
            compact
              ? "mt-3 flex min-h-0 flex-1 flex-col items-center justify-center"
              : "mt-6 flex flex-col items-center"
          }
        >
          <div
            className={
              compact
                ? "mx-auto h-[110px] w-full max-w-[220px] overflow-hidden"
                : "mx-auto h-[160px] w-full max-w-[280px] overflow-hidden"
            }
          >
            <Chart
              options={options}
              series={options.series}
              type="radialBar"
              height={compact ? 220 : options.chart.height}
            />
          </div>

          <p
            className={
              compact
                ? "mt-0 text-2xl font-semibold text-gray-800"
                : "mt-1 text-3xl font-semibold text-gray-800"
            }
          >
            {displayRate}%
          </p>

          <span
            className={
              compact
                ? "mt-2 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600"
                : "mt-3 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600"
            }
          >
            {meta.badge}
          </span>
        </div>
      </div>

      <div
        className={
          compact
            ? "flex shrink-0 items-center justify-center gap-4 px-4 py-2.5 sm:gap-6"
            : "flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5"
        }
      >
        {meta.stats.map((stat, index) => (
          <div key={stat.id} className="contents">
            {index > 0 ? <div className="h-7 w-px bg-gray-200" /> : null}
            <div>
              <p className="mb-1 text-center text-theme-xs text-gray-500 sm:text-sm">
                {stat.label}
              </p>
              <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 sm:text-lg">
                {stat.value}
                <TrendIcon trend={stat.trend} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChartTwo;
