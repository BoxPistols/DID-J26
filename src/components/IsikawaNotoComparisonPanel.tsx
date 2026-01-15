/**
 * Ishikawa Noto Comparison Panel Component
 * 石川県2020年と能登2024年のDIDデータを比較表示するUI
 * 
 * ドローン飛行申請用に、地震前後の地形変化を視覚的に比較できます。
 * 透明度を個別に調整し、レイヤーを重ね合わせて確認可能。
 */

import { useState } from 'react'

export interface IsikawaNotoComparisonPanelProps {
  onLayerToggle: (layerId: string, visible: boolean) => void
  onOpacityChange: (layerId: string, opacity: number) => void
  visibleLayers: Set<string>
  opacityLayers: Map<string, number>
  darkMode?: boolean
}

const LAYER_CONFIG = {
  ishikawa2020: {
    id: 'did-17-ishikawa-2020',
    name: '石川県 (2020年)',
    year: 2020,
    color: '#4444FF',
    description: '2020年国勢調査DID（地震前基準データ）',
    helpText: '青色で表示される2020年の人口集中地区'
  },
  noto2024: {
    id: 'terrain-2024-noto',
    name: '能登半島 (2024年)',
    year: 2024,
    color: '#FF4444',
    description: '2024年能登半島地震後の地形データ',
    helpText: '赤色で表示される2024年のデータ（隆起地域を反映）'
  }
}

export function IsikawaNotoComparisonPanel({
  onLayerToggle,
  onOpacityChange,
  visibleLayers,
  opacityLayers,
  darkMode = false
}: IsikawaNotoComparisonPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null)

  const isLayerVisible = (layerId: string) => visibleLayers.has(layerId)
  const getOpacity = (layerId: string) => opacityLayers.get(layerId) ?? 0.5

  const handleToggle = (layerId: string) => {
    onLayerToggle(layerId, !isLayerVisible(layerId))
  }

  const handleOpacityChange = (layerId: string, opacity: number) => {
    onOpacityChange(layerId, opacity)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        title="石川県2020年 vs 能登2024年の地形比較"
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          padding: '10px 16px',
          backgroundColor: '#e17055',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 999,
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}
      >
        📊 地形比較
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: '380px',
        maxHeight: '70vh',
        backgroundColor: darkMode ? '#2a2a2a' : '#fff',
        color: darkMode ? '#fff' : '#333',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        zIndex: 999,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: `2px solid ${darkMode ? '#444' : '#e0e0e0'}`
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          background: 'linear-gradient(135deg, #e17055 0%, #d63031 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 'bold' }}>
            📊 地形変化比較
          </h3>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.9 }}>
            2024年能登地震による地形変化
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="閉じる"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Info Box */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: darkMode ? 'rgba(225, 112, 85, 0.1)' : '#fff3e0',
            border: `1px solid ${darkMode ? '#444' : '#ffe0b2'}`,
            borderRadius: '6px',
            fontSize: '12px',
            color: darkMode ? '#ffb74d' : '#e65100',
            lineHeight: '1.4'
          }}
        >
          <strong>💡 使用方法:</strong> スライダーで透明度を調整し、2つの年度データを重ね合わせて地形変化を比較してください。
        </div>

        {/* Layer Controls */}
        {[LAYER_CONFIG.ishikawa2020, LAYER_CONFIG.noto2024].map((layer) => (
          <div
            key={layer.id}
            onMouseEnter={() => setHoveredLayer(layer.id)}
            onMouseLeave={() => setHoveredLayer(null)}
            style={{
              padding: '12px',
              backgroundColor: darkMode ? '#333' : '#f5f5f5',
              border: `2px solid ${hoveredLayer === layer.id ? layer.color : 'transparent'}`,
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
          >
            {/* Layer Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px'
              }}
            >
              {/* Visibility Checkbox */}
              <input
                type="checkbox"
                checked={isLayerVisible(layer.id)}
                onChange={() => handleToggle(layer.id)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: layer.color
                }}
              />

              {/* Color Indicator */}
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: layer.color,
                  borderRadius: '3px',
                  border: `2px solid ${darkMode ? '#555' : '#ddd'}`
                }}
              />

              {/* Layer Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>
                  {layer.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: darkMode ? '#aaa' : '#888',
                    display: hoveredLayer === layer.id ? 'block' : 'none'
                  }}
                >
                  {hoveredLayer === layer.id
                    ? layer.helpText
                    : layer.description}
                </div>
              </div>

              {/* Year Badge */}
              <div
                style={{
                  padding: '2px 8px',
                  backgroundColor: layer.color,
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  minWidth: '50px',
                  textAlign: 'center'
                }}
              >
                {layer.year}
              </div>
            </div>

            {/* Opacity Slider */}
            {isLayerVisible(layer.id) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <label style={{ fontSize: '11px', color: darkMode ? '#999' : '#666', minWidth: '60px' }}>
                  透明度:
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(getOpacity(layer.id) * 100)}
                  onChange={(e) => handleOpacityChange(layer.id, parseInt(e.target.value) / 100)}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '3px',
                    outline: 'none',
                    accentColor: layer.color,
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '11px', minWidth: '30px', textAlign: 'right' }}>
                  {Math.round(getOpacity(layer.id) * 100)}%
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Comparison Tips */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: darkMode ? 'rgba(100, 100, 255, 0.1)' : '#e3f2fd',
            border: `1px solid ${darkMode ? '#444' : '#bbdefb'}`,
            borderRadius: '6px',
            fontSize: '11px',
            color: darkMode ? '#64b5f6' : '#1565c0'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📍 ドローン飛行申請での活用:</div>
          <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
            <li>透明度50%で両データを重ね合わせ</li>
            <li>隆起エリアの正確な座標を確認</li>
            <li>海岸線の変化を確認</li>
            <li>DID変更エリアを識別</li>
          </ul>
        </div>

        {/* Status */}
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: darkMode ? '#444' : '#fafafa',
            borderRadius: '4px',
            fontSize: '10px',
            color: darkMode ? '#aaa' : '#666',
            textAlign: 'center'
          }}
        >
          {isLayerVisible(LAYER_CONFIG.ishikawa2020.id) &&
          isLayerVisible(LAYER_CONFIG.noto2024.id)
            ? '✅ 両レイヤーが表示されています'
            : isLayerVisible(LAYER_CONFIG.ishikawa2020.id) ||
                isLayerVisible(LAYER_CONFIG.noto2024.id)
              ? '⚠️ 片方のレイヤーのみ表示中'
              : '⏸️ レイヤーが非表示です'}
        </div>
      </div>

      {/* Help Text */}
      <div
        style={{
          padding: '8px 14px',
          backgroundColor: darkMode ? '#1a1a1a' : '#f8f8f8',
          borderTop: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
          fontSize: '10px',
          color: darkMode ? '#888' : '#888',
          lineHeight: '1.3',
          flexShrink: 0
        }}
      >
        💾 本パネルの設定はセッション中保持されます。
        ブラウザを更新すると初期状態にリセットされます。
      </div>
    </div>
  )
}

export default IsikawaNotoComparisonPanel
