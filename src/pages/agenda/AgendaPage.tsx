import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  getAgendaEntriesForUser,
  getAgendaEmployeeOptions,
} from '../../services/agendaService'
import {
  AgendaEntry,
  AgendaEntrySource,
  AgendaActivityType,
  AgendaDisplayStatus,
  AgendaActivityPriority,
} from '../../types'
import { useAuth } from '../../hooks/useAuth'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  Plus,
  Eye,
  Pencil,
  ExternalLink,
  CalendarDays,
  CalendarClock,
  AlertTriangle,
  ListChecks,
} from 'lucide-react'
import { addDaysToCivilDate, todayDateString } from '../../utils/date'

type SourceFilter = AgendaEntrySource | ''
type TypeFilter = AgendaActivityType | 'Validade de estoque' | ''
type StatusFilter = AgendaDisplayStatus | ''
type PriorityFilter = AgendaActivityPriority | ''

interface Filters {
  search: string
  source: SourceFilter
  type: TypeFilter
  status: StatusFilter
  priority: PriorityFilter
  dateFrom: string
  dateTo: string
}

const defaultFilters: Filters = {
  search: '',
  source: '',
  type: '',
  status: '',
  priority: '',
  dateFrom: '',
  dateTo: '',
}

const sourceOptions: { value: SourceFilter; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'health', label: 'Saúde Animal' },
  { value: 'crops', label: 'Cultivos' },
  { value: 'inventory', label: 'Estoque' },
  { value: 'machines', label: 'Máquinas' },
]

const typeOptions: TypeFilter[] = [
  'Tarefa',
  'Vacinação',
  'Tratamento',
  'Plantio',
  'Colheita',
  'Manutenção',
  'Irrigação',
  'Pagamento',
  'Reposição de estoque',
  'Validade de estoque',
  'Outro',
]

const statusOptions: StatusFilter[] = [
  'Pendente',
  'Atrasada',
  'Concluída',
  'Cancelada',
]

const priorityOptions: PriorityFilter[] = ['Baixa', 'Média', 'Alta']

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function AgendaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [entries, setEntries] = useState<AgendaEntry[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const employeeOptions = useMemo(() => getAgendaEmployeeOptions(), [])

  const loadData = useCallback(() => {
    setEntries(getAgendaEntriesForUser(user))
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData, location.key])

  useEffect(() => {
    const state = location.state as { successMessage?: string } | null
    if (!state?.successMessage) return

    setFeedback({
      type: 'success',
      message: state.successMessage,
    })

    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!feedback) return

    const timer = setTimeout(() => setFeedback(null), 5000)

    return () => clearTimeout(timer)
  }, [feedback])

  const filtered = useMemo(() => {
    return entries.filter(entry => {
      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm || entry.title.toLowerCase().includes(searchTerm)

      const matchesSource =
        !filters.source || entry.source === filters.source

      const matchesType =
        !filters.type || entry.type === filters.type

      const matchesStatus =
        !filters.status || entry.status === filters.status

      const matchesPriority =
        !filters.priority || entry.priority === filters.priority

      const matchesDateFrom =
        !filters.dateFrom || entry.date >= filters.dateFrom

      const matchesDateTo =
        !filters.dateTo || entry.date <= filters.dateTo

      return (
        matchesSearch &&
        matchesSource &&
        matchesType &&
        matchesStatus &&
        matchesPriority &&
        matchesDateFrom &&
        matchesDateTo
      )
    })
  }, [entries, filters])

  const summary = useMemo(() => {
    const today = todayDateString()
    const sevenDays = addDaysToCivilDate(today, 7)

    let overdue = 0
    let todayCount = 0
    let nextSevenDays = 0
    let manualPending = 0

    for (const entry of entries) {
      if (entry.status === 'Atrasada') {
        overdue++
      }

      if (entry.date === today) {
        todayCount++
      }

      if (entry.date >= today && entry.date <= sevenDays) {
        nextSevenDays++
      }

      if (
        entry.source === 'manual' &&
        entry.status !== 'Concluída' &&
        entry.status !== 'Cancelada'
      ) {
        manualPending++
      }
    }

    return {
      overdue,
      todayCount,
      nextSevenDays,
      manualPending,
    }
  }, [entries])

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')

  const renderStatusBadge = (status: AgendaDisplayStatus) => {
    if (status === 'Atrasada') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
          Atrasada
        </span>
      )
    }

    if (status === 'Pendente') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Pendente
        </span>
      )
    }

    if (status === 'Concluída') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
          Concluída
        </span>
      )
    }

    return (
      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
        Cancelada
      </span>
    )
  }

  const renderPriorityBadge = (
    priority: AgendaActivityPriority,
  ) => {
    if (priority === 'Alta') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
          Alta
        </span>
      )
    }

    if (priority === 'Média') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Média
        </span>
      )
    }

    return (
      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
        Baixa
      </span>
    )
  }

  const renderSourceBadge = (
    source: AgendaEntrySource,
    label: string,
  ) => {
    const colorMap: Record<AgendaEntrySource, string> = {
      manual:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      health:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      crops:
        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      inventory:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      machines:
        'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    }

    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${colorMap[source]}`}
      >
        {label}
      </span>
    )
  }

  const getResponsibleName = (entry: AgendaEntry): string => {
    if (entry.responsibleName) {
      return entry.responsibleName
    }

    if (entry.responsibleEmployeeId) {
      const employee = employeeOptions.find(
        option => option.id === entry.responsibleEmployeeId,
      )

      return employee?.name ?? '—'
    }

    return '—'
  }

  const summaryCards = [
    {
      label: 'Atrasadas',
      value: summary.overdue,
      icon: AlertTriangle,
      color:
        'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    },
    {
      label: 'Hoje',
      value: summary.todayCount,
      icon: CalendarClock,
      color:
        'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    },
    {
      label: 'Próximos 7 dias',
      value: summary.nextSevenDays,
      icon: CalendarDays,
      color:
        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Atividades manuais pendentes',
      value: summary.manualPending,
      icon: ListChecks,
      color:
        'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Agenda
            </h1>

            <HelpTip
              title="Para que serve a Agenda?"
              description="Centralize atividades, compromissos e prazos da propriedade, incluindo lembretes manuais e informações vindas dos outros módulos."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Centralize atividades, compromissos e prazos da propriedade.
          </p>
        </div>

        <Button
          onClick={() =>
            navigate('/agenda/novo')
          }
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Nova atividade
        </Button>
      </div>

      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map(card => {
          const Icon = card.icon

          return (
            <Card
              key={card.label}
              className="p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.label}
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {card.value}
                  </p>
                </div>

                <div
                  className={`p-2 rounded-lg ${card.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por título..."
            value={filters.search}
            onChange={event =>
              setFilters(prev => ({
                ...prev,
                search: event.target.value,
              }))
            }
            className="md:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={filters.source}
            onChange={event =>
              setFilters(prev => ({
                ...prev,
                source: event.target.value as SourceFilter,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Origem: todas
            </option>

            {sourceOptions.map(option => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={event =>
              setFilters(prev => ({
                ...prev,
                type: event.target.value as TypeFilter,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Tipo: todos
            </option>

            {typeOptions.map(option => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={event =>
              setFilters(prev => ({
                ...prev,
                status: event.target.value as StatusFilter,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Situação: todas
            </option>

            {statusOptions.map(option => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={event =>
              setFilters(prev => ({
                ...prev,
                priority: event.target.value as PriorityFilter,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Prioridade: todas
            </option>

            {priorityOptions.map(option => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={event =>
              setFilters(prev => ({
                ...prev,
                dateFrom: event.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={event =>
              setFilters(prev => ({
                ...prev,
                dateTo: event.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

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

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma atividade na Agenda.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre a primeira atividade ou acompanhe aqui os prazos
            provenientes dos outros módulos.
          </p>

          <Button
            className="mt-4"
            onClick={() =>
              navigate('/agenda/novo')
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeira atividade
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma atividade encontrada com os filtros selecionados.
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
                    Data
                  </th>

                  <th className="px-4 py-3">
                    Hora
                  </th>

                  <th className="px-4 py-3">
                    Atividade
                  </th>

                  <th className="px-4 py-3">
                    Tipo
                  </th>

                  <th className="px-4 py-3">
                    Origem
                  </th>

                  <th className="px-4 py-3">
                    Prioridade
                  </th>

                  <th className="px-4 py-3">
                    Situação
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
                {filtered.map(entry => (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      {formatDate(entry.date)}
                    </td>

                    <td className="px-4 py-3">
                      {entry.time ?? '—'}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {entry.title}
                    </td>

                    <td className="px-4 py-3">
                      {entry.type}
                    </td>

                    <td className="px-4 py-3">
                      {renderSourceBadge(
                        entry.source,
                        entry.sourceLabel,
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {renderPriorityBadge(
                        entry.priority,
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {renderStatusBadge(
                        entry.status,
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {getResponsibleName(entry)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {entry.editable &&
                        entry.sourceRecordId ? (
                          <>
                            <button
                              onClick={() =>
                                navigate(
                                  `/agenda/${entry.sourceRecordId}`,
                                )
                              }
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              aria-label="Ver atividade"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                navigate(
                                  `/agenda/${entry.sourceRecordId}/editar`,
                                )
                              }
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              aria-label="Editar atividade"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </>
                        ) : entry.sourcePath ? (
                          <Link
                            to={entry.sourcePath}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-1 text-green-600"
                            aria-label="Abrir origem"
                          >
                            <ExternalLink className="w-4 h-4" />

                            <span className="text-xs">
                              Origem
                            </span>
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(entry => (
              <Card
                key={entry.id}
                className="p-4"
              >
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-sm">
                      {entry.title}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(entry.date)}

                      {entry.time
                        ? ` · ${entry.time}`
                        : ''}
                    </p>
                  </div>

                  {renderStatusBadge(
                    entry.status,
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {renderSourceBadge(
                    entry.source,
                    entry.sourceLabel,
                  )}

                  {renderPriorityBadge(
                    entry.priority,
                  )}
                </div>

                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    Tipo: {entry.type}
                  </p>

                  <p>
                    Responsável:{' '}
                    {getResponsibleName(entry)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.editable &&
                  entry.sourceRecordId ? (
                    <>
                      <Link
                        to={`/agenda/${entry.sourceRecordId}`}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Ver
                      </Link>

                      <Link
                        to={`/agenda/${entry.sourceRecordId}/editar`}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Editar
                      </Link>
                    </>
                  ) : entry.sourcePath ? (
                    <Link
                      to={entry.sourcePath}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Abrir origem
                    </Link>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}