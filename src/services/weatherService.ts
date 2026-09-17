// Integração externa com Open-Meteo. Toda chamada HTTP fica confinada neste
// arquivo, conforme regra da Etapa 12.

export interface WeatherCurrent {
  temperature: number
  weatherCode: number
  condition: string
  windSpeed: number
}

export interface WeatherForecastDay {
  date: string
  weatherCode: number
  condition: string
  tempMin: number
  tempMax: number
  precipitationProbability: number | null
}

export interface WeatherData {
  current: WeatherCurrent
  forecast: WeatherForecastDay[]
  fetchedAt: string
}

const API_BASE = 'https://api.open-meteo.com/v1/forecast'

const CURRENT_FIELDS = [
  'temperature_2m',
  'weather_code',
  'wind_speed_10m',
]

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
]

const FORECAST_DAYS = '5'

export async function fetchWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherData> {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error('Latitude inválida.')
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('Longitude inválida.')
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: CURRENT_FIELDS.join(','),
    daily: DAILY_FIELDS.join(','),
    timezone: 'auto',
    forecast_days: FORECAST_DAYS,
  })

  const response = await fetch(`${API_BASE}?${params.toString()}`)

  if (!response.ok) {
    throw new Error(
      'Não foi possível carregar a previsão do tempo no momento.',
    )
  }

  const payload: unknown = await response.json()

  return normalizeWeatherPayload(payload)
}

// -------------------- Normalização defensiva --------------------

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return null
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function toNumberArray(value: unknown): (number | null)[] {
  if (!Array.isArray(value)) return []
  return value.map(item => toNumber(item))
}

function normalizeWeatherPayload(payload: unknown): WeatherData {
  if (!payload || typeof payload !== 'object') {
    throw new Error(
      'Não foi possível carregar a previsão do tempo no momento.',
    )
  }

  const root = payload as Record<string, unknown>
  const currentRaw = root.current
  const dailyRaw = root.daily

  if (!currentRaw || typeof currentRaw !== 'object') {
    throw new Error(
      'Não foi possível carregar a previsão do tempo no momento.',
    )
  }

  if (!dailyRaw || typeof dailyRaw !== 'object') {
    throw new Error(
      'Não foi possível carregar a previsão do tempo no momento.',
    )
  }

  const current = currentRaw as Record<string, unknown>
  const daily = dailyRaw as Record<string, unknown>

  const temperature = toNumber(current.temperature_2m)
  const weatherCode = toNumber(current.weather_code)
  const windSpeed = toNumber(current.wind_speed_10m)

  if (
    temperature === null ||
    weatherCode === null ||
    windSpeed === null
  ) {
    throw new Error(
      'Não foi possível carregar a previsão do tempo no momento.',
    )
  }

  const dates = toStringArray(daily.time)
  const codes = toNumberArray(daily.weather_code)
  const maxs = toNumberArray(daily.temperature_2m_max)
  const mins = toNumberArray(daily.temperature_2m_min)
  const precips = toNumberArray(
    daily.precipitation_probability_max,
  )

  const forecast: WeatherForecastDay[] = []

  for (let i = 0; i < dates.length; i += 1) {
    const code = codes[i]
    const max = maxs[i]
    const min = mins[i]

    if (
      typeof code !== 'number' ||
      typeof max !== 'number' ||
      typeof min !== 'number'
    ) {
      continue
    }

    const precip = precips[i]

    forecast.push({
      date: dates[i],
      weatherCode: code,
      condition: describeWeatherCode(code),
      tempMin: min,
      tempMax: max,
      precipitationProbability:
        typeof precip === 'number' ? precip : null,
    })
  }

  return {
    current: {
      temperature,
      weatherCode,
      condition: describeWeatherCode(weatherCode),
      windSpeed,
    },
    forecast,
    fetchedAt: new Date().toISOString(),
  }
}

// -------------------- Interpretação de WMO weather codes --------------------

export function describeWeatherCode(code: number): string {
  if (!Number.isFinite(code)) return 'Condição desconhecida'
  if (code === 0) return 'Céu limpo'
  if (code === 1) return 'Predominantemente limpo'
  if (code === 2) return 'Parcialmente nublado'
  if (code === 3) return 'Nublado'
  if (code === 45 || code === 48) return 'Neblina'
  if (code >= 51 && code <= 55) return 'Chuvisco'
  if (code === 56 || code === 57) return 'Chuvisco congelante'
  if (code >= 61 && code <= 65) return 'Chuva'
  if (code === 66 || code === 67) return 'Chuva congelante'
  if (code >= 71 && code <= 75) return 'Neve'
  if (code === 77) return 'Grãos de neve'
  if (code >= 80 && code <= 82) return 'Pancadas de chuva'
  if (code === 85 || code === 86) return 'Pancadas de neve'
  if (code === 95) return 'Tempestade'
  if (code === 96 || code === 99) return 'Tempestade com granizo'
  return 'Condição desconhecida'
}