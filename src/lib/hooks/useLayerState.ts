/**
 * useLayerState - DID layer state management hook
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import type { LayerState, SearchIndexItem } from '../types'
import { loadExpandedGroups, saveExpandedGroups } from './useSettingsPersistence'
import { LAYER_GROUPS } from '../config/layers'

export interface UseLayerStateResult {
  // Layer states
  layerStates: Map<string, LayerState>
  setLayerStates: React.Dispatch<React.SetStateAction<Map<string, LayerState>>>

  // Expanded groups (UI accordion state)
  expandedGroups: Set<string>
  toggleGroup: (groupName: string) => void
  setExpandedGroups: React.Dispatch<React.SetStateAction<Set<string>>>

  // DID group color mode
  didGroupColorMode: Map<string, 'default' | 'red'>
  setDidGroupColorMode: React.Dispatch<React.SetStateAction<Map<string, 'default' | 'red'>>>

  // Loading state
  loadingLayers: Map<string, string>
  setLoadingLayers: React.Dispatch<React.SetStateAction<Map<string, string>>>
  showProgressBar: boolean

  // Search index
  searchIndex: SearchIndexItem[]
  setSearchIndex: React.Dispatch<React.SetStateAction<SearchIndexItem[]>>

  // Ref for event handlers (avoid stale closures)
  layerStatesRef: React.RefObject<Map<string, LayerState>>

  // Custom layer visibility
  customLayerVisibility: Set<string>
  setCustomLayerVisibility: React.Dispatch<React.SetStateAction<Set<string>>>
}

export function useLayerState(): UseLayerStateResult {
  const allowedGroups = LAYER_GROUPS.map((g) => g.name)

  // Layer states
  const [layerStates, setLayerStates] = useState<Map<string, LayerState>>(new Map())

  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() =>
    loadExpandedGroups(allowedGroups)
  )

  // DID group color mode
  const [didGroupColorMode, setDidGroupColorMode] = useState<Map<string, 'default' | 'red'>>(
    () => new Map()
  )

  // Loading state
  const [loadingLayers, setLoadingLayers] = useState<Map<string, string>>(new Map())
  const [showProgressBar, setShowProgressBar] = useState(false)

  // Search index
  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([])

  // Custom layer visibility
  const [customLayerVisibility, setCustomLayerVisibility] = useState<Set<string>>(new Set())

  // Ref for event handlers
  const layerStatesRef = useRef<Map<string, LayerState>>(new Map())

  // Sync ref
  useEffect(() => {
    layerStatesRef.current = layerStates
  }, [layerStates])

  // Progress bar fade effect
  useEffect(() => {
    if (loadingLayers.size > 0) {
      setShowProgressBar(true)
    } else {
      const timer = setTimeout(() => {
        setShowProgressBar(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [loadingLayers.size])

  // Save expanded groups
  useEffect(() => {
    saveExpandedGroups(expandedGroups)
  }, [expandedGroups])

  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }, [])

  return {
    layerStates,
    setLayerStates,
    expandedGroups,
    toggleGroup,
    setExpandedGroups,
    didGroupColorMode,
    setDidGroupColorMode,
    loadingLayers,
    setLoadingLayers,
    showProgressBar,
    searchIndex,
    setSearchIndex,
    layerStatesRef,
    customLayerVisibility,
    setCustomLayerVisibility
  }
}
