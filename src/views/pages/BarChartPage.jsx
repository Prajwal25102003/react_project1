import ChartOne from '../dashboard/ChartOne.jsx'
import PageCard from '../components/PageCard.jsx'

function BarChartPage() {
  return (
    <PageCard title="Bar Chart 1" bodyClassName="p-5 sm:p-6">
      <ChartOne showHeader={false} chartClassName="min-w-[1000px]" />
    </PageCard>
  )
}

export default BarChartPage
