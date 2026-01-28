/**
 * Custom React Hooks for Drone Flight Safety
 *
 * This module provides hooks for:
 * - Mesh code conversion
 * - Weather data fetching and monitoring
 * - Network coverage checking
 * - Flight window calculation (daylight/twilight)
 * - Comprehensive operation safety assessment
 */

export {
  useMeshCodeConversion,
  type MeshCodeConversionResult
} from './useMeshCodeConversion'

export {
  useWeatherMesh,
  useCurrentWeatherForecast,
  classifyWindLevel,
  type WeatherMeshResult,
  type JmaMeshWeatherData,
  type JmaTimeSeriesData,
  type WindLevel
} from './useWeatherMesh'

export {
  useNetworkCoverage,
  type NetworkCoverageResult
} from './useNetworkCoverage'

export {
  useFlightWindow,
  type FlightWindowResult
} from './useFlightWindow'

export {
  useOperationSafety,
  getSafetyLevelColor,
  getSafetyLevelText,
  type OperationSafetyResult,
  type SafetyReason,
  type SafetyLevel
} from './useOperationSafety'

export {
  useCollisionDetection,
  useProhibitedAreas,
  type Waypoint,
  type FlightPath,
  type CollisionDetectionResult,
  type UseCollisionDetectionOptions
} from './useCollisionDetection'

// UI State Management Hooks
export {
  useTheme,
  type UseThemeResult
} from './useTheme'

export {
  useSidebarResize,
  type UseSidebarResizeOptions,
  type UseSidebarResizeResult
} from './useSidebarResize'

export {
  useSettingsPersistence,
  useAutoSaveSettings,
  saveMapViewState,
  loadMapViewState,
  saveRestrictionVisibility,
  loadRestrictionVisibility,
  saveCoordFormat,
  loadCoordFormat,
  saveExpandedGroups,
  loadExpandedGroups,
  type UISettings,
  type UseSettingsPersistenceResult,
  type MapViewState
} from './useSettingsPersistence'

export {
  useCoordinateTools,
  type CoordClickType,
  type CoordDisplayPosition,
  type UseCoordinateToolsOptions,
  type UseCoordinateToolsResult
} from './useCoordinateTools'

export {
  useLayerState,
  type UseLayerStateResult
} from './useLayerState'

export {
  useRestrictionState,
  type UseRestrictionStateResult
} from './useRestrictionState'
