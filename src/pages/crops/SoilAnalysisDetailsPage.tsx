import { useState, useEffect } from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom'
import { getSoilAnalysisById } from '../../services/soilAnalysisService'
import { getLandAreaById } from '../../services/landService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Pencil, ArrowLeft } from 'lucide-react'

export default function SoilAnalysisDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null)

  const analysis = id
    ? getSoilAnalysisById(id)
    : undefined

  const area = analysis
    ? getLandAreaById(
        analysis.landAreaId
      )
    : undefined

  useEffect(() => {
    const state = location.state as {
      successMessage?: string
    } | null

    if (!state?.successMessage) return

    setSuccessMessage(
      state.successMessage
    )

    navigate(location.pathname, {
      replace: true,
      state: null,
    })
  }, [
    location.pathname,
    location.state,
    navigate,
  ])

  useEffect(() => {
    if (!successMessage) return

    const timer = setTimeout(
      () => setSuccessMessage(null),
      5000
    )

    return () =>
      clearTimeout(timer)
  }, [successMessage])

  if (!analysis) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Análise não encontrada
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate('/cultivos/solo')
          }
        >
          Voltar para análises
        </Button>
      </div>
    )
  }

  const formatDate = (
    date?: string
  ) => {
    if (!date) return 'Não informada'

    return new Date(
      date + 'T00:00:00'
    ).toLocaleDateString('pt-BR')
  }

  const formatOptionalNumber = (
    value?: number,
    unit?: string
  ) => {
    if (value === undefined) {
      return 'Não informado'
    }

    return unit
      ? `${value} ${unit}`
      : String(value)
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <PageFeedback
          type="success"
          message={successMessage}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate('/cultivos/solo')
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para análises
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Análise de solo
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os resultados registrados nesta análise de solo do talhão, como pH, nutrientes e saturações."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {formatDate(
              analysis.sampleDate
            )}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            navigate(
              `/cultivos/solo/${analysis.id}/editar`
            )
          }
        >
          <Pencil className="w-4 h-4 mr-2 inline" />
          Editar
        </Button>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Talhão
            </p>

            {area ? (
              <Link
                to={`/terras/${area.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {area.code} —{' '}
                {area.name}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Área não encontrada
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data da análise
            </p>
            <p className="font-medium">
              {formatDate(
                analysis.sampleDate
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Laboratório
            </p>
            <p className="font-medium">
              {analysis.laboratory ??
                'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Código da amostra
            </p>
            <p className="font-medium">
              {analysis.sampleCode ??
                'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Profundidade
            </p>
            <p className="font-medium">
              {analysis.sampleDepth ??
                'Não informada'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              pH
            </p>
            <p className="font-medium">
              {formatOptionalNumber(
                analysis.ph
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Matéria orgânica
            </p>
            <p className="font-medium">
              {formatOptionalNumber(
                analysis.organicMatter,
                '%'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fósforo
            </p>
            <p className="font-medium">
              {formatOptionalNumber(
                analysis.phosphorus,
                'mg/dm³'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Potássio
            </p>
            <p className="font-medium">
              {formatOptionalNumber(
                analysis.potassium,
                'mg/dm³'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cálcio
            </p>
            <p className="font-medium">
              {formatOptionalNumber(
                analysis.calcium,
                'cmolc/dm³'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Magnésio
            </p>
            <p className="font-medium">
              {formatOptionalNumber(
                analysis.magnesium,
                'cmolc/dm³'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Alumínio
            </p>
            <p className="font-medium">
              {formatOptionalNumber(
                analysis.aluminum,
                'cmolc/dm³'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              CTC
            </p>
            <p className="font-medium">
              {formatOptionalNumber(
                analysis.cec,
                'cmolc/dm³'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Saturação por bases
            </p>
            <p className="font-medium">
              {formatOptionalNumber(
                analysis.baseSaturation,
                '%'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Saturação por alumínio
            </p>
            <p className="font-medium">
              {formatOptionalNumber(
                analysis.aluminumSaturation,
                '%'
              )}
            </p>
          </div>
        </div>

        {analysis.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Observações
            </p>
            <p className="mt-1">
              {analysis.notes}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de cadastro
            </p>

            <p className="font-medium">
              {new Date(
                analysis.createdAt
              ).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>

            <p className="font-medium">
              {new Date(
                analysis.updatedAt
              ).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}