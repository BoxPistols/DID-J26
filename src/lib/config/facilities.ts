import type { FacilityLayerConfig } from '../types'

// ============================================
// 重要施設周辺空域（小型無人機等飛行禁止法の対象）
// ============================================
export const CRITICAL_FACILITY_LAYERS: FacilityLayerConfig[] = [
  {
    id: 'facility-military',
    name: '駐屯地・基地',
    path: '/data/facilities/military_bases.geojson',
    color: '#EF5350',
    category: 'military',
    description: '防衛関係施設',
    pointRadius: 10
  }
]

// ============================================
// 参考情報（実際の飛行前はDIPS/NOTAM確認必須）
// ============================================
export const REFERENCE_FACILITY_LAYERS: FacilityLayerConfig[] = [
  {
    id: 'facility-landing',
    name: '有人機発着地',
    path: '/data/facilities/landing_sites.geojson',
    color: '#4CAF50',
    category: 'landing',
    description: '航空法：ヘリポート等の位置情報',
    pointRadius: 10
  },
  {
    id: 'facility-fire',
    name: '消防署',
    path: '/data/facilities/fire_stations.geojson',
    color: '#FF7043',
    category: 'fire',
    description: '災害時は「緊急用務空域」指定の可能性',
    pointRadius: 10
  },
  {
    id: 'facility-medical',
    name: '医療機関',
    path: '/data/facilities/medical_facilities.geojson',
    color: '#42A5F5',
    category: 'medical',
    description: '災害時は「緊急用務空域」指定の可能性',
    pointRadius: 10
  }
]

// ============================================
// 後方互換性のためのエイリアス
// ============================================
/** @deprecated 後方互換性のため残しています。新しいコードでは CRITICAL_FACILITY_LAYERS と REFERENCE_FACILITY_LAYERS を使用してください。 */
export const FACILITY_LAYERS: FacilityLayerConfig[] = [
  ...CRITICAL_FACILITY_LAYERS,
  ...REFERENCE_FACILITY_LAYERS
]

const FACILITY_LAYER_MAP = new Map(FACILITY_LAYERS.map((layer) => [layer.id, layer]))

export const getFacilityLayerById = (id: string): FacilityLayerConfig | undefined =>
  FACILITY_LAYER_MAP.get(id)
