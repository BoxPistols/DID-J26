import { describe, it, expect } from 'vitest'
import * as turf from '@turf/turf'
import type { FeatureCollection, Feature, Polygon } from 'geojson'

// Test utility functions directly since hooks need React rendering context
import {
  checkWaypointCollision,
  checkPathCollision,
  checkPolygonCollision,
  createSpatialIndex,
  checkWaypointCollisionOptimized
} from '../utils/collision'

// Test data
const createTestZone = (
  coords: number[][],
  zoneType: string,
  name: string
): Feature<Polygon> => ({
  type: 'Feature',
  properties: { zoneType, name },
  geometry: {
    type: 'Polygon',
    coordinates: [coords]
  }
})

const testProhibitedAreas: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    createTestZone(
      [
        [139.76, 35.67],
        [139.78, 35.67],
        [139.78, 35.69],
        [139.76, 35.69],
        [139.76, 35.67]
      ],
      'DID',
      '東京駅周辺DID'
    ),
    createTestZone(
      [
        [139.70, 35.55],
        [139.80, 35.55],
        [139.80, 35.60],
        [139.70, 35.60],
        [139.70, 35.55]
      ],
      'AIRPORT',
      '羽田空港周辺'
    )
  ]
}

describe('Collision Detection Integration', () => {
  describe('Waypoint Collision with Multiple Zones', () => {
    it('should detect collision with DID zone', () => {
      const waypoint: [number, number] = [139.77, 35.68]
      const result = checkWaypointCollision(waypoint, testProhibitedAreas)

      expect(result.isColliding).toBe(true)
      expect(result.collisionType).toBe('DID')
      expect(result.areaName).toBe('東京駅周辺DID')
    })

    it('should detect collision with AIRPORT zone', () => {
      const waypoint: [number, number] = [139.75, 35.57]
      const result = checkWaypointCollision(waypoint, testProhibitedAreas)

      expect(result.isColliding).toBe(true)
      expect(result.collisionType).toBe('AIRPORT')
      expect(result.areaName).toBe('羽田空港周辺')
    })

    it('should return SAFE for waypoint outside all zones', () => {
      const waypoint: [number, number] = [140.0, 36.0]
      const result = checkWaypointCollision(waypoint, testProhibitedAreas)

      expect(result.isColliding).toBe(false)
      expect(result.severity).toBe('SAFE')
    })
  })

  describe('Spatial Index Optimization', () => {
    it('should create spatial index from feature collection', () => {
      const index = createSpatialIndex(testProhibitedAreas)
      expect(index).toBeDefined()
    })

    it('should find collision using optimized index', () => {
      const index = createSpatialIndex(testProhibitedAreas)
      const waypoint: [number, number] = [139.77, 35.68]
      const result = checkWaypointCollisionOptimized(waypoint, index as never)

      expect(result.isColliding).toBe(true)
      expect(result.collisionType).toBe('DID')
    })

    it('should return SAFE when no collision using optimized index', () => {
      const index = createSpatialIndex(testProhibitedAreas)
      const waypoint: [number, number] = [140.0, 36.0]
      const result = checkWaypointCollisionOptimized(waypoint, index as never)

      expect(result.isColliding).toBe(false)
      expect(result.severity).toBe('SAFE')
    })
  })

  describe('Flight Path Collision', () => {
    it('should detect path crossing DID zone', () => {
      const path = [
        [139.75, 35.68],
        [139.79, 35.68]
      ]
      const result = checkPathCollision(path, testProhibitedAreas)

      expect(result.isColliding).toBe(true)
      expect(result.intersectionPoints.length).toBeGreaterThan(0)
    })

    it('should detect path crossing AIRPORT zone', () => {
      const path = [
        [139.65, 35.57],
        [139.85, 35.57]
      ]
      const result = checkPathCollision(path, testProhibitedAreas)

      expect(result.isColliding).toBe(true)
      expect(result.intersectionPoints.length).toBeGreaterThan(0)
    })

    it('should return SAFE for path outside all zones', () => {
      const path = [
        [140.0, 36.0],
        [140.1, 36.1]
      ]
      const result = checkPathCollision(path, testProhibitedAreas)

      expect(result.isColliding).toBe(false)
      expect(result.intersectionPoints.length).toBe(0)
    })
  })

  describe('Polygon Overlap Detection', () => {
    it('should detect polygon overlapping DID zone', () => {
      const polygon = [
        [
          [139.765, 35.675],
          [139.775, 35.675],
          [139.775, 35.685],
          [139.765, 35.685],
          [139.765, 35.675]
        ]
      ]
      const result = checkPolygonCollision(polygon, testProhibitedAreas)

      expect(result.isColliding).toBe(true)
      expect(result.overlapRatio).toBeGreaterThan(0)
    })

    it('should return SAFE for polygon outside all zones', () => {
      const polygon = [
        [
          [140.0, 36.0],
          [140.1, 36.0],
          [140.1, 36.1],
          [140.0, 36.1],
          [140.0, 36.0]
        ]
      ]
      const result = checkPolygonCollision(polygon, testProhibitedAreas)

      expect(result.isColliding).toBe(false)
      expect(result.overlapArea).toBe(0)
    })
  })

  describe('Multiple Waypoints Batch Check', () => {
    it('should correctly categorize multiple waypoints', () => {
      const waypoints = [
        { id: '1', coords: [139.77, 35.68] as [number, number] }, // DID
        { id: '2', coords: [139.75, 35.57] as [number, number] }, // AIRPORT
        { id: '3', coords: [140.0, 36.0] as [number, number] } // SAFE
      ]

      const results = waypoints.map(wp => ({
        id: wp.id,
        result: checkWaypointCollision(wp.coords, testProhibitedAreas)
      }))

      expect(results[0].result.isColliding).toBe(true)
      expect(results[0].result.collisionType).toBe('DID')

      expect(results[1].result.isColliding).toBe(true)
      expect(results[1].result.collisionType).toBe('AIRPORT')

      expect(results[2].result.isColliding).toBe(false)
      expect(results[2].result.severity).toBe('SAFE')
    })
  })

  describe('Performance with Large Dataset', () => {
    it('should handle large feature collection with spatial index', () => {
      // Create a large feature collection
      const features = []
      for (let i = 0; i < 100; i++) {
        const lng = 135 + Math.random() * 10
        const lat = 33 + Math.random() * 10
        features.push(
          createTestZone(
            [
              [lng, lat],
              [lng + 0.1, lat],
              [lng + 0.1, lat + 0.1],
              [lng, lat + 0.1],
              [lng, lat]
            ],
            'DID',
            `Test Zone ${i}`
          )
        )
      }

      const largeCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features
      }

      const index = createSpatialIndex(largeCollection)
      const startTime = performance.now()

      // Check 100 points
      for (let i = 0; i < 100; i++) {
        const waypoint: [number, number] = [135 + Math.random() * 10, 33 + Math.random() * 10]
        checkWaypointCollisionOptimized(waypoint, index as never)
      }

      const endTime = performance.now()
      const elapsed = endTime - startTime

      // Should complete 100 checks in under 100ms
      expect(elapsed).toBeLessThan(100)
    })
  })
})
