/**
 * Weather API Service using Open-Meteo (free, no API key required)
 * https://open-meteo.com/
 */

export interface WeatherData {
  temperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
  precipitation: number
}

export interface CityWeather {
  id: string
  name: string
  coordinates: [number, number]
  weather: WeatherData | null
  loading: boolean
  error: string | null
}

// WMO Weather interpretation codes
// https://open-meteo.com/en/docs
export function getWeatherDescription(code: number): {
  type: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'snowy' | 'stormy'
  icon: string
  label: string
} {
  if (code === 0) return { type: 'sunny', icon: '☀️', label: '快晴' }
  if (code === 1) return { type: 'sunny', icon: '🌤️', label: '晴れ' }
  if (code === 2) return { type: 'partly_cloudy', icon: '⛅', label: '一部曇り' }
  if (code === 3) return { type: 'cloudy', icon: '☁️', label: '曇り' }
  if (code >= 45 && code <= 48) return { type: 'cloudy', icon: '🌫️', label: '霧' }
  if (code >= 51 && code <= 55) return { type: 'rainy', icon: '🌦️', label: '霧雨' }
  if (code >= 56 && code <= 57) return { type: 'snowy', icon: '🌨️', label: '着氷性霧雨' }
  if (code >= 61 && code <= 65) return { type: 'rainy', icon: '🌧️', label: '雨' }
  if (code >= 66 && code <= 67) return { type: 'snowy', icon: '🌨️', label: '着氷性の雨' }
  if (code >= 71 && code <= 75) return { type: 'snowy', icon: '❄️', label: '雪' }
  if (code === 77) return { type: 'snowy', icon: '🌨️', label: '霧雪' }
  if (code >= 80 && code <= 82) return { type: 'rainy', icon: '🌧️', label: 'にわか雨' }
  if (code >= 85 && code <= 86) return { type: 'snowy', icon: '❄️', label: 'にわか雪' }
  if (code === 95) return { type: 'stormy', icon: '⛈️', label: '雷雨' }
  if (code >= 96 && code <= 99) return { type: 'stormy', icon: '⛈️', label: '雷雨（雹）' }
  return { type: 'cloudy', icon: '🌡️', label: '不明' }
}

// Japanese cities with coordinates
export const JAPAN_CITIES = [
  // 北海道
  { id: 'sapporo', name: '札幌', lat: 43.06, lng: 141.35 },
  { id: 'hakodate', name: '函館', lat: 41.77, lng: 140.73 },
  // 東北
  { id: 'sendai', name: '仙台', lat: 38.27, lng: 140.87 },
  { id: 'akita', name: '秋田', lat: 39.72, lng: 140.10 },
  // 関東
  { id: 'tokyo', name: '東京', lat: 35.68, lng: 139.75 },
  { id: 'yokohama', name: '横浜', lat: 35.44, lng: 139.64 },
  { id: 'chiba', name: '千葉', lat: 35.61, lng: 140.12 },
  { id: 'saitama', name: 'さいたま', lat: 35.86, lng: 139.65 },
  // 中部
  { id: 'nagoya', name: '名古屋', lat: 35.18, lng: 136.91 },
  { id: 'niigata', name: '新潟', lat: 37.90, lng: 139.02 },
  { id: 'kanazawa', name: '金沢', lat: 36.59, lng: 136.63 },
  // 近畿
  { id: 'osaka', name: '大阪', lat: 34.69, lng: 135.50 },
  { id: 'kyoto', name: '京都', lat: 35.01, lng: 135.77 },
  { id: 'kobe', name: '神戸', lat: 34.69, lng: 135.19 },
  // 中国・四国
  { id: 'hiroshima', name: '広島', lat: 34.40, lng: 132.46 },
  { id: 'matsuyama', name: '松山', lat: 33.84, lng: 132.77 },
  { id: 'takamatsu', name: '高松', lat: 34.34, lng: 134.05 },
  // 九州
  { id: 'fukuoka', name: '福岡', lat: 33.60, lng: 130.42 },
  { id: 'nagasaki', name: '長崎', lat: 32.75, lng: 129.87 },
  { id: 'kagoshima', name: '鹿児島', lat: 31.60, lng: 130.56 },
  // 沖縄
  { id: 'naha', name: '那覇', lat: 26.21, lng: 127.68 },
]

/**
 * Fetch weather for a single location
 */
export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,precipitation&timezone=Asia/Tokyo`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`)
  }

  const data = await response.json()

  return {
    temperature: Math.round(data.current.temperature_2m),
    weatherCode: data.current.weather_code,
    windSpeed: data.current.wind_speed_10m,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation
  }
}

/**
 * Fetch weather for all Japanese cities
 * Uses parallel requests for speed
 */
export async function fetchAllCitiesWeather(): Promise<Map<string, WeatherData>> {
  const results = new Map<string, WeatherData>()

  // Fetch all cities in parallel
  const promises = JAPAN_CITIES.map(async (city) => {
    try {
      const weather = await fetchWeather(city.lat, city.lng)
      return { id: city.id, weather }
    } catch (error) {
      console.error(`Failed to fetch weather for ${city.name}:`, error)
      return { id: city.id, weather: null }
    }
  })

  const responses = await Promise.all(promises)

  for (const { id, weather } of responses) {
    if (weather) {
      results.set(id, weather)
    }
  }

  return results
}

/**
 * Generate GeoJSON with real weather data
 */
export async function generateRealWeatherGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  const weatherData = await fetchAllCitiesWeather()

  const features: GeoJSON.Feature[] = JAPAN_CITIES.map((city) => {
    const weather = weatherData.get(city.id)
    const weatherInfo = weather
      ? getWeatherDescription(weather.weatherCode)
      : { type: 'cloudy' as const, icon: '❓', label: '取得中' }

    return {
      type: 'Feature',
      properties: {
        id: city.id,
        name: city.name,
        weather: weatherInfo.type,
        temperature: weather?.temperature ?? null,
        humidity: weather?.humidity ?? null,
        windSpeed: weather?.windSpeed ?? null,
        precipitation: weather?.precipitation ?? null,
        weatherLabel: weatherInfo.label,
        icon: weatherInfo.icon,
        label: weather ? `${weather.temperature}°` : '...'
      },
      geometry: {
        type: 'Point',
        coordinates: [city.lng, city.lat]
      }
    }
  })

  return { type: 'FeatureCollection', features }
}
