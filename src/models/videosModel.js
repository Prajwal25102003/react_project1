export const VIDEO_EMBED_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ'

export function getVideoSections() {
  return [
    {
      column: 'left',
      items: [
        { id: '16-9', title: 'Video Ratio 16:9', aspectClass: 'aspect-video' },
        { id: '4-3-a', title: 'Video Ratio 4:3', aspectClass: 'aspect-4/3' },
      ],
    },
    {
      column: 'right',
      items: [
        { id: '4-3-b', title: 'Video Ratio 4:3', aspectClass: 'aspect-4/3' },
        { id: '1-1', title: 'Video Ratio 1:1', aspectClass: 'aspect-square' },
      ],
    },
  ]
}
