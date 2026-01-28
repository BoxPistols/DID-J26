/**
 * useCoordinateTools - Coordinate display, crosshair, and format management
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import type { CrosshairDesign } from '../../components/FocusCrosshair'
import { loadCoordFormat, saveCoordFormat } from './useSettingsPersistence'

export type CoordClickType = 'right' | 'left' | 'both'
export type CoordDisplayPosition = 'click' | 'fixed'

export interface UseCoordinateToolsOptions {
  initialFormat?: 'decimal' | 'dms'
  initialShowCrosshair?: boolean
  initialCrosshairDesign?: CrosshairDesign
  initialCrosshairColor?: string
  initialClickCapture?: boolean
  initialCoordClickType?: CoordClickType
  initialCoordDisplayPosition?: CoordDisplayPosition
}

export interface UseCoordinateToolsResult {
  // Coordinate format
  coordFormat: 'decimal' | 'dms'
  setCoordFormat: (format: 'decimal' | 'dms') => void
  toggleCoordFormat: () => void

  // Coordinate display
  enableCoordinateDisplay: boolean
  setEnableCoordinateDisplay: (enabled: boolean) => void
  coordClickType: CoordClickType
  setCoordClickType: (type: CoordClickType) => void
  coordDisplayPosition: CoordDisplayPosition
  setCoordDisplayPosition: (position: CoordDisplayPosition) => void

  // Crosshair
  showFocusCrosshair: boolean
  setShowFocusCrosshair: (show: boolean) => void
  crosshairDesign: CrosshairDesign
  setCrosshairDesign: (design: CrosshairDesign) => void
  crosshairColor: string
  setCrosshairColor: (color: string) => void
  crosshairClickCapture: boolean
  setCrosshairClickCapture: (capture: boolean) => void

  // Refs for event handlers (avoid stale closures)
  enableCoordinateDisplayRef: React.RefObject<boolean>
  coordClickTypeRef: React.RefObject<CoordClickType>
  coordDisplayPositionRef: React.RefObject<CoordDisplayPosition>
  coordFormatRef: React.RefObject<'decimal' | 'dms'>
}

const getStoredSettings = () => {
  try {
    const stored = localStorage.getItem('ui-settings')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore
  }
  return {}
}

export function useCoordinateTools(
  options: UseCoordinateToolsOptions = {}
): UseCoordinateToolsResult {
  const stored = getStoredSettings()

  // Coordinate format
  const [coordFormat, setCoordFormatState] = useState<'decimal' | 'dms'>(
    options.initialFormat ?? loadCoordFormat()
  )

  // Coordinate display
  const [enableCoordinateDisplay, setEnableCoordinateDisplay] = useState<boolean>(
    stored.enableCoordinateDisplay ?? false
  )

  const [coordClickType, setCoordClickType] = useState<CoordClickType>(
    stored.coordClickType ?? options.initialCoordClickType ?? 'right'
  )

  const [coordDisplayPosition, setCoordDisplayPosition] = useState<CoordDisplayPosition>(
    stored.coordDisplayPosition ?? options.initialCoordDisplayPosition ?? 'click'
  )

  // Crosshair
  const [showFocusCrosshair, setShowFocusCrosshair] = useState<boolean>(
    stored.showFocusCrosshair ?? options.initialShowCrosshair ?? true
  )

  const [crosshairDesign, setCrosshairDesign] = useState<CrosshairDesign>(
    stored.crosshairDesign ?? options.initialCrosshairDesign ?? 'square'
  )

  const [crosshairColor, setCrosshairColor] = useState<string>(
    stored.crosshairColor ?? options.initialCrosshairColor ?? '#e53935'
  )

  const [crosshairClickCapture, setCrosshairClickCapture] = useState<boolean>(
    stored.crosshairClickCapture ?? options.initialClickCapture ?? true
  )

  // Refs for event handlers
  const enableCoordinateDisplayRef = useRef(enableCoordinateDisplay)
  const coordClickTypeRef = useRef(coordClickType)
  const coordDisplayPositionRef = useRef(coordDisplayPosition)
  const coordFormatRef = useRef(coordFormat)

  // Sync refs
  useEffect(() => {
    enableCoordinateDisplayRef.current = enableCoordinateDisplay
  }, [enableCoordinateDisplay])

  useEffect(() => {
    coordClickTypeRef.current = coordClickType
  }, [coordClickType])

  useEffect(() => {
    coordDisplayPositionRef.current = coordDisplayPosition
  }, [coordDisplayPosition])

  useEffect(() => {
    coordFormatRef.current = coordFormat
  }, [coordFormat])

  const setCoordFormat = useCallback((format: 'decimal' | 'dms') => {
    setCoordFormatState(format)
    saveCoordFormat(format)
  }, [])

  const toggleCoordFormat = useCallback(() => {
    setCoordFormatState((prev) => {
      const next = prev === 'decimal' ? 'dms' : 'decimal'
      saveCoordFormat(next)
      return next
    })
  }, [])

  return {
    // Coordinate format
    coordFormat,
    setCoordFormat,
    toggleCoordFormat,

    // Coordinate display
    enableCoordinateDisplay,
    setEnableCoordinateDisplay,
    coordClickType,
    setCoordClickType,
    coordDisplayPosition,
    setCoordDisplayPosition,

    // Crosshair
    showFocusCrosshair,
    setShowFocusCrosshair,
    crosshairDesign,
    setCrosshairDesign,
    crosshairColor,
    setCrosshairColor,
    crosshairClickCapture,
    setCrosshairClickCapture,

    // Refs
    enableCoordinateDisplayRef,
    coordClickTypeRef,
    coordDisplayPositionRef,
    coordFormatRef
  }
}
