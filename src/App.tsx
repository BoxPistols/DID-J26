import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  BASE_MAPS,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  LAYER_GROUPS,
  GEO_OVERLAYS,
  RESTRICTION_COLORS,
  createLayerNameMap,
  fetchRainRadarTimestamp,
  buildRainTileUrl,
  generateAirportGeoJSON,
  generateRedZoneGeoJSON,
  generateYellowZoneGeoJSON,
  calculateBBox,
  getCustomLayers
} from './lib'
import type { BaseMapKey, LayerConfig, LayerGroup, SearchIndexItem, LayerState, CustomLayer } from './lib'
import { CustomLayerManager } from './components/CustomLayerManager'

// ============================================
// Main App Component
// ============================================
function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  // State
  const [layerStates, setLayerStates] = useState<Map<string, LayerState>>(new Map())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['関東']))
  const [mapLoaded, setMapLoaded] = useState(false)
  const [opacity, setOpacity] = useState(0.5)
  const [baseMap, setBaseMap] = useState<BaseMapKey>('osm')
  const [overlayStates, setOverlayStates] = useState<Map<string, boolean>>(new Map())
  const [weatherStates, setWeatherStates] = useState<Map<string, boolean>>(new Map())
  const [restrictionStates, setRestrictionStates] = useState<Map<string, boolean>>(new Map())
  const [rainRadarPath, setRainRadarPath] = useState<string | null>(null)
  const [radarLastUpdate, setRadarLastUpdate] = useState<string>('')

  // Search
  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchIndexItem[]>([])

  // Legend visibility
  const [showLeftLegend, setShowLeftLegend] = useState(true)
  const [showRightLegend, setShowRightLegend] = useState(true)

  // Custom layers
  const [customLayerVisibility, setCustomLayerVisibility] = useState<Set<string>>(new Set())

  const LAYER_ID_TO_NAME = createLayerNameMap()

  // ============================================
  // Search functionality
  // ============================================
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([])
      return
    }
    const results = searchIndex.filter(item =>
      item.cityName.includes(searchTerm) || item.prefName.includes(searchTerm)
    )
    const uniqueResults = Array.from(
      new Map(results.map(item => [item.prefName + item.cityName, item])).values()
    )
    setSearchResults(uniqueResults.slice(0, 10))
  }, [searchTerm, searchIndex])

  const flyToFeature = (item: SearchIndexItem) => {
    const map = mapRef.current
    if (!map) return

    map.fitBounds(item.bbox, { padding: 50, maxZoom: 14 })

    const state = layerStates.get(item.layerId)
    if (!state || !state.visible) {
      if (map.getLayer(item.layerId)) {
        map.setLayoutProperty(item.layerId, 'visibility', 'visible')
        map.setLayoutProperty(`${item.layerId}-outline`, 'visibility', 'visible')
      }
      setLayerStates(prev => {
        const next = new Map(prev)
        next.set(item.layerId, { id: item.layerId, visible: true, loaded: true })
        return next
      })
    }
  }

  // ============================================
  // Map initialization
  // ============================================
  useEffect(() => {
    if (!mapContainer.current) return

    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
      setMapLoaded(false)
    }

    const styleConfig = BASE_MAPS[baseMap].style
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: styleConfig as maplibregl.StyleSpecification | string,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left')

    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '300px'
    })

    map.on('load', () => {
      setMapLoaded(true)
    })

    map.on('mousemove', (e) => {
      const features = map.queryRenderedFeatures(e.point)
      const didFeature = features.find(f => f.layer.id.startsWith('did-') && f.layer.type === 'fill')
      const restrictionFeature = features.find(f =>
        f.layer.id.startsWith('airport-') ||
        f.layer.id.startsWith('no-fly-')
      )

      if (didFeature && popupRef.current) {
        map.getCanvas().style.cursor = 'pointer'
        const props = didFeature.properties
        if (!props) return

        const layerId = didFeature.layer.id
        const prefName = LAYER_ID_TO_NAME.get(layerId) || ''
        const cityName = props.CITYNAME || ''
        const population = props.JINKO || 0
        const area = props.MENSEKI || 0
        const density = area > 0 ? (population / area) : 0

        const content = `
          <div class="did-popup">
            <div class="popup-header">
              <span class="pref-name">${prefName}</span>
              <span class="city-name">${cityName}</span>
            </div>
            <div class="popup-stats">
              <div class="stat-row">
                <span class="stat-label">人口</span>
                <span class="stat-value">${population.toLocaleString()}人</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">面積</span>
                <span class="stat-value">${area.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}km²</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">人口密度</span>
                <span class="stat-value">${density.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}人/km²</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">コード</span>
                <span class="stat-value">${props.KEN || '-'}-${props.CITY || '-'}</span>
              </div>
            </div>
          </div>
        `
        popupRef.current.setLngLat(e.lngLat).setHTML(content).addTo(map)
      } else if (restrictionFeature && popupRef.current) {
        map.getCanvas().style.cursor = 'pointer'
        const props = restrictionFeature.properties
        if (!props) return

        const content = `
          <div class="did-popup">
            <div class="popup-header">
              <span class="pref-name">${props.name || ''}</span>
              <span class="city-name">${props.type || ''}</span>
            </div>
            <div class="popup-stats">
              <div class="stat-row">
                <span class="stat-label">制限半径</span>
                <span class="stat-value">${props.radiusKm || '-'}km</span>
              </div>
            </div>
          </div>
        `
        popupRef.current.setLngLat(e.lngLat).setHTML(content).addTo(map)
      } else if (popupRef.current) {
        map.getCanvas().style.cursor = ''
        popupRef.current.remove()
      }
    })

    map.on('mouseleave', () => {
      if (popupRef.current) {
        map.getCanvas().style.cursor = ''
        popupRef.current.remove()
      }
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [baseMap])

  // ============================================
  // Opacity effect
  // ============================================
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    layerStates.forEach((state) => {
      if (state.visible && map.getLayer(state.id)) {
        map.setPaintProperty(state.id, 'fill-opacity', opacity)
      }
    })
  }, [opacity, layerStates, mapLoaded])

  // ============================================
  // Layer management
  // ============================================
  const addLayer = useCallback(async (layer: LayerConfig) => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    if (map.getSource(layer.id)) return

    try {
      const response = await fetch(layer.path)
      const data = await response.json()

      const newItems: SearchIndexItem[] = []
      data.features.forEach((feature: any) => {
        if (feature.properties?.CITYNAME) {
          newItems.push({
            prefName: layer.name,
            cityName: feature.properties.CITYNAME,
            bbox: calculateBBox(feature.geometry),
            layerId: layer.id
          })
        }
      })
      setSearchIndex(prev => [...prev, ...newItems])

      map.addSource(layer.id, { type: 'geojson', data })

      map.addLayer({
        id: layer.id,
        type: 'fill',
        source: layer.id,
        paint: { 'fill-color': layer.color, 'fill-opacity': opacity }
      })

      map.addLayer({
        id: `${layer.id}-outline`,
        type: 'line',
        source: layer.id,
        paint: { 'line-color': layer.color, 'line-width': 1 }
      })

      setLayerStates(prev => {
        const next = new Map(prev)
        next.set(layer.id, { id: layer.id, visible: true, loaded: true })
        return next
      })
    } catch (e) {
      console.error(`Failed to add layer ${layer.id}:`, e)
    }
  }, [mapLoaded, opacity])

  const toggleLayer = (layer: LayerConfig) => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const state = layerStates.get(layer.id)

    if (!state) {
      addLayer(layer)
      return
    }

    const newVisibility = !state.visible
    const visibility = newVisibility ? 'visible' : 'none'

    map.setLayoutProperty(layer.id, 'visibility', visibility)
    map.setLayoutProperty(`${layer.id}-outline`, 'visibility', visibility)

    setLayerStates(prev => {
      const next = new Map(prev)
      next.set(layer.id, { ...state, visible: newVisibility })
      return next
    })
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  const isLayerVisible = (layerId: string) => layerStates.get(layerId)?.visible ?? false

  const enableAllInGroup = (group: LayerGroup) => {
    group.layers.forEach(layer => {
      if (!isLayerVisible(layer.id)) {
        addLayer(layer)
      }
    })
  }

  const disableAllInGroup = (group: LayerGroup) => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    group.layers.forEach(layer => {
      const state = layerStates.get(layer.id)
      if (state?.visible) {
        map.setLayoutProperty(layer.id, 'visibility', 'none')
        map.setLayoutProperty(`${layer.id}-outline`, 'visibility', 'none')
        setLayerStates(prev => {
          const next = new Map(prev)
          next.set(layer.id, { ...state, visible: false })
          return next
        })
      }
    })
  }

  // ============================================
  // Overlay management
  // ============================================
  const toggleOverlay = (overlay: typeof GEO_OVERLAYS[0]) => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const isVisible = overlayStates.get(overlay.id) ?? false

    if (!isVisible) {
      if (!map.getSource(overlay.id)) {
        map.addSource(overlay.id, {
          type: 'raster',
          tiles: overlay.tiles,
          tileSize: 256
        })
        map.addLayer({
          id: overlay.id,
          type: 'raster',
          source: overlay.id,
          paint: { 'raster-opacity': overlay.opacity }
        })
      } else {
        map.setLayoutProperty(overlay.id, 'visibility', 'visible')
      }
      setOverlayStates(prev => new Map(prev).set(overlay.id, true))
    } else {
      map.setLayoutProperty(overlay.id, 'visibility', 'none')
      setOverlayStates(prev => new Map(prev).set(overlay.id, false))
    }
  }

  const isOverlayVisible = (overlayId: string) => overlayStates.get(overlayId) ?? false

  // ============================================
  // Weather overlay management
  // ============================================
  const updateRainRadar = async () => {
    const path = await fetchRainRadarTimestamp()
    if (path) {
      setRainRadarPath(path)
      const timestamp = path.split('/').pop()
      if (timestamp) {
        const date = new Date(parseInt(timestamp) * 1000)
        setRadarLastUpdate(date.toLocaleTimeString('ja-JP'))
      }
    }
    return path
  }

  const toggleWeatherOverlay = async (overlayId: string) => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const isVisible = weatherStates.get(overlayId) ?? false

    if (!isVisible) {
      if (overlayId === 'rain-radar') {
        let path = rainRadarPath
        if (!path) {
          path = await updateRainRadar()
        }
        if (!path) return

        const tileUrl = buildRainTileUrl(path)

        if (map.getSource('rain-radar')) {
          map.removeLayer('rain-radar')
          map.removeSource('rain-radar')
        }

        map.addSource('rain-radar', {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256
        })
        map.addLayer({
          id: 'rain-radar',
          type: 'raster',
          source: 'rain-radar',
          paint: { 'raster-opacity': 0.6 }
        })
      }
      setWeatherStates(prev => new Map(prev).set(overlayId, true))
    } else {
      if (map.getLayer(overlayId)) {
        map.setLayoutProperty(overlayId, 'visibility', 'none')
      }
      setWeatherStates(prev => new Map(prev).set(overlayId, false))
    }
  }

  const isWeatherVisible = (overlayId: string) => weatherStates.get(overlayId) ?? false

  // Rain radar auto-update
  useEffect(() => {
    if (!weatherStates.get('rain-radar')) return

    const interval = setInterval(async () => {
      const map = mapRef.current
      if (!map || !mapLoaded) return

      const path = await updateRainRadar()
      if (path && map.getSource('rain-radar')) {
        const tileUrl = buildRainTileUrl(path)
        map.removeLayer('rain-radar')
        map.removeSource('rain-radar')
        map.addSource('rain-radar', {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256
        })
        map.addLayer({
          id: 'rain-radar',
          type: 'raster',
          source: 'rain-radar',
          paint: { 'raster-opacity': 0.6 }
        })
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [weatherStates, mapLoaded])

  // ============================================
  // Restriction zone management
  // ============================================
  const toggleRestriction = async (restrictionId: string) => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const isVisible = restrictionStates.get(restrictionId) ?? false

    if (!isVisible) {
      let geojson: GeoJSON.FeatureCollection | null = null
      let color = ''

      if (restrictionId === 'airport-airspace') {
        geojson = generateAirportGeoJSON()
        color = RESTRICTION_COLORS.airport
      } else if (restrictionId === 'no-fly-red') {
        geojson = generateRedZoneGeoJSON()
        color = RESTRICTION_COLORS.no_fly_red
      } else if (restrictionId === 'no-fly-yellow') {
        geojson = generateYellowZoneGeoJSON()
        color = RESTRICTION_COLORS.no_fly_yellow
      }

      if (geojson && !map.getSource(restrictionId)) {
        map.addSource(restrictionId, { type: 'geojson', data: geojson })
        map.addLayer({
          id: restrictionId,
          type: 'fill',
          source: restrictionId,
          paint: { 'fill-color': color, 'fill-opacity': 0.4 }
        })
        map.addLayer({
          id: `${restrictionId}-outline`,
          type: 'line',
          source: restrictionId,
          paint: { 'line-color': color, 'line-width': 2 }
        })
      } else if (map.getLayer(restrictionId)) {
        map.setLayoutProperty(restrictionId, 'visibility', 'visible')
        map.setLayoutProperty(`${restrictionId}-outline`, 'visibility', 'visible')
      }
      setRestrictionStates(prev => new Map(prev).set(restrictionId, true))
    } else {
      if (map.getLayer(restrictionId)) {
        map.setLayoutProperty(restrictionId, 'visibility', 'none')
        map.setLayoutProperty(`${restrictionId}-outline`, 'visibility', 'none')
      }
      setRestrictionStates(prev => new Map(prev).set(restrictionId, false))
    }
  }

  const isRestrictionVisible = (id: string) => restrictionStates.get(id) ?? false

  // ============================================
  // Custom layer management
  // ============================================
  const handleCustomLayerAdded = useCallback((layer: CustomLayer) => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    if (!map.getSource(layer.id)) {
      map.addSource(layer.id, { type: 'geojson', data: layer.data })
      map.addLayer({
        id: layer.id,
        type: 'fill',
        source: layer.id,
        paint: { 'fill-color': layer.color, 'fill-opacity': layer.opacity }
      })
      map.addLayer({
        id: `${layer.id}-outline`,
        type: 'line',
        source: layer.id,
        paint: { 'line-color': layer.color, 'line-width': 2 }
      })
    }
    setCustomLayerVisibility(prev => new Set(prev).add(layer.id))
  }, [mapLoaded])

  const handleCustomLayerRemoved = useCallback((layerId: string) => {
    const map = mapRef.current
    if (!map) return

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId)
      map.removeLayer(`${layerId}-outline`)
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId)
    }
    setCustomLayerVisibility(prev => {
      const next = new Set(prev)
      next.delete(layerId)
      return next
    })
  }, [])

  const handleCustomLayerToggle = useCallback((layerId: string, visible: boolean) => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    // レイヤーがまだ追加されていない場合は追加
    if (visible && !map.getSource(layerId)) {
      const customLayers = getCustomLayers()
      const layer = customLayers.find(l => l.id === layerId)
      if (layer) {
        handleCustomLayerAdded(layer)
        return
      }
    }

    if (map.getLayer(layerId)) {
      const visibility = visible ? 'visible' : 'none'
      map.setLayoutProperty(layerId, 'visibility', visibility)
      map.setLayoutProperty(`${layerId}-outline`, 'visibility', visibility)
    }

    setCustomLayerVisibility(prev => {
      const next = new Set(prev)
      if (visible) {
        next.add(layerId)
      } else {
        next.delete(layerId)
      }
      return next
    })
  }, [mapLoaded, handleCustomLayerAdded])

  // ============================================
  // Render
  // ============================================
  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative' }}>
      {/* Left Legend Panel */}
      <aside style={{
        position: 'absolute',
        left: showLeftLegend ? 0 : -280,
        top: 0,
        bottom: 0,
        width: '280px',
        padding: '12px',
        backgroundColor: 'rgba(255,255,255,0.95)',
        color: '#333',
        overflowY: 'auto',
        zIndex: 10,
        transition: 'left 0.3s ease',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        fontSize: '12px'
      }}>
        {/* Toggle button */}
        <button
          onClick={() => setShowLeftLegend(!showLeftLegend)}
          style={{
            position: 'absolute',
            right: -24,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 24,
            height: 48,
            background: 'rgba(255,255,255,0.95)',
            border: 'none',
            borderRadius: '0 4px 4px 0',
            cursor: 'pointer',
            boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
          }}
        >
          {showLeftLegend ? '<' : '>'}
        </button>

        {/* Search */}
        <div style={{ marginBottom: '12px', position: 'relative' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="市区町村検索..."
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '0 0 4px 4px',
              maxHeight: '150px',
              overflowY: 'auto',
              zIndex: 100
            }}>
              {searchResults.map((item, index) => (
                <div
                  key={`${item.prefName}-${item.cityName}-${index}`}
                  onClick={() => { flyToFeature(item); setSearchTerm(''); }}
                  style={{
                    padding: '6px 8px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    fontSize: '11px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ color: '#888', marginRight: '4px' }}>{item.prefName}</span>
                  {item.cityName}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Base map selector */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {(Object.keys(BASE_MAPS) as BaseMapKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setBaseMap(key)}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  backgroundColor: baseMap === key ? '#4a90d9' : '#f0f0f0',
                  color: baseMap === key ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                {BASE_MAPS[key].name}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity slider */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: '#666' }}>
            透明度: {Math.round(opacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        {/* Restriction Areas Section */}
        <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f8f8f8', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
            禁止エリア
          </h3>

          {/* Airport airspace */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isRestrictionVisible('airport-airspace')}
              onChange={() => toggleRestriction('airport-airspace')}
            />
            <span style={{ width: '14px', height: '14px', backgroundColor: RESTRICTION_COLORS.airport, borderRadius: '2px' }} />
            <span>空港など周辺空域</span>
          </label>

          {/* DID */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', cursor: 'pointer' }}>
            <input type="checkbox" disabled checked={layerStates.size > 0} />
            <span style={{ width: '14px', height: '14px', backgroundColor: RESTRICTION_COLORS.did, borderRadius: '2px' }} />
            <span>人口集中地区</span>
          </label>

          {/* Emergency airspace */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', cursor: 'pointer', opacity: 0.5 }}>
            <input type="checkbox" disabled />
            <span style={{ width: '14px', height: '14px', backgroundColor: RESTRICTION_COLORS.emergency, borderRadius: '2px' }} />
            <span>緊急用務空域</span>
          </label>

          {/* Manned aircraft */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', cursor: 'pointer', opacity: 0.5 }}>
            <input type="checkbox" disabled />
            <span style={{ width: '14px', height: '14px', backgroundColor: RESTRICTION_COLORS.manned, borderRadius: '2px' }} />
            <span>有人機発着エリア</span>
          </label>

          {/* Remote ID */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', cursor: 'pointer', opacity: 0.5 }}>
            <input type="checkbox" disabled />
            <span style={{ width: '14px', height: '14px', backgroundColor: RESTRICTION_COLORS.remote_id, borderRadius: '2px' }} />
            <span>リモートID特定区域</span>
          </label>

          {/* No-fly law section */}
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ddd' }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>小型無人機等飛行禁止法</div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isRestrictionVisible('no-fly-red')}
                onChange={() => toggleRestriction('no-fly-red')}
              />
              <span style={{ width: '14px', height: '14px', backgroundColor: RESTRICTION_COLORS.no_fly_red, borderRadius: '2px' }} />
              <span>レッドゾーン</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isRestrictionVisible('no-fly-yellow')}
                onChange={() => toggleRestriction('no-fly-yellow')}
              />
              <span style={{ width: '14px', height: '14px', backgroundColor: RESTRICTION_COLORS.no_fly_yellow, borderRadius: '2px' }} />
              <span>イエローゾーン</span>
            </label>
          </div>
        </div>

        {/* DID Section */}
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600 }}>人口集中地区（DID）</h3>
          {LAYER_GROUPS.map(group => (
            <div key={group.name} style={{ marginBottom: '4px' }}>
              <button
                onClick={() => toggleGroup(group.name)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: '#f0f0f0',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px'
                }}
              >
                <span>{group.name}</span>
                <span>{expandedGroups.has(group.name) ? '▼' : '▶'}</span>
              </button>

              {expandedGroups.has(group.name) && (
                <div style={{ padding: '4px 0 4px 8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    <button
                      onClick={() => enableAllInGroup(group)}
                      style={{ flex: 1, padding: '2px 4px', fontSize: '10px', backgroundColor: '#e8e8e8', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
                    >
                      全て表示
                    </button>
                    <button
                      onClick={() => disableAllInGroup(group)}
                      style={{ flex: 1, padding: '2px 4px', fontSize: '10px', backgroundColor: '#e8e8e8', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
                    >
                      全て非表示
                    </button>
                  </div>
                  {group.layers.map(layer => (
                    <label
                      key={layer.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0', cursor: 'pointer', fontSize: '11px' }}
                    >
                      <input
                        type="checkbox"
                        checked={isLayerVisible(layer.id)}
                        onChange={() => toggleLayer(layer)}
                      />
                      <span style={{ width: '10px', height: '10px', backgroundColor: layer.color, borderRadius: '2px' }} />
                      <span>{layer.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Right Legend Panel */}
      <aside style={{
        position: 'absolute',
        right: showRightLegend ? 0 : -200,
        top: 0,
        bottom: 0,
        width: '200px',
        padding: '12px',
        backgroundColor: 'rgba(255,255,255,0.95)',
        color: '#333',
        overflowY: 'auto',
        zIndex: 10,
        transition: 'right 0.3s ease',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        fontSize: '12px'
      }}>
        {/* Toggle button */}
        <button
          onClick={() => setShowRightLegend(!showRightLegend)}
          style={{
            position: 'absolute',
            left: -24,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 24,
            height: 48,
            background: 'rgba(255,255,255,0.95)',
            border: 'none',
            borderRadius: '4px 0 0 4px',
            cursor: 'pointer',
            boxShadow: '-2px 0 4px rgba(0,0,0,0.1)'
          }}
        >
          {showRightLegend ? '>' : '<'}
        </button>

        <h3 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
          禁止エリア
        </h3>

        {/* Geographic Info */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>地理情報</div>
          {GEO_OVERLAYS.filter(o => o.id !== 'buildings').map(overlay => (
            <label key={overlay.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', cursor: 'pointer', fontSize: '11px' }}>
              <input
                type="checkbox"
                checked={isOverlayVisible(overlay.id)}
                onChange={() => toggleOverlay(overlay)}
              />
              <span>{overlay.name}</span>
            </label>
          ))}

          {/* 地物 */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', cursor: 'pointer', fontSize: '11px', opacity: 0.5 }}>
            <input type="checkbox" disabled />
            <span>地物</span>
          </label>
        </div>

        {/* Weather Info */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>天候情報</div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', cursor: 'pointer', fontSize: '11px' }}>
            <input
              type="checkbox"
              checked={isWeatherVisible('rain-radar')}
              onChange={() => toggleWeatherOverlay('rain-radar')}
            />
            <span>雨雲</span>
            {isWeatherVisible('rain-radar') && radarLastUpdate && (
              <span style={{ fontSize: '9px', color: '#888' }}>{radarLastUpdate}</span>
            )}
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', cursor: 'pointer', fontSize: '11px', opacity: 0.5 }}>
            <input type="checkbox" disabled />
            <span>風向・風量</span>
          </label>
        </div>

        {/* Signal Info */}
        <div>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>電波種</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', opacity: 0.5 }}>
            <input type="checkbox" disabled />
            <span>LTE</span>
          </label>
        </div>
      </aside>

      {/* Map Container */}
      <div ref={mapContainer} style={{ flex: 1 }} />

      {/* Custom Layer Manager */}
      <CustomLayerManager
        onLayerAdded={handleCustomLayerAdded}
        onLayerRemoved={handleCustomLayerRemoved}
        onLayerToggle={handleCustomLayerToggle}
        visibleLayers={customLayerVisibility}
      />

      {/* Attribution */}
      <div style={{
        position: 'absolute',
        bottom: 4,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        color: '#666',
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: '2px 8px',
        borderRadius: '2px',
        zIndex: 5
      }}>
        出典: 政府統計の総合窓口(e-Stat) / 国土地理院
      </div>
    </div>
  )
}

export default App
