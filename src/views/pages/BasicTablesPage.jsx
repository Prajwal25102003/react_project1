import { getBasicTableRows } from '../../models/basicTablesModel.js'
import Breadcrumb from '../components/Breadcrumb.jsx'
import PageCard from '../components/PageCard.jsx'

function BasicTablesPage() {
  const rows = getBasicTableRows()

  return (
    <>
      <Breadcrumb pageName="Basic Tables" />
      <div className="space-y-5 sm:space-y-6">
        <PageCard title="Basic Table 1" bodyClassName="p-5 sm:p-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['User', 'Project Name', 'Team', 'Status', 'Budget'].map((heading) => (
                      <th key={heading} className="px-5 py-3 sm:px-6">
                        <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                          {heading}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-full">
                            <img src={row.avatar} alt={row.name} />
                          </div>
                          <div>
                            <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                              {row.name}
                            </span>
                            <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                              {row.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                          {row.project}
                        </p>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex -space-x-2">
                          {row.team.map((member) => (
                            <div
                              key={member}
                              className="h-6 w-6 overflow-hidden rounded-full border-2 border-white dark:border-gray-900"
                            >
                              <img src={member} alt="team member" />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <p
                          className={`rounded-full px-2 py-0.5 text-theme-xs font-medium ${row.statusClass}`}
                        >
                          {row.status}
                        </p>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                          {row.budget}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </PageCard>
      </div>
    </>
  )
}

export default BasicTablesPage
