import Breadcrumb from '../components/Breadcrumb.jsx'
import PageCard from '../components/PageCard.jsx'
import { VIDEO_EMBED_URL, getVideoSections } from '../../models/videosModel.js'

function VideoFrame({ aspectClass }) {
  return (
    <div className={`overflow-hidden rounded-lg ${aspectClass}`}>
      <iframe
        src={VIDEO_EMBED_URL}
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}

function VideosPage() {
  const columns = getVideoSections()

  return (
    <>
      <Breadcrumb pageName="Videos" />
      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-2">
        {columns.map((column) => (
          <div key={column.column} className="space-y-5 sm:space-y-6">
            {column.items.map((item) => (
              <PageCard
                key={item.id}
                title={item.title}
                bodyClassName="border-b-0 p-4 sm:p-6"
              >
                <VideoFrame aspectClass={item.aspectClass} />
              </PageCard>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

export default VideosPage
