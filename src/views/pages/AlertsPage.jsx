import { ALERT_DESCRIPTION, ALERT_VARIANTS, getAlertSections } from '../../models/alertsModel.js'
import Breadcrumb from '../components/Breadcrumb.jsx'
import PageCard from '../components/PageCard.jsx'

function AlertBlock({ variant, showLink }) {
  const config = ALERT_VARIANTS[variant]

  return (
    <div className={`rounded-xl border p-4 ${config.border}`}>
      <div className="flex items-start gap-3">
        <div className={`-mt-0.5 ${config.iconColor}`}>
          <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d={config.iconPath} />
          </svg>
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {config.title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{ALERT_DESCRIPTION}</p>
          {showLink ? (
            <a
              href="#"
              className="mt-3 inline-block text-sm font-medium text-gray-500 underline dark:text-gray-400"
            >
              Learn more
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function AlertsPage() {
  const sections = getAlertSections()

  return (
    <>
      <Breadcrumb pageName="Alerts" />
      <div className="space-y-5 sm:space-y-6">
        {sections.map((section) => (
          <PageCard key={section.id} title={section.title} bodyClassName="p-4 sm:p-6">
            <div className="space-y-6">
              <AlertBlock variant={section.variant} showLink />
              <AlertBlock variant={section.variant} />
            </div>
          </PageCard>
        ))}
      </div>
    </>
  )
}

export default AlertsPage
