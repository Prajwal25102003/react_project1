export function getImageSections() {
  return [
    {
      id: 'responsive',
      title: 'Responsive image',
      layout: 'single',
      images: ['image-01.png'],
    },
    {
      id: 'grid-2',
      title: 'Image in 2 Grid',
      layout: 'grid-2',
      images: ['image-02.png', 'image-03.png'],
    },
    {
      id: 'grid-3',
      title: 'Image in 3 Grid',
      layout: 'grid-3',
      images: ['image-04.png', 'image-05.png', 'image-06.png'],
    },
  ]
}

export const IMAGE_LAYOUT_CLASSES = {
  single: '',
  'grid-2': 'grid grid-cols-1 gap-5 sm:grid-cols-2',
  'grid-3': 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3',
}
