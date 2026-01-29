/**
 * useTheme - Dark mode and theme management hook
 */
import { useState, useEffect, useCallback } from 'react'
import { getAppTheme } from '../../styles/theme'

const SETTINGS_EXPIRATION_DAYS = 30
const SETTINGS_EXPIRATION_MS = SETTINGS_EXPIRATION_DAYS * 24 * 60 * 60 * 1000

export interface UseThemeResult {
  darkMode: boolean
  theme: ReturnType<typeof getAppTheme>
  toggleDarkMode: () => void
  setDarkMode: (value: boolean) => void
}

export function useTheme(): UseThemeResult {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('ui-settings')
      if (stored) {
        const { darkMode: savedDarkMode, timestamp } = JSON.parse(stored)
        const now = Date.now()
        if (timestamp && now - timestamp < SETTINGS_EXPIRATION_MS) {
          return savedDarkMode ?? false
        }
        localStorage.removeItem('ui-settings')
      }
    } catch (e) {
      console.error('Failed to load UI settings:', e)
    }
    return false
  })

  const theme = getAppTheme(darkMode)

  // Sync theme to document for CSS Modules
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
  }, [darkMode])

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev: boolean) => !prev)
  }, [])

  return {
    darkMode,
    theme,
    toggleDarkMode,
    setDarkMode
  }
}
