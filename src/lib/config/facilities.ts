import type { FacilityLayerConfig } from '../types'

export const FACILITY_LAYERS: FacilityLayerConfig[] = [
  {
    id: 'facility-landing',
    name: '有人機発着地',
    path: '/data/facilities/landing_sites.geojson',
    color: '#4CAF50',
    category: 'landing',
    description: '空港・ヘリポート（OSM/自治体）',
    pointRadius: 10
  },
  {
    id: 'facility-military',
    name: '駐屯地・基地',
    path: '/data/facilities/military_bases.geojson',
    color: '#EF5350',
    category: 'military',
    description: '駐屯地・基地（OSM/自治体）',
    pointRadius: 10
  },
  {
    id: 'facility-fire',
    name: '消防署',
    path: '/data/facilities/fire_stations.geojson',
    color: '#FF7043',
    category: 'fire',
    description: '消防署（OSM/自治体）',
    pointRadius: 10
  },
  {
    id: 'facility-medical',
    name: '医療機関',
    path: '/data/facilities/medical_facilities.geojson',
    color: '#42A5F5',
    category: 'medical',
    description: '病院・診療所（OSM/自治体）',
    pointRadius: 10
  }
]

const FACILITY_LAYER_MAP = new Map(FACILITY_LAYERS.map((layer) => [layer.id, layer]))

export const getFacilityLayerById = (id: string): FacilityLayerConfig | undefined =>
  FACILITY_LAYER_MAP.get(id)
