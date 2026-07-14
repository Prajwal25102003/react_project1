import {
  BADGE_ICON_PATH,
  getBadgeIconSections,
  getBadgeSections,
} from '../../models/badgeModel.js'
import Breadcrumb from '../components/Breadcrumb.jsx'
import PageCard from '../components/PageCard.jsx'

function BadgeIcon() {
  return (
    <svg className="fill-current" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d={BADGE_ICON_PATH} />
    </svg>
  )
}

function BadgeList({ badges }) {
  return (
    <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  )
}

function IconBadgeList({ badges, iconPosition }) {
  const padding =
    iconPosition === 'left' ? 'py-0.5 pl-2 pr-2.5' : 'py-0.5 pl-2.5 pr-2'

  return (
    <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={`inline-flex items-center justify-center gap-1 rounded-full ${padding} text-sm font-medium ${badge.className}`}
        >
          {iconPosition === 'left' ? <BadgeIcon /> : null}
          {badge.label}
          {iconPosition === 'right' ? <BadgeIcon /> : null}
        </span>
      ))}
    </div>
  )
}

function BadgePage() {
  const sections = getBadgeSections()
  const iconSections = getBadgeIconSections()

  return (
    <>
      <Breadcrumb pageName="Badge" />
      <div className="space-y-5 sm:space-y-6">
        {sections.map((section) => (
          <PageCard
            key={section.id}
            title={section.title}
            bodyClassName="p-6 xl:p-10"
          >
            <BadgeList badges={section.badges} />
          </PageCard>
        ))}
        {iconSections.map((section) => (
          <PageCard
            key={section.id}
            title={section.title}
            bodyClassName="p-6 xl:p-10"
          >
            <IconBadgeList
              badges={section.badges}
              iconPosition={section.iconPosition}
            />
          </PageCard>
        ))}
      </div>
    </>
  )
}

export default BadgePage
