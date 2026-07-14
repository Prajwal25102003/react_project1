const LIGHT_BADGE_CLASSES = [
  'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400',
  'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
  'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400',
  'bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500',
  'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80',
  'bg-gray-500 text-white dark:bg-white/5 dark:text-white',
]

const SOLID_BADGE_CLASSES = [
  'bg-brand-500 text-white',
  'bg-success-500 text-white',
  'bg-error-500 text-white',
  'bg-warning-500 text-white',
  'bg-blue-light-500 text-white',
  'bg-gray-400 text-white dark:bg-white/5 dark:text-white/80',
  'bg-gray-800 text-white dark:bg-white/15 dark:text-white',
]

const BADGE_LABELS = [
  'Primary',
  'Success',
  'Error',
  'Warning',
  'Info',
  'Light',
  'Dark',
]

export const BADGE_ICON_PATH =
  'M5.25012 3C5.25012 2.58579 5.58591 2.25 6.00012 2.25C6.41433 2.25 6.75012 2.58579 6.75012 3V5.25012L9.00034 5.25012C9.41455 5.25012 9.75034 5.58591 9.75034 6.00012C9.75034 6.41433 9.41455 6.75012 9.00034 6.75012H6.75012V9.00034C6.75012 9.41455 6.41433 9.75034 6.00012 9.75034C5.58591 9.75034 5.25012 9.41455 5.25012 9.00034L5.25012 6.75012H3C2.58579 6.75012 2.25 6.41433 2.25 6.00012C2.25 5.58591 2.58579 5.25012 3 5.25012H5.25012V3Z'

function buildBadges(classes) {
  return BADGE_LABELS.map((label, index) => ({
    label,
    className: classes[index],
  }))
}

export function getBadgeSections() {
  return [
    {
      id: 'light',
      title: 'With Light Background',
      badges: buildBadges(LIGHT_BADGE_CLASSES),
    },
    {
      id: 'solid',
      title: 'With Solid Background',
      badges: buildBadges(SOLID_BADGE_CLASSES),
    },
  ]
}

export function getBadgeIconSections() {
  return [
    {
      id: 'light-left',
      title: 'Light Background with Left Icon',
      iconPosition: 'left',
      badges: buildBadges(LIGHT_BADGE_CLASSES),
    },
    {
      id: 'solid-left',
      title: 'Solid Background with Left Icon',
      iconPosition: 'left',
      badges: buildBadges(SOLID_BADGE_CLASSES),
    },
    {
      id: 'light-right',
      title: 'Light Background with Right Icon',
      iconPosition: 'right',
      badges: buildBadges(LIGHT_BADGE_CLASSES),
    },
    {
      id: 'solid-right',
      title: 'Solid Background with Right Icon',
      iconPosition: 'right',
      badges: buildBadges(SOLID_BADGE_CLASSES),
    },
  ]
}
