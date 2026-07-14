import MetricCards from './MetricCards.jsx'
import ChartOne from './ChartOne.jsx'
import ChartTwo from './ChartTwo.jsx'
import ChartThree from './ChartThree.jsx'
import MapOne from './MapOne.jsx'
import RecentOrdersTable from './RecentOrdersTable.jsx'

function DashboardPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <MetricCards />
        <ChartOne />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <ChartTwo />
      </div>

      <div className="col-span-12">
        <ChartThree />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MapOne />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentOrdersTable />
      </div>
    </div>
  )
}

export default DashboardPage
