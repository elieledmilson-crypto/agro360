import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getHarvestRecords,
  deleteHarvestRecord,
  getHarvestProductionKg,
  getHarvestProductivityKgPerHectare,
  getHarvestProductivityInOriginalUnitPerHectare,
} from '../../services/harvestService'
import { getCropCycles } from '../../services/cropService'
import { getLandAreas } from '../../services/landService'
import {
  HarvestRecord,
  CropCycle,
  LandArea,
  HarvestProductionUnit,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'

interface Filters {
  search: string
  landAreaId: string
  cropCycleId: string
  productionUnit:
    | HarvestProductionUnit
    | ''
}

const defaultFilters: Filters = {
  search: '',
  landAreaId: '',
  cropCycleId: '',
  productionUnit: '',
}

const unitOptions: HarvestProductionUnit[] =
  ['kg', 't', 'sc']

export default function HarvestRecordsPage() {
  const navigate = useNavigate()

  const [records, setRecords] =
    useState<HarvestRecord[]>([])

  const [cropCycles, setCropCycles] =
    useState<CropCycle[]>([])

  const [landAreas, setLandAreas] =
    useState<LandArea[]>([])

  const [filters, setFilters] =
    useState<Filters>(defaultFilters)

  const [feedback, setFeedback] =
    useState<{
      type: 'success' | 'error'
      message: string
    } | null>(null)

  const loadData = useCallback(() => {
    setRecords(getHarvestRecords())
    setCropCycles(getCropCycles())
    setLandAreas(getLandAreas())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return records.filter(record => {
      const cycle = cropCycles.find(
        item =>
          item.id ===
          record.cropCycleId
      )

      const area = cycle
        ? landAreas.find(
            a =>
              a.id ===
              cycle.landAreaId
          )
        : undefined

      const searchTerm =
        filters.search
          .toLowerCase()
          .trim()

      const matchesSearch =
        !searchTerm ||
        (area?.code
          .toLowerCase()
          .includes(searchTerm) ??
          false) ||
        (area?.name
          .toLowerCase()
          .includes(searchTerm) ??
          false) ||
        (cycle?.crop
          .toLowerCase()
          .includes(searchTerm) ??
          false) ||
        (cycle?.cultivar
          ?.toLowerCase()
          .includes(searchTerm) ??
          false) ||
        (cycle?.season
          .toLowerCase()
          .includes(searchTerm) ??
          false) ||
        (record.notes
          ?.toLowerCase()
          .includes(searchTerm) ??
          false)

      const matchesArea =
        !filters.landAreaId ||
        cycle?.landAreaId ===
          filters.landAreaId

      const matchesCropCycle =
        !filters.cropCycleId ||
        record.cropCycleId ===
          filters.cropCycleId

      const matchesUnit =
        !filters.productionUnit ||
        record.productionUnit ===
          filters.productionUnit

      return (
        matchesSearch &&
        matchesArea &&
        matchesCropCycle &&
        matchesUnit
      )
    })
  }, [
    records,
    cropCycles,
    landAreas,
    filters,
  ])

  const handleDelete = (
    id: string
  ) => {
    const record = records.find(
      item => item.id === id
    )

    if (!record) return

    if (
      window.confirm(
        'Excluir este registro de colheita?'
      )
    ) {
      try {
        const deleted =
          deleteHarvestRecord(id)

        if (deleted) {
          setFeedback({
            type: 'success',
            message:
              'Colheita excluída com sucesso.',
          })
        } else {
          setFeedback({
            type: 'error',
            message:
              'Colheita não encontrada.',
          })
        }

        loadData()
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir colheita.',
        })

        loadData()
      }
    }
  }

  const currentYear =
    new Date().getFullYear()

  const harvestsThisYear =
    records.filter(
      record =>
        new Date(
          record.harvestDate +
            'T00:00:00'
        ).getFullYear() ===
        currentYear
    ).length

  const totalHarvestedArea =
    records.reduce(
      (sum, record) =>
        sum +
        record.harvestedAreaHectares,
      0
    )

  const totalProductionKg =
    records.reduce(
      (sum, record) =>
        sum +
        getHarvestProductionKg(
          record
        ),
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

  const formatArea = (
    value: number
  ) =>
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) + ' ha'

  const formatProduction = (
    record: HarvestRecord
  ) => {
    const unit =
      record.productionUnit

    const value =
      record.productionQuantity

    return `${value.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )} ${unit}`
  }

  const formatProductivityOriginal = (
    record: HarvestRecord
  ) => {
    const productivity =
      getHarvestProductivityInOriginalUnitPerHectare(
        record
      )

    return `${productivity.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )} ${record.productionUnit}/ha`
  }

  const formatProductivityKg = (
    record: HarvestRecord
  ) => {
    const productivity =
      getHarvestProductivityKgPerHectare(
        record
      )

    return `${productivity.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )} kg/ha`
  }

  const getAreaLabel = (
    record: HarvestRecord
  ): string => {
    const cycle = cropCycles.find(
      item =>
        item.id ===
        record.cropCycleId
    )

    if (!cycle) {
      return 'Área não encontrada'
    }

    const area = landAreas.find(
      a => a.id === cycle.landAreaId
    )

    return area
      ? `${area.code} — ${area.name}`
      : 'Área não encontrada'
  }

  const getCropLabel = (
    record: HarvestRecord
  ): string => {
    const cycle = cropCycles.find(
      item =>
        item.id ===
        record.cropCycleId
    )

    if (!cycle) {
      return 'Cultivo não encontrado'
    }

    return `${cycle.crop}${
      cycle.cultivar
        ? ` — ${cycle.cultivar}`
        : ''
    }`
  }

  const getSeason = (
    record: HarvestRecord
  ): string => {
    const cycle = cropCycles.find(
      item =>
        item.id ===
        record.cropCycleId
    )

    return cycle?.season ?? '—'
  }

  const summaryCards = [
    {
      label: 'Total de colheitas',
      value: records.length,
    },
    {
      label: `Colheitas em ${currentYear}`,
      value: harvestsThisYear,
    },
    {
      label: 'Área total colhida',
      value: formatArea(
        totalHarvestedArea
      ),
    },
    {
      label: 'Produção total',
      value: `${totalProductionKg.toLocaleString(
        'pt-BR',
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }
      )} kg`,
    },
    {
      label: 'Produtividade média',
      value: `${averageProductivity.toLocaleString(
        'pt-BR',
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }
      )} kg/ha`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Colheitas e Produtividade
            </h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Aqui você registra e acompanha as colheitas, a produção obtida e a produtividade do cultivo."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe as colheitas e a
            produtividade dos cultivos.
          </p>
        </div>

        <Button
          onClick={() =>
            navigate(
              '/cultivos/colheitas/nova'
            )
          }
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Nova colheita
        </Button>
      </div>

      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map(card => (
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
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por talhão, cultivo, safra ou observações..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                search: e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={filters.landAreaId}
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

            {landAreas
              .filter(
                area =>
                  area.type ===
                  'Talhão'
              )
              .map(area => (
                <option
                  key={area.id}
                  value={area.id}
                >
                  {area.code} —{' '}
                  {area.name}
                </option>
              ))}
          </select>

          <select
            value={
              filters.cropCycleId
            }
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                cropCycleId:
                  e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Cultivo: todos
            </option>

            {cropCycles.map(
              cycle => (
                <option
                  key={cycle.id}
                  value={cycle.id}
                >
                  {cycle.crop}{' '}
                  {cycle.cultivar
                    ? `— ${cycle.cultivar}`
                    : ''}{' '}
                  — {cycle.season}
                </option>
              )
            )}
          </select>

          <select
            value={
              filters.productionUnit
            }
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                productionUnit:
                  e.target
                    .value as
                    | HarvestProductionUnit
                    | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Unidade: todas
            </option>

            {unitOptions.map(
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

      {records.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma colheita cadastrada.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre a primeira colheita
            para um cultivo.
          </p>

          <Button
            className="mt-4"
            onClick={() =>
              navigate(
                '/cultivos/colheitas/nova'
              )
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeira colheita
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma colheita encontrada
            com os filtros selecionados.
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
                    Data
                  </th>
                  <th className="px-4 py-3">
                    Talhão
                  </th>
                  <th className="px-4 py-3">
                    Cultivo
                  </th>
                  <th className="px-4 py-3">
                    Safra
                  </th>
                  <th className="px-4 py-3">
                    Área colhida
                  </th>
                  <th className="px-4 py-3">
                    Produção
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
                {filtered.map(
                  record => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        {formatDate(
                          record.harvestDate
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {getAreaLabel(
                          record
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {getCropLabel(
                          record
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {getSeason(
                          record
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {formatArea(
                          record.harvestedAreaHectares
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {formatProduction(
                          record
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {formatProductivityOriginal(
                          record
                        )}

                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {formatProductivityKg(
                            record
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/cultivos/colheitas/${record.id}`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Visualizar colheita"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/cultivos/colheitas/${record.id}/editar`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Editar colheita"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                record.id
                              )
                            }
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                            aria-label="Excluir colheita"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(
              record => (
                <Card
                  key={record.id}
                  className="p-4"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {formatDate(
                          record.harvestDate
                        )}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getAreaLabel(
                          record
                        )}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getCropLabel(
                          record
                        )}{' '}
                        —{' '}
                        {getSeason(
                          record
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      Área:{' '}
                      {formatArea(
                        record.harvestedAreaHectares
                      )}
                    </p>

                    <p>
                      Produção:{' '}
                      {formatProduction(
                        record
                      )}
                    </p>

                    <p>
                      Produtividade:{' '}
                      {formatProductivityOriginal(
                        record
                      )}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatProductivityKg(
                        record
                      )}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/cultivos/colheitas/${record.id}`
                        )
                      }
                      className="text-xs px-2 py-1"
                    >
                      Ver
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/cultivos/colheitas/${record.id}/editar`
                        )
                      }
                      className="text-xs px-2 py-1"
                    >
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() =>
                        handleDelete(
                          record.id
                        )
                      }
                      className="text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}