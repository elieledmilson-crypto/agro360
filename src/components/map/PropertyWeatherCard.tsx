import { useCallback, useEffect, useState } from 'react'
import Card from '../ui/Card'
import PageFeedback from '../ui/PageFeedback'
import { Droplets, RefreshCw, Wind } from 'lucide-react'
import {
  fetchWeather,
  type WeatherData,
} from '../../services/weatherService'

interface Props {
  latitude: number | null
  longitude: number | null
}

function formatForecastDate(iso: string): string {
  try {
    const date = new Date(`${iso}T00:00:00`)

    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatFetchedAt(iso: string): string {
  try {
    const date = new Date(iso)

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    const day = date.toLocaleDateString('pt-BR')

    const time = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    return `Atualizado em ${day} às ${time}`
  } catch {
    return ''
  }
}

export default function PropertyWeatherCard({
  latitude,
  longitude,
}: Props) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (
      latitude === null ||
      longitude === null
    ) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetchWeather(
        latitude,
        longitude,
      )

      setData(result)
    } catch {
      setError(
        'Não foi possível carregar a previsão do tempo no momento.',
      )

      setData(null)
    } finally {
      setLoading(false)
    }
  }, [latitude, longitude])

  useEffect(() => {
    if (
      latitude === null ||
      longitude === null
    ) {
      setData(null)
      setError(null)
      return
    }

    void load()
  }, [latitude, longitude, load])

  if (
    latitude === null ||
    longitude === null
  ) {
    return (
      <Card className="p-4 space-y-2">
        <h2 className="text-sm font-semibold">
          Clima da propriedade
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure a localização da propriedade para utilizar o mapa de
          satélite e a previsão do tempo.
        </p>
      </Card>
    )
  }

  const latLabel = latitude.toFixed(4)
  const lonLabel = longitude.toFixed(4)

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          Clima da propriedade
        </h2>

        <button
          type="button"
          onClick={() => void load()}
          aria-label="Atualizar previsão do tempo"
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Coordenadas cadastradas: {latLabel}, {lonLabel}
      </p>

      {loading && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Carregando previsão do tempo…
        </p>
      )}

      {!loading && error && (
        <div className="space-y-2">
          <PageFeedback
            type="error"
            message={error}
          />

          <button
            type="button"
            onClick={() => void load()}
            className="text-sm text-green-600 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Agora
              </span>

              <span className="text-2xl font-bold">
                {Math.round(data.current.temperature)}°C
              </span>
            </div>

            <p className="text-sm">
              {data.current.condition}
            </p>

            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Wind
                className="w-3.5 h-3.5"
                aria-hidden="true"
              />

              Vento: {Math.round(data.current.windSpeed)} km/h
            </p>
          </div>

          {data.forecast.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Previsão — próximos dias
              </p>

              <ul className="space-y-2">
                {data.forecast.map(day => (
                  <li
                    key={day.date}
                    className="text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {formatForecastDate(day.date)}
                      </span>

                      <span className="flex-1 text-gray-600 dark:text-gray-400 truncate">
                        {day.condition}
                      </span>

                      <span className="whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {Math.round(day.tempMin)}° /{' '}
                        {Math.round(day.tempMax)}°
                      </span>
                    </div>

                    {day.precipitationProbability !== null && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Droplets
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />

                        Prob. de chuva:{' '}
                        {Math.round(
                          day.precipitationProbability,
                        )}
                        %
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.fetchedAt && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFetchedAt(data.fetchedAt)}
            </p>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dados meteorológicos de Open-Meteo para as coordenadas
            cadastradas da propriedade. Não utilizamos localização do
            dispositivo.
          </p>
        </>
      )}
    </Card>
  )
}