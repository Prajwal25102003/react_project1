import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getNavGroups,
  getParentIdForPath,
  getPromoBox,
  isNavItemActive,
} from '../models/navModel.js'

export function useNav() {
  return {
    groups: getNavGroups(),
    promo: getPromoBox(),
  }
}

export function useSidebar() {
  const [sidebarToggle, setSidebarToggle] = useState(false)

  return {
    sidebarToggle,
    toggleSidebar: () => setSidebarToggle((value) => !value),
    closeSidebar: () => setSidebarToggle(false),
  }
}

export function useSidebarNav() {
  const { pathname } = useLocation()
  const [selected, setSelected] = useState(() => {
    return getParentIdForPath(pathname) || 'dashboard'
  })

  useEffect(() => {
    const parentId = getParentIdForPath(pathname)
    if (parentId) {
      setSelected(parentId)
    }
  }, [pathname])

  const toggleSelected = useCallback((id) => {
    setSelected((current) => (current === id ? '' : id))
  }, [])

  const isItemOpen = useCallback(
    (item) => selected === item.id,
    [selected],
  )

  const isItemActive = useCallback(
    (item) => isNavItemActive(item, pathname),
    [pathname],
  )

  const isChildActive = useCallback(
    (path) => pathname === path,
    [pathname],
  )

  return {
    pathname,
    selected,
    toggleSelected,
    isItemOpen,
    isItemActive,
    isChildActive,
  }
}
