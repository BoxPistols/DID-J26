/**
 * Airport Data Service
 * Japanese airports with restriction zones
 */

import { Airport } from '../types'
import { createCirclePolygon, calculateDistance } from '../utils/geo'

// 主要空港データ（小型無人機等飛行禁止法の対象空港含む）
export const MAJOR_AIRPORTS: Airport[] = [
  // 小型無人機等飛行禁止法で指定された8空港
  {
    id: 'NRT',
    name: '成田国際空港',
    nameEn: 'Narita International Airport',
    type: 'international',
    coordinates: [140.3929, 35.7720],
    radiusKm: 24
  },
  {
    id: 'HND',
    name: '東京国際空港（羽田）',
    nameEn: 'Tokyo International Airport (Haneda)',
    type: 'international',
    coordinates: [139.7798, 35.5494],
    radiusKm: 24
  },
  {
    id: 'KIX',
    name: '関西国際空港',
    nameEn: 'Kansai International Airport',
    type: 'international',
    coordinates: [135.2440, 34.4347],
    radiusKm: 24
  },
  {
    id: 'ITM',
    name: '大阪国際空港（伊丹）',
    nameEn: 'Osaka International Airport (Itami)',
    type: 'international',
    coordinates: [135.4380, 34.7855],
    radiusKm: 24
  },
  {
    id: 'NGO',
    name: '中部国際空港',
    nameEn: 'Chubu Centrair International Airport',
    type: 'international',
    coordinates: [136.8052, 34.8584],
    radiusKm: 24
  },
  {
    id: 'CTS',
    name: '新千歳空港',
    nameEn: 'New Chitose Airport',
    type: 'international',
    coordinates: [141.6922, 42.7752],
    radiusKm: 24
  },
  {
    id: 'FUK',
    name: '福岡空港',
    nameEn: 'Fukuoka Airport',
    type: 'international',
    coordinates: [130.4511, 33.5859],
    radiusKm: 24
  },
  {
    id: 'OKA',
    name: '那覇空港',
    nameEn: 'Naha Airport',
    type: 'international',
    coordinates: [127.6465, 26.1958],
    radiusKm: 24
  },
  // その他の主要空港
  {
    id: 'SDJ',
    name: '仙台空港',
    nameEn: 'Sendai Airport',
    type: 'domestic',
    coordinates: [140.9225, 38.1397],
    radiusKm: 6
  },
  {
    id: 'HIJ',
    name: '広島空港',
    nameEn: 'Hiroshima Airport',
    type: 'domestic',
    coordinates: [132.9220, 34.4361],
    radiusKm: 6
  },
  {
    id: 'KMJ',
    name: '熊本空港',
    nameEn: 'Kumamoto Airport',
    type: 'domestic',
    coordinates: [130.8553, 32.8373],
    radiusKm: 6
  },
  {
    id: 'KOJ',
    name: '鹿児島空港',
    nameEn: 'Kagoshima Airport',
    type: 'domestic',
    coordinates: [130.7191, 31.8034],
    radiusKm: 6
  },
  {
    id: 'NGS',
    name: '長崎空港',
    nameEn: 'Nagasaki Airport',
    type: 'domestic',
    coordinates: [129.9146, 32.9169],
    radiusKm: 6
  },
  {
    id: 'OIT',
    name: '大分空港',
    nameEn: 'Oita Airport',
    type: 'domestic',
    coordinates: [131.7368, 33.4794],
    radiusKm: 6
  },
  {
    id: 'KMI',
    name: '宮崎空港',
    nameEn: 'Miyazaki Airport',
    type: 'domestic',
    coordinates: [131.4489, 31.8772],
    radiusKm: 6
  },
  {
    id: 'TAK',
    name: '高松空港',
    nameEn: 'Takamatsu Airport',
    type: 'domestic',
    coordinates: [134.0159, 34.2142],
    radiusKm: 6
  },
  {
    id: 'MYJ',
    name: '松山空港',
    nameEn: 'Matsuyama Airport',
    type: 'domestic',
    coordinates: [132.6997, 33.8272],
    radiusKm: 6
  },
  {
    id: 'KCZ',
    name: '高知龍馬空港',
    nameEn: 'Kochi Ryoma Airport',
    type: 'domestic',
    coordinates: [133.6694, 33.5461],
    radiusKm: 6
  },
  {
    id: 'TKS',
    name: '徳島空港',
    nameEn: 'Tokushima Airport',
    type: 'domestic',
    coordinates: [134.6067, 34.1328],
    radiusKm: 6
  },
  {
    id: 'OKJ',
    name: '岡山空港',
    nameEn: 'Okayama Airport',
    type: 'domestic',
    coordinates: [133.8550, 34.7569],
    radiusKm: 6
  },
  {
    id: 'UBJ',
    name: '山口宇部空港',
    nameEn: 'Yamaguchi Ube Airport',
    type: 'domestic',
    coordinates: [131.2789, 33.9300],
    radiusKm: 6
  },
  {
    id: 'IZO',
    name: '出雲空港',
    nameEn: 'Izumo Airport',
    type: 'domestic',
    coordinates: [132.8900, 35.4136],
    radiusKm: 6
  },
  {
    id: 'TTJ',
    name: '鳥取空港',
    nameEn: 'Tottori Airport',
    type: 'domestic',
    coordinates: [134.1669, 35.5300],
    radiusKm: 6
  },
  {
    id: 'KMQ',
    name: '小松空港',
    nameEn: 'Komatsu Airport',
    type: 'domestic',
    coordinates: [136.4067, 36.3947],
    radiusKm: 6
  },
  {
    id: 'TOY',
    name: '富山空港',
    nameEn: 'Toyama Airport',
    type: 'domestic',
    coordinates: [137.1878, 36.6483],
    radiusKm: 6
  },
  {
    id: 'NKM',
    name: '県営名古屋空港',
    nameEn: 'Nagoya Airfield',
    type: 'domestic',
    coordinates: [136.9239, 35.2550],
    radiusKm: 6
  },
  {
    id: 'FSZ',
    name: '静岡空港',
    nameEn: 'Shizuoka Airport',
    type: 'domestic',
    coordinates: [138.1900, 34.7961],
    radiusKm: 6
  },
  {
    id: 'MMJ',
    name: '松本空港',
    nameEn: 'Matsumoto Airport',
    type: 'domestic',
    coordinates: [137.9228, 36.1669],
    radiusKm: 6
  },
  {
    id: 'KIJ',
    name: '新潟空港',
    nameEn: 'Niigata Airport',
    type: 'domestic',
    coordinates: [139.1211, 37.9558],
    radiusKm: 6
  },
  {
    id: 'AKJ',
    name: '旭川空港',
    nameEn: 'Asahikawa Airport',
    type: 'domestic',
    coordinates: [142.4475, 43.6708],
    radiusKm: 6
  },
  {
    id: 'HKD',
    name: '函館空港',
    nameEn: 'Hakodate Airport',
    type: 'domestic',
    coordinates: [140.8219, 41.7700],
    radiusKm: 6
  }
]

// 自衛隊基地
export const MILITARY_BASES: Airport[] = [
  {
    id: 'RJAH',
    name: '百里基地',
    nameEn: 'Hyakuri Air Base',
    type: 'military',
    coordinates: [140.4147, 36.1811],
    radiusKm: 6
  },
  {
    id: 'RJTY',
    name: '横田基地',
    nameEn: 'Yokota Air Base',
    type: 'military',
    coordinates: [139.3486, 35.7484],
    radiusKm: 6
  },
  {
    id: 'RJFK',
    name: '築城基地',
    nameEn: 'Tsuiki Air Base',
    type: 'military',
    coordinates: [131.0397, 33.6847],
    radiusKm: 6
  },
  {
    id: 'RJOI',
    name: '岩国基地',
    nameEn: 'Marine Corps Air Station Iwakuni',
    type: 'military',
    coordinates: [132.2358, 34.1439],
    radiusKm: 6
  },
  {
    id: 'RJNA',
    name: '浜松基地',
    nameEn: 'Hamamatsu Air Base',
    type: 'military',
    coordinates: [137.7028, 34.7503],
    radiusKm: 6
  }
]

/**
 * Get all airports
 */
export function getAllAirports(): Airport[] {
  return [...MAJOR_AIRPORTS, ...MILITARY_BASES]
}

/**
 * Get airports that require special restrictions (小型無人機等飛行禁止法)
 */
export function getNoFlyLawAirports(): Airport[] {
  return MAJOR_AIRPORTS.filter(a => a.radiusKm >= 24)
}

/**
 * Generate GeoJSON for airport restriction zones
 */
export function generateAirportGeoJSON(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = []

  for (const airport of getAllAirports()) {
    const polygon = createCirclePolygon(airport.coordinates, airport.radiusKm)

    features.push({
      type: 'Feature',
      properties: {
        id: airport.id,
        name: airport.name,
        nameEn: airport.nameEn,
        type: airport.type,
        radiusKm: airport.radiusKm
      },
      geometry: polygon
    })
  }

  return {
    type: 'FeatureCollection',
    features
  }
}

/**
 * Generate GeoJSON for airport markers (points)
 */
export function generateAirportMarkersGeoJSON(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = getAllAirports().map(airport => ({
    type: 'Feature',
    properties: {
      id: airport.id,
      name: airport.name,
      nameEn: airport.nameEn,
      type: airport.type,
      radiusKm: airport.radiusKm
    },
    geometry: {
      type: 'Point',
      coordinates: airport.coordinates
    }
  }))

  return {
    type: 'FeatureCollection',
    features
  }
}

/**
 * Check if a point is within any airport restriction zone
 */
export function isInAirportZone(
  lat: number,
  lng: number
): { inZone: boolean; airport?: Airport } {
  for (const airport of getAllAirports()) {
    const distance = calculateDistance(
      lat,
      lng,
      airport.coordinates[1],
      airport.coordinates[0]
    )

    if (distance <= airport.radiusKm) {
      return { inZone: true, airport }
    }
  }

  return { inZone: false }
}

export const AirportService = {
  getAllAirports,
  getNoFlyLawAirports,
  generateGeoJSON: generateAirportGeoJSON,
  generateMarkers: generateAirportMarkersGeoJSON,
  isInZone: isInAirportZone
}
