import {
  AVATAR_CONTAINER_SIZES,
  AVATAR_IMAGE,
  AVATAR_INDICATOR_CLASSES,
  AVATAR_INDICATOR_SIZES,
  getAvatarSections,
} from '../../models/avatarsModel.js'
import Breadcrumb from '../components/Breadcrumb.jsx'
import PageCard from '../components/PageCard.jsx'

function AvatarRow({ sizes, indicator }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
      {sizes.map((size) => (
        <div
          key={size}
          className={`relative w-full rounded-full ${AVATAR_CONTAINER_SIZES[size]}`}
        >
          <img src={AVATAR_IMAGE} alt="user" className="overflow-hidden rounded-full" />
          {indicator ? (
            <span
              className={`absolute bottom-0 right-0 ${AVATAR_INDICATOR_SIZES[size]} rounded-full border-[1.5px] border-white ${AVATAR_INDICATOR_CLASSES[indicator]} dark:border-gray-900`}
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}

function AvatarsPage() {
  const sections = getAvatarSections()

  return (
    <>
      <Breadcrumb pageName="Avatars" />
      <div className="space-y-5 sm:space-y-6">
        {sections.map((section) => (
          <PageCard key={section.id} title={section.title} bodyClassName="p-8">
            <AvatarRow sizes={section.sizes} indicator={section.indicator} />
          </PageCard>
        ))}
      </div>
    </>
  )
}

export default AvatarsPage
