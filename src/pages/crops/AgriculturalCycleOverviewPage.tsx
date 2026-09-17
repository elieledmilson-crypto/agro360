import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAgriculturalCycleSummaries,
  AgriculturalCycleSummary,
} from '../../services/agriculturalCycleService'
import { CropCycleStatus } from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import HelpTip from '../../components/ui/HelpTip'
import CropCycleStatusBadge from '../../components/crops/CropCycleStatusBadge'
import { Eye, Search } from 'lucide-react'

interface Filters {
  search: string
  landAreaId: string
  status: CropCycleStatus | ''
  harvestStatus:
    | 'Todas'
    | 'Com colheita'
    | 'Sem colheita'
}

const defaultFilters: Filters = {
  search: '',
  landAreaId: '',
  status: '',
  harvestStatus: 'Todas',
}

const statusOptions: CropCycleStatus[] = [
  'Planejado',
  'Em andamento',
  'Concluído',
  'Cancelado',
]

export default function AgriculturalCycleOverviewPage() {
  const navigate = useNavigate()

  const [filters, setFilters] =
    useState<Filters>(defaultFilters)

  const summaries = useMemo(
    () => getAgriculturalCycleSummaries(),
    []
  )

  const filteredSummaries =
    useMemo(() => {
      return summaries.filter(
        summary => {
          const {
            cropCycle,
            landArea,
            harvestRecord,
          } = summary

          const searchTerm =
            filters.search
              .toLowerCase()
              .trim()

          const matchesSearch =
            !searchTerm ||
            (landArea?.code
              .toLowerCase()
              .includes(searchTerm) ??
              false) ||
            (landArea?.name
              .toLowerCase()
              .includes(searchTerm) ??
              false) ||
            cropCycle.crop
              .toLowerCase()
              .includes(searchTerm) ||
            (cropCycle.cultivar
              ?.toLowerCase()
              .includes(searchTerm) ??
              false) ||
            cropCycle.season
              .toLowerCase()
              .includes(searchTerm)

          const matchesLandArea =
            !filters.landAreaId ||
            cropCycle.landAreaId ===
              filters.landAreaId

          const matchesStatus =
            !filters.status ||
            cropCycle.status ===
              filters.status

          const hasHarvest =
            !!harvestRecord

          const matchesHarvest =
            filters.harvestStatus ===
              'Todas' ||
            (filters.harvestStatus ===
              'Com colheita' &&
              hasHarvest) ||
            (filters.harvestStatus ===
              'Sem colheita' &&
              !hasHarvest)

          return (
            matchesSearch &&
            matchesLandArea &&
            matchesStatus &&
            matchesHarvest
          )
        }
      )
    }, [summaries, filters])

  const totalCycles =
    summaries.length

  const inProgressCycles =
    summaries.filter(
      summary =>
        summary.cropCycle.status ===
        'Em andamento'
    ).length

  const cyclesWithHarvest =
    summaries.filter(
      summary =>
        summary.harvestRecord
    ).length

  const totalManagements =
    summaries.reduce(
      (sum, summary) =>
        sum +
        summary.cropManagements.length,
      0
    )

  const totalProductionKg =
    summaries.reduce(
      (sum, summary) =>
        sum +
        summary.productionKg,
      0
    )

  const totalHarvestedArea =
    summaries
      .filter(
        summary =>
          summary.harvestRecord
      )
      .reduce(
        (sum, summary) =>
          sum +
          (summary.harvestRecord
            ?.harvestedAreaHectares ??
            0),
        0
      )

  const averageProductivity =
    totalHarvestedArea > 0
      ? totalProductionKg /
        totalHarvestedArea
      : 0

  const formatDate = (
    date?: string
  ) => {
    if (!date) return '—'

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

  const getLandAreaLabel = (
    summary: AgriculturalCycleSummary
  ): string => {
    const area = summary.landArea

    if (!area) {
      return 'Área não encontrada'
    }

    return `${area.code} — ${area.name}`
  }

  const getCropLabel = (
    summary: AgriculturalCycleSummary
  ): string => {
    const { cropCycle } = summary

    return `${cropCycle.crop}${
      cropCycle.cultivar
        ? ` — ${cropCycle.cultivar}`
        : ''
    }`
  }

  const getLatestSoilInfo = (
    summary: AgriculturalCycleSummary
  ): string => {
    const latest =
      summary.latestSoilAnalysis

    if (!latest) {
      return 'Sem análise'
    }

    const parts = [
      formatDate(latest.sampleDate),
    ]

    if (
      latest.ph !== undefined
    ) {
      parts.push(
        `pH ${formatNumber(
          latest.ph
        )}`
      )
    }

    return parts.join(' · ')
  }

  const getHarvestInfo = (
    summary: AgriculturalCycleSummary
  ): string => {
    const harvest =
      summary.harvestRecord

    if (!harvest) {
      return 'Não registrada'
    }

    return `${formatDate(
      harvest.harvestDate
    )} · ${formatNumber(
      harvest.productionQuantity
    )} ${harvest.productionUnit}`
  }

  const getProductivityInfo = (
    summary: AgriculturalCycleSummary
  ): string => {
    if (!summary.harvestRecord) {
      return '—'
    }

    return `${formatNumber(
      summary.productivityKgPerHectare
    )} kg/ha`
  }

  const summaryCards = [
    {
      label: 'Total de ciclos',
      value: totalCycles,
    },
    {
      label: 'Em andamento',
      value: inProgressCycles,
    },
    {
      label: 'Com colheita',
      value: cyclesWithHarvest,
    },
    {
      label: 'Manejos registrados',
      value: totalManagements,
    },
    {
      label: 'Produção total',
      value: `${formatNumber(
        totalProductionKg
      )} kg`,
    },
    {
      label:
        'Produtividade média',
      value: `${formatNumber(
        averageProductivity
      )} kg/ha`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Visão do Ciclo Agrícola
            </h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Esta visão reúne as principais informações do ciclo agrícola, desde o cultivo e os manejos até a colheita e a produtividade."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe de forma
            integrada solo, cultivo,
            manejos, colheita e
            produtividade.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map(
          card => (
            <Card
              key={card.label}
              className="p-4"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {card.label}
              </p>

              <p className="text-2xl font-bold mt-1">
                {card.value}
              </p>
            </Card>
          )
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Pesquisar por talhão, cultura, cultivar ou safra..."
              value={filters.search}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  search:
                    e.target.value,
                }))
              }
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <select
            value={
              filters.landAreaId
            }
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                landAreaId:
                  e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Talhão: todos
            </option>

            {Array.from(
              new Map(
                summaries.map(
                  summary => [
                    summary.cropCycle
                      .landAreaId,
                    summary.landArea,
                  ]
                )
              ).entries()
            ).map(
              ([
                landAreaId,
                area,
              ]) => (
                <option
                  key={landAreaId}
                  value={landAreaId}
                >
                  {area
                    ? `${area.code} — ${area.name}`
                    : 'Área não encontrada'}
                </option>
              )
            )}
          </select>

          <select
            value={filters.status}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                status:
                  e.target
                    .value as
                    | CropCycleStatus
                    | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Situação: todas
            </option>

            {statusOptions.map(
              option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
          </select>

          <select
            value={
              filters.harvestStatus
            }
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                harvestStatus:
                  e.target
                    .value as Filters['harvestStatus'],
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Todas">
              Colheita: todas
            </option>

            <option value="Com colheita">
              Com colheita
            </option>

            <option value="Sem colheita">
              Sem colheita
            </option>
          </select>

          <button
            onClick={() =>
              setFilters(
                defaultFilters
              )
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline self-center"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum ciclo agrícola
            cadastrado.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre primeiro um
            cultivo para visualizar o
            ciclo agrícola.
          </p>
        </div>
      ) : filteredSummaries.length ===
        0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum ciclo encontrado
            com os filtros
            selecionados.
          </p>

          <button
            onClick={() =>
              setFilters(
                defaultFilters
              )
            }
            className="mt-2 text-green-600 hover:underline text-sm"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3">
                    Talhão
                  </th>

                  <th className="px-4 py-3">
                    Cultura / Cultivar
                  </th>

                  <th className="px-4 py-3">
                    Safra
                  </th>

                  <th className="px-4 py-3">
                    Situação
                  </th>

                  <th className="px-4 py-3">
                    Última análise do
                    talhão
                  </th>

                  <th className="px-4 py-3">
                    Manejos
                  </th>

                  <th className="px-4 py-3">
                    Colheita
                  </th>

                  <th className="px-4 py-3">
                    Produtividade
                  </th>

                  <th className="px-4 py-3">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSummaries.map(
                  summary => {
                    const managementsCount =
                      summary
                        .cropManagements
                        .length

                    return (
                      <tr
                        key={
                          summary
                            .cropCycle
                            .id
                        }
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3 font-medium">
                          {getLandAreaLabel(
                            summary
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {getCropLabel(
                            summary
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {
                            summary
                              .cropCycle
                              .season
                          }
                        </td>

                        <td className="px-4 py-3">
                          <CropCycleStatusBadge
                            status={
                              summary
                                .cropCycle
                                .status
                            }
                          />
                        </td>

                        <td className="px-4 py-3">
                          {getLatestSoilInfo(
                            summary
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {managementsCount >
                          0
                            ? `${managementsCount} ${
                                managementsCount ===
                                1
                                  ? 'manejo'
                                  : 'manejos'
                              }`
                            : 'Nenhum manejo'}
                        </td>

                        <td className="px-4 py-3">
                          {getHarvestInfo(
                            summary
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {getProductivityInfo(
                            summary
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              navigate(
                                `/cultivos/ciclo-agricola/${summary.cropCycle.id}`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Ver ciclo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filteredSummaries.map(
              summary => {
                const managementsCount =
                  summary
                    .cropManagements
                    .length

                return (
                  <Card
                    key={
                      summary
                        .cropCycle.id
                    }
                    className="p-4"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <p className="font-medium text-sm">
                          {getLandAreaLabel(
                            summary
                          )}
                        </p>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getCropLabel(
                            summary
                          )}
                        </p>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {
                            summary
                              .cropCycle
                              .season
                          }
                        </p>
                      </div>

                      <CropCycleStatusBadge
                        status={
                          summary
                            .cropCycle
                            .status
                        }
                      />
                    </div>

                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      <p>
                        Última análise:{' '}
                        {getLatestSoilInfo(
                          summary
                        )}
                      </p>

                      <p>
                        Manejos:{' '}
                        {managementsCount}
                      </p>

                      <p>
                        Colheita:{' '}
                        {getHarvestInfo(
                          summary
                        )}
                      </p>

                      <p>
                        Produtividade:{' '}
                        {getProductivityInfo(
                          summary
                        )}
                      </p>
                    </div>

                    <div className="mt-3">
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/cultivos/ciclo-agricola/${summary.cropCycle.id}`
                          )
                        }
                        className="text-xs px-2 py-1"
                      >
                        Ver ciclo
                      </Button>
                    </div>
                  </Card>
                )
              }
            )}
          </div>
        </>
      )}
    </div>
  )
}