import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getCurrentUser,
  getNotifications,
  getUserMenuItems,
} from '../models/headerModel.js'
import { useDarkMode } from './themeController.js'

export function useHeader() {
  const [menuToggle, setMenuToggle] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifying, setNotifying] = useState(true)
  const [userOpen, setUserOpen] = useState(false)
  const { darkMode, toggleDarkMode } = useDarkMode()

  const notificationsRef = useRef(null)
  const userRef = useRef(null)

  const toggleMenu = useCallback(() => {
    setMenuToggle((value) => !value)
  }, [])

  const toggleNotifications = useCallback(() => {
    setNotificationsOpen((value) => {
      if (!value) {
        setNotifying(false)
      }
      return !value
    })
  }, [])

  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false)
  }, [])

  const toggleUserMenu = useCallback(() => {
    setUserOpen((value) => !value)
  }, [])

  const closeUserMenu = useCallback(() => {
    setUserOpen(false)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false)
      }

      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return {
    menuToggle,
    searchQuery,
    notificationsOpen,
    notifying,
    userOpen,
    darkMode,
    user: getCurrentUser(),
    notifications: getNotifications(),
    userMenuItems: getUserMenuItems(),
    notificationsRef,
    userRef,
    setSearchQuery,
    toggleMenu,
    toggleDarkMode,
    toggleNotifications,
    closeNotifications,
    toggleUserMenu,
    closeUserMenu,
  }
}
