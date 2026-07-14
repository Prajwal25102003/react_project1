import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'darkMode'

function readStoredDarkMode() {
  if (typeof document === 'undefined') {
    return false
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) {
    try {
      return JSON.parse(stored)
    } catch {
      return document.documentElement.classList.contains('dark')
    }
  }

  return document.documentElement.classList.contains('dark')
}

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(readStoredDarkMode)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(darkMode))
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const toggleDarkMode = useCallback(() => {
    setDarkMode((value) => !value)
  }, [])

  return { darkMode, toggleDarkMode }
}
