/**
 * useRestrictionState - Restriction zone and weather state management
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { loadRestrictionVisibility, saveRestrictionVisibility } from './useSettingsPersistence'

export interface UseRestrictionStateResult {
  // Restriction states
  restrictionStates: Map<string, boolean>
  setRestrictionStates: React.Dispatch<React.SetStateAction<Map<string, boolean>>>
  toggleRestriction: (id: string) => void

  // Weather states
  weatherStates: Map<string, boolean>
  setWeatherStates: React.Dispatch<React.SetStateAction<Map<string, boolean>>>

  // Overlay states
  overlayStates: Map<string, boolean>
  setOverlayStates: React.Dispatch<React.SetStateAction<Map<string, boolean>>>

  // Rain radar
  rainRadarPath: string | null
  setRainRadarPath: React.Dispatch<React.SetStateAction<string | null>>
  radarLastUpdate: string
  setRadarLastUpdate: React.Dispatch<React.SetStateAction<string>>

  // Weather forecast panel
  showWeatherForecast: boolean
  setShowWeatherForecast: React.Dispatch<React.SetStateAction<boolean>>
  selectedPrefectureId: string | undefined
  setSelectedPrefectureId: React.Dispatch<React.SetStateAction<string | undefined>>
  enableWeatherClick: boolean
  setEnableWeatherClick: React.Dispatch<React.SetStateAction<boolean>>

  // Refs for event handlers
  restrictionStatesRef: React.RefObject<Map<string, boolean>>
  weatherStatesRef: React.RefObject<Map<string, boolean>>
  enableWeatherClickRef: React.RefObject<boolean>
}

export function useRestrictionState(): UseRestrictionStateResult {
  // Initialize from sessionStorage
  const [restrictionStates, setRestrictionStates] = useState<Map<string, boolean>>(() => {
    const stored = loadRestrictionVisibility()
    if (!stored) return new Map()
    return new Map(stored.map((id) => [id, true]))
  })

  const [weatherStates, setWeatherStates] = useState<Map<string, boolean>>(new Map())
  const [overlayStates, setOverlayStates] = useState<Map<string, boolean>>(new Map())

  // Rain radar
  const [rainRadarPath, setRainRadarPath] = useState<string | null>(null)
  const [radarLastUpdate, setRadarLastUpdate] = useState<string>('')

  // Weather forecast panel
  const [showWeatherForecast, setShowWeatherForecast] = useState(false)
  const [selectedPrefectureId, setSelectedPrefectureId] = useState<string | undefined>()
  const [enableWeatherClick, setEnableWeatherClick] = useState(false)

  // Refs for event handlers
  const restrictionStatesRef = useRef<Map<string, boolean>>(new Map())
  const weatherStatesRef = useRef<Map<string, boolean>>(new Map())
  const enableWeatherClickRef = useRef(false)

  // Sync refs
  useEffect(() => {
    restrictionStatesRef.current = restrictionStates
  }, [restrictionStates])

  useEffect(() => {
    weatherStatesRef.current = weatherStates
  }, [weatherStates])

  useEffect(() => {
    enableWeatherClickRef.current = enableWeatherClick
  }, [enableWeatherClick])

  // Save restriction visibility to sessionStorage
  useEffect(() => {
    const visibleIds = Array.from(restrictionStates.entries())
      .filter(([, isVisible]) => isVisible)
      .map(([id]) => id)
    saveRestrictionVisibility(visibleIds)
  }, [restrictionStates])

  const toggleRestriction = useCallback((id: string) => {
    setRestrictionStates((prev) => {
      const next = new Map(prev)
      const current = next.get(id) ?? false
      next.set(id, !current)
      return next
    })
  }, [])

  return {
    restrictionStates,
    setRestrictionStates,
    toggleRestriction,
    weatherStates,
    setWeatherStates,
    overlayStates,
    setOverlayStates,
    rainRadarPath,
    setRainRadarPath,
    radarLastUpdate,
    setRadarLastUpdate,
    showWeatherForecast,
    setShowWeatherForecast,
    selectedPrefectureId,
    setSelectedPrefectureId,
    enableWeatherClick,
    setEnableWeatherClick,
    restrictionStatesRef,
    weatherStatesRef,
    enableWeatherClickRef
  }
}
