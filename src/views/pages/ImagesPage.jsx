import Breadcrumb from '../components/Breadcrumb.jsx'
import PageCard from '../components/PageCard.jsx'
import {
  IMAGE_LAYOUT_CLASSES,
  getImageSections,
} from '../../models/imagesModel.js'

function ImageSection({ section }) {
  const layoutClass = IMAGE_LAYOUT_CLASSES[section.layout]
  const imageClassName =
    'rounded-xl border border-gray-200 dark:border-gray-800' +
    (section.layout === 'single' ? ' w-full' : '')

  const images = section.images.map((image) => (
    <img
      key={image}
      src={`/images/grid-image/${image}`}
      alt={section.layout === 'single' ? 'Cover' : 'image grid'}
      className={imageClassName}
    />
  ))

  if (section.layout === 'single') {
    return images
  }

  return <div className={layoutClass}>{images}</div>
}

function ImagesPage() {
  const sections = getImageSections()

  return (
    <>
      <Breadcrumb pageName="Images" />
      <div className="space-y-5 sm:space-y-6">
        {sections.map((section) => (
          <PageCard key={section.id} title={section.title} bodyClassName="p-4 sm:p-6">
            <ImageSection section={section} />
          </PageCard>
        ))}
      </div>
    </>
  )
}

export default ImagesPage
