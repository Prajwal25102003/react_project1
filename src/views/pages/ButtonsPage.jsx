import Breadcrumb from '../components/Breadcrumb.jsx'
import PageCard from '../components/PageCard.jsx'
import {
  BUTTON_ICON_PATH,
  BUTTON_SIZES,
  getButtonSections,
} from '../../models/buttonsModel.js'

const PRIMARY_CLASS =
  'inline-flex items-center gap-2 rounded-lg bg-brand-500 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600'
const SECONDARY_CLASS =
  'inline-flex items-center gap-2 rounded-lg bg-white text-sm font-medium text-gray-700 shadow-theme-xs ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]'

function ButtonIcon() {
  return (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d={BUTTON_ICON_PATH} />
    </svg>
  )
}

function ButtonGroup({ variant, icon }) {
  const baseClass = variant === 'primary' ? PRIMARY_CLASS : SECONDARY_CLASS

  return (
    <div className="flex items-center gap-5">
      {BUTTON_SIZES.map((size) => (
        <button key={size} type="button" className={`${baseClass} ${size}`}>
          {icon === 'left' ? <ButtonIcon /> : null}
          Button Text
          {icon === 'right' ? <ButtonIcon /> : null}
        </button>
      ))}
    </div>
  )
}

function ButtonsPage() {
  const sections = getButtonSections()

  return (
    <>
      <Breadcrumb pageName="Buttons" />
      <div className="space-y-5 sm:space-y-6">
        {sections.map((section) => (
          <PageCard
            key={section.id}
            title={section.title}
            bodyClassName="px-6 py-6.5"
          >
            <ButtonGroup variant={section.variant} icon={section.icon} />
          </PageCard>
        ))}
      </div>
    </>
  )
}

export default ButtonsPage
