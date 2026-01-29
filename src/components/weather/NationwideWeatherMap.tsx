/**
 * NationwideWeatherMap - 全国天気マップ
 * TV天気予報スタイルで主要都市の天気アイコンと気温を表示
 */
import { useEffect, useState, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import { fetchWeather, getWeatherDescription, type WeatherData } from '../../lib/services/weatherApi'

// 主要都市（TV天気予報で表示される代表的な都市）
const MAJOR_CITIES = [
  // 北海道
  { id: 'sapporo', name: '札幌', lat: 43.06, lng: 141.35 },
  { id: 'kushiro', name: '釧路', lat: 42.98, lng: 144.38 },
  // 東北
  { id: 'aomori', name: '青森', lat: 40.82, lng: 140.74 },
  { id: 'akita', name: '秋田', lat: 39.72, lng: 140.10 },
  { id: 'sendai', name: '仙台', lat: 38.27, lng: 140.87 },
  // 関東
  { id: 'tokyo', name: '東京', lat: 35.68, lng: 139.75 },
  // 中部
  { id: 'niigata', name: '新潟', lat: 37.90, lng: 139.02 },
  { id: 'kanazawa', name: '金沢', lat: 36.59, lng: 136.63 },
  { id: 'nagano', name: '長野', lat: 36.65, lng: 138.18 },
  { id: 'nagoya', name: '名古屋', lat: 35.18, lng: 136.91 },
  // 近畿
  { id: 'osaka', name: '大阪', lat: 34.69, lng: 135.50 },
  // 中国
  { id: 'matsue', name: '松江', lat: 35.47, lng: 133.05 },
  { id: 'hiroshima', name: '広島', lat: 34.40, lng: 132.46 },
  { id: 'okayama', name: '岡山', lat: 34.66, lng: 133.93 },
  // 四国
  { id: 'kochi', name: '高知', lat: 33.56, lng: 133.53 },
  // 九州
  { id: 'fukuoka', name: '福岡', lat: 33.60, lng: 130.42 },
  { id: 'kagoshima', name: '鹿児島', lat: 31.60, lng: 130.56 },
  // 沖縄
  { id: 'naha', name: '那覇', lat: 26.21, lng: 127.68 },
]

interface CityWeatherData {
  id: string
  name: string
  lat: number
  lng: number
  weather: WeatherData | null
  loading: boolean
}

interface NationwideWeatherMapProps {
  map: maplibregl.Map
  visible: boolean
  darkMode?: boolean
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

export function NationwideWeatherMap({ map, visible, darkMode = false }: NationwideWeatherMapProps) {
  const [cityWeather, setCityWeather] = useState<CityWeatherData[]>(() =>
    MAJOR_CITIES.map(city => ({ ...city, weather: null, loading: true }))
  )
  const markersRef = useRef<maplibregl.Marker[]>([])
  const fetchedRef = useRef(false)

  // Fetch weather for all cities
  const fetchAllWeather = useCallback(async () => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const results = await Promise.allSettled(
      MAJOR_CITIES.map(async (city) => {
        const weather = await fetchWeather(city.lat, city.lng)
        return { id: city.id, weather }
      })
    )

    setCityWeather(prev =>
      prev.map(city => {
        const result = results.find((_, i) => MAJOR_CITIES[i].id === city.id)
        if (result && result.status === 'fulfilled') {
          return { ...city, weather: result.value.weather, loading: false }
        }
        return { ...city, loading: false }
      })
    )
  }, [])

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

      // Weather card
      const card = document.createElement('div')
      card.style.cssText = `
        background: ${darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
        border-radius: 8px;
        padding: 4px 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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

      // Add popup on click
      const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px; font-family: system-ui, sans-serif;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${city.name}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 24px;">${weatherInfo.icon}</span>
              <div>
                <div style="font-size: 18px; font-weight: 700;">${temp}°C</div>
                <div style="font-size: 12px; color: #666;">${weatherInfo.label}</div>
              </div>
            </div>
            <div style="margin-top: 8px; font-size: 11px; color: #888;">
              風速: ${city.weather.windSpeed.toFixed(1)}m/s<br/>
              湿度: ${city.weather.humidity}%
            </div>
          </div>
        `)

      el.addEventListener('click', () => {
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
