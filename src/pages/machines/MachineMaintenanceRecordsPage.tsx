import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  getMachineMaintenanceRecords,
  deleteMachineMaintenanceRecord,
} from '../../services/machineMaintenanceService'
import {
  getMachines,
  getMachineById,
} from '../../services/machineService'
import {
  MachineMaintenanceRecord,
  MachineMaintenanceType,
  Machine,
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
  machineId: string
  type: MachineMaintenanceType | ''
}

const defaultFilters: Filters = {
  search: '',
  machineId: '',
  type: '',
}

const typeOptions:
  MachineMaintenanceType[] = [
  'Preventiva',
  'Corretiva',
  'Inspeção',
  'Lubrificação',
  'Troca de óleo',
  'Troca de filtros',
  'Reparo',
  'Outro',
]

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function MachineMaintenanceRecordsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [records, setRecords] =
    useState<
      MachineMaintenanceRecord[]
    >([])

  const [machines, setMachines] =
    useState<Machine[]>([])

  const [filters, setFilters] =
    useState<Filters>(() => {
      const query =
        new URLSearchParams(
          location.search
        )

      const requestedMachineId =
        query.get('machineId') ??
        ''

      const validMachineId =
        requestedMachineId &&
        getMachineById(
          requestedMachineId
        )
          ? requestedMachineId
          : ''

      return {
        ...defaultFilters,
        machineId:
          validMachineId,
      }
    })

  const [feedback, setFeedback] =
    useState<FeedbackType>(null)

  const loadData =
    useCallback(() => {
      setRecords(
        getMachineMaintenanceRecords()
      )

      setMachines(
        getMachines()
      )
    }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const state =
      location.state as {
        successMessage?: string
      } | null

    if (!state?.successMessage) {
      return
    }

    setFeedback({
      type: 'success',
      message:
        state.successMessage,
    })

    navigate(
      location.pathname,
      {
        replace: true,
        state: null,
      }
    )
  }, [
    location.pathname,
    location.state,
    navigate,
  ])

  useEffect(() => {
    if (!feedback) return

    const timer =
      setTimeout(
        () =>
          setFeedback(null),
        5000
      )

    return () =>
      clearTimeout(timer)
  }, [feedback])

  const filtered = useMemo(
    () => {
      return records.filter(
        record => {
          const machine =
            machines.find(
              m =>
                m.id ===
                record.machineId
            )

          const searchTerm =
            filters.search
              .toLowerCase()
              .trim()

          const matchesSearch =
            !searchTerm ||
            (machine?.code
              .toLowerCase()
              .includes(searchTerm) ??
              false) ||
            (machine?.name
              .toLowerCase()
              .includes(searchTerm) ??
              false) ||
            record.type
              .toLowerCase()
              .includes(searchTerm) ||
            record.servicePerformed
              .toLowerCase()
              .includes(searchTerm) ||
            (record.responsible
              ?.toLowerCase()
              .includes(searchTerm) ??
              false) ||
            (record.notes
              ?.toLowerCase()
              .includes(searchTerm) ??
              false)

          const matchesMachine =
            !filters.machineId ||
            record.machineId ===
              filters.machineId

          const matchesType =
            !filters.type ||
            record.type ===
              filters.type

          return (
            matchesSearch &&
            matchesMachine &&
            matchesType
          )
        }
      )
    },
    [
      records,
      machines,
      filters,
    ]
  )

  const handleDelete = (
    id: string
  ) => {
    const record =
      records.find(
        r => r.id === id
      )

    if (!record) return

    if (
      window.confirm(
        'Excluir este registro de manutenção?'
      )
    ) {
      try {
        const deleted =
          deleteMachineMaintenanceRecord(
            id
          )

        if (deleted) {
          setFeedback({
            type: 'success',
            message:
              'Registro de manutenção excluído com sucesso.',
          })
        } else {
          setFeedback({
            type: 'error',
            message:
              'Registro de manutenção não encontrado.',
          })
        }

        loadData()
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir registro de manutenção.',
        })

        loadData()
      }
    }
  }

  const formatDate = (
    date: string
  ) =>
    new Date(
      date + 'T00:00:00'
    ).toLocaleDateString(
      'pt-BR'
    )

  const formatHourMeter = (
    value?: number
  ) => {
    if (value === undefined) {
      return '—'
    }

    return `${value.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }
    )} h`
  }

  const getMachineLabel = (
    record:
      MachineMaintenanceRecord
  ): string => {
    const machine =
      machines.find(
        m =>
          m.id ===
          record.machineId
      )

    if (!machine) {
      return 'Máquina ou equipamento não encontrado'
    }

    return `${machine.code} — ${machine.name}`
  }

  const totalRecords =
    records.length

  const preventiveCount =
    records.filter(
      r =>
        r.type ===
        'Preventiva'
    ).length

  const correctiveCount =
    records.filter(
      r =>
        r.type ===
        'Corretiva'
    ).length

  const machinesWithHistory =
    new Set(
      records.map(
        r => r.machineId
      )
    ).size

  const summaryCards = [
    {
      label: 'Total de registros',
      value: totalRecords,
    },
    {
      label: 'Preventivas',
      value: preventiveCount,
    },
    {
      label: 'Corretivas',
      value: correctiveCount,
    },
    {
      label: 'Máquinas com histórico',
      value:
        machinesWithHistory,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Manutenções
            </h1>

            <HelpTip
              title="Para que serve o histórico de manutenção?"
              description="Aqui você registra os serviços realizados nas máquinas e equipamentos para manter um histórico do que foi feito e quando aconteceu."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe o histórico de manutenção das máquinas e equipamentos.
          </p>
        </div>

        <Button
          onClick={() =>
            navigate(
              '/maquinas/manutencoes/nova'
            )
          }
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Nova manutenção
        </Button>
      </div>

      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por máquina, tipo, serviço, responsável ou observações..."
            aria-label="Pesquisar manutenções"
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                search:
                  e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            aria-label="Filtrar por máquina"
            value={filters.machineId}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                machineId:
                  e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Máquina: todas
            </option>

            {machines.map(
              machine => (
                <option
                  key={machine.id}
                  value={machine.id}
                >
                  {machine.code} —{' '}
                  {machine.name}
                </option>
              )
            )}
          </select>

          <select
            aria-label="Filtrar por tipo"
            value={filters.type}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                type:
                  e.target.value as
                    | MachineMaintenanceType
                    | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Tipo: todos
            </option>

            {typeOptions.map(
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
            Nenhuma manutenção cadastrada.
          </p>

          <Button
            className="mt-4"
            onClick={() =>
              navigate(
                '/maquinas/manutencoes/nova'
              )
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Registrar primeira manutenção
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum registro encontrado com os filtros selecionados.
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
                    Máquina
                  </th>

                  <th className="px-4 py-3">
                    Tipo
                  </th>

                  <th className="px-4 py-3">
                    Horímetro
                  </th>

                  <th className="px-4 py-3">
                    Serviço realizado
                  </th>

                  <th className="px-4 py-3">
                    Responsável
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
                          record.maintenanceDate
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {getMachineLabel(
                          record
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {record.type}
                      </td>

                      <td className="px-4 py-3">
                        {formatHourMeter(
                          record.hourMeter
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {record.servicePerformed}
                      </td>

                      <td className="px-4 py-3">
                        {record.responsible ??
                          '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/maquinas/manutencoes/${record.id}`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Visualizar manutenção"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/maquinas/manutencoes/${record.id}/editar`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Editar manutenção"
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
                            aria-label="Excluir manutenção"
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
                          record.maintenanceDate
                        )}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getMachineLabel(
                          record
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      Tipo: {record.type}
                    </p>

                    <p>
                      Horímetro:{' '}
                      {formatHourMeter(
                        record.hourMeter
                      )}
                    </p>

                    <p>
                      Serviço:{' '}
                      {record.servicePerformed}
                    </p>

                    {record.responsible && (
                      <p>
                        Responsável:{' '}
                        {record.responsible}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/maquinas/manutencoes/${record.id}`
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
                          `/maquinas/manutencoes/${record.id}/editar`
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