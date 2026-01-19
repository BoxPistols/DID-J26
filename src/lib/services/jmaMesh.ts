/**
 * JMA (Japan Meteorological Agency) Mesh Weather API Service
 * Provides mesh-based weather forecasts for Japan
 */

interface JmaMeshWeatherData {
  windSpeed: number // m/s
  windDirection: number // degrees (0-360)
  precipitationProbability: number // percentage (0-100)
  temperature: number // celsius
  timestamp: string // ISO 8601
  meshCode: string
}

interface JmaTimeSeriesData {
  meshCode: string
  forecasts: JmaMeshWeatherData[]
}

interface JmaApiResponse {
  validTime: string
  // Simplified structure - actual JMA API has more complex nested data
  [key: string]: any
}

const JMA_BASE_URL = 'https://www.jma.go.jp/bosai/jmatile/data/wdist'

/**
 * Fetch current weather data for a specific mesh code
 * @param meshCode JMA mesh code (e.g., "53394547")
 * @returns Weather data or mock data with "(見本)" marker on failure
 */
export async function fetchMeshWeather(meshCode: string): Promise<JmaMeshWeatherData> {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const url = `${JMA_BASE_URL}/${timestamp}.json`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`JMA API returned ${response.status}`)
    }
    
    const data: JmaApiResponse = await response.json()
    
    // Parse JMA response for the specific mesh
    // Note: Actual parsing logic depends on JMA's data structure
    return {
      windSpeed: data.windSpeed || 0,
      windDirection: data.windDirection || 0,
      precipitationProbability: data.precipProb || 0,
      temperature: data.temperature || 20,
      timestamp: data.validTime || new Date().toISOString(),
      meshCode
    }
  } catch (error) {
    console.error('Failed to fetch JMA mesh weather:', error)
    return createMockWeatherData(meshCode)
  }
}

/**
 * Fetch time series weather forecast (5-minute intervals, up to 72 hours)
 * @param meshCode JMA mesh code
 * @param hours Number of hours to forecast (max 72)
 * @returns Time series forecast data
 */
export async function fetchMeshTimeSeries(
  meshCode: string,
  hours: number = 24
): Promise<JmaTimeSeriesData> {
  const maxHours = Math.min(hours, 72)
  const intervals = (maxHours * 60) / 5 // 5-minute intervals
  
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const url = `${JMA_BASE_URL}/${timestamp}.json`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`JMA API returned ${response.status}`)
    }
    
    const data: JmaApiResponse = await response.json()
    
    // Parse time series data from JMA response
    const forecasts: JmaMeshWeatherData[] = []
    for (let i = 0; i < intervals; i++) {
      const forecastTime = new Date(Date.now() + i * 5 * 60 * 1000)
      forecasts.push({
        windSpeed: data.windSpeed || 0,
        windDirection: data.windDirection || 0,
        precipitationProbability: data.precipProb || 0,
        temperature: data.temperature || 20,
        timestamp: forecastTime.toISOString(),
        meshCode
      })
    }
    
    return {
      meshCode,
      forecasts
    }
  } catch (error) {
    console.error('Failed to fetch JMA time series:', error)
    return createMockTimeSeries(meshCode, maxHours)
  }
}

/**
 * Convert lat/lng to JMA mesh code (3rd mesh - approximately 1km)
 * @param lat Latitude
 * @param lng Longitude
 * @returns JMA mesh code
 */
export function latLngToMeshCode(lat: number, lng: number): string {
  // Simplified mesh code calculation
  // Actual JMA mesh system is more complex
  const latCode = Math.floor((lat * 60) / 40)
  const lngCode = Math.floor(((lng - 100) * 60) / 60)
  
  return `${latCode}${lngCode}0000`
}

/**
 * Create mock weather data with "(見本)" marker
 */
function createMockWeatherData(meshCode: string): JmaMeshWeatherData {
  return {
    windSpeed: 3.5,
    windDirection: 180,
    precipitationProbability: 20,
    temperature: 22,
    timestamp: new Date().toISOString(),
    meshCode: `(見本)${meshCode}`
  }
}

/**
 * Create mock time series data with "(見本)" marker
 */
function createMockTimeSeries(meshCode: string, hours: number): JmaTimeSeriesData {
  const intervals = (hours * 60) / 5
  const forecasts: JmaMeshWeatherData[] = []
  
  for (let i = 0; i < intervals; i++) {
    const forecastTime = new Date(Date.now() + i * 5 * 60 * 1000)
    const hour = forecastTime.getHours()
    
    // Vary conditions by time of day for realism
    const tempVariation = Math.sin((hour / 24) * Math.PI * 2) * 5
    const windVariation = Math.random() * 2
    
    forecasts.push({
      windSpeed: 3.5 + windVariation,
      windDirection: 180 + (i % 360),
      precipitationProbability: 20 + (hour > 14 && hour < 18 ? 30 : 0),
      temperature: 22 + tempVariation,
      timestamp: forecastTime.toISOString(),
      meshCode: `(見本)${meshCode}`
    })
  }
  
  return {
    meshCode: `(見本)${meshCode}`,
    forecasts
  }
}

/**
 * Check if weather data is mock data
 */
export function isMockData(data: JmaMeshWeatherData | JmaTimeSeriesData): boolean {
  const meshCode = 'meshCode' in data ? data.meshCode : ''
  return meshCode.includes('(見本)')
}

/**
 * Format weather data for display
 */
export function formatWeatherData(data: JmaMeshWeatherData): string {
  const prefix = isMockData(data) ? '(見本) ' : ''
  return `${prefix}風速: ${data.windSpeed.toFixed(1)}m/s, 気温: ${data.temperature.toFixed(1)}°C, 降水確率: ${data.precipitationProbability}%`
}

export const JmaMeshService = {
  fetchWeather: fetchMeshWeather,
  fetchTimeSeries: fetchMeshTimeSeries,
  latLngToMeshCode,
  isMockData,
  formatWeatherData
}
