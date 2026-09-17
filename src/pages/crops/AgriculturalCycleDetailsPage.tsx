import { useMemo } from 'react'
import {
  useParams,
  useNavigate,
  Link,
} from 'react-router-dom'
import {
  getAgriculturalCycleSummaryByCropCycleId,
  getAgriculturalCycleTimeline,
  AgriculturalCycleTimelineEventType,
} from '../../services/agriculturalCycleService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import HelpTip from '../../components/ui/HelpTip'
import CropCycleStatusBadge from '../../components/crops/CropCycleStatusBadge'
import CropManagementTypeBadge from '../../components/crops/CropManagementTypeBadge'
import {
  ArrowLeft,
  Pencil,
  Sprout,
  ClipboardList,
  Calendar,
  Gavel,
  FlaskConical,
} from 'lucide-react'

const timelineIcons: Record<
  AgriculturalCycleTimelineEventType,
  typeof Sprout
> = {
  Plantio: Sprout,
  Manejo: ClipboardList,
  'Previsão de colheita':
    Calendar,
  Colheita: Gavel,
}

export default function AgriculturalCycleDetailsPage() {
  const { cropCycleId } =
    useParams<{
      cropCycleId: string
    }>()

  const navigate = useNavigate()

  const summary = useMemo(
    () =>
      cropCycleId
        ? getAgriculturalCycleSummaryByCropCycleId(
            cropCycleId
          )
        : undefined,
    [cropCycleId]
  )

  const timeline = useMemo(
    () =>
      cropCycleId
        ? getAgriculturalCycleTimeline(
            cropCycleId
          )
        : [],
    [cropCycleId]
  )

  if (!summary) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Cultivo não encontrado
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate(
              '/cultivos/ciclo-agricola'
            )
          }
        >
          Voltar para visão do ciclo
        </Button>
      </div>
    )
  }

  const {
    cropCycle,
    landArea,
    soilAnalyses,
    latestSoilAnalysis,
    cropManagements,
    harvestRecord,
    productionKg,
    productivityKgPerHectare,
  } = summary

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return 'Não informada'
    }

    return new Date(
      date + 'T00:00:00'
    ).toLocaleDateString('pt-BR')
  }

  const formatNumber = (
    value: number
  ) =>
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate(
                '/cultivos/ciclo-agricola'
              )
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para visão do ciclo
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              {cropCycle.crop}
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Esta visão reúne, em um só lugar, o cultivo, as análises de solo do talhão, os manejos, a colheita e a linha do tempo do ciclo."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {cropCycle.cultivar
              ? `${cropCycle.cultivar} — `
              : ''}
            {cropCycle.season}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CropCycleStatusBadge
              status={
                cropCycle.status
              }
            />

            {landArea ? (
              <Link
                to={`/terras/${landArea.id}`}
                className="text-sm text-green-600 hover:underline"
              >
                {landArea.code} —{' '}
                {landArea.name}
              </Link>
            ) : (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Área não encontrada
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/cultivos/${cropCycle.id}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Ver cultivo
          </Link>

          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/cultivos/${cropCycle.id}/editar`
              )
            }
          >
            <Pencil className="w-4 h-4 mr-2 inline" />
            Editar cultivo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Situação
          </p>

          <div className="mt-1">
            <CropCycleStatusBadge
              status={
                cropCycle.status
              }
            />
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Última análise de solo
            do talhão
          </p>

          <p className="text-2xl font-bold mt-1">
            {latestSoilAnalysis
              ? formatDate(
                  latestSoilAnalysis.sampleDate
                )
              : 'Sem análise'}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manejos registrados
          </p>

          <p className="text-2xl font-bold mt-1">
            {
              cropManagements.length
            }
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Colheita
          </p>

          <p className="text-2xl font-bold mt-1">
            {harvestRecord
              ? 'Registrada'
              : 'Não registrada'}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Produtividade
          </p>

          <p className="text-2xl font-bold mt-1">
            {harvestRecord
              ? `${formatNumber(
                  productivityKgPerHectare
                )} kg/ha`
              : '—'}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">
          Dados do cultivo
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Talhão
            </p>

            {landArea ? (
              <Link
                to={`/terras/${landArea.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {landArea.code} —{' '}
                {landArea.name}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Área não encontrada
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cultura
            </p>

            <p className="font-medium">
              {cropCycle.crop}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cultivar
            </p>

            <p className="font-medium">
              {cropCycle.cultivar ??
                'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Safra
            </p>

            <p className="font-medium">
              {cropCycle.season}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Situação
            </p>

            <CropCycleStatusBadge
              status={
                cropCycle.status
              }
            />
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de plantio
            </p>

            <p className="font-medium">
              {formatDate(
                cropCycle.plantingDate
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Previsão de colheita
            </p>

            <p className="font-medium">
              {formatDate(
                cropCycle.expectedHarvestDate
              )}
            </p>
          </div>
        </div>

        {cropCycle.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Observações
            </p>

            <p className="mt-1">
              {cropCycle.notes}
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-semibold">
            Análises de solo do talhão
          </h2>

          <Link
            to="/cultivos/solo"
            className="inline-flex items-center text-sm text-green-600 hover:underline"
          >
            <FlaskConical className="w-4 h-4 mr-1" />
            Ver todas as análises
          </Link>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          As análises de solo são
          vinculadas ao talhão e não
          diretamente ao cultivo.
        </p>

        {soilAnalyses.length ===
        0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma análise de solo
            registrada neste talhão.
          </p>
        ) : (
          <div className="space-y-3">
            {soilAnalyses
              .slice(0, 3)
              .map(analysis => (
                <button
                  key={analysis.id}
                  onClick={() =>
                    navigate(
                      `/cultivos/solo/${analysis.id}`
                    )
                  }
                  className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <p className="font-medium">
                    {new Date(
                      analysis.sampleDate +
                        'T00:00:00'
                    ).toLocaleDateString(
                      'pt-BR'
                    )}
                  </p>

                  {analysis.laboratory && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Laboratório:{' '}
                      {
                        analysis.laboratory
                      }
                    </p>
                  )}

                  {analysis.sampleCode && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Código:{' '}
                      {
                        analysis.sampleCode
                      }
                    </p>
                  )}

                  {analysis.sampleDepth && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Profundidade:{' '}
                      {
                        analysis.sampleDepth
                      }
                    </p>
                  )}

                  {analysis.ph !==
                    undefined && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      pH: {analysis.ph}
                    </p>
                  )}
                </button>
              ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-semibold">
            Manejos agrícolas
          </h2>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/cultivos/manejos/novo?cropCycleId=${cropCycle.id}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Novo manejo
            </Link>

            <Link
              to="/cultivos/manejos"
              className="inline-flex items-center text-sm text-green-600 hover:underline"
            >
              <ClipboardList className="w-4 h-4 mr-1" />
              Ver todos os manejos
            </Link>
          </div>
        </div>

        {cropManagements.length ===
        0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhum manejo registrado
            neste cultivo.
          </p>
        ) : (
          <div className="space-y-3">
            {cropManagements.map(
              management => (
                <button
                  key={
                    management.id
                  }
                  onClick={() =>
                    navigate(
                      `/cultivos/manejos/${management.id}`
                    )
                  }
                  className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <p className="font-medium">
                    {new Date(
                      management.date +
                        'T00:00:00'
                    ).toLocaleDateString(
                      'pt-BR'
                    )}
                    {` · ${management.type}`}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {
                      management.description
                    }
                  </p>

                  {management.productOrMaterial && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Produto:{' '}
                      {
                        management.productOrMaterial
                      }
                    </p>
                  )}

                  {management.doseOrQuantity && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dose:{' '}
                      {
                        management.doseOrQuantity
                      }
                    </p>
                  )}

                  {management.responsible && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Responsável:{' '}
                      {
                        management.responsible
                      }
                    </p>
                  )}

                  <div className="mt-2">
                    <CropManagementTypeBadge
                      type={
                        management.type
                      }
                    />
                  </div>
                </button>
              )
            )}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">
              Colheita e produtividade
            </h2>

            <HelpTip
              title="O que é produtividade?"
              description="É a quantidade produzida em relação à área colhida. Ela ajuda a comparar o resultado de diferentes cultivos e talhões."
            />
          </div>

          {harvestRecord && (
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/cultivos/colheitas/${harvestRecord.id}`}
                className="inline-flex items-center text-sm text-green-600 hover:underline"
              >
                Ver detalhes da colheita
              </Link>

              <Link
                to={`/cultivos/colheitas/${harvestRecord.id}/editar`}
                className="inline-flex items-center text-sm text-green-600 hover:underline"
              >
                Editar colheita
              </Link>
            </div>
          )}
        </div>

        {!harvestRecord ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nenhuma colheita
              registrada neste cultivo.
            </p>

            <Link
              to={`/cultivos/colheitas/nova?cropCycleId=${cropCycle.id}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              <Gavel className="w-4 h-4 mr-2" />
              Registrar colheita
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Data da colheita
              </p>

              <p className="font-medium">
                {formatDate(
                  harvestRecord.harvestDate
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Área colhida
              </p>

              <p className="font-medium">
                {formatNumber(
                  harvestRecord.harvestedAreaHectares
                )}{' '}
                ha
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Produção na unidade
                original
              </p>

              <p className="font-medium">
                {formatNumber(
                  harvestRecord.productionQuantity
                )}{' '}
                {
                  harvestRecord.productionUnit
                }
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Produção normalizada em
                kg
              </p>

              <p className="font-medium">
                {formatNumber(
                  productionKg
                )}{' '}
                kg
              </p>
            </div>

            {harvestRecord.productionUnit ===
              'sc' &&
              harvestRecord.sackWeightKg && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Peso da saca
                  </p>

                  <p className="font-medium">
                    {formatNumber(
                      harvestRecord.sackWeightKg
                    )}{' '}
                    kg
                  </p>
                </div>
              )}

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Produtividade (unidade
                original)
              </p>

              <p className="font-medium">
                {formatNumber(
                  harvestRecord.productionQuantity /
                    harvestRecord.harvestedAreaHectares
                )}{' '}
                {
                  harvestRecord.productionUnit
                }
                /ha
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Produtividade
                normalizada em kg/ha
              </p>

              <p className="font-medium">
                {formatNumber(
                  productivityKgPerHectare
                )}{' '}
                kg/ha
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">
          Linha do tempo do ciclo
        </h2>

        {timeline.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhum evento com data
            registrado neste ciclo.
          </p>
        ) : (
          <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
            {timeline.map(event => {
              const Icon =
                timelineIcons[
                  event.type
                ]

              return (
                <li
                  key={event.id}
                  className="ml-6"
                >
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full -left-3 ring-4 ring-white dark:ring-gray-900">
                    <Icon className="w-3 h-3 text-green-700 dark:text-green-300" />
                  </span>

                  <p className="text-sm font-medium">
                    {formatDate(
                      event.date
                    )}{' '}
                    · {event.title}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {event.type}
                  </p>

                  {event.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {
                        event.description
                      }
                    </p>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </Card>
    </div>
  )
}