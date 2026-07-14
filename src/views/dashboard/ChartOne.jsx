import Chart from 'react-apexcharts'
import { useChartOne } from '../../controllers/chartController.js'
import ChartActionsMenu from './ChartActionsMenu.jsx'

function ChartOne({
  chartClassName = '-ml-5 h-full min-w-[650px] pl-2 xl:min-w-full',
  showHeader = true,
}) {
  const { menuOpen, toggleMenu, closeMenu, options, series, type, height } =
    useChartOne()

  const chart = (
    <div className="custom-scrollbar max-w-full overflow-x-auto">
      <div className={showHeader ? '-ml-5 min-w-[650px] pl-2 xl:min-w-full' : ''}>
        <div className={chartClassName}>
          <Chart options={options} series={series} type={type} height={height} />
        </div>
      </div>
    </div>
  )

  if (!showHeader) {
    return chart
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Monthly Sales
        </h3>

        <ChartActionsMenu
          menuOpen={menuOpen}
          toggleMenu={toggleMenu}
          closeMenu={closeMenu}
        />
      </div>

      {chart}
    </div>
  )
}

export default ChartOne
