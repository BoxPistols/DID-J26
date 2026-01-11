/**
 * Drawing Tools Component
 * DIPS風の描画ツール - ポリゴン、円、ウェイポイント、飛行経路
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import type maplibregl from 'maplibre-gl'
import { createCirclePolygon } from '../lib/utils/geo'
import { Modal } from './Modal'

// 描画モードの型定義
type DrawMode = 'none' | 'polygon' | 'circle' | 'point' | 'line'

// エクスポート形式の型定義
type ExportFormat = 'geojson' | 'kml' | 'csv' | 'dms'

// モード名の日本語表示
const MODE_LABELS: Record<DrawMode, string> = {
  none: '',
  polygon: 'ポリゴン描画中',
  circle: '円を配置（クリック）',
  point: 'ウェイポイント配置中',
  line: '経路描画中'
}

// エクスポート形式の日本語表示
const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  geojson: 'GeoJSON',
  kml: 'KML',
  csv: 'CSV',
  dms: 'DMS (NOTAM)'
}

// デフォルトカラー設定
const DEFAULT_STROKE_COLOR = '#3388ff'
const DEFAULT_FILL_COLOR = '#3388ff'
const DEFAULT_STROKE_WIDTH = 3
const DEFAULT_FILL_OPACITY = 0.25

// カラーパレット
const COLOR_PALETTE = [
  '#ff4444', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
  '#795548', '#9e9e9e', '#607d8b', '#000000'
]

// 描画されたフィーチャーの型
interface DrawnFeature {
  id: string
  type: 'polygon' | 'circle' | 'point' | 'line'
  name: string
  coordinates: GeoJSON.Position | GeoJSON.Position[] | GeoJSON.Position[][] | GeoJSON.Position[][][]
  radius?: number // 円の場合の半径(m)
  center?: [number, number] // 円の中心座標
  properties?: Record<string, unknown>
  // スタイル設定
  strokeColor?: string // 線の色
  fillColor?: string // 塗りつぶしの色
  strokeWidth?: number // 線の幅
  fillOpacity?: number // 塗りつぶしの不透明度
}

export interface DrawingToolsProps {
  map: maplibregl.Map | null
  onFeaturesChange?: (features: DrawnFeature[]) => void
  darkMode?: boolean
  embedded?: boolean // サイドバー内に埋め込む場合true
}

// localStorage用のキー
const STORAGE_KEY = 'did-map-drawn-features'

// localStorageへの保存
const saveToLocalStorage = (features: GeoJSON.FeatureCollection) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(features))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

// localStorageからの読み込み
const loadFromLocalStorage = (): GeoJSON.FeatureCollection | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return null
    return JSON.parse(data) as GeoJSON.FeatureCollection
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
    return null
  }
}

/**
 * DrawingTools Component
 * 飛行経路・飛行範囲の描画ツール
 */
export function DrawingTools({ map, onFeaturesChange, darkMode = false, embedded = false }: DrawingToolsProps) {
  const [isOpen, setIsOpen] = useState(embedded) // 埋め込み時はデフォルトで開く
  const [drawMode, setDrawMode] = useState<DrawMode>('none')
  const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>([])
  const [circleRadius, setCircleRadius] = useState(100) // メートル
  const [circlePoints, setCirclePoints] = useState(24) // 円の頂点数
  const drawRef = useRef<MapboxDraw | null>(null)
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<string>('')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('geojson')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([])
  const [selectedCount, setSelectedCount] = useState(0)
  const [continuousMode, setContinuousMode] = useState(true) // WP連続配置モード
  const drawModeRef = useRef<DrawMode>('none') // 描画モードをrefでも保持
  const continuousModeRef = useRef(true) // 連続モードをrefでも保持

  // drawModeが変更されたらrefも更新
  useEffect(() => {
    drawModeRef.current = drawMode
  }, [drawMode])

  // continuousModeが変更されたらrefも更新
  useEffect(() => {
    continuousModeRef.current = continuousMode
  }, [continuousMode])

  // Delete/Backspaceキーで選択オブジェクトを削除
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力中は無視
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // Delete または Backspace キー
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!drawRef.current) return

        const selected = drawRef.current.getSelected()
        if (selected && selected.features && selected.features.length > 0) {
          e.preventDefault()
          const ids = selected.features.map(f => String(f.id))
          setPendingDeleteIds(ids)
          setSelectedCount(ids.length)
          setShowDeleteConfirm(true)
        }
      }

      // Escapeで確認ダイアログを閉じる
      if (e.key === 'Escape' && showDeleteConfirm) {
        setShowDeleteConfirm(false)
        setPendingDeleteIds([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDeleteConfirm])

  // 選択オブジェクトを削除実行
  const handleConfirmDelete = () => {
    if (!drawRef.current || pendingDeleteIds.length === 0) return

    pendingDeleteIds.forEach(id => {
      drawRef.current?.delete(id)
    })

    setShowDeleteConfirm(false)
    setPendingDeleteIds([])
    setSelectedCount(0)
    setSelectedFeatureId(null)
    updateFeatures()
  }

  // Draw初期化
  useEffect(() => {
    if (!map) return

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      // 基本設定
      defaultMode: 'simple_select',
      keybindings: true,
      touchEnabled: true,
      boxSelect: true,
      clickBuffer: 2,
      touchBuffer: 25,
      styles: [
        // ポリゴン塗りつぶし - 非アクティブ
        {
          id: 'gl-draw-polygon-fill-inactive',
          type: 'fill',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': ['coalesce', ['get', 'user_fillColor'], DEFAULT_FILL_COLOR],
            'fill-outline-color': ['coalesce', ['get', 'user_strokeColor'], DEFAULT_STROKE_COLOR],
            'fill-opacity': ['coalesce', ['get', 'user_fillOpacity'], DEFAULT_FILL_OPACITY]
          }
        },
        // ポリゴン塗りつぶし - アクティブ
        {
          id: 'gl-draw-polygon-fill-active',
          type: 'fill',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': ['coalesce', ['get', 'user_fillColor'], DEFAULT_FILL_COLOR],
            'fill-outline-color': ['coalesce', ['get', 'user_strokeColor'], DEFAULT_STROKE_COLOR],
            'fill-opacity': ['coalesce', ['get', 'user_fillOpacity'], DEFAULT_FILL_OPACITY]
          }
        },
        // ポリゴンストローク - 非アクティブ
        {
          id: 'gl-draw-polygon-stroke-inactive',
          type: 'line',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': ['coalesce', ['get', 'user_strokeColor'], DEFAULT_STROKE_COLOR],
            'line-width': ['coalesce', ['get', 'user_strokeWidth'], DEFAULT_STROKE_WIDTH]
          }
        },
        // ポリゴンストローク - アクティブ
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': ['coalesce', ['get', 'user_strokeColor'], DEFAULT_STROKE_COLOR],
            'line-dasharray': [0.2, 2],
            'line-width': ['coalesce', ['get', 'user_strokeWidth'], DEFAULT_STROKE_WIDTH]
          }
        },
        // ライン - 非アクティブ
        {
          id: 'gl-draw-line-inactive',
          type: 'line',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': ['coalesce', ['get', 'user_strokeColor'], DEFAULT_STROKE_COLOR],
            'line-width': ['coalesce', ['get', 'user_strokeWidth'], DEFAULT_STROKE_WIDTH]
          }
        },
        // ライン - アクティブ
        {
          id: 'gl-draw-line-active',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString'], ['==', 'active', 'true']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': ['coalesce', ['get', 'user_strokeColor'], DEFAULT_STROKE_COLOR],
            'line-dasharray': [0.2, 2],
            'line-width': ['coalesce', ['get', 'user_strokeWidth'], DEFAULT_STROKE_WIDTH]
          }
        },
        // ポイント - 非アクティブ
        {
          id: 'gl-draw-point-inactive',
          type: 'circle',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'feature'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 6,
            'circle-color': ['coalesce', ['get', 'user_strokeColor'], DEFAULT_STROKE_COLOR]
          }
        },
        // ポイント - アクティブ（描画中の点）
        {
          id: 'gl-draw-point-active',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint'], ['==', 'active', 'true']],
          paint: {
            'circle-radius': 8,
            'circle-color': ['coalesce', ['get', 'user_strokeColor'], DEFAULT_STROKE_COLOR]
          }
        },
        // 描画中のポイント
        {
          id: 'gl-draw-point-point-stroke-inactive',
          type: 'circle',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['==', 'meta', 'feature'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 8,
            'circle-opacity': 1,
            'circle-color': '#fff'
          }
        },
        // 頂点 - アクティブ
        {
          id: 'gl-draw-polygon-and-line-vertex-stroke-inactive',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#fff'
          }
        },
        {
          id: 'gl-draw-polygon-and-line-vertex-inactive',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
          paint: {
            'circle-radius': 4,
            'circle-color': '#3388ff'
          }
        },
        // ミッドポイント（頂点追加用）
        {
          id: 'gl-draw-polygon-midpoint',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 4,
            'circle-color': '#3388ff'
          }
        }
      ]
    })

    // @ts-expect-error MapLibreとMapboxの互換性
    map.addControl(draw, 'top-left')
    drawRef.current = draw

    // イベントハンドラ
    const handleCreate = (e: { features: Array<{ id: string }> }) => {
      updateFeatures()

      // WP連続モードの場合は継続
      if (drawModeRef.current === 'point' && continuousModeRef.current) {
        // 連続モード: draw_pointモードを維持
        setTimeout(() => {
          draw.changeMode('draw_point')
        }, 50)
        return
      }

      // 作成後、自動的に選択状態にして編集しやすく
      if (e.features.length > 0) {
        const newFeatureId = e.features[0].id
        setSelectedFeatureId(newFeatureId)
        // 作成後、選択モードに戻す
        setTimeout(() => {
          draw.changeMode('simple_select', { featureIds: [newFeatureId] })
        }, 100)
      }
      setDrawMode('none')
    }

    const handleUpdate = () => {
      updateFeatures()
    }

    const handleDelete = () => {
      updateFeatures()
      setSelectedFeatureId(null)
    }

    const handleSelectionChange = (e: { features: Array<{ id: string }> }) => {
      if (e.features.length > 0) {
        setSelectedFeatureId(e.features[0].id)
      } else {
        setSelectedFeatureId(null)
      }
    }

    // 描画モード変更時のUI更新
    const handleModeChange = (e: { mode: string }) => {
      if (e.mode === 'simple_select' || e.mode === 'direct_select') {
        // 編集モードではカーソルを変更
        map.getCanvas().style.cursor = e.mode === 'direct_select' ? 'move' : ''
        setIsEditing(e.mode === 'direct_select')
      } else {
        setIsEditing(false)
      }
    }

    map.on('draw.create', handleCreate)
    map.on('draw.update', handleUpdate)
    map.on('draw.delete', handleDelete)
    map.on('draw.selectionchange', handleSelectionChange)
    map.on('draw.modechange', handleModeChange)

    // localStorageからデータを復元
    const savedData = loadFromLocalStorage()
    if (savedData && savedData.features.length > 0) {
      draw.set(savedData)
      updateFeatures()
    }

    return () => {
      try {
        // マップが有効な場合のみクリーンアップ
        if (map && map.getCanvas()) {
          map.off('draw.create', handleCreate)
          map.off('draw.update', handleUpdate)
          map.off('draw.delete', handleDelete)
          map.off('draw.selectionchange', handleSelectionChange)
          map.off('draw.modechange', handleModeChange)
          // @ts-expect-error MapLibreとMapboxの互換性
          map.removeControl(draw)
        }
      } catch {
        // マップが既に破棄されている場合は無視
      }
      drawRef.current = null
    }
  }, [map])

  // 円描画モードのクリックハンドラ
  useEffect(() => {
    if (!map || drawMode !== 'circle') return

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const center: [number, number] = [e.lngLat.lng, e.lngLat.lat]

      // 円ポリゴンを作成（少ない座標点で）
      const radiusKm = circleRadius / 1000
      const circlePolygon = createCirclePolygon(center, radiusKm, circlePoints)

      if (drawRef.current) {
        drawRef.current.add({
          type: 'Feature',
          properties: {
            isCircle: true,
            radiusKm,
            center,
            circlePoints,
            strokeColor: DEFAULT_STROKE_COLOR,
            fillColor: DEFAULT_FILL_COLOR,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            fillOpacity: DEFAULT_FILL_OPACITY
          },
          geometry: circlePolygon
        })
        updateFeatures()
      }

      setDrawMode('none')
    }

    map.on('click', handleClick)
    map.getCanvas().style.cursor = 'crosshair'

    return () => {
      try {
        if (map && map.getCanvas()) {
          map.off('click', handleClick)
          map.getCanvas().style.cursor = ''
        }
      } catch {
        // マップが既に破棄されている場合は無視
      }
    }
  }, [map, drawMode, circleRadius])

  // フィーチャー更新
  const updateFeatures = useCallback(() => {
    if (!drawRef.current) return

    const allFeatures = drawRef.current.getAll()
    const features: DrawnFeature[] = allFeatures.features.map((f) => {
      let type: DrawnFeature['type'] = 'polygon'
      if (f.geometry.type === 'Point') type = 'point'
      else if (f.geometry.type === 'LineString') type = 'line'
      else if (f.properties?.isCircle) type = 'circle'

      const id = typeof f.id === 'string' ? f.id : String(f.id)

      // 名前が明示的に設定されている場合はそれを使用（空文字列も許可）
      // 未設定（undefined/null）の場合のみデフォルト名を生成
      const hasExplicitName = f.properties && 'name' in f.properties
      const name = hasExplicitName
        ? (f.properties?.name as string)
        : `${type}-${id.slice(0, 6)}`

      return {
        id,
        type,
        name,
        coordinates: f.geometry.type !== 'GeometryCollection' ? f.geometry.coordinates : [],
        radius: f.properties?.radiusKm ? (f.properties.radiusKm as number) * 1000 : undefined,
        center: f.properties?.center as [number, number] | undefined,
        properties: f.properties || {},
        // スタイル情報を保持
        strokeColor: (f.properties?.strokeColor as string) || DEFAULT_STROKE_COLOR,
        fillColor: (f.properties?.fillColor as string) || DEFAULT_FILL_COLOR,
        strokeWidth: (f.properties?.strokeWidth as number) || DEFAULT_STROKE_WIDTH,
        fillOpacity: (f.properties?.fillOpacity as number) || DEFAULT_FILL_OPACITY
      }
    })

    setDrawnFeatures(features)
    onFeaturesChange?.(features)

    // localStorageに保存
    saveToLocalStorage(allFeatures)
  }, [onFeaturesChange])

  // 座標配列からバウンディングボックスを計算
  const calculateBounds = useCallback((coordinates: GeoJSON.Position[]): [[number, number], [number, number]] => {
    let minLng = Infinity
    let maxLng = -Infinity
    let minLat = Infinity
    let maxLat = -Infinity

    coordinates.forEach(coord => {
      const [lng, lat] = coord
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    })

    return [[minLng, minLat], [maxLng, maxLat]]
  }, [])

  // フィーチャーにズーム
  const zoomToFeature = useCallback((feature: DrawnFeature) => {
    if (!map) return

    let bounds: [[number, number], [number, number]] | null = null
    let center: [number, number] | null = null

    switch (feature.type) {
      case 'point':
        // ポイントの場合は中心座標にズーム
        if (Array.isArray(feature.coordinates) && feature.coordinates.length === 2) {
          center = [feature.coordinates[0] as number, feature.coordinates[1] as number]
        }
        break

      case 'circle':
        // 円の場合は中心座標にズーム
        if (feature.center) {
          center = feature.center
        }
        break

      case 'line':
        // ラインの場合は全座標からバウンディングボックスを計算
        if (Array.isArray(feature.coordinates)) {
          bounds = calculateBounds(feature.coordinates as GeoJSON.Position[])
        }
        break

      case 'polygon':
        // ポリゴンの場合は外周座標からバウンディングボックスを計算
        if (Array.isArray(feature.coordinates) && feature.coordinates.length > 0) {
          // ポリゴンの座標は [[外周], [穴1], [穴2], ...] の形式
          const outerRing = feature.coordinates[0] as GeoJSON.Position[]
          if (outerRing && outerRing.length > 0) {
            bounds = calculateBounds(outerRing)
          }
        }
        break
    }

    // ズーム実行
    if (bounds) {
      map.fitBounds(bounds, { padding: 50, maxZoom: 16 })
    } else if (center) {
      map.flyTo({ center, zoom: 16 })
    }
  }, [map, calculateBounds])

  // 描画モード変更
  const handleModeChange = (mode: DrawMode) => {
    if (!drawRef.current || !map) return

    setDrawMode(mode)
    setIsEditing(false)

    // カーソルを描画モードに合わせて変更
    const canvas = map.getCanvas()

    switch (mode) {
      case 'polygon':
        drawRef.current.changeMode('draw_polygon')
        canvas.style.cursor = 'crosshair'
        break
      case 'circle':
        // 円はカスタムモードで処理
        drawRef.current.changeMode('simple_select')
        canvas.style.cursor = 'crosshair'
        break
      case 'point':
        drawRef.current.changeMode('draw_point')
        canvas.style.cursor = 'crosshair'
        break
      case 'line':
        drawRef.current.changeMode('draw_line_string')
        canvas.style.cursor = 'crosshair'
        break
      default:
        drawRef.current.changeMode('simple_select')
        canvas.style.cursor = ''
    }
  }

  // 選択フィーチャー削除
  const handleDelete = () => {
    if (!drawRef.current || !selectedFeatureId) return
    drawRef.current.delete(selectedFeatureId)
    setSelectedFeatureId(null)
    updateFeatures()
  }

  // 全削除
  const handleDeleteAll = () => {
    if (!drawRef.current) return
    drawRef.current.deleteAll()
    setDrawnFeatures([])
    onFeaturesChange?.([])
  }

  // フィーチャー名変更
  const handleRenameFeature = (featureId: string, newName: string) => {
    if (!drawRef.current) return

    const feature = drawRef.current.get(featureId)
    if (!feature) return

    // プロパティを更新
    feature.properties = {
      ...feature.properties,
      name: newName
    }

    // フィーチャーを更新（削除して再追加）
    drawRef.current.delete(featureId)
    const updatedIds = drawRef.current.add(feature)

    // 選択状態を維持
    if (updatedIds && updatedIds.length > 0) {
      setSelectedFeatureId(String(updatedIds[0]))
    }

    updateFeatures()
  }

  // 名前が空かチェック
  const isNameEmpty = (name: string | undefined): boolean => {
    return !name || name.trim().length === 0
  }

  // フィーチャーのスタイル更新
  const handleUpdateFeatureStyle = (
    featureId: string,
    updates: {
      strokeColor?: string
      fillColor?: string
      strokeWidth?: number
      fillOpacity?: number
    }
  ) => {
    if (!drawRef.current) return

    const feature = drawRef.current.get(featureId)
    if (!feature) return

    // プロパティを更新
    feature.properties = {
      ...feature.properties,
      ...updates
    }

    // フィーチャーを更新（削除して再追加）
    drawRef.current.delete(featureId)
    const updatedIds = drawRef.current.add(feature)

    // 選択状態を維持
    if (updatedIds && updatedIds.length > 0) {
      setSelectedFeatureId(String(updatedIds[0]))
    }

    updateFeatures()
  }

  // GeoJSONフォーマットに変換
  const convertToGeoJSON = (features: GeoJSON.Feature[]): string => {
    const exportData = {
      type: 'FeatureCollection',
      features: features.map(f => {
        const props = { ...f.properties }
        // 円の場合は中心点と半径のみを出力
        if (props.isCircle && props.center) {
          return {
            type: 'Feature',
            properties: {
              type: 'circle',
              radiusM: (props.radiusKm as number) * 1000,
              center: props.center
            },
            geometry: {
              type: 'Point',
              coordinates: props.center
            }
          }
        }
        return f
      }),
      metadata: {
        exportedAt: new Date().toISOString(),
        featureCount: features.length
      }
    }
    return JSON.stringify(exportData, null, 2)
  }

  // KMLフォーマットに変換
  const convertToKML = (features: GeoJSON.Feature[]): string => {
    const kmlFeatures = features.map(f => {
      const props = f.properties || {}
      const name = props.name || f.id || 'Unnamed'
      let coordinatesKML = ''

      if (f.geometry.type === 'Point') {
        const coords = f.geometry.coordinates as [number, number]
        coordinatesKML = `<Point><coordinates>${coords[0]},${coords[1]},0</coordinates></Point>`
      } else if (f.geometry.type === 'LineString') {
        const coords = f.geometry.coordinates as [number, number][]
        const coordStr = coords.map(c => `${c[0]},${c[1]},0`).join(' ')
        coordinatesKML = `<LineString><coordinates>${coordStr}</coordinates></LineString>`
      } else if (f.geometry.type === 'Polygon') {
        const coords = f.geometry.coordinates[0] as [number, number][]
        const coordStr = coords.map(c => `${c[0]},${c[1]},0`).join(' ')
        coordinatesKML = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coordStr}</coordinates></LinearRing></outerBoundaryIs></Polygon>`
      }

      return `    <Placemark>
      <name>${name}</name>
      ${coordinatesKML}
    </Placemark>`
    }).join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Flight Plan Export</name>
    <description>Exported on ${new Date().toISOString()}</description>
${kmlFeatures}
  </Document>
</kml>`
  }

  // CSVフォーマットに変換
  const convertToCSV = (features: GeoJSON.Feature[]): string => {
    const rows = ['Type,Name,Latitude,Longitude,Radius(m)']

    features.forEach(f => {
      const props = f.properties || {}
      const name = props.name || f.id || 'Unnamed'

      if (f.geometry.type === 'Point') {
        const coords = f.geometry.coordinates as [number, number]
        const radius = props.isCircle && props.radiusKm ? (props.radiusKm * 1000).toFixed(0) : ''
        rows.push(`Point,${name},${coords[1]},${coords[0]},${radius}`)
      } else if (f.geometry.type === 'LineString') {
        const coords = f.geometry.coordinates as [number, number][]
        coords.forEach((c, i) => {
          rows.push(`LinePoint,${name}_${i + 1},${c[1]},${c[0]},`)
        })
      } else if (f.geometry.type === 'Polygon') {
        const coords = f.geometry.coordinates[0] as [number, number][]
        coords.forEach((c, i) => {
          rows.push(`PolygonPoint,${name}_${i + 1},${c[1]},${c[0]},`)
        })
      }
    })

    return rows.join('\n')
  }

  // 10進数座標を度分秒（DMS）に変換
  const decimalToDMS = (decimal: number, isLatitude: boolean): string => {
    const absolute = Math.abs(decimal)
    const degrees = Math.floor(absolute)
    const minutesDecimal = (absolute - degrees) * 60
    const minutes = Math.floor(minutesDecimal)
    const seconds = Math.floor((minutesDecimal - minutes) * 60)

    const direction = isLatitude
      ? (decimal >= 0 ? '北緯' : '南緯')
      : (decimal >= 0 ? '東経' : '西経')

    return `${direction}${degrees}°${minutes}'${seconds}"`
  }

  // DMS (NOTAM)フォーマットに変換
  const convertToDMS = (features: GeoJSON.Feature[]): string => {
    const lines: string[] = []
    let featureIndex = 1

    features.forEach(f => {
      const props = f.properties || {}
      const name = props.name || f.id || `範囲${featureIndex}`

      const coords: [number, number][] = []

      if (f.geometry.type === 'Point') {
        const point = f.geometry.coordinates as [number, number]
        coords.push(point)
      } else if (f.geometry.type === 'LineString') {
        const lineCoords = f.geometry.coordinates as [number, number][]
        coords.push(...lineCoords)
      } else if (f.geometry.type === 'Polygon') {
        const polygonCoords = f.geometry.coordinates[0] as [number, number][]
        coords.push(...polygonCoords)
      }

      if (coords.length > 0) {
        lines.push(`【${name}】`)
        coords.forEach((coord) => {
          const lat = decimalToDMS(coord[1], true)
          const lng = decimalToDMS(coord[0], false)
          lines.push(`${lat}  ${lng}`)
        })
        lines.push('') // 空行を追加
        featureIndex++
      }
    })

    return lines.join('\n')
  }

  // プレビュー表示
  const handleShowPreview = () => {
    if (!drawRef.current) return

    // 空の名前があるかチェック
    const featuresWithEmptyNames = drawnFeatures.filter(f => isNameEmpty(f.name))
    if (featuresWithEmptyNames.length > 0) {
      const message = featuresWithEmptyNames.length === 1
        ? '1つのフィーチャーに名前が設定されていません。エクスポート前に名前を入力してください。'
        : `${featuresWithEmptyNames.length}個のフィーチャーに名前が設定されていません。エクスポート前に名前を入力してください。`

      alert(message)
      return
    }

    const allFeatures = drawRef.current.getAll()
    let data = ''

    switch (exportFormat) {
      case 'geojson':
        data = convertToGeoJSON(allFeatures.features)
        break
      case 'kml':
        data = convertToKML(allFeatures.features)
        break
      case 'csv':
        data = convertToCSV(allFeatures.features)
        break
      case 'dms':
        data = convertToDMS(allFeatures.features)
        break
    }

    setPreviewData(data)
    setShowPreview(true)
  }

  // ダウンロード実行
  const handleDownload = () => {
    const mimeTypes: Record<ExportFormat, string> = {
      geojson: 'application/json',
      kml: 'application/vnd.google-earth.kml+xml',
      csv: 'text/csv',
      dms: 'text/plain'
    }

    const extensions: Record<ExportFormat, string> = {
      geojson: 'geojson',
      kml: 'kml',
      csv: 'csv',
      dms: 'txt'
    }

    const blob = new Blob([previewData], { type: mimeTypes[exportFormat] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flight-plan-${new Date().toISOString().slice(0, 10)}.${extensions[exportFormat]}`
    a.click()
    URL.revokeObjectURL(url)
    setShowPreview(false)
  }

  // 座標をテキスト形式でコピー
  const handleCopyCoordinates = () => {
    const coordText = drawnFeatures.map(f => {
      if (f.type === 'point') {
        const coords = f.coordinates as GeoJSON.Position
        return `${f.name}: ${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`
      } else if (f.type === 'circle' && f.center) {
        return `${f.name}: 中心 ${f.center[1].toFixed(6)}, ${f.center[0].toFixed(6)} / 半径 ${f.radius}m`
      } else if (f.type === 'line') {
        const coords = f.coordinates as GeoJSON.Position[]
        return `${f.name}:\n` + coords.map((c, i) =>
          `  WP${i + 1}: ${c[1].toFixed(6)}, ${c[0].toFixed(6)}`
        ).join('\n')
      } else {
        const coords = f.coordinates as GeoJSON.Position[][]
        if (coords.length > 0 && coords[0].length > 0) {
          return `${f.name} (${f.type}):\n` + coords[0].slice(0, -1).map((c, i) =>
            `  P${i + 1}: ${c[1].toFixed(6)}, ${c[0].toFixed(6)}`
          ).join('\n')
        }
        return `${f.name} (${f.type}): No coordinates`
      }
    }).join('\n\n')

    navigator.clipboard.writeText(coordText)
    alert('座標をクリップボードにコピーしました')
  }

  // 選択フィーチャーの編集モードに入る / 編集完了
  const handleEditFeature = () => {
    if (!drawRef.current || !selectedFeatureId) return
    if (isEditing) {
      // 編集中の場合は選択モードに戻る
      drawRef.current.changeMode('simple_select', { featureIds: [selectedFeatureId] })
      setIsEditing(false)
    } else {
      // 編集モードに入る
      drawRef.current.changeMode('direct_select', { featureId: selectedFeatureId })
      setIsEditing(true)
    }
  }

  // 描画モードをキャンセル
  const handleCancelMode = () => {
    if (!drawRef.current || !map) return
    drawRef.current.changeMode('simple_select')
    setDrawMode('none')
    setIsEditing(false)
    map.getCanvas().style.cursor = ''
  }

  // 円のリサイズ
  const handleResizeCircle = (newRadiusM: number) => {
    if (!drawRef.current || !selectedFeatureId) return

    const feature = drawRef.current.get(selectedFeatureId)
    if (!feature || !feature.properties?.isCircle || !feature.properties?.center) return

    const center = feature.properties.center as [number, number]
    const radiusKm = newRadiusM / 1000

    // 既存の頂点数を保持、なければデフォルト24
    const savedCirclePoints = (feature.properties.circlePoints as number) || 24

    // 既存の色情報を保持
    const strokeColor = (feature.properties.strokeColor as string) || DEFAULT_STROKE_COLOR
    const fillColor = (feature.properties.fillColor as string) || DEFAULT_FILL_COLOR
    const strokeWidth = (feature.properties.strokeWidth as number) || DEFAULT_STROKE_WIDTH
    const fillOpacity = (feature.properties.fillOpacity as number) || DEFAULT_FILL_OPACITY

    // 新しい円ポリゴンを作成
    const newCirclePolygon = createCirclePolygon(center, radiusKm, savedCirclePoints)

    // フィーチャーを更新
    drawRef.current.delete(selectedFeatureId)
    const newFeature = drawRef.current.add({
      type: 'Feature',
      properties: {
        isCircle: true,
        radiusKm,
        center,
        circlePoints: savedCirclePoints,
        strokeColor,
        fillColor,
        strokeWidth,
        fillOpacity
      },
      geometry: newCirclePolygon
    })

    // 新しいフィーチャーを選択
    if (newFeature && newFeature[0]) {
      setSelectedFeatureId(newFeature[0])
      drawRef.current.changeMode('simple_select', { featureIds: newFeature })
    }

    updateFeatures()
  }

  const bgColor = darkMode ? 'rgba(30,30,40,0.95)' : 'rgba(255,255,255,0.95)'
  const textColor = darkMode ? '#fff' : '#333'
  const borderColor = darkMode ? '#555' : '#ddd'
  const buttonBg = darkMode ? '#444' : '#f0f0f0'
  const buttonActiveBg = '#3388ff'

  // 埋め込み時は折りたたみボタンを表示しない
  if (!isOpen && !embedded) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          top: 120,
          left: 300,
          padding: '10px 16px',
          backgroundColor: '#3388ff',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
      >
        飛行経路作成
      </button>
    )
  }

  // 埋め込み時で閉じている場合は折りたたみヘッダーのみ表示
  if (!isOpen && embedded) {
    return (
      <div style={{ marginBottom: '12px', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          onClick={() => setIsOpen(true)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#3388ff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            userSelect: 'none',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a6fc9'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3388ff'}
        >
          <span>飛行経路／飛行範囲</span>
          <span style={{ fontSize: '12px' }}>▼</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={embedded ? {
        // 埋め込み時のスタイル
        marginBottom: '12px',
        backgroundColor: darkMode ? '#222' : '#f8f8f8',
        borderRadius: '4px',
        overflow: 'hidden'
      } : {
        // フローティング時のスタイル
        position: 'fixed',
        top: 120,
        left: 300,
        width: '280px',
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        zIndex: 1000,
        overflow: 'hidden'
      }}>
        {/* Header - クリック可能 */}
        <div
          onClick={() => embedded && setIsOpen(false)}
          style={{
            padding: embedded ? '10px 12px' : '12px 16px',
            backgroundColor: '#3388ff',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: embedded ? 'pointer' : 'default',
            userSelect: 'none',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => embedded && (e.currentTarget.style.backgroundColor = '#2a6fc9')}
          onMouseLeave={(e) => embedded && (e.currentTarget.style.backgroundColor = '#3388ff')}
        >
          <h3 style={{ margin: 0, fontSize: embedded ? '13px' : '14px', fontWeight: 500 }}>飛行経路／飛行範囲</h3>
          {embedded ? (
            <span style={{ fontSize: '12px', transition: 'transform 0.3s' }}>▲</span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Status Banner */}
        {(drawMode !== 'none' || isEditing) && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: isEditing ? '#e8f5e9' : '#fff3e0',
            borderBottom: `1px solid ${isEditing ? '#4caf50' : '#ff9800'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: isEditing ? '#2e7d32' : '#e65100' }}>
              {isEditing ? '編集中 - 頂点をドラッグ' : MODE_LABELS[drawMode]}
            </span>
            <button
              onClick={handleCancelMode}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: '1px solid currentColor',
                borderRadius: '4px',
                color: isEditing ? '#2e7d32' : '#e65100',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              {isEditing ? '完了' : 'キャンセル'}
            </button>
          </div>
        )}

        {/* Drawing Tools */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: darkMode ? '#ccc' : '#666', display: 'block', marginBottom: '6px' }}>
              描画ツール
            </label>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleModeChange('polygon')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: drawMode === 'polygon' ? buttonActiveBg : buttonBg,
                  color: drawMode === 'polygon' ? '#fff' : textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="ポリゴン（飛行範囲）"
              >
                ポリゴン
              </button>
              <button
                onClick={() => handleModeChange('circle')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: drawMode === 'circle' ? buttonActiveBg : buttonBg,
                  color: drawMode === 'circle' ? '#fff' : textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="円（半径指定）"
              >
                円
              </button>
              <button
                onClick={() => handleModeChange('point')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: drawMode === 'point' ? buttonActiveBg : buttonBg,
                  color: drawMode === 'point' ? '#fff' : textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="ウェイポイント"
              >
                WP
              </button>
              <button
                onClick={() => handleModeChange('line')}
                style={{
                  padding: '8px 12px',
                  backgroundColor: drawMode === 'line' ? buttonActiveBg : buttonBg,
                  color: drawMode === 'line' ? '#fff' : textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="飛行経路（ライン）"
              >
                経路
              </button>
            </div>
          </div>

          {/* 円の半径設定 */}
          {drawMode === 'circle' && (
            <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: darkMode ? '#333' : '#f0f8ff', borderRadius: '4px', border: '1px solid #3388ff' }}>
              <label style={{ fontSize: '12px', color: '#3388ff', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                半径: {circleRadius}m
              </label>
              <p style={{ fontSize: '10px', color: darkMode ? '#ccc' : '#666', margin: '0 0 8px' }}>
                地図をクリックして円を配置
              </p>
              <select
                value={circleRadius}
                onChange={(e) => setCircleRadius(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: buttonBg,
                  color: textColor
                }}
              >
                <option value={10}>10m</option>
                <option value={30}>30m</option>
                <option value={50}>50m</option>
                <option value={100}>100m</option>
                <option value={150}>150m</option>
                <option value={200}>200m</option>
                <option value={300}>300m</option>
                <option value={500}>500m</option>
                <option value={1000}>1km</option>
                <option value={2000}>2km</option>
                <option value={5000}>5km</option>
              </select>
            </div>
          )}

          {/* 円の頂点数設定 */}
          {drawMode === 'circle' && (
            <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: darkMode ? '#333' : '#e8f5e9', borderRadius: '4px', border: '1px solid #4caf50' }}>
              <label style={{ fontSize: '12px', color: '#4caf50', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                円の頂点数
              </label>
              <select
                value={circlePoints}
                onChange={(e) => setCirclePoints(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: buttonBg,
                  color: textColor
                }}
              >
                <option value={8}>8点（簡易）</option>
                <option value={12}>12点</option>
                <option value={16}>16点</option>
                <option value={24}>24点（標準）</option>
                <option value={32}>32点（滑らか）</option>
                <option value={48}>48点（精密）</option>
                <option value={64}>64点（高精度）</option>
              </select>
            </div>
          )}

          {/* WP連続配置モード */}
          {drawMode === 'point' && (
            <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: darkMode ? '#333' : '#f0f8ff', borderRadius: '4px', border: '1px solid #3388ff' }}>
              <label style={{
                fontSize: '12px',
                color: darkMode ? '#eee' : '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={continuousMode}
                  onChange={(e) => setContinuousMode(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 'bold' }}>連続配置モード</span>
              </label>
              <p style={{ fontSize: '10px', color: darkMode ? '#ccc' : '#666', margin: '6px 0 0', paddingLeft: '24px' }}>
                {continuousMode ? 'クリックで連続してWPを配置' : 'クリックで1つ配置して終了'}
              </p>
            </div>
          )}

          {/* 描画済みフィーチャー一覧 */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: darkMode ? '#ccc' : '#666', display: 'block', marginBottom: '6px' }}>
              描画済み ({drawnFeatures.length})
            </label>
            <div style={{
              maxHeight: '120px',
              overflowY: 'auto',
              border: `1px solid ${borderColor}`,
              borderRadius: '4px'
            }}>
              {drawnFeatures.length === 0 ? (
                <p style={{ padding: '8px', fontSize: '11px', color: darkMode ? '#aaa' : '#888', margin: 0, textAlign: 'center' }}>
                  地図上をクリックして描画
                </p>
              ) : (
                drawnFeatures.map(f => (
                  <div
                    key={f.id}
                    style={{
                      padding: '6px 8px',
                      borderBottom: `1px solid ${borderColor}`,
                      fontSize: '11px',
                      backgroundColor: selectedFeatureId === f.id ? (darkMode ? '#444' : '#e8f4ff') : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedFeatureId(f.id)
                      zoomToFeature(f)
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: f.type === 'point' ? '50%' : '2px',
                        backgroundColor: '#3388ff'
                      }} />
                      <span>{f.name}</span>
                      <span style={{ marginLeft: 'auto', color: darkMode ? '#aaa' : '#888' }}>
                        {f.type === 'circle' && f.radius ? `${f.radius}m` : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 選択中の円のリサイズ */}
          {selectedFeatureId && drawnFeatures.find(f => f.id === selectedFeatureId)?.type === 'circle' && (
            <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: darkMode ? '#333' : '#e8f5e9', borderRadius: '4px', border: '1px solid #4caf50' }}>
              <label style={{ fontSize: '12px', color: '#4caf50', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                円のサイズ変更
              </label>
              <select
                value={drawnFeatures.find(f => f.id === selectedFeatureId)?.radius || 100}
                onChange={(e) => handleResizeCircle(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: buttonBg,
                  color: textColor
                }}
              >
                <option value={10}>10m</option>
                <option value={30}>30m</option>
                <option value={50}>50m</option>
                <option value={100}>100m</option>
                <option value={150}>150m</option>
                <option value={200}>200m</option>
                <option value={300}>300m</option>
                <option value={500}>500m</option>
                <option value={1000}>1km</option>
                <option value={2000}>2km</option>
                <option value={5000}>5km</option>
              </select>
            </div>
          )}

          {/* 選択中の円の頂点数変更 */}
          {selectedFeatureId && drawnFeatures.find(f => f.id === selectedFeatureId)?.type === 'circle' && (
            <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: darkMode ? '#333' : '#e8f5e9', borderRadius: '4px', border: '1px solid #4caf50' }}>
              <label style={{ fontSize: '12px', color: '#4caf50', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                円の頂点数（WP数）
              </label>
              <select
                value={(drawnFeatures.find(f => f.id === selectedFeatureId)?.properties?.circlePoints as number) || 24}
                onChange={(e) => {
                  const newPoints = Number(e.target.value)
                  const currentFeature = drawnFeatures.find(f => f.id === selectedFeatureId)
                  if (currentFeature && drawRef.current) {
                    const feature = drawRef.current.get(selectedFeatureId)
                    if (feature?.properties?.center && feature?.properties?.radiusKm) {
                      const center = feature.properties.center as [number, number]
                      const radiusKm = feature.properties.radiusKm as number
                      const newCirclePolygon = createCirclePolygon(center, radiusKm, newPoints)
                      drawRef.current.delete(selectedFeatureId)
                      const newFeature = drawRef.current.add({
                        type: 'Feature',
                        properties: { isCircle: true, radiusKm, center, circlePoints: newPoints },
                        geometry: newCirclePolygon
                      })
                      if (newFeature && newFeature[0]) {
                        setSelectedFeatureId(newFeature[0])
                        drawRef.current.changeMode('simple_select', { featureIds: newFeature })
                      }
                      updateFeatures()
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: buttonBg,
                  color: textColor
                }}
              >
                <option value={8}>8点（簡易）</option>
                <option value={12}>12点</option>
                <option value={16}>16点</option>
                <option value={24}>24点（標準）</option>
                <option value={32}>32点（滑らか）</option>
                <option value={48}>48点（精密）</option>
                <option value={64}>64点（高精度）</option>
              </select>
            </div>
          )}

          {/* 選択中のフィーチャー名変更 */}
          {selectedFeatureId && (() => {
            const currentFeature = drawnFeatures.find(f => f.id === selectedFeatureId)
            const currentName = currentFeature?.name || ''
            const hasEmptyName = isNameEmpty(currentName)

            // 頂点数を計算
            let vertexCount = 0
            if (currentFeature) {
              if (currentFeature.type === 'polygon' && Array.isArray(currentFeature.coordinates) && currentFeature.coordinates.length > 0) {
                const outerRing = currentFeature.coordinates[0]
                if (Array.isArray(outerRing)) {
                  vertexCount = outerRing.length - 1 // 最後は最初と同じ座標なので-1
                }
              } else if (currentFeature.type === 'line' && Array.isArray(currentFeature.coordinates)) {
                vertexCount = currentFeature.coordinates.length
              } else if (currentFeature.type === 'circle') {
                vertexCount = (currentFeature.properties?.circlePoints as number) || 24
              }
            }

            return (
              <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: darkMode ? '#333' : '#f0f7ff', borderRadius: '4px', border: `1px solid ${darkMode ? '#555' : '#2196f3'}` }}>
                <label style={{ fontSize: '12px', color: darkMode ? '#64b5f6' : '#2196f3', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  名前
                  {hasEmptyName && (
                    <span style={{ color: '#f44336', marginLeft: '8px', fontSize: '11px' }}>
                      ※ 名前を入力してください
                    </span>
                  )}
                  {vertexCount > 0 && (
                    <span style={{ color: darkMode ? '#aaa' : '#666', marginLeft: '8px', fontSize: '11px', fontWeight: 'normal' }}>
                      ({vertexCount}点)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={currentName}
                  onChange={(e) => handleRenameFeature(selectedFeatureId, e.target.value)}
                  placeholder="フィーチャー名を入力"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: hasEmptyName ? '2px solid #f44336' : `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: hasEmptyName ? (darkMode ? '#3d2020' : '#fff5f5') : buttonBg,
                    color: textColor,
                    outline: 'none'
                  }}
                />
              </div>
            )
          })()}

          {/* カラー設定 */}
          {selectedFeatureId && (() => {
            const currentFeature = drawnFeatures.find(f => f.id === selectedFeatureId)
            if (!currentFeature) return null

            const strokeColor = currentFeature.strokeColor || DEFAULT_STROKE_COLOR
            const fillColor = currentFeature.fillColor || DEFAULT_FILL_COLOR
            const strokeWidth = currentFeature.strokeWidth || DEFAULT_STROKE_WIDTH
            const fillOpacity = currentFeature.fillOpacity || DEFAULT_FILL_OPACITY

            return (
              <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: darkMode ? '#333' : '#fafafa', borderRadius: '4px', border: `1px solid ${borderColor}` }}>
                <div style={{ fontSize: '12px', color: darkMode ? '#ccc' : '#666', fontWeight: 'bold', marginBottom: '8px' }}>
                  カラー設定
                </div>

                {/* 線の色 */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', color: darkMode ? '#aaa' : '#666', display: 'block', marginBottom: '4px' }}>
                    線の色
                  </label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={`stroke-${color}`}
                        onClick={() => handleUpdateFeatureStyle(selectedFeatureId, { strokeColor: color })}
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: color,
                          border: strokeColor === color ? '2px solid #fff' : `1px solid ${borderColor}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          boxShadow: strokeColor === color ? '0 0 0 2px #3388ff' : 'none'
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* 塗りつぶしの色 */}
                {(currentFeature.type === 'polygon' || currentFeature.type === 'circle') && (
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', color: darkMode ? '#aaa' : '#666', display: 'block', marginBottom: '4px' }}>
                      塗りつぶしの色
                    </label>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {COLOR_PALETTE.map(color => (
                        <button
                          key={`fill-${color}`}
                          onClick={() => handleUpdateFeatureStyle(selectedFeatureId, { fillColor: color })}
                          style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: color,
                            border: fillColor === color ? '2px solid #fff' : `1px solid ${borderColor}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            boxShadow: fillColor === color ? '0 0 0 2px #3388ff' : 'none'
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 線の幅 */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', color: darkMode ? '#aaa' : '#666', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>線の幅</span>
                    <span>{strokeWidth}px</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={strokeWidth}
                    onChange={(e) => handleUpdateFeatureStyle(selectedFeatureId, { strokeWidth: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* 不透明度 */}
                {(currentFeature.type === 'polygon' || currentFeature.type === 'circle') && (
                  <div>
                    <label style={{ fontSize: '11px', color: darkMode ? '#aaa' : '#666', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>不透明度</span>
                      <span>{Math.round(fillOpacity * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={fillOpacity}
                      onChange={(e) => handleUpdateFeatureStyle(selectedFeatureId, { fillOpacity: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
            )
          })()}

          {/* 編集・削除ボタン */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            <button
              onClick={handleEditFeature}
              disabled={!selectedFeatureId}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: isEditing ? '#4caf50' : (selectedFeatureId ? '#e3f2fd' : buttonBg),
                color: isEditing ? '#fff' : (selectedFeatureId ? '#1565c0' : (darkMode ? '#666' : '#999')),
                border: `1px solid ${isEditing ? '#4caf50' : borderColor}`,
                borderRadius: '4px',
                cursor: selectedFeatureId ? 'pointer' : 'not-allowed',
                fontSize: '11px',
                fontWeight: isEditing ? 'bold' : 'normal'
              }}
            >
              {isEditing ? '編集完了' : '編集'}
            </button>
            <button
              onClick={handleDelete}
              disabled={!selectedFeatureId}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: selectedFeatureId ? '#ffebee' : buttonBg,
                color: selectedFeatureId ? '#c62828' : (darkMode ? '#666' : '#999'),
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                cursor: selectedFeatureId ? 'pointer' : 'not-allowed',
                fontSize: '11px'
              }}
            >
              削除
            </button>
          </div>

          {/* 編集モード時の操作説明 */}
          {isEditing && selectedFeatureId && (() => {
            const currentFeature = drawnFeatures.find(f => f.id === selectedFeatureId)
            const isCircle = currentFeature?.type === 'circle'
            const isPolygonOrLine = currentFeature?.type === 'polygon' || currentFeature?.type === 'line'

            if (!isCircle && isPolygonOrLine) {
              return (
                <div style={{
                  marginBottom: '12px',
                  padding: '8px',
                  backgroundColor: darkMode ? '#2d3e2d' : '#f1f8e9',
                  borderRadius: '4px',
                  border: '1px solid #8bc34a',
                  fontSize: '11px',
                  color: darkMode ? '#c5e1a5' : '#558b2f'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📍 頂点の編集方法</div>
                  <div style={{ lineHeight: '1.6' }}>
                    • 頂点を移動: 青い点をドラッグ<br/>
                    • 頂点を追加: 辺の中点（半透明の点）をクリック<br/>
                    • 頂点を削除: 頂点を選択 → Delete/Backspace
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* エクスポート形式選択 */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', color: darkMode ? '#ccc' : '#666', display: 'block', marginBottom: '6px' }}>
              エクスポート形式
            </label>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {(['geojson', 'kml', 'csv', 'dms'] as ExportFormat[]).map(format => (
                <button
                  key={format}
                  onClick={() => setExportFormat(format)}
                  style={{
                    flex: '1 0 auto',
                    padding: '6px 12px',
                    backgroundColor: exportFormat === format ? '#3388ff' : buttonBg,
                    color: exportFormat === format ? '#fff' : (darkMode ? '#ccc' : '#666'),
                    border: `1px solid ${exportFormat === format ? '#3388ff' : borderColor}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: exportFormat === format ? 'bold' : 'normal'
                  }}
                >
                  {EXPORT_FORMAT_LABELS[format]}
                </button>
              ))}
            </div>
          </div>

          {/* 出力ボタン */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleCopyCoordinates}
              disabled={drawnFeatures.length === 0}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: drawnFeatures.length > 0 ? '#e3f2fd' : buttonBg,
                color: drawnFeatures.length > 0 ? '#1565c0' : (darkMode ? '#666' : '#999'),
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                cursor: drawnFeatures.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '11px'
              }}
            >
              座標コピー
            </button>
            <button
              onClick={handleShowPreview}
              disabled={drawnFeatures.length === 0}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: drawnFeatures.length > 0 ? '#e8f5e9' : buttonBg,
                color: drawnFeatures.length > 0 ? '#2e7d32' : (darkMode ? '#666' : '#999'),
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                cursor: drawnFeatures.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '11px'
              }}
            >
              データ出力
            </button>
          </div>

          {/* 全削除 */}
          {drawnFeatures.length > 0 && (
            <button
              onClick={handleDeleteAll}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '6px',
                backgroundColor: 'transparent',
                color: '#c62828',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              全て削除
            </button>
          )}
        </div>

        {/* Help */}
        <div style={{
          padding: '8px 16px',
          backgroundColor: darkMode ? '#222' : '#f8f8f8',
          borderTop: `1px solid ${borderColor}`,
          fontSize: '10px',
          color: darkMode ? '#bbb' : '#666'
        }}>
          <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>操作ガイド:</p>
          <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
            <li><strong>ポリゴン/経路:</strong> クリックで頂点追加、最初の点をクリックで完了</li>
            <li><strong>円:</strong> 半径選択後、地図をクリックで配置</li>
            <li><strong>編集:</strong> 図形選択→「編集」→頂点ドラッグで変形</li>
            <li><strong>移動:</strong> 図形をドラッグして移動</li>
            <li><strong>選択:</strong> Shift+ドラッグで複数選択</li>
            <li><strong>削除:</strong> Delete/Backspaceキーで選択オブジェクト削除</li>
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }} onClick={() => {
          setShowDeleteConfirm(false)
          setPendingDeleteIds([])
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            width: '360px',
            maxWidth: '90vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#ffebee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px'
              }}>
                🗑️
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#333' }}>
                オブジェクトを削除しますか？
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                選択された {selectedCount} 個のオブジェクトを削除します。
                <br />
                この操作は取り消せません。
              </p>
            </div>
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#f8f8f8',
              borderTop: '1px solid #eee',
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setPendingDeleteIds([])
                }}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#333'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`エクスポートプレビュー (${EXPORT_FORMAT_LABELS[exportFormat]})`}
        darkMode={darkMode}
        footer={
          <>
            <button
              onClick={() => {
                navigator.clipboard.writeText(previewData)
                alert('クリップボードにコピーしました')
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: darkMode ? '#333' : '#f0f0f0',
                border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                color: darkMode ? '#fff' : '#333'
              }}
            >
              コピー
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3388ff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ダウンロード
            </button>
          </>
        }
      >
        <pre
          style={{
            margin: 0,
            padding: '12px',
            backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontFamily: 'Monaco, Consolas, monospace',
            color: darkMode ? '#e0e0e0' : '#333',
            border: darkMode ? '1px solid #444' : 'none'
          }}
        >
          {previewData}
        </pre>
      </Modal>
    </>
  )
}

export default DrawingTools
