import ChartThree from '../dashboard/ChartThree.jsx'
import PageCard from '../components/PageCard.jsx'

function LineChartPage() {
  return (
    <PageCard title="Line Chart 1" bodyClassName="p-5 sm:p-6">
      <ChartThree showHeader={false} chartClassName="min-w-[1000px]" />
    </PageCard>
  )
}

export default LineChartPage
