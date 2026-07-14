const NAV_GROUPS = [
  {
    id: 'menu',
    title: 'MENU',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        children: [{ id: 'ecommerce', label: 'eCommerce', path: '/' }],
      },
      {
        id: 'calendar',
        label: 'Calendar',
        icon: 'calendar',
        path: '/calendar',
      },
      {
        id: 'profile',
        label: 'User Profile',
        icon: 'profile',
        path: '/profile',
      },
      {
        id: 'forms',
        label: 'Forms',
        icon: 'forms',
        children: [
          { id: 'form-elements', label: 'Form Elements', path: '/form-elements' },
        ],
      },
      {
        id: 'tables',
        label: 'Tables',
        icon: 'tables',
        children: [
          { id: 'basic-tables', label: 'Basic Tables', path: '/basic-tables' },
        ],
      },
      {
        id: 'pages',
        label: 'Pages',
        icon: 'pages',
        children: [
          { id: 'blank', label: 'Blank Page', path: '/blank' },
          { id: '404', label: '404 Error', path: '/404' },
        ],
      },
    ],
  },
  {
    id: 'others',
    title: 'others',
    items: [
      {
        id: 'charts',
        label: 'Charts',
        icon: 'charts',
        children: [
          { id: 'line-chart', label: 'Line Chart', path: '/line-chart' },
          { id: 'bar-chart', label: 'Bar Chart', path: '/bar-chart' },
        ],
      },
      {
        id: 'ui-elements',
        label: 'UI Elements',
        icon: 'ui',
        children: [
          { id: 'alerts', label: 'Alerts', path: '/alerts' },
          { id: 'avatars', label: 'Avatars', path: '/avatars' },
          { id: 'badge', label: 'Badges', path: '/badge' },
          { id: 'buttons', label: 'Buttons', path: '/buttons' },
          { id: 'images', label: 'Images', path: '/images' },
          { id: 'videos', label: 'Videos', path: '/videos' },
        ],
      },
      {
        id: 'authentication',
        label: 'Authentication',
        icon: 'auth',
        children: [
          { id: 'signin', label: 'Sign In', path: '/signin' },
          { id: 'signup', label: 'Sign Up', path: '/signup' },
        ],
      },
    ],
  },
]

const PROMO_BOX = {
  title: '#1 Tailwind CSS Dashboard',
  description:
    'Leading Tailwind CSS Admin Template with 400+ UI Component and Pages.',
  ctaLabel: 'Purchase Plan',
  ctaHref: 'https://tailadmin.com/pricing',
}

const PATH_PARENT_MAP = {
  '/': 'dashboard',
  '/calendar': 'calendar',
  '/profile': 'profile',
  '/form-elements': 'forms',
  '/basic-tables': 'tables',
  '/blank': 'pages',
  '/404': 'pages',
  '/line-chart': 'charts',
  '/bar-chart': 'charts',
  '/alerts': 'ui-elements',
  '/avatars': 'ui-elements',
  '/badge': 'ui-elements',
  '/buttons': 'ui-elements',
  '/images': 'ui-elements',
  '/videos': 'ui-elements',
  '/signin': 'authentication',
  '/signup': 'authentication',
}

export function getNavGroups() {
  return NAV_GROUPS
}

export function getPromoBox() {
  return PROMO_BOX
}

export function getParentIdForPath(pathname) {
  return PATH_PARENT_MAP[pathname] || null
}

export function isNavItemActive(item, pathname) {
  if (item.path) {
    return item.path === pathname
  }

  return item.children?.some((child) => child.path === pathname) ?? false
}
