/**
 * Japan Drone Map Library - Type Definitions
 */

import maplibregl from 'maplibre-gl'

// ============================================
// Base Map Types
// ============================================
export interface BaseMapConfig {
  id: string
  name: string
  style: string | maplibregl.StyleSpecification
}

export type BaseMapKey = 'osm' | 'gsi' | 'pale' | 'photo'

// ============================================
// Layer Types
// ============================================
export interface LayerConfig {
  id: string
  name: string
  path: string
  color: string
}

export interface LayerGroup {
  name: string
  layers: LayerConfig[]
}

export interface LayerState {
  id: string
  visible: boolean
}

// ============================================
// Overlay Types
// ============================================
export interface GeoOverlay {
  id: string
  name: string
  tiles: string[]
  opacity: number
  category: 'geo' | 'weather' | 'restriction'
  minZoom?: number
  maxZoom?: number
}

export interface WeatherOverlay {
  id: string
  name: string
  opacity: number
  dynamic: boolean
  updateInterval?: number // milliseconds
}

// ============================================
// Restriction Zone Types (ドローン飛行禁止エリア)
// ============================================
export type RestrictionType =
  | 'airport'           // 空港等周辺空域
  | 'did'               // 人口集中地区
  | 'emergency'         // 緊急用務空域
  | 'manned'            // 有人機発着エリア
  | 'remote_id'         // リモートID特定区域
  | 'no_fly_red'        // 小型無人機等飛行禁止法 レッドゾーン
  | 'no_fly_yellow'     // 小型無人機等飛行禁止法 イエローゾーン

export interface RestrictionZone {
  id: string
  name: string
  type: RestrictionType
  color: string
  opacity: number
  path?: string          // GeoJSON path
  tiles?: string[]       // Tile URL
  description?: string
}

export interface RestrictionCategory {
  id: string
  name: string
  zones: RestrictionZone[]
}

// ============================================
// Airport Types
// ============================================
export interface Airport {
  id: string
  name: string
  nameEn?: string
  type: 'international' | 'domestic' | 'military' | 'heliport'
  coordinates: [number, number] // [lng, lat]
  radiusKm: number // 空港周辺の制限半径
  surfaces?: AirportSurface[]
}

export interface AirportSurface {
  type: 'horizontal' | 'conical' | 'approach' | 'transitional'
  heightLimit: number // meters
  geometry: GeoJSON.Geometry
}

// ============================================
// Weather Data Types
// ============================================
export interface WindData {
  speed: number      // m/s
  direction: number  // degrees
  gust?: number      // m/s
}

export interface WeatherData {
  timestamp: number
  wind?: WindData
  rain?: number      // mm/h
  visibility?: number // meters
}

// ============================================
// Search Types
// ============================================
export interface SearchIndexItem {
  prefName: string
  cityName: string
  bbox: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
  layerId: string
}

// ============================================
// Map State Types
// ============================================
export interface MapState {
  center: [number, number]
  zoom: number
  baseMap: BaseMapKey
}

export interface LayerVisibilityState {
  layers: Map<string, LayerState>
  overlays: Map<string, boolean>
  weather: Map<string, boolean>
  restrictions: Map<string, boolean>
}

// ============================================
// Event Types
// ============================================
export interface LayerClickEvent {
  layerId: string
  feature: GeoJSON.Feature
  lngLat: { lng: number; lat: number }
}

export interface MapClickEvent {
  lngLat: { lng: number; lat: number }
  features: GeoJSON.Feature[]
}

// ============================================
// Configuration Types
// ============================================
export interface JapanDroneMapConfig {
  apiKeys?: {
    openWeatherMap?: string
  }
  initialCenter?: [number, number]
  initialZoom?: number
  defaultBaseMap?: BaseMapKey
  enabledCategories?: {
    did?: boolean
    restrictions?: boolean
    weather?: boolean
    geo?: boolean
  }
}

// ============================================
// Component Props Types
// ============================================
export interface MapContainerProps {
  config?: JapanDroneMapConfig
  onMapLoad?: (map: maplibregl.Map) => void
  onLayerClick?: (event: LayerClickEvent) => void
}

export interface LayerControlProps {
  categories: RestrictionCategory[]
  layerGroups: LayerGroup[]
  onToggleLayer: (layerId: string) => void
  onToggleCategory: (categoryId: string) => void
}
