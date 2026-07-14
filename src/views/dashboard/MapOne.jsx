import { useMapOne } from '../../controllers/chartController.js'
import ChartActionsMenu from './ChartActionsMenu.jsx'

function MapOne() {
  const { menuOpen, toggleMenu, closeMenu, mapRef, demographics } = useMapOne()

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customers Demographic
          </h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            Number of customer based on country
          </p>
        </div>

        <ChartActionsMenu
          menuOpen={menuOpen}
          toggleMenu={toggleMenu}
          closeMenu={closeMenu}
        />
      </div>

      <div className="border-gary-200 my-6 overflow-hidden rounded-2xl border bg-gray-50 px-4 py-6 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div
          ref={mapRef}
          className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        />
      </div>

      <div className="space-y-5">
        {demographics.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-full max-w-8 items-center rounded-full">
                <img src={item.flag} alt={item.country} />
              </div>
              <div>
                <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                  {item.country}
                </p>
                <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                  {item.customers}
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-[140px] items-center gap-3">
              <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                <div
                  className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                {item.percent}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MapOne
