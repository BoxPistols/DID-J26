/**
 * useSettingsPersistence - localStorage/sessionStorage persistence hook
 */
import { useEffect, useCallback } from 'react'

const SETTINGS_EXPIRATION_DAYS = 30
const SETTINGS_EXPIRATION_MS = SETTINGS_EXPIRATION_DAYS * 24 * 60 * 60 * 1000

export interface UISettings {
  darkMode: boolean
  baseMap: string
  enableCoordinateDisplay: boolean
  showFocusCrosshair: boolean
  crosshairDesign: string
  crosshairClickCapture: boolean
  crosshairColor: string
  tooltipAutoFade: boolean
  opacity: number
  showTooltip: boolean
  showLeftLegend: boolean
  showRightLegend: boolean
  leftSidebarWidth: number
  rightSidebarWidth: number
  coordClickType?: 'right' | 'left' | 'both'
  coordDisplayPosition?: 'click' | 'fixed'
}

export interface UseSettingsPersistenceResult {
  saveSettings: (settings: Partial<UISettings>) => void
  loadSettings: () => Partial<UISettings>
  clearSettings: () => void
}

export function useSettingsPersistence(): UseSettingsPersistenceResult {
  const loadSettings = useCallback((): Partial<UISettings> => {
    try {
      const stored = localStorage.getItem('ui-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        const { timestamp } = parsed
        const now = Date.now()

        if (timestamp && now - timestamp < SETTINGS_EXPIRATION_MS) {
          return parsed
        }
        // Expired
        localStorage.removeItem('ui-settings')
      }
    } catch (e) {
      console.error('Failed to load UI settings:', e)
    }
    return {}
  }, [])

  const saveSettings = useCallback((settings: Partial<UISettings>) => {
    try {
      const current = loadSettings()
      const merged = {
        ...current,
        ...settings,
        timestamp: Date.now()
      }
      localStorage.setItem('ui-settings', JSON.stringify(merged))
    } catch (e) {
      console.error('Failed to save UI settings:', e)
    }
  }, [loadSettings])

  const clearSettings = useCallback(() => {
    try {
      localStorage.removeItem('ui-settings')
    } catch (e) {
      console.error('Failed to clear UI settings:', e)
    }
  }, [])

  return {
    saveSettings,
    loadSettings,
    clearSettings
  }
}

// Auto-save hook for settings
export function useAutoSaveSettings(
  settings: Partial<UISettings>,
  deps: React.DependencyList
) {
  const { saveSettings } = useSettingsPersistence()

  useEffect(() => {
    saveSettings(settings)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// Map view state persistence (sessionStorage - temporary)
export interface MapViewState {
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
}

const MAP_VIEW_STATE_KEY = 'map-view-state-once'

export function saveMapViewState(state: MapViewState): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(MAP_VIEW_STATE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save map view state:', e)
  }
}

export function loadMapViewState(): MapViewState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(MAP_VIEW_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    sessionStorage.removeItem(MAP_VIEW_STATE_KEY) // one-time use

    if (!parsed || typeof parsed !== 'object') return null
    const { center, zoom, pitch, bearing } = parsed

    if (!Array.isArray(center) || center.length !== 2) return null
    const [lng, lat] = center
    if (typeof lng !== 'number' || typeof lat !== 'number') return null
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
    if (typeof zoom !== 'number' || !Number.isFinite(zoom)) return null
    if (typeof pitch !== 'number' || !Number.isFinite(pitch)) return null
    if (typeof bearing !== 'number' || !Number.isFinite(bearing)) return null

    return { center: [lng, lat], zoom, pitch, bearing }
  } catch (e) {
    console.error('Failed to load map view state:', e)
    try {
      sessionStorage.removeItem(MAP_VIEW_STATE_KEY)
    } catch {
      // ignore cleanup errors
    }
    return null
  }
}

// Restriction visibility persistence (sessionStorage)
const RESTRICTION_VIS_KEY = 'restriction-visible-ids'

export function saveRestrictionVisibility(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(RESTRICTION_VIS_KEY, JSON.stringify(ids))
  } catch {
    // ignore
  }
}

export function loadRestrictionVisibility(): string[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(RESTRICTION_VIS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((v): v is string => typeof v === 'string' && v.length > 0)
  } catch {
    return null
  }
}

// Coordinate format persistence
export function saveCoordFormat(format: 'decimal' | 'dms'): void {
  try {
    localStorage.setItem('coord-format', format)
  } catch {
    // ignore
  }
}

export function loadCoordFormat(): 'decimal' | 'dms' {
  try {
    const stored = localStorage.getItem('coord-format')
    if (stored === 'dms' || stored === 'decimal') return stored
  } catch {
    // ignore
  }
  return 'decimal'
}

// DID expanded groups persistence
const DID_EXPANDED_GROUPS_KEY = 'did-expanded-groups'

export function saveExpandedGroups(groups: Set<string>): void {
  try {
    localStorage.setItem(DID_EXPANDED_GROUPS_KEY, JSON.stringify(Array.from(groups)))
  } catch {
    // ignore
  }
}

export function loadExpandedGroups(allowedGroups: string[]): Set<string> {
  try {
    const raw = localStorage.getItem(DID_EXPANDED_GROUPS_KEY)
    if (!raw) return new Set<string>(['関東'])
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set<string>(['関東'])
    const names = parsed.filter((v): v is string => typeof v === 'string' && v.length > 0)
    const allowed = new Set(allowedGroups)
    const filtered = names.filter((n) => allowed.has(n))
    return new Set<string>(filtered)
  } catch {
    return new Set<string>(['関東'])
  }
}
