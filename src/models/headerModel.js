const CURRENT_USER = {
  name: 'Musharof',
  fullName: 'Musharof Chowdhury',
  email: 'randomuser@pimjo.com',
  avatar: '/images/user/owner.jpg',
}

const USER_MENU_ITEMS = [
  { id: 'profile', label: 'Edit profile', path: '/profile', icon: 'profile' },
  {
    id: 'settings',
    label: 'Account settings',
    path: '/settings',
    icon: 'settings',
  },
  { id: 'support', label: 'Support', path: '/support', icon: 'support' },
]

const NOTIFICATIONS = [
  {
    id: 'n1',
    user: 'Terry Franci',
    avatar: '/images/user/user-02.jpg',
    message: 'requests permission to change',
    subject: 'Project - Nganter App',
    category: 'Project',
    time: '5 min ago',
    status: 'success',
  },
  {
    id: 'n2',
    user: 'Alena Franci',
    avatar: '/images/user/user-03.jpg',
    message: 'requests permission to change',
    subject: 'Project - Nganter App',
    category: 'Project',
    time: '8 min ago',
    status: 'success',
  },
  {
    id: 'n3',
    user: 'Jocelyn Kenter',
    avatar: '/images/user/user-04.jpg',
    message: 'requests permission to change',
    subject: 'Project - Nganter App',
    category: 'Project',
    time: '15 min ago',
    status: 'success',
  },
  {
    id: 'n4',
    user: 'Brandon Philips',
    avatar: '/images/user/user-05.jpg',
    message: 'requests permission to change',
    subject: 'Project - Nganter App',
    category: 'Project',
    time: '1 hr ago',
    status: 'error',
  },
]

export function getCurrentUser() {
  return CURRENT_USER
}

export function getUserMenuItems() {
  return USER_MENU_ITEMS
}

export function getNotifications() {
  return NOTIFICATIONS
}
