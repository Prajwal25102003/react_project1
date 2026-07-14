export function getAvatarSections() {
  return [
    { id: 'default', title: 'Default Avatar', sizes: [6, 8, 10, 12, 14, 16] },
    {
      id: 'online',
      title: 'Avatar with online indicator',
      sizes: [6, 8, 10, 12, 14, 16],
      indicator: 'online',
    },
    {
      id: 'offline',
      title: 'Avatar with Offline indicator',
      sizes: [6, 8, 10, 12, 14, 16],
      indicator: 'offline',
    },
    {
      id: 'busy',
      title: 'Avatar with busy indicator',
      sizes: [6, 8, 10, 12, 14, 16],
      indicator: 'busy',
    },
  ]
}

export const AVATAR_IMAGE = '/images/user/user-01.jpg'

export const AVATAR_INDICATOR_CLASSES = {
  online: 'bg-success-500',
  offline: 'bg-error-500',
  busy: 'bg-warning-500',
}

export const AVATAR_INDICATOR_SIZES = {
  6: 'h-1.5 max-w-1.5',
  8: 'h-2 max-w-2',
  10: 'h-2.5 max-w-2.5',
  12: 'h-3 max-w-3',
  14: 'h-3.5 max-w-3.5',
  16: 'h-4 max-w-4',
}

export const AVATAR_CONTAINER_SIZES = {
  6: 'h-6 max-w-6',
  8: 'h-8 max-w-8',
  10: 'h-10 max-w-10',
  12: 'h-12 max-w-12',
  14: 'h-14 max-w-14',
  16: 'h-16 max-w-16',
}
