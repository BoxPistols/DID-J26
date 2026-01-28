/**
 * WeatherMapOverlay Component
 * Renders weather data as a heatmap overlay on the map
 */

import React, { useEffect, useRef, useCallback } from 'react'
import type maplibregl from 'maplibre-gl'
import { latLngToMeshCode, meshCodeToBBox } from '../../lib/utils/meshCodeConverter'
import { fetchMeshTimeSeries, isMockData } from '../../lib/services/jmaMesh'

export type WeatherDataType = 'wind' | 'precipitation' | 'temperature'

export interface WeatherMapOverlayProps {
  /** MapLibre GL map instance */
  map: maplibregl.Map
  /** Type of weather data to display */
  dataType: WeatherDataType
  /** Whether the overlay is visible */
  visible: boolean
  /** Forecast time offset in hours (0-72) */
  forecastHours?: number
  /** Opacity of the overlay (0-1) */
  opacity?: number
  /** Callback when mesh is clicked */
  onMeshClick?: (meshCode: string, data: MeshWeatherData) => void
}

export interface MeshWeatherData {
  meshCode: string
  windSpeed: number
  windDirection: number
  precipitationProbability: number
  temperature: number
  timestamp: string
}

interface MeshGridCell {
  meshCode: string
  bbox: [number, number, number, number]
  data?: MeshWeatherData
}

const SOURCE_ID = 'weather-mesh-source'
const LAYER_ID_FILL = 'weather-mesh-fill'
const LAYER_ID_OUTLINE = 'weather-mesh-outline'

/**
 * Get color for wind speed
 * Safe: green, Caution: yellow, Warning: orange, Danger: red
 */
function getWindSpeedColor(speed: number): string {
  if (speed < 2) return '#22c55e' // green - safe
  if (speed < 5) return '#eab308' // yellow - caution
  if (speed < 10) return '#f97316' // orange - warning
  return '#ef4444' // red - danger
}

/**
 * Get color for precipitation probability
 */
function getPrecipitationColor(probability: number): string {
  if (probability < 20) return '#22c55e' // green
  if (probability < 40) return '#a3e635' // lime
  if (probability < 60) return '#eab308' // yellow
  if (probability < 80) return '#f97316' // orange
  return '#3b82f6' // blue - high rain
}

/**
 * Get color for temperature
 */
function getTemperatureColor(temp: number): string {
  if (temp < 0) return '#3b82f6' // blue - cold
  if (temp < 10) return '#06b6d4' // cyan
  if (temp < 20) return '#22c55e' // green
  if (temp < 30) return '#eab308' // yellow
  return '#ef4444' // red - hot
}

/**
 * Get color based on data type and value
 */
function getColorForDataType(dataType: WeatherDataType, data: MeshWeatherData): string {
  switch (dataType) {
    case 'wind':
      return getWindSpeedColor(data.windSpeed)
    case 'precipitation':
      return getPrecipitationColor(data.precipitationProbability)
    case 'temperature':
      return getTemperatureColor(data.temperature)
    default:
      return '#6b7280'
  }
}

/**
 * WeatherMapOverlay Component
 * Displays weather data as colored mesh cells on the map
 *
 * @example
 * ```tsx
 * <WeatherMapOverlay
 *   map={mapInstance}
 *   dataType="wind"
 *   visible={true}
 *   forecastHours={0}
 *   opacity={0.5}
 *   onMeshClick={(code, data) => console.log(code, data)}
 * />
 * ```
 */
export const WeatherMapOverlay: React.FC<WeatherMapOverlayProps> = ({
  map,
  dataType,
  visible,
  forecastHours = 0,
  opacity = 0.5,
  onMeshClick
}) => {
  const meshCacheRef = useRef<Map<string, MeshWeatherData>>(new Map())
  const isInitializedRef = useRef(false)

  /**
   * Generate mesh grid for visible bounds
   */
  const generateMeshGrid = useCallback((): MeshGridCell[] => {
    if (!map) return []

    const bounds = map.getBounds()
    const cells: MeshGridCell[] = []

    // Generate grid at approximately 1km intervals
    const latStep = 0.5 / 60 // ~1km
    const lngStep = 0.75 / 60 // ~1km

    const minLat = Math.floor(bounds.getSouth() / latStep) * latStep
    const maxLat = Math.ceil(bounds.getNorth() / latStep) * latStep
    const minLng = Math.floor(bounds.getWest() / lngStep) * lngStep
    const maxLng = Math.ceil(bounds.getEast() / lngStep) * lngStep

    // Limit grid size to prevent performance issues
    const maxCells = 500
    let cellCount = 0

    for (let lat = minLat; lat < maxLat && cellCount < maxCells; lat += latStep) {
      for (let lng = minLng; lng < maxLng && cellCount < maxCells; lng += lngStep) {
        try {
          const meshCode = latLngToMeshCode(lat + latStep / 2, lng + lngStep / 2)
          const bbox = meshCodeToBBox(meshCode)
          cells.push({ meshCode, bbox })
          cellCount++
        } catch {
          // Skip cells outside Japan bounds
        }
      }
    }

    return cells
  }, [map])

  /**
   * Fetch weather data for mesh cells
   */
  const fetchMeshWeatherData = useCallback(
    async (cells: MeshGridCell[]): Promise<MeshGridCell[]> => {
      const results = await Promise.all(
        cells.map(async cell => {
          // Check cache first
          const cached = meshCacheRef.current.get(cell.meshCode)
          if (cached) {
            return { ...cell, data: cached }
          }

          try {
            const timeSeries = await fetchMeshTimeSeries(cell.meshCode, Math.max(1, forecastHours))
            const forecastIndex = Math.min(
              Math.floor(forecastHours * 12),
              timeSeries.forecasts.length - 1
            ) // 5-min intervals
            const forecast = timeSeries.forecasts[Math.max(0, forecastIndex)]

            const data: MeshWeatherData = {
              meshCode: cell.meshCode,
              windSpeed: forecast.windSpeed,
              windDirection: forecast.windDirection,
              precipitationProbability: forecast.precipitationProbability,
              temperature: forecast.temperature,
              timestamp: forecast.timestamp
            }

            meshCacheRef.current.set(cell.meshCode, data)
            return { ...cell, data }
          } catch {
            return cell
          }
        })
      )

      return results
    },
    [forecastHours]
  )

  /**
   * Update map source with weather data
   */
  const updateMapSource = useCallback(
    (cells: MeshGridCell[]) => {
      if (!map) return

      const features: GeoJSON.Feature[] = cells
        .filter(cell => cell.data)
        .map(cell => ({
          type: 'Feature',
          properties: {
            meshCode: cell.meshCode,
            color: getColorForDataType(dataType, cell.data!),
            windSpeed: cell.data!.windSpeed,
            precipitationProbability: cell.data!.precipitationProbability,
            temperature: cell.data!.temperature,
            isMock: isMockData({ meshCode: cell.data!.meshCode } as never)
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [cell.bbox[0], cell.bbox[1]],
                [cell.bbox[2], cell.bbox[1]],
                [cell.bbox[2], cell.bbox[3]],
                [cell.bbox[0], cell.bbox[3]],
                [cell.bbox[0], cell.bbox[1]]
              ]
            ]
          }
        }))

      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features
      }

      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
      if (source) {
        source.setData(geojson)
      }
    },
    [map, dataType]
  )

  /**
   * Initialize map layers
   */
  const initializeLayers = useCallback(() => {
    if (!map || isInitializedRef.current) return

    // Add source if not exists
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })
    }

    // Add fill layer
    if (!map.getLayer(LAYER_ID_FILL)) {
      map.addLayer({
        id: LAYER_ID_FILL,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': opacity
        }
      })
    }

    // Add outline layer
    if (!map.getLayer(LAYER_ID_OUTLINE)) {
      map.addLayer({
        id: LAYER_ID_OUTLINE,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.5,
          'line-opacity': 0.3
        }
      })
    }

    isInitializedRef.current = true
  }, [map, opacity])

  /**
   * Handle map click on mesh
   */
  useEffect(() => {
    if (!map || !onMeshClick) return

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [LAYER_ID_FILL]
      })

      if (features.length > 0) {
        const feature = features[0]
        const meshCode = feature.properties?.meshCode
        const cached = meshCacheRef.current.get(meshCode)
        if (cached) {
          onMeshClick(meshCode, cached)
        }
      }
    }

    map.on('click', LAYER_ID_FILL, handleClick)

    return () => {
      map.off('click', LAYER_ID_FILL, handleClick)
    }
  }, [map, onMeshClick])

  /**
   * Update overlay when visibility or data type changes
   */
  useEffect(() => {
    if (!map) return

    initializeLayers()

    // Set visibility
    if (map.getLayer(LAYER_ID_FILL)) {
      map.setLayoutProperty(LAYER_ID_FILL, 'visibility', visible ? 'visible' : 'none')
    }
    if (map.getLayer(LAYER_ID_OUTLINE)) {
      map.setLayoutProperty(LAYER_ID_OUTLINE, 'visibility', visible ? 'visible' : 'none')
    }

    if (!visible) return

    // Fetch and display weather data
    const updateWeatherData = async () => {
      const cells = generateMeshGrid()
      const cellsWithData = await fetchMeshWeatherData(cells)
      updateMapSource(cellsWithData)
    }

    updateWeatherData()

    // Update on map move
    const handleMoveEnd = () => {
      updateWeatherData()
    }

    map.on('moveend', handleMoveEnd)

    return () => {
      map.off('moveend', handleMoveEnd)
    }
  }, [
    map,
    visible,
    dataType,
    forecastHours,
    initializeLayers,
    generateMeshGrid,
    fetchMeshWeatherData,
    updateMapSource
  ])

  /**
   * Update opacity
   */
  useEffect(() => {
    if (!map || !map.getLayer(LAYER_ID_FILL)) return

    map.setPaintProperty(LAYER_ID_FILL, 'fill-opacity', opacity)
  }, [map, opacity])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (!map) return

      if (map.getLayer(LAYER_ID_OUTLINE)) {
        map.removeLayer(LAYER_ID_OUTLINE)
      }
      if (map.getLayer(LAYER_ID_FILL)) {
        map.removeLayer(LAYER_ID_FILL)
      }
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID)
      }

      isInitializedRef.current = false
    }
  }, [map])

  return null // This component doesn't render any DOM elements
}

export default WeatherMapOverlay
