import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { getAlertsForUser } from '../../services/alertService'
import {
  AgroAlert,
  AgroAlertSeverity,
  AgroAlertSource,
} from '../../types'
import { useAuth } from '../../hooks/useAuth'
import Card from '../../components/ui/Card'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  AlertTriangle,
  Info,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react'

type SourceFilter = AgroAlertSource | ''
type SeverityFilter = AgroAlertSeverity | ''

interface Filters {
  search: string
  severity: SeverityFilter
  source: SourceFilter
}

const defaultFilters: Filters = {
  search: '',
  severity: '',
  source: '',
}

const severityOptions: SeverityFilter[] = [
  'Urgente',
  'Atenção',
  'Informativo',
]

const sourceOptions: { value: SourceFilter; label: string }[] = [
  { value: 'agenda', label: 'Agenda' },
  { value: 'health', label: 'Saúde Animal' },
  { value: 'crops', label: 'Cultivos' },
  { value: 'inventory', label: 'Estoque' },
  { value: 'machines', label: 'Máquinas' },
]

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function AlertsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [alerts, setAlerts] = useState<AgroAlert[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const loadData = useCallback(() => {
    setAlerts(getAlertsForUser(user))
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
    return alerts.filter(alert => {
      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        alert.title.toLowerCase().includes(searchTerm) ||
        alert.message.toLowerCase().includes(searchTerm) ||
        alert.sourceLabel.toLowerCase().includes(searchTerm)

      const matchesSeverity =
        !filters.severity || alert.severity === filters.severity

      const matchesSource =
        !filters.source || alert.source === filters.source

      return matchesSearch && matchesSeverity && matchesSource
    })
  }, [alerts, filters])

  const summary = useMemo(() => {
    let urgent = 0
    let attention = 0
    let info = 0

    for (const alert of alerts) {
      if (alert.severity === 'Urgente') urgent++
      else if (alert.severity === 'Atenção') attention++
      else info++
    }

    return {
      total: alerts.length,
      urgent,
      attention,
      info,
    }
  }, [alerts])

  const renderSeverityBadge = (severity: AgroAlertSeverity) => {
    if (severity === 'Urgente') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
          <ShieldAlert className="w-3 h-3" />
          Urgente
        </span>
      )
    }

    if (severity === 'Atenção') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <AlertTriangle className="w-3 h-3" />
          Atenção
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
        <Info className="w-3 h-3" />
        Informativo
      </span>
    )
  }

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')

  const summaryCards = [
    {
      label: 'Total',
      value: summary.total,
      color:
        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    },
    {
      label: 'Urgentes',
      value: summary.urgent,
      color:
        'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    },
    {
      label: 'Atenção',
      value: summary.attention,
      color:
        'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    },
    {
      label: 'Informativos',
      value: summary.info,
      color:
        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
          >
            ← Voltar ao Dashboard
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">Alertas</h1>

            <HelpTip
              title="Para que servem os Alertas?"
              description="A página de Alertas reúne situações calculadas automaticamente a partir dos dados existentes no Agro360 e das atividades cadastradas na Agenda."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe situações que precisam de atenção na propriedade.
          </p>
        </div>
      </div>

      {feedback && (
        <PageFeedback type={feedback.type} message={feedback.message} />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <Card key={card.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {card.label}
                </p>

                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>

              <div className={`p-2 rounded-lg ${card.color}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por título, mensagem ou origem..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
            className="md:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={filters.severity}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                severity: e.target.value as SeverityFilter,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Severidade: todas</option>

            {severityOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={filters.source}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                source: e.target.value as SourceFilter,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Origem: todas</option>

            {sourceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilters(defaultFilters)}
            className="md:col-span-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline justify-self-start"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum alerta no momento.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Todos os módulos que você acompanha estão dentro do esperado.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum alerta encontrado com os filtros selecionados.
          </p>

          <button
            onClick={() => setFilters(defaultFilters)}
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
                  <th className="px-4 py-3">Severidade</th>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Mensagem</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(alert => (
                  <tr
                    key={alert.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      {renderSeverityBadge(alert.severity)}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {alert.title}
                    </td>

                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {alert.message}
                    </td>

                    <td className="px-4 py-3">{alert.sourceLabel}</td>

                    <td className="px-4 py-3">
                      {alert.date ? formatDate(alert.date) : '—'}
                    </td>

                    <td className="px-4 py-3">
                      {alert.sourcePath ? (
                        <Link
                          to={alert.sourcePath}
                          className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver origem
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(alert => (
              <Card key={alert.id} className="p-4">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <p className="font-medium text-sm">{alert.title}</p>

                  {renderSeverityBadge(alert.severity)}
                </div>

                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  {alert.message}
                </p>

                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <p>Origem: {alert.sourceLabel}</p>

                  {alert.date && <p>Data: {formatDate(alert.date)}</p>}
                </div>

                {alert.sourcePath && (
                  <div className="mt-3">
                    <Link
                      to={alert.sourcePath}
                      className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver origem
                    </Link>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}