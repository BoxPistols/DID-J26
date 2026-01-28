/**
 * useCollisionDetection Hook
 *
 * React hook for real-time collision detection between waypoints/paths
 * and prohibited areas (DID, airports, etc.)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { FeatureCollection, Position } from 'geojson'
import RBush from 'rbush'
import {
  createSpatialIndex,
  checkWaypointCollision,
  checkWaypointCollisionOptimized,
  checkPathCollision,
  checkPolygonCollision,
  type WaypointCollisionResult,
  type PathCollisionResult,
  type PolygonCollisionResult
} from '../utils/collision'

export interface Waypoint {
  id: string
  coordinates: [number, number] // [lng, lat]
  name?: string
  altitude?: number
}

export interface FlightPath {
  id: string
  waypoints: Waypoint[]
}

export interface CollisionDetectionResult {
  waypointResults: Map<string, WaypointCollisionResult>
  pathResult: PathCollisionResult | null
  hasCollisions: boolean
  collisionCount: number
  loading: boolean
  error: string | null
}

export interface UseCollisionDetectionOptions {
  /** Use spatial index for optimization (recommended for large datasets) */
  useOptimizedIndex?: boolean
  /** Debounce delay in ms for recalculation */
  debounceMs?: number
  /** Auto-check on waypoint/path changes */
  autoCheck?: boolean
}

/**
 * Hook to detect collisions between waypoints/paths and prohibited areas
 *
 * @param waypoints - Array of waypoints to check
 * @param prohibitedAreas - GeoJSON FeatureCollection of prohibited zones
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const { waypointResults, hasCollisions, checkCollisions } = useCollisionDetection(
 *   waypoints,
 *   prohibitedAreasGeoJSON,
 *   { useOptimizedIndex: true }
 * )
 *
 * if (hasCollisions) {
 *   waypoints.forEach(wp => {
 *     const result = waypointResults.get(wp.id)
 *     if (result?.isColliding) {
 *       console.log(`${wp.name} is in ${result.areaName}`)
 *     }
 *   })
 * }
 * ```
 */
export function useCollisionDetection(
  waypoints: Waypoint[],
  prohibitedAreas: FeatureCollection | null,
  options: UseCollisionDetectionOptions = {}
): CollisionDetectionResult & {
  checkCollisions: () => void
  checkSingleWaypoint: (waypoint: Waypoint) => WaypointCollisionResult
  checkPath: (path: Position[]) => PathCollisionResult
  checkPolygon: (coords: Position[][]) => PolygonCollisionResult
} {
  const { useOptimizedIndex = true, debounceMs = 100, autoCheck = true } = options

  const [waypointResults, setWaypointResults] = useState<Map<string, WaypointCollisionResult>>(
    new Map()
  )
  const [pathResult, setPathResult] = useState<PathCollisionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const spatialIndexRef = useRef<RBush<never> | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Create spatial index when prohibited areas change
  useEffect(() => {
    if (!prohibitedAreas || prohibitedAreas.features.length === 0) {
      spatialIndexRef.current = null
      return
    }

    if (useOptimizedIndex) {
      spatialIndexRef.current = createSpatialIndex(prohibitedAreas) as RBush<never>
    }
  }, [prohibitedAreas, useOptimizedIndex])

  // Check single waypoint
  const checkSingleWaypoint = useCallback(
    (waypoint: Waypoint): WaypointCollisionResult => {
      if (!prohibitedAreas) {
        return {
          isColliding: false,
          collisionType: null,
          severity: 'SAFE',
          uiColor: '#00FF00',
          message: '禁止エリアデータがありません'
        }
      }

      if (useOptimizedIndex && spatialIndexRef.current) {
        return checkWaypointCollisionOptimized(
          waypoint.coordinates,
          spatialIndexRef.current as never
        )
      }

      return checkWaypointCollision(waypoint.coordinates, prohibitedAreas)
    },
    [prohibitedAreas, useOptimizedIndex]
  )

  // Check path
  const checkPath = useCallback(
    (path: Position[]): PathCollisionResult => {
      if (!prohibitedAreas || path.length < 2) {
        return {
          isColliding: false,
          intersectionPoints: [],
          severity: 'SAFE',
          message: path.length < 2 ? '経路には2点以上必要です' : '禁止エリアデータがありません'
        }
      }

      return checkPathCollision(path, prohibitedAreas)
    },
    [prohibitedAreas]
  )

  // Check polygon
  const checkPolygon = useCallback(
    (coords: Position[][]): PolygonCollisionResult => {
      if (!prohibitedAreas) {
        return {
          isColliding: false,
          overlapArea: 0,
          overlapRatio: 0,
          severity: 'SAFE',
          message: '禁止エリアデータがありません'
        }
      }

      return checkPolygonCollision(coords, prohibitedAreas)
    },
    [prohibitedAreas]
  )

  // Check all waypoints and path
  const checkCollisions = useCallback(() => {
    if (!prohibitedAreas) {
      setError('禁止エリアデータがありません')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = new Map<string, WaypointCollisionResult>()

      // Check each waypoint
      for (const waypoint of waypoints) {
        const result = checkSingleWaypoint(waypoint)
        results.set(waypoint.id, result)
      }

      setWaypointResults(results)

      // Check path if there are multiple waypoints
      if (waypoints.length >= 2) {
        const pathCoords = waypoints.map(wp => wp.coordinates)
        const pathRes = checkPath(pathCoords)
        setPathResult(pathRes)
      } else {
        setPathResult(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '衝突判定中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [waypoints, prohibitedAreas, checkSingleWaypoint, checkPath])

  // Auto-check with debounce
  useEffect(() => {
    if (!autoCheck || !prohibitedAreas) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      checkCollisions()
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [waypoints, prohibitedAreas, autoCheck, debounceMs, checkCollisions])

  // Calculate summary stats
  const { hasCollisions, collisionCount } = useMemo(() => {
    let count = 0
    for (const result of waypointResults.values()) {
      if (result.isColliding) count++
    }
    if (pathResult?.isColliding) count += pathResult.intersectionPoints.length

    return {
      hasCollisions: count > 0,
      collisionCount: count
    }
  }, [waypointResults, pathResult])

  return {
    waypointResults,
    pathResult,
    hasCollisions,
    collisionCount,
    loading,
    error,
    checkCollisions,
    checkSingleWaypoint,
    checkPath,
    checkPolygon
  }
}

/**
 * Hook to load prohibited areas from multiple GeoJSON sources
 */
export function useProhibitedAreas(sources: string[]): {
  data: FeatureCollection | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [data, setData] = useState<FeatureCollection | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAreas = useCallback(async () => {
    if (sources.length === 0) {
      setData(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const responses = await Promise.all(
        sources.map(async source => {
          const res = await fetch(source)
          if (!res.ok) throw new Error(`Failed to load ${source}`)
          return res.json() as Promise<FeatureCollection>
        })
      )

      // Merge all feature collections
      const merged: FeatureCollection = {
        type: 'FeatureCollection',
        features: responses.flatMap(fc => fc.features)
      }

      setData(merged)
    } catch (err) {
      setError(err instanceof Error ? err.message : '禁止エリアデータの読み込みに失敗しました')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [sources])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  return { data, loading, error, refetch: fetchAreas }
}

export default useCollisionDetection
