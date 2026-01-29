/**
 * NationwideWeatherMap - 全国天気マップ
 * TV天気予報スタイルで主要都市の天気アイコンと気温を表示
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import { fetchWeather, getWeatherDescription, type WeatherData } from '../../lib/services/weatherApi'

// 全47都道府県 + 地域区分（北海道の道北・道東・道央・道南、沖縄の離島など）
const WEATHER_LOCATIONS = [
  // ===== 北海道（地域区分あり）=====
  { id: 'hokkaido-central', name: '札幌', lat: 43.06, lng: 141.35, region: '道央' },
  { id: 'hokkaido-north', name: '稚内', lat: 45.42, lng: 141.67, region: '道北' },
  { id: 'hokkaido-east', name: '釧路', lat: 42.98, lng: 144.38, region: '道東' },
  { id: 'hokkaido-south', name: '函館', lat: 41.77, lng: 140.73, region: '道南' },
  { id: 'hokkaido-asahikawa', name: '旭川', lat: 43.77, lng: 142.37, region: '道北' },

  // ===== 東北 =====
  { id: 'aomori', name: '青森', lat: 40.82, lng: 140.74 },
  { id: 'iwate', name: '盛岡', lat: 39.70, lng: 141.15 },
  { id: 'miyagi', name: '仙台', lat: 38.27, lng: 140.87 },
  { id: 'akita', name: '秋田', lat: 39.72, lng: 140.10 },
  { id: 'yamagata', name: '山形', lat: 38.24, lng: 140.33 },
  { id: 'fukushima', name: '福島', lat: 37.75, lng: 140.47 },

  // ===== 関東 =====
  { id: 'ibaraki', name: '水戸', lat: 36.34, lng: 140.45 },
  { id: 'tochigi', name: '宇都宮', lat: 36.57, lng: 139.88 },
  { id: 'gunma', name: '前橋', lat: 36.39, lng: 139.06 },
  { id: 'saitama', name: 'さいたま', lat: 35.86, lng: 139.65 },
  { id: 'chiba', name: '千葉', lat: 35.61, lng: 140.12 },
  { id: 'tokyo', name: '東京', lat: 35.68, lng: 139.75 },
  { id: 'kanagawa', name: '横浜', lat: 35.44, lng: 139.64 },

  // ===== 中部（甲信越）=====
  { id: 'niigata', name: '新潟', lat: 37.90, lng: 139.02 },
  { id: 'toyama', name: '富山', lat: 36.70, lng: 137.21 },
  { id: 'ishikawa', name: '金沢', lat: 36.59, lng: 136.63 },
  { id: 'fukui', name: '福井', lat: 36.07, lng: 136.22 },
  { id: 'yamanashi', name: '甲府', lat: 35.66, lng: 138.57 },
  { id: 'nagano', name: '長野', lat: 36.65, lng: 138.18 },

  // ===== 中部（東海）=====
  { id: 'gifu', name: '岐阜', lat: 35.39, lng: 136.72 },
  { id: 'shizuoka', name: '静岡', lat: 34.98, lng: 138.38 },
  { id: 'aichi', name: '名古屋', lat: 35.18, lng: 136.91 },

  // ===== 近畿 =====
  { id: 'mie', name: '津', lat: 34.73, lng: 136.51 },
  { id: 'shiga', name: '大津', lat: 35.00, lng: 135.87 },
  { id: 'kyoto', name: '京都', lat: 35.01, lng: 135.77 },
  { id: 'osaka', name: '大阪', lat: 34.69, lng: 135.50 },
  { id: 'hyogo', name: '神戸', lat: 34.69, lng: 135.19 },
  { id: 'nara', name: '奈良', lat: 34.69, lng: 135.83 },
  { id: 'wakayama', name: '和歌山', lat: 34.23, lng: 135.17 },

  // ===== 中国 =====
  { id: 'tottori', name: '鳥取', lat: 35.50, lng: 134.24 },
  { id: 'shimane', name: '松江', lat: 35.47, lng: 133.05 },
  { id: 'okayama', name: '岡山', lat: 34.66, lng: 133.93 },
  { id: 'hiroshima', name: '広島', lat: 34.40, lng: 132.46 },
  { id: 'yamaguchi', name: '山口', lat: 34.19, lng: 131.47 },

  // ===== 四国 =====
  { id: 'tokushima', name: '徳島', lat: 34.07, lng: 134.56 },
  { id: 'kagawa', name: '高松', lat: 34.34, lng: 134.05 },
  { id: 'ehime', name: '松山', lat: 33.84, lng: 132.77 },
  { id: 'kochi', name: '高知', lat: 33.56, lng: 133.53 },

  // ===== 九州 =====
  { id: 'fukuoka', name: '福岡', lat: 33.60, lng: 130.42 },
  { id: 'saga', name: '佐賀', lat: 33.25, lng: 130.30 },
  { id: 'nagasaki', name: '長崎', lat: 32.75, lng: 129.87 },
  { id: 'kumamoto', name: '熊本', lat: 32.79, lng: 130.74 },
  { id: 'oita', name: '大分', lat: 33.24, lng: 131.61 },
  { id: 'miyazaki', name: '宮崎', lat: 31.91, lng: 131.42 },
  { id: 'kagoshima', name: '鹿児島', lat: 31.60, lng: 130.56 },

  // ===== 沖縄（地域区分あり）=====
  { id: 'okinawa-naha', name: '那覇', lat: 26.21, lng: 127.68, region: '沖縄本島' },
  { id: 'okinawa-miyako', name: '宮古島', lat: 24.80, lng: 125.28, region: '先島' },
  { id: 'okinawa-ishigaki', name: '石垣島', lat: 24.34, lng: 124.16, region: '先島' },
]

interface CityWeatherData {
  id: string
  name: string
  lat: number
  lng: number
  region?: string
  weather: WeatherData | null
  loading: boolean
}

interface NationwideWeatherMapProps {
  map: maplibregl.Map
  visible: boolean
  darkMode?: boolean
  onLoadingChange?: (isLoading: boolean, progress?: number) => void
}

// SVG Weather Icons (professional, no emoji)
const WeatherIcons = {
  sunny: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5" fill="#FF9500"/>
    <g stroke="#FF9500" stroke-width="2" stroke-linecap="round">
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </g>
  </svg>`,
  partly_cloudy: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="4" fill="#FF9500"/>
    <g stroke="#FF9500" stroke-width="1.5" stroke-linecap="round">
      <line x1="8" y1="1" x2="8" y2="2.5"/>
      <line x1="2.5" y1="5" x2="3.5" y2="5.7"/>
      <line x1="1" y1="8" x2="2.5" y2="8"/>
      <line x1="13.5" y1="5" x2="12.5" y2="5.7"/>
    </g>
    <path d="M8 16a4 4 0 0 1 4-4h3a3 3 0 0 1 0 6H9a3 3 0 0 1-1-5.83" fill="#B0BEC5"/>
    <path d="M17 14.5a3 3 0 0 1 0 5.5H9a3 3 0 0 1-.5-5.96 4 4 0 0 1 7.5-1.54 3 3 0 0 1 1 2z" fill="#CFD8DC"/>
  </svg>`,
  cloudy: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 16a4 4 0 0 1 4-4 4 4 0 0 1 8 1 3 3 0 0 1 0 6H7a3 3 0 0 1-1-5.83z" fill="#90A4AE"/>
    <path d="M19 13a3 3 0 0 1 0 6H7a3 3 0 0 1-.5-5.96 4 4 0 0 1 7.5-1.54A3 3 0 0 1 19 13z" fill="#B0BEC5"/>
  </svg>`,
  rainy: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 10a3 3 0 0 1 0 6H7a3 3 0 0 1-.5-5.96 4 4 0 0 1 7.5-1.54A3 3 0 0 1 19 10z" fill="#78909C"/>
    <g stroke="#2196F3" stroke-width="2" stroke-linecap="round">
      <line x1="8" y1="18" x2="8" y2="22"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="16" y1="18" x2="16" y2="22"/>
    </g>
  </svg>`,
  snowy: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 10a3 3 0 0 1 0 6H7a3 3 0 0 1-.5-5.96 4 4 0 0 1 7.5-1.54A3 3 0 0 1 19 10z" fill="#B0BEC5"/>
    <g fill="#90CAF9">
      <circle cx="8" cy="19" r="1.5"/>
      <circle cx="12" cy="21" r="1.5"/>
      <circle cx="16" cy="19" r="1.5"/>
    </g>
  </svg>`,
  stormy: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 8a3 3 0 0 1 0 6H7a3 3 0 0 1-.5-5.96 4 4 0 0 1 7.5-1.54A3 3 0 0 1 19 8z" fill="#546E7A"/>
    <polygon points="13,14 10,19 12,19 11,23 15,17 13,17 14,14" fill="#FFC107"/>
  </svg>`,
}

export function NationwideWeatherMap({ map, visible, darkMode = false, onLoadingChange }: NationwideWeatherMapProps) {
  const [cityWeather, setCityWeather] = useState<CityWeatherData[]>(() =>
    WEATHER_LOCATIONS.map(city => ({ ...city, weather: null, loading: true }))
  )
  const [isLoading, setIsLoading] = useState(false)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const fetchedRef = useRef(false)

  // Fetch weather for all cities with progress tracking
  const fetchAllWeather = useCallback(async () => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    setIsLoading(true)
    onLoadingChange?.(true, 0)

    const total = WEATHER_LOCATIONS.length
    let completed = 0
    const weatherResults: { id: string; weather: WeatherData | null }[] = []

    // Fetch in batches of 10 to show progress
    const batchSize = 10
    for (let i = 0; i < WEATHER_LOCATIONS.length; i += batchSize) {
      const batch = WEATHER_LOCATIONS.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(
        batch.map(async (city) => {
          const weather = await fetchWeather(city.lat, city.lng)
          return { id: city.id, weather }
        })
      )

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          weatherResults.push(result.value)
        } else {
          weatherResults.push({ id: batch[idx].id, weather: null })
        }
      })

      completed += batch.length
      const progress = Math.round((completed / total) * 100)
      onLoadingChange?.(true, progress)
    }

    setCityWeather(prev =>
      prev.map(city => {
        const result = weatherResults.find(r => r.id === city.id)
        if (result) {
          return { ...city, weather: result.weather, loading: false }
        }
        return { ...city, loading: false }
      })
    )
    setIsLoading(false)
    onLoadingChange?.(false, 100)
  }, [onLoadingChange])

  // Fetch weather on mount
  useEffect(() => {
    if (visible) {
      fetchAllWeather()
    }
  }, [visible, fetchAllWeather])

  // Create/update markers
  useEffect(() => {
    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    if (!visible) return

    cityWeather.forEach(city => {
      if (!city.weather) return

      const weatherInfo = getWeatherDescription(city.weather.weatherCode)
      const iconSvg = WeatherIcons[weatherInfo.type] || WeatherIcons.cloudy
      const temp = Math.round(city.weather.temperature)

      // Create marker element
      const el = document.createElement('div')
      el.className = 'nationwide-weather-marker'
      el.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transform: translate(-50%, -100%);
      `

      // Weather card with glassmorphism
      const card = document.createElement('div')
      card.style.cssText = `
        background: ${darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.88)'};
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'};
        border-radius: 10px;
        padding: 4px 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, ${darkMode ? '0.3' : '0.12'});
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 50px;
      `

      // City name
      const nameDiv = document.createElement('div')
      nameDiv.style.cssText = `
        font-size: 10px;
        font-weight: 600;
        color: ${darkMode ? '#e2e8f0' : '#1e293b'};
        margin-bottom: 2px;
        white-space: nowrap;
      `
      nameDiv.textContent = city.name

      // Icon container
      const iconDiv = document.createElement('div')
      iconDiv.style.cssText = `
        width: 28px;
        height: 28px;
      `
      iconDiv.innerHTML = iconSvg

      // Temperature
      const tempDiv = document.createElement('div')
      tempDiv.style.cssText = `
        font-size: 12px;
        font-weight: 700;
        color: ${temp < 0 ? '#3b82f6' : temp > 30 ? '#ef4444' : darkMode ? '#f1f5f9' : '#0f172a'};
      `
      tempDiv.textContent = `${temp}°`

      card.appendChild(nameDiv)
      card.appendChild(iconDiv)
      card.appendChild(tempDiv)
      el.appendChild(card)

      // Create marker
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([city.lng, city.lat])
        .addTo(map)

      // Add popup on click with detailed weather info
      const precipitation = city.weather.precipitation
      const windSpeed = city.weather.windSpeed
      const humidity = city.weather.humidity

      // Dark mode colors
      const popupBg = darkMode ? '#1e293b' : '#ffffff'
      const textPrimary = darkMode ? '#f1f5f9' : '#0f172a'
      const textSecondary = darkMode ? '#94a3b8' : '#64748b'
      const cardBg = darkMode ? 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      const infoBg = darkMode ? '#334155' : '#f1f5f9'
      const infoText = darkMode ? '#e2e8f0' : '#334155'
      const regionBg = darkMode ? '#475569' : '#f0f0f0'
      const regionText = darkMode ? '#cbd5e1' : '#888'

      // Glassmorphism colors - light mode nearly opaque for readability
      const glassBg = darkMode
        ? 'rgba(30, 41, 59, 0.92)'
        : 'rgba(255, 255, 255, 0.97)'
      const glassBorder = darkMode
        ? 'rgba(255, 255, 255, 0.15)'
        : 'rgba(0, 0, 0, 0.1)'

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: true,
        maxWidth: '280px',
        className: darkMode ? 'weather-popup-dark' : 'weather-popup-light'
      })

      // ESC key handler to close popup
      const handleEscKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          popup.remove()
        }
      }

      popup.on('open', () => {
        document.addEventListener('keydown', handleEscKey)
      })

      popup.on('close', () => {
        document.removeEventListener('keydown', handleEscKey)
      })
        .setHTML(`
          <style>
            .weather-popup-dark .maplibregl-popup-content,
            .weather-popup-light .maplibregl-popup-content {
              background: ${glassBg};
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border: 1px solid ${glassBorder};
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, ${darkMode ? '0.4' : '0.25'}),
                          0 2px 8px rgba(0, 0, 0, ${darkMode ? '0.2' : '0.1'});
              padding: 0;
              overflow: hidden;
            }
            .weather-popup-dark .maplibregl-popup-close-button,
            .weather-popup-light .maplibregl-popup-close-button {
              width: 28px;
              height: 28px;
              font-size: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              margin: 8px;
              padding: 0;
              background: ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
              color: ${darkMode ? '#e2e8f0' : '#475569'};
              border: none;
              outline: none;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .weather-popup-dark .maplibregl-popup-close-button:hover,
            .weather-popup-light .maplibregl-popup-close-button:hover {
              background: ${darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
            }
            .weather-popup-dark .maplibregl-popup-close-button:focus,
            .weather-popup-light .maplibregl-popup-close-button:focus {
              outline: none;
              box-shadow: none;
            }
            .weather-popup-dark .maplibregl-popup-tip,
            .weather-popup-light .maplibregl-popup-tip {
              border-top-color: ${glassBg};
            }
          </style>
          <div style="padding: 16px; font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-right: 20px;">
              <div style="font-weight: 700; font-size: 18px; color: ${textPrimary};">${city.name}</div>
              ${city.region ? `<span style="font-size: 11px; color: ${darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'}; background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; padding: 3px 8px; border-radius: 6px;">${city.region}</span>` : ''}
            </div>

            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <span style="font-size: 40px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">${weatherInfo.icon}</span>
              <div>
                <div style="font-size: 32px; font-weight: 700; color: ${temp < 0 ? '#3b82f6' : temp > 30 ? '#ef4444' : textPrimary}; line-height: 1;">${temp}°C</div>
                <div style="font-size: 14px; color: ${textSecondary}; margin-top: 2px;">${weatherInfo.label}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 12px;">
              <div style="text-align: center; padding: 8px 4px;">
                <div style="font-size: 16px; margin-bottom: 4px;">💨</div>
                <div style="color: ${textSecondary}; font-size: 10px; margin-bottom: 2px;">風速</div>
                <div style="font-weight: 600; color: ${textPrimary};">${windSpeed.toFixed(1)} m/s</div>
              </div>
              <div style="text-align: center; padding: 8px 4px;">
                <div style="font-size: 16px; margin-bottom: 4px;">💧</div>
                <div style="color: ${textSecondary}; font-size: 10px; margin-bottom: 2px;">湿度</div>
                <div style="font-weight: 600; color: ${textPrimary};">${humidity}%</div>
              </div>
              <div style="text-align: center; padding: 8px 4px;">
                <div style="font-size: 16px; margin-bottom: 4px;">🌧️</div>
                <div style="color: ${textSecondary}; font-size: 10px; margin-bottom: 2px;">降水量</div>
                <div style="font-weight: 600; color: ${textPrimary};">${precipitation.toFixed(1)} mm</div>
              </div>
            </div>
          </div>
        `)

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        marker.setPopup(popup)
        marker.togglePopup()
      })

      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
    }
  }, [map, visible, cityWeather, darkMode])

  return null // This component only manages markers
}

export default NationwideWeatherMap
