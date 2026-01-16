/**
 * Custom Layer Manager Component
 * ユーザーがカスタムレイヤーをインポート/エクスポート/管理するUI
 */

import { useMemo, useState, useRef } from 'react'
import {
  CustomLayerService,
  CustomLayer,
  CustomLayerConfig,
  readGeoJSONFile,
  downloadAsFile
} from '../lib/services/customLayers'
import { showToast } from '../utils/toast'
import { showConfirm } from '../utils/dialog'
import { getAppTheme } from '../styles/theme'

export interface CustomLayerManagerProps {
  onLayerAdded: (layer: CustomLayer) => void
  onLayerRemoved: (layerId: string) => void
  onLayerToggle: (layerId: string, visible: boolean) => void
  onLayerFocus?: (layerId: string) => void
  visibleLayers: Set<string>
  darkMode: boolean
}

/**
 * Layer categories and their visual properties
 */
const CATEGORIES = [
  { id: 'emergency', name: '緊急用務空域', color: '#FFA500' },
  { id: 'manned', name: '有人機発着エリア', color: '#87CEEB' },
  { id: 'remote_id', name: 'リモートID特定区域', color: '#DDA0DD' },
  { id: 'lte', name: 'LTEエリア', color: '#4CAF50' },
  { id: 'wind', name: '風況データ', color: '#2196F3' },
  { id: 'custom', name: 'カスタム', color: '#888888' }
]

/**
 * CustomLayerManager Component
 *
 * Manages user-created custom geographic layers with import/export functionality.
 * Allows users to:
 * - Import GeoJSON files as custom layers
 * - Export layers as GeoJSON
 * - Delete custom layers with confirmation
 * - Configure layer properties (name, category, color, opacity)
 *
 * @component
 * @param props - Component props
 * @returns JSX Element
 */
export function CustomLayerManager({
  onLayerAdded,
  onLayerRemoved,
  onLayerToggle,
  onLayerFocus,
  visibleLayers,
  darkMode
}: CustomLayerManagerProps) {
  const theme = useMemo(() => getAppTheme(darkMode), [darkMode])
  const [isOpen, setIsOpen] = useState(false)
  const [customLayers, setCustomLayers] = useState<CustomLayer[]>(() => CustomLayerService.getAll())
  const [importing, setImporting] = useState(false)
  const [newLayerConfig, setNewLayerConfig] = useState<Partial<CustomLayerConfig>>({
    category: 'custom',
    color: '#888888',
    opacity: 0.5
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handles GeoJSON file selection and import
   * Reads file, validates GeoJSON format, and adds as new layer
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const geojson = await readGeoJSONFile(file)

      const config: CustomLayerConfig = {
        id: `custom-${Date.now()}`,
        name: newLayerConfig.name || file.name.replace(/\.[^/.]+$/, ''),
        category: newLayerConfig.category || 'custom',
        color: newLayerConfig.color || '#888888',
        opacity: newLayerConfig.opacity ?? 0.5,
        description: newLayerConfig.description
      }

      const newLayer = CustomLayerService.importGeoJSON(geojson, config)
      setCustomLayers(CustomLayerService.getAll())
      onLayerAdded(newLayer)

      // Reset form
      setNewLayerConfig({
        category: 'custom',
        color: '#888888',
        opacity: 0.5
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to import GeoJSON:', error)
      showToast('GeoJSONファイルの読み込みに失敗しました', 'error')
    } finally {
      setImporting(false)
    }
  }

  /**
   * Handles layer deletion with user confirmation
   * Shows confirm dialog before removing layer from storage
   */
  const handleRemoveLayer = async (layerId: string) => {
    const confirmed = await showConfirm('このレイヤーを削除しますか？', {
      confirmText: '削除',
      cancelText: 'キャンセル'
    })
    if (confirmed) {
      CustomLayerService.remove(layerId)
      setCustomLayers(CustomLayerService.getAll())
      onLayerRemoved(layerId)
      showToast('レイヤーを削除しました', 'success')
    }
  }

  /**
   * Exports all custom layers as a JSON file
   */
  const handleExportAll = () => {
    const data = CustomLayerService.exportAll()
    downloadAsFile(data, 'custom-layers.json')
  }

  /**
   * Exports a single custom layer as GeoJSON file
   */
  const handleExportLayer = (layerId: string) => {
    const data = CustomLayerService.exportAsGeoJSON(layerId)
    if (data) {
      const layer = CustomLayerService.getById(layerId)
      downloadAsFile(data, `${layer?.name || layerId}.geojson`)
    }
  }

  const focusLayer = (layerId: string) => {
    // フォーカスするなら、まず表示状態にしておく（見えないままズームすると混乱するため）
    if (!visibleLayers.has(layerId)) {
      onLayerToggle(layerId, true)
    }
    onLayerFocus?.(layerId)
  }

  /**
   * Handles bulk import of multiple layers from JSON file
   * Reads JSON file and imports all layers defined in it
   */
  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      const result = CustomLayerService.import(content)

      if (result.success) {
        setCustomLayers(CustomLayerService.getAll())
        showToast(`${result.count}件のレイヤーをインポートしました`, 'success')
      } else {
        showToast(`インポートに失敗しました: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast('ファイルの読み込みに失敗しました', 'error')
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          padding: '10px 16px',
          backgroundColor: theme.colors.buttonBgActive,
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
      >
        カスタムレイヤー管理
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: '360px',
      maxHeight: '80vh',
      backgroundColor: theme.colors.panelBg,
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      zIndex: 1000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: theme.colors.buttonBgActive,
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px' }}>カスタムレイヤー管理</h3>
        <button
          onClick={() => setIsOpen(false)}
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
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Import Section */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '12px', color: theme.colors.textMuted }}>
            GeoJSONファイルをインポート
          </h4>

          <div style={{ marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="レイヤー名"
              value={newLayerConfig.name || ''}
              onChange={(e) => setNewLayerConfig({ ...newLayerConfig, name: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: `1px solid ${theme.colors.borderStrong}`,
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '4px',
                backgroundColor: theme.colors.buttonBg,
                color: theme.colors.text
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select
              value={newLayerConfig.category}
              onChange={(e) => {
                const cat = CATEGORIES.find(c => c.id === e.target.value)
                setNewLayerConfig({
                  ...newLayerConfig,
                  category: e.target.value,
                  color: cat?.color || '#888888'
                })
              }}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: `1px solid ${theme.colors.borderStrong}`,
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: theme.colors.buttonBg,
                color: theme.colors.text
              }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <input
              type="color"
              value={newLayerConfig.color}
              onChange={(e) => setNewLayerConfig({ ...newLayerConfig, color: e.target.value })}
              style={{ width: '40px', height: '32px', border: 'none', cursor: 'pointer' }}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.geojson"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: importing ? theme.colors.borderStrong : theme.colors.buttonBgActive,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: importing ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            {importing ? 'インポート中...' : 'GeoJSONファイルを選択'}
          </button>
        </div>

        {/* Existing Layers */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '12px', color: theme.colors.textMuted }}>
            登録済みレイヤー ({customLayers.length})
          </h4>

          {customLayers.length === 0 ? (
            <p style={{ fontSize: '11px', color: theme.colors.textSubtle, textAlign: 'center', padding: '16px' }}>
              カスタムレイヤーがありません
            </p>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {customLayers.map(layer => (
                <div
                  key={layer.id}
                  style={{
                    padding: '8px',
                    marginBottom: '4px',
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : '#f8f8f8',
                    borderRadius: '4px',
                    fontSize: '11px',
                    border: `1px solid ${theme.colors.border}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <input
                      type="checkbox"
                      checked={visibleLayers.has(layer.id)}
                      onChange={(e) => onLayerToggle(layer.id, e.target.checked)}
                    />
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: layer.color,
                        borderRadius: '2px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => focusLayer(layer.id)}
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        padding: 0,
                        background: 'none',
                        border: 'none',
                        fontWeight: 600,
                        color: theme.colors.text,
                        cursor: 'pointer'
                      }}
                      title="クリックでズーム"
                    >
                      {layer.name}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '24px' }}>
                    <span style={{ color: theme.colors.textSubtle, fontSize: '10px' }}>
                      {CATEGORIES.find(c => c.id === layer.category)?.name || layer.category}
                    </span>
                    <span style={{ color: theme.colors.textSubtle, fontSize: '10px' }}>|</span>
                    <span style={{ color: theme.colors.textSubtle, fontSize: '10px' }}>
                      {layer.data.features.length} features
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', marginLeft: '24px' }}>
                    <button
                      type="button"
                      onClick={() => focusLayer(layer.id)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        backgroundColor: darkMode ? 'rgba(51,136,255,0.18)' : 'rgba(51,136,255,0.12)',
                        border: `1px solid ${
                          darkMode ? 'rgba(160, 199, 255, 0.55)' : 'rgba(21, 101, 192, 0.35)'
                        }`,
                        borderRadius: '2px',
                        cursor: 'pointer',
                        color: darkMode ? '#a0c7ff' : '#1565c0',
                        fontWeight: 700
                      }}
                      title="ズーム"
                    >
                      ZOOM
                    </button>
                    <button
                      onClick={() => handleExportLayer(layer.id)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        backgroundColor: darkMode ? 'rgba(255,255,255,0.10)' : '#e8e8e8',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        color: theme.colors.text
                      }}
                    >
                      エクスポート
                    </button>
                    <button
                      onClick={() => handleRemoveLayer(layer.id)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        backgroundColor: darkMode ? 'rgba(239, 83, 80, 0.18)' : '#ffebee',
                        color: darkMode ? '#ff8a80' : '#c62828',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bulk Operations */}
        <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: '12px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '12px', color: theme.colors.textMuted }}>一括操作</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExportAll}
              disabled={customLayers.length === 0}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '11px',
                backgroundColor:
                  customLayers.length === 0
                    ? (darkMode ? 'rgba(255,255,255,0.08)' : '#eee')
                    : (darkMode ? 'rgba(255,255,255,0.10)' : '#f0f0f0'),
                border: 'none',
                borderRadius: '4px',
                cursor: customLayers.length === 0 ? 'not-allowed' : 'pointer',
                color: theme.colors.text
              }}
            >
              全てエクスポート
            </button>
            <label style={{
              flex: 1,
              padding: '8px',
              fontSize: '11px',
              backgroundColor: darkMode ? 'rgba(255,255,255,0.10)' : '#f0f0f0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'center',
              color: theme.colors.text
            }}>
              一括インポート
              <input
                type="file"
                accept=".json"
                onChange={handleBulkImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Help text */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : '#f8f8f8',
        borderTop: `1px solid ${theme.colors.border}`,
        fontSize: '10px',
        color: theme.colors.textSubtle
      }}>
        GeoJSON形式のファイルをインポートできます。
        データはブラウザのローカルストレージに保存されます。
      </div>
    </div>
  )
}

export default CustomLayerManager
