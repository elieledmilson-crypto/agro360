import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  getMachines,
  deleteMachine,
} from '../../services/machineService'
import {
  Machine,
  MachineCategory,
  MachineStatus,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import MachineStatusBadge from '../../components/machines/MachineStatusBadge'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Wrench,
  ClipboardList,
} from 'lucide-react'

interface Filters {
  search: string
  category: MachineCategory | ''
  status: MachineStatus | ''
}

const defaultFilters: Filters = {
  search: '',
  category: '',
  status: '',
}

const categoryOptions: MachineCategory[] = [
  'Trator',
  'Colheitadeira',
  'Pulverizador',
  'Plantadeira',
  'Semeadora',
  'Grade',
  'Arado',
  'Roçadeira',
  'Distribuidor',
  'Implemento',
  'Veículo',
  'Outro',
]

const statusOptions: MachineStatus[] = [
  'Operacional',
  'Em manutenção',
  'Inativa',
]

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function MachinesPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [machines, setMachines] =
    useState<Machine[]>([])

  const [filters, setFilters] =
    useState<Filters>(defaultFilters)

  const [feedback, setFeedback] =
    useState<FeedbackType>(null)

  const loadData = useCallback(() => {
    setMachines(getMachines())
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
      return machines.filter(
        machine => {
          const searchTerm =
            filters.search
              .toLowerCase()
              .trim()

          const matchesSearch =
            !searchTerm ||
            machine.code
              .toLowerCase()
              .includes(searchTerm) ||
            machine.name
              .toLowerCase()
              .includes(searchTerm) ||
            machine.category
              .toLowerCase()
              .includes(searchTerm) ||
            (machine.brand
              ?.toLowerCase()
              .includes(searchTerm) ??
              false) ||
            (machine.model
              ?.toLowerCase()
              .includes(searchTerm) ??
              false) ||
            (machine.identification
              ?.toLowerCase()
              .includes(searchTerm) ??
              false)

          const matchesCategory =
            !filters.category ||
            machine.category ===
              filters.category

          const matchesStatus =
            !filters.status ||
            machine.status ===
              filters.status

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
          )
        }
      )
    },
    [machines, filters]
  )

  const handleDelete = (
    id: string
  ) => {
    const machine =
      machines.find(
        item =>
          item.id === id
      )

    if (!machine) return

    if (
      window.confirm(
        `Excluir a máquina/equipamento ${machine.name}?`
      )
    ) {
      try {
        const deleted =
          deleteMachine(id)

        if (deleted) {
          setFeedback({
            type: 'success',
            message:
              'Máquina ou equipamento excluído com sucesso.',
          })
        } else {
          setFeedback({
            type: 'error',
            message:
              'Máquina ou equipamento não encontrado.',
          })
        }

        loadData()
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir máquina ou equipamento.',
        })

        loadData()
      }
    }
  }

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

  const summaryCards = [
    {
      label: 'Total',
      value: machines.length,
    },
    {
      label: 'Operacionais',
      value:
        machines.filter(
          m =>
            m.status ===
            'Operacional'
        ).length,
    },
    {
      label: 'Em manutenção',
      value:
        machines.filter(
          m =>
            m.status ===
            'Em manutenção'
        ).length,
    },
    {
      label: 'Inativas',
      value:
        machines.filter(
          m =>
            m.status ===
            'Inativa'
        ).length,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Máquinas e Equipamentos
            </h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Aqui você cadastra e acompanha tratores, implementos, veículos e outros equipamentos utilizados na propriedade."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Gerencie as máquinas, veículos e equipamentos da propriedade.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/maquinas/manutencoes"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Manutenções
          </Link>

          <Link
            to="/maquinas/utilizacoes"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Utilizações
          </Link>

          <Button
            onClick={() =>
              navigate('/maquinas/nova')
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Nova máquina
          </Button>
        </div>
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
            placeholder="Pesquisar por código, nome, categoria, marca, modelo ou identificação..."
            aria-label="Pesquisar máquinas e equipamentos"
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
            aria-label="Filtrar por categoria"
            value={filters.category}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                category:
                  e.target.value as
                    | MachineCategory
                    | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Categoria: todas
            </option>

            {categoryOptions.map(
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
            aria-label="Filtrar por situação"
            value={filters.status}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                status:
                  e.target.value as
                    | MachineStatus
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

          <button
            onClick={() =>
              setFilters(defaultFilters)
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline self-center"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {machines.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma máquina cadastrada.
          </p>

          <Button
            className="mt-4"
            onClick={() =>
              navigate('/maquinas/nova')
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeira máquina
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma máquina encontrada com os filtros selecionados.
          </p>

          <button
            onClick={() =>
              setFilters(defaultFilters)
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
                    Código
                  </th>

                  <th className="px-4 py-3">
                    Nome
                  </th>

                  <th className="px-4 py-3">
                    Categoria
                  </th>

                  <th className="px-4 py-3">
                    Marca / Modelo
                  </th>

                  <th className="px-4 py-3">
                    Ano
                  </th>

                  <th className="px-4 py-3">
                    Horímetro
                  </th>

                  <th className="px-4 py-3">
                    Situação
                  </th>

                  <th className="px-4 py-3">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(
                  machine => (
                    <tr
                      key={machine.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {machine.code}
                      </td>

                      <td className="px-4 py-3">
                        {machine.name}
                      </td>

                      <td className="px-4 py-3">
                        {machine.category}
                      </td>

                      <td className="px-4 py-3">
                        {[
                          machine.brand,
                          machine.model,
                        ]
                          .filter(Boolean)
                          .join(' / ') ||
                          '—'}
                      </td>

                      <td className="px-4 py-3">
                        {machine.year ?? '—'}
                      </td>

                      <td className="px-4 py-3">
                        {formatHourMeter(
                          machine.hourMeter
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <MachineStatusBadge
                          status={machine.status}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/maquinas/${machine.id}`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Visualizar máquina"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/maquinas/${machine.id}/editar`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Editar máquina"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                machine.id
                              )
                            }
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                            aria-label="Excluir máquina"
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
              machine => (
                <Card
                  key={machine.id}
                  className="p-4"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {machine.code}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {machine.name}
                      </p>
                    </div>

                    <MachineStatusBadge
                      status={machine.status}
                    />
                  </div>

                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      Categoria:{' '}
                      {machine.category}
                    </p>

                    <p>
                      Marca/Modelo:{' '}
                      {[
                        machine.brand,
                        machine.model,
                      ]
                        .filter(Boolean)
                        .join(' / ') ||
                        '—'}
                    </p>

                    <p>
                      Ano:{' '}
                      {machine.year ?? '—'}
                    </p>

                    <p>
                      Horímetro:{' '}
                      {formatHourMeter(
                        machine.hourMeter
                      )}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/maquinas/${machine.id}`
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
                          `/maquinas/${machine.id}/editar`
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
                          machine.id
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