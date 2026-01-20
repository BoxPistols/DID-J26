/**
 * Layer Configurations - DID (Densely Inhabited Districts) by Prefecture
 */

import { LayerGroup } from '../types'

// 都道府県別の色（赤系の配色で統一 - 危険度を視覚的に強調）
export const PREFECTURE_COLORS: Record<string, string> = {
  '01': '#d32f2f', // 北海道 - 暗めの赤
  '02': '#c62828', // 青森 - より暗い赤
  '03': '#b71c1c', // 岩手 - 非常に暗い赤
  '04': '#e53935', // 宮城 - 明るめの赤
  '05': '#ef5350', // 秋田 - 明るい赤
  '06': '#f44336', // 山形 - 標準的な赤
  '07': '#ff5252', // 福島 - 鮮やかな赤
  '08': '#ff6b6b', // 茨城 - 明るい赤
  '09': '#ff7675', // 栃木 - やや明るい赤
  '10': '#ff8a80', // 群馬 - ピンクがかった赤
  '11': '#ff9f9f', // 埼玉 - 薄めの赤
  '12': '#ffb3b3', // 千葉 - さらに薄い赤
  '13': '#ff4444', // 東京 - 鮮やかな赤
  '14': '#ff5555', // 神奈川 - 明るい赤
  '15': '#e64a19', // 新潟 - オレンジがかった赤
  '16': '#f4511e', // 富山 - オレンジ系の赤
  '17': '#ff5722', // 石川 - オレンジレッド
  '18': '#d84315', // 福井 - 暗めのオレンジレッド
  '19': '#e91e63', // 山梨 - ピンクレッド
  '20': '#c2185b', // 長野 - 暗いピンクレッド
  '21': '#ad1457', // 岐阜 - より暗いピンクレッド
  '22': '#880e4f', // 静岡 - 非常に暗いピンクレッド
  '23': '#ec407a', // 愛知 - 明るいピンクレッド
  '24': '#f06292', // 三重 - 薄いピンクレッド
  '25': '#f48fb1', // 滋賀 - さらに薄いピンクレッド
  '26': '#d81b60', // 京都 - ピンクレッド
  '27': '#e91e63', // 大阪 - ピンクレッド
  '28': '#c2185b', // 兵庫 - 暗いピンクレッド
  '29': '#ad1457', // 奈良 - より暗いピンクレッド
  '30': '#880e4f', // 和歌山 - 非常に暗いピンクレッド
  '31': '#d32f2f', // 鳥取 - 暗めの赤
  '32': '#c62828', // 島根 - より暗い赤
  '33': '#b71c1c', // 岡山 - 非常に暗い赤
  '34': '#e53935', // 広島 - 明るめの赤
  '35': '#ef5350', // 山口 - 明るい赤
  '36': '#f44336', // 徳島 - 標準的な赤
  '37': '#ff5252', // 香川 - 鮮やかな赤
  '38': '#ff6b6b', // 愛媛 - 明るい赤
  '39': '#ff7675', // 高知 - やや明るい赤
  '40': '#ff8a80', // 福岡 - ピンクがかった赤
  '41': '#ff9f9f', // 佐賀 - 薄めの赤
  '42': '#ffb3b3', // 長崎 - さらに薄い赤
  '43': '#ff4444', // 熊本 - 鮮やかな赤
  '44': '#ff5555', // 大分 - 明るい赤
  '45': '#e64a19', // 宮崎 - オレンジがかった赤
  '46': '#f4511e', // 鹿児島 - オレンジ系の赤
  '47': '#ff5722' // 沖縄 - オレンジレッド
}

// 都道府県別のバウンディングボックス [[minLng, minLat], [maxLng, maxLat]]
// おおよその値（正確な値はGeoJSONファイルから計算可能）
export const PREFECTURE_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  '01': [[139.0, 41.0], [146.0, 45.5]], // 北海道
  '02': [[139.7, 40.2], [141.9, 41.6]], // 青森
  '03': [[140.7, 38.7], [142.1, 40.3]], // 岩手
  '04': [[140.5, 37.8], [141.6, 38.9]], // 宮城
  '05': [[139.6, 39.0], [140.7, 40.2]], // 秋田
  '06': [[139.4, 37.8], [140.5, 38.9]], // 山形
  '07': [[139.2, 36.8], [141.0, 37.9]], // 福島
  '08': [[139.4, 35.7], [140.9, 36.8]], // 茨城
  '09': [[139.3, 36.2], [140.2, 37.0]], // 栃木
  '10': [[138.3, 36.0], [139.4, 36.9]], // 群馬
  '11': [[138.5, 35.7], [139.9, 36.3]], // 埼玉
  '12': [[139.5, 35.0], [140.9, 35.9]], // 千葉
  '13': [[138.7, 35.4], [139.9, 35.9]], // 東京
  '14': [[138.6, 35.1], [139.8, 35.7]], // 神奈川
  '15': [[137.7, 37.0], [139.4, 38.3]], // 新潟
  '16': [[136.7, 36.4], [137.6, 37.0]], // 富山
  '17': [[136.0, 36.0], [137.4, 37.5]], // 石川
  '18': [[135.5, 35.4], [136.9, 36.4]], // 福井
  '19': [[138.0, 35.1], [139.1, 35.9]], // 山梨
  '20': [[137.5, 35.2], [138.5, 36.8]], // 長野
  '21': [[136.2, 35.2], [137.6, 36.0]], // 岐阜
  '22': [[137.5, 34.6], [139.1, 35.4]], // 静岡
  '23': [[136.5, 34.7], [137.5, 35.4]], // 愛知
  '24': [[135.8, 33.7], [136.9, 35.1]], // 三重
  '25': [[135.7, 34.9], [136.4, 35.6]], // 滋賀
  '26': [[135.0, 34.7], [135.8, 35.6]], // 京都
  '27': [[135.0, 34.3], [135.7, 34.9]], // 大阪
  '28': [[134.2, 34.2], [135.6, 35.6]], // 兵庫
  '29': [[135.4, 34.0], [136.0, 34.7]], // 奈良
  '30': [[135.0, 33.4], [135.9, 34.3]], // 和歌山
  '31': [[133.0, 35.0], [134.5, 35.6]], // 鳥取
  '32': [[131.2, 34.2], [133.1, 35.6]], // 島根
  '33': [[133.0, 34.2], [134.3, 35.1]], // 岡山
  '34': [[131.9, 34.0], [133.2, 34.9]], // 広島
  '35': [[130.8, 33.9], [132.1, 34.6]], // 山口
  '36': [[133.5, 33.5], [134.6, 34.2]], // 徳島
  '37': [[133.5, 34.0], [134.4, 34.5]], // 香川
  '38': [[132.0, 33.0], [133.5, 34.3]], // 愛媛
  '39': [[132.7, 32.7], [134.2, 33.8]], // 高知
  '40': [[130.0, 33.0], [131.0, 33.9]], // 福岡
  '41': [[129.8, 33.0], [130.4, 33.5]], // 佐賀
  '42': [[128.8, 32.2], [130.2, 34.8]], // 長崎
  '43': [[130.0, 32.0], [131.4, 33.2]], // 熊本
  '44': [[130.8, 32.7], [132.1, 33.7]], // 大分
  '45': [[130.5, 31.2], [131.8, 32.7]], // 宮崎
  '46': [[129.0, 27.0], [131.0, 32.0]], // 鹿児島
  '47': [[122.9, 24.0], [131.3, 26.9]] // 沖縄
}

// 地域別レイヤーグループ（令和2年国勢調査データ）
export const LAYER_GROUPS: LayerGroup[] = [
  {
    name: '北海道・東北',
    layers: [
      {
        id: 'did-01',
        name: '北海道',
        path: '/GeoJSON/2020/r02_did_01_hokkaido.geojson',
        color: PREFECTURE_COLORS['01'],
        bounds: PREFECTURE_BOUNDS['01']
      },
      {
        id: 'did-02',
        name: '青森県',
        path: '/GeoJSON/2020/r02_did_02_aomori.geojson',
        color: PREFECTURE_COLORS['02'],
        bounds: PREFECTURE_BOUNDS['02']
      },
      {
        id: 'did-03',
        name: '岩手県',
        path: '/GeoJSON/2020/r02_did_03_iwate.geojson',
        color: PREFECTURE_COLORS['03'],
        bounds: PREFECTURE_BOUNDS['03']
      },
      {
        id: 'did-04',
        name: '宮城県',
        path: '/GeoJSON/2020/r02_did_04_miyagi.geojson',
        color: PREFECTURE_COLORS['04'],
        bounds: PREFECTURE_BOUNDS['04']
      },
      {
        id: 'did-05',
        name: '秋田県',
        path: '/GeoJSON/2020/r02_did_05_akita.geojson',
        color: PREFECTURE_COLORS['05'],
        bounds: PREFECTURE_BOUNDS['05']
      },
      {
        id: 'did-06',
        name: '山形県',
        path: '/GeoJSON/2020/r02_did_06_yamagata.geojson',
        color: PREFECTURE_COLORS['06'],
        bounds: PREFECTURE_BOUNDS['06']
      },
      {
        id: 'did-07',
        name: '福島県',
        path: '/GeoJSON/2020/r02_did_07_fukushima.geojson',
        color: PREFECTURE_COLORS['07'],
        bounds: PREFECTURE_BOUNDS['07']
      }
    ]
  },
  {
    name: '関東',
    layers: [
      {
        id: 'did-08',
        name: '茨城県',
        path: '/GeoJSON/2020/r02_did_08_ibaraki.geojson',
        color: PREFECTURE_COLORS['08'],
        bounds: PREFECTURE_BOUNDS['08']
      },
      {
        id: 'did-09',
        name: '栃木県',
        path: '/GeoJSON/2020/r02_did_09_tochigi.geojson',
        color: PREFECTURE_COLORS['09'],
        bounds: PREFECTURE_BOUNDS['09']
      },
      {
        id: 'did-10',
        name: '群馬県',
        path: '/GeoJSON/2020/r02_did_10_gunma.geojson',
        color: PREFECTURE_COLORS['10'],
        bounds: PREFECTURE_BOUNDS['10']
      },
      {
        id: 'did-11',
        name: '埼玉県',
        path: '/GeoJSON/2020/r02_did_11_saitama.geojson',
        color: PREFECTURE_COLORS['11'],
        bounds: PREFECTURE_BOUNDS['11']
      },
      {
        id: 'did-12',
        name: '千葉県',
        path: '/GeoJSON/2020/r02_did_12_chiba.geojson',
        color: PREFECTURE_COLORS['12'],
        bounds: PREFECTURE_BOUNDS['12']
      },
      {
        id: 'did-13',
        name: '東京都',
        path: '/GeoJSON/2020/r02_did_13_tokyo.geojson',
        color: PREFECTURE_COLORS['13'],
        bounds: PREFECTURE_BOUNDS['13']
      },
      {
        id: 'did-14',
        name: '神奈川県',
        path: '/GeoJSON/2020/r02_did_14_kanagawa.geojson',
        color: PREFECTURE_COLORS['14'],
        bounds: PREFECTURE_BOUNDS['14']
      }
    ]
  },
  {
    name: '中部',
    layers: [
      {
        id: 'did-15',
        name: '新潟県',
        path: '/GeoJSON/2020/r02_did_15_niigata.geojson',
        color: PREFECTURE_COLORS['15'],
        bounds: PREFECTURE_BOUNDS['15']
      },
      {
        id: 'did-16',
        name: '富山県',
        path: '/GeoJSON/2020/r02_did_16_toyama.geojson',
        color: PREFECTURE_COLORS['16'],
        bounds: PREFECTURE_BOUNDS['16']
      },
      {
        id: 'did-17',
        name: '石川県',
        path: '/GeoJSON/2020/r02_did_17_ishikawa.geojson',
        color: PREFECTURE_COLORS['17'],
        bounds: PREFECTURE_BOUNDS['17']
      },
      {
        id: 'did-18',
        name: '福井県',
        path: '/GeoJSON/2020/r02_did_18_fukui.geojson',
        color: PREFECTURE_COLORS['18'],
        bounds: PREFECTURE_BOUNDS['18']
      },
      {
        id: 'did-19',
        name: '山梨県',
        path: '/GeoJSON/2020/r02_did_19_yamanashi.geojson',
        color: PREFECTURE_COLORS['19'],
        bounds: PREFECTURE_BOUNDS['19']
      },
      {
        id: 'did-20',
        name: '長野県',
        path: '/GeoJSON/2020/r02_did_20_nagano.geojson',
        color: PREFECTURE_COLORS['20'],
        bounds: PREFECTURE_BOUNDS['20']
      },
      {
        id: 'did-21',
        name: '岐阜県',
        path: '/GeoJSON/2020/r02_did_21_gifu.geojson',
        color: PREFECTURE_COLORS['21'],
        bounds: PREFECTURE_BOUNDS['21']
      },
      {
        id: 'did-22',
        name: '静岡県',
        path: '/GeoJSON/2020/r02_did_22_shizuoka.geojson',
        color: PREFECTURE_COLORS['22'],
        bounds: PREFECTURE_BOUNDS['22']
      },
      {
        id: 'did-23',
        name: '愛知県',
        path: '/GeoJSON/2020/r02_did_23_aichi.geojson',
        color: PREFECTURE_COLORS['23'],
        bounds: PREFECTURE_BOUNDS['23']
      }
    ]
  },
  {
    name: '近畿',
    layers: [
      {
        id: 'did-24',
        name: '三重県',
        path: '/GeoJSON/2020/r02_did_24_mie.geojson',
        color: PREFECTURE_COLORS['24'],
        bounds: PREFECTURE_BOUNDS['24']
      },
      {
        id: 'did-25',
        name: '滋賀県',
        path: '/GeoJSON/2020/r02_did_25_shiga.geojson',
        color: PREFECTURE_COLORS['25'],
        bounds: PREFECTURE_BOUNDS['25']
      },
      {
        id: 'did-26',
        name: '京都府',
        path: '/GeoJSON/2020/r02_did_26_kyoto.geojson',
        color: PREFECTURE_COLORS['26'],
        bounds: PREFECTURE_BOUNDS['26']
      },
      {
        id: 'did-27',
        name: '大阪府',
        path: '/GeoJSON/2020/r02_did_27_osaka.geojson',
        color: PREFECTURE_COLORS['27'],
        bounds: PREFECTURE_BOUNDS['27']
      },
      {
        id: 'did-28',
        name: '兵庫県',
        path: '/GeoJSON/2020/r02_did_28_hyogo.geojson',
        color: PREFECTURE_COLORS['28'],
        bounds: PREFECTURE_BOUNDS['28']
      },
      {
        id: 'did-29',
        name: '奈良県',
        path: '/GeoJSON/2020/r02_did_29_nara.geojson',
        color: PREFECTURE_COLORS['29'],
        bounds: PREFECTURE_BOUNDS['29']
      },
      {
        id: 'did-30',
        name: '和歌山県',
        path: '/GeoJSON/2020/r02_did_30_wakayama.geojson',
        color: PREFECTURE_COLORS['30'],
        bounds: PREFECTURE_BOUNDS['30']
      }
    ]
  },
  {
    name: '中国',
    layers: [
      {
        id: 'did-31',
        name: '鳥取県',
        path: '/GeoJSON/2020/r02_did_31_tottori.geojson',
        color: PREFECTURE_COLORS['31'],
        bounds: PREFECTURE_BOUNDS['31']
      },
      {
        id: 'did-32',
        name: '島根県',
        path: '/GeoJSON/2020/r02_did_32_shimane.geojson',
        color: PREFECTURE_COLORS['32'],
        bounds: PREFECTURE_BOUNDS['32']
      },
      {
        id: 'did-33',
        name: '岡山県',
        path: '/GeoJSON/2020/r02_did_33_okayama.geojson',
        color: PREFECTURE_COLORS['33'],
        bounds: PREFECTURE_BOUNDS['33']
      },
      {
        id: 'did-34',
        name: '広島県',
        path: '/GeoJSON/2020/r02_did_34_hiroshima.geojson',
        color: PREFECTURE_COLORS['34'],
        bounds: PREFECTURE_BOUNDS['34']
      },
      {
        id: 'did-35',
        name: '山口県',
        path: '/GeoJSON/2020/r02_did_35_yamaguchi.geojson',
        color: PREFECTURE_COLORS['35'],
        bounds: PREFECTURE_BOUNDS['35']
      }
    ]
  },
  {
    name: '四国',
    layers: [
      {
        id: 'did-36',
        name: '徳島県',
        path: '/GeoJSON/2020/r02_did_36_tokushima.geojson',
        color: PREFECTURE_COLORS['36'],
        bounds: PREFECTURE_BOUNDS['36']
      },
      {
        id: 'did-37',
        name: '香川県',
        path: '/GeoJSON/2020/r02_did_37_kagawa.geojson',
        color: PREFECTURE_COLORS['37'],
        bounds: PREFECTURE_BOUNDS['37']
      },
      {
        id: 'did-38',
        name: '愛媛県',
        path: '/GeoJSON/2020/r02_did_38_ehime.geojson',
        color: PREFECTURE_COLORS['38'],
        bounds: PREFECTURE_BOUNDS['38']
      },
      {
        id: 'did-39',
        name: '高知県',
        path: '/GeoJSON/2020/r02_did_39_kochi.geojson',
        color: PREFECTURE_COLORS['39'],
        bounds: PREFECTURE_BOUNDS['39']
      }
    ]
  },
  {
    name: '九州・沖縄',
    layers: [
      {
        id: 'did-40',
        name: '福岡県',
        path: '/GeoJSON/2020/r02_did_40_fukuoka.geojson',
        color: PREFECTURE_COLORS['40'],
        bounds: PREFECTURE_BOUNDS['40']
      },
      {
        id: 'did-41',
        name: '佐賀県',
        path: '/GeoJSON/2020/r02_did_41_saga.geojson',
        color: PREFECTURE_COLORS['41'],
        bounds: PREFECTURE_BOUNDS['41']
      },
      {
        id: 'did-42',
        name: '長崎県',
        path: '/GeoJSON/2020/r02_did_42_nagasaki.geojson',
        color: PREFECTURE_COLORS['42'],
        bounds: PREFECTURE_BOUNDS['42']
      },
      {
        id: 'did-43',
        name: '熊本県',
        path: '/GeoJSON/2020/r02_did_43_kumamoto.geojson',
        color: PREFECTURE_COLORS['43'],
        bounds: PREFECTURE_BOUNDS['43']
      },
      {
        id: 'did-44',
        name: '大分県',
        path: '/GeoJSON/2020/r02_did_44_oita.geojson',
        color: PREFECTURE_COLORS['44'],
        bounds: PREFECTURE_BOUNDS['44']
      },
      {
        id: 'did-45',
        name: '宮崎県',
        path: '/GeoJSON/2020/r02_did_45_miyazaki.geojson',
        color: PREFECTURE_COLORS['45'],
        bounds: PREFECTURE_BOUNDS['45']
      },
      {
        id: 'did-46',
        name: '鹿児島県',
        path: '/GeoJSON/2020/r02_did_46_kagoshima.geojson',
        color: PREFECTURE_COLORS['46'],
        bounds: PREFECTURE_BOUNDS['46']
      },
      {
        id: 'did-47',
        name: '沖縄県',
        path: '/GeoJSON/2020/r02_did_47_okinawa.geojson',
        color: PREFECTURE_COLORS['47'],
        bounds: PREFECTURE_BOUNDS['47']
      }
    ]
  }
]

// レイヤーIDから都道府県名を取得するためのマップ
export function createLayerIdToNameMap(): Map<string, string> {
  const map = new Map<string, string>()
  LAYER_GROUPS.forEach((group) => {
    group.layers.forEach((layer) => {
      map.set(layer.id, layer.name)
    })
  })
  return map
}

// 全レイヤーを取得
export function getAllLayers() {
  return LAYER_GROUPS.flatMap((g) => g.layers)
}

// ============================================
// 2024年ポスト災害データレイヤーグループ
// 2024年能登半島地震後の地形変化を可視化するためのレイヤー
// ============================================

export const TERRAIN_2024_COLOR = '#FF4444' // 地震後の地形：赤
export const TERRAIN_2020_COLOR = '#4444FF' // 地震前の地形：青

export interface TerrainLayer {
  id: string
  name: string
  path: string
  year: 2020 | 2024
  region: string
  description: string
  color: string
}

// 2024年地形データレイヤー（能登半島対応）
export const TERRAIN_2024_LAYERS: TerrainLayer[] = [
  {
    id: 'terrain-2024-noto',
    name: '能登半島地形 (2024年)',
    path: '/GeoJSON/2024/noto_2024_elevation.geojson',
    year: 2024,
    region: 'noto',
    description: '2024年能登半島地震後の地形データ（GSI DEM）',
    color: TERRAIN_2024_COLOR
  }
]

// 地震前の2020年DID参照用（比較対象）
export const TERRAIN_2020_REFERENCE = {
  id: 'terrain-2020-ishikawa',
  name: '石川県 (2020年基準)',
  path: '/GeoJSON/2020/r02_did_17_ishikawa.geojson',
  year: 2020,
  region: 'ishikawa',
  description: '2020年国勢調査DID（地震前基準）',
  color: TERRAIN_2020_COLOR
}

/**
 * 2024年地形データをフィルター取得
 * @param region - 地域キー (オプション: 'noto' など)
 */
export function getTerrain2024Layers(region?: string): TerrainLayer[] {
  if (!region) return TERRAIN_2024_LAYERS
  return TERRAIN_2024_LAYERS.filter((layer) => layer.region === region)
}

// ============================================
// 石川県地震前後比較用レイヤー
// ドローン飛行申請で2020年と2024年のデータを同時比較
// ============================================

export interface ComparisonLayerConfig {
  id: string
  name: string
  path: string
  year: 2020 | 2024
  color: string
  region: string
  description: string
  helpText: string
}

/**
 * 石川県比較用レイヤー
 * 2024年能登地震による地形変化を視覚的に比較
 */
export const ISHIKAWA_NOTO_COMPARISON_LAYERS: ComparisonLayerConfig[] = [
  {
    id: 'terrain-2024-noto',
    name: '能登半島隆起エリア',
    path: '/GeoJSON/2024/noto_2024_elevation.geojson',
    year: 2024,
    color: TERRAIN_2024_COLOR,
    region: 'noto',
    description: '2024年能登半島地震後の隆起を示す点サンプル（簡易表示）',
    helpText: '標準マップ限定の簡易表示です'
  }
]

/**
 * 比較レイヤーの設定を取得
 * @param region - 地域キー ('ishikawa', 'noto', 'all')
 */
export function getComparisonLayers(region: string = 'all'): ComparisonLayerConfig[] {
  if (region === 'all') return ISHIKAWA_NOTO_COMPARISON_LAYERS
  return ISHIKAWA_NOTO_COMPARISON_LAYERS.filter(
    (layer) => layer.region === region || region === 'all'
  )
}

/**
 * 比較レイヤーのメタデータを取得
 */
export function getComparisonLayerMetadata(layerId: string): ComparisonLayerConfig | undefined {
  return ISHIKAWA_NOTO_COMPARISON_LAYERS.find((layer) => layer.id === layerId)
}
