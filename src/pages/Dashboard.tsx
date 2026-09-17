import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getAnimals } from '../services/animalService'
import { getPendingVaccinationCount } from '../services/healthService'
import { getLandAreaCount } from '../services/landService'
import { getActiveCropCyclesCount } from '../services/cropService'
import { getAgendaEntriesForUser } from '../services/agendaService'
import { getAlertsForUser } from '../services/alertService'
import { userHasPermission } from '../services/permissionService'
import { useAuth } from '../hooks/useAuth'
import Card from '../components/ui/Card'
import HelpTip from '../components/ui/HelpTip'
import {
  Users,
  MapPin,
  Sprout,
  CalendarClock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()

  const animalCount = useMemo(() => getAnimals().length, [])
  const pendingVaccineCount = useMemo(() => getPendingVaccinationCount(), [])
  const landAreaCount = useMemo(() => getLandAreaCount(), [])
  const activeCropCycles = useMemo(() => getActiveCropCyclesCount(), [])

  const hasAgendaAccess = userHasPermission(user, 'agenda')

  const upcomingAgendaEntries = useMemo(() => {
    if (!hasAgendaAccess) return []

    const all = getAgendaEntriesForUser(user)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return all
      .filter(entry => {
        if (entry.status === 'Concluída') return false
        if (entry.status === 'Cancelada') return false

        const entryDate = new Date(entry.date + 'T00:00:00')
        return entryDate >= today
      })
      .slice(0, 5)
  }, [user, hasAgendaAccess])

  const visibleAlerts = useMemo(() => {
    if (!hasAgendaAccess) return []

    return getAlertsForUser(user).slice(0, 5)
  }, [user, hasAgendaAccess])

  const statsCards = [
    {
      label: 'Animais cadastrados',
      value: animalCount,
      icon: Users,
      color:
        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Vacinações pendentes',
      value: pendingVaccineCount,
      icon: CalendarClock,
      color:
        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    },
    {
      label: 'Áreas cadastradas',
      value: landAreaCount,
      icon: MapPin,
      color:
        'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    },
    {
      label: 'Cultivos ativos',
      value: activeCropCycles,
      icon: Sprout,
      color:
        'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    },
  ]

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')

  const renderAlertSeverity = (severity: string) => {
    if (severity === 'Urgente') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
          Urgente
        </span>
      )
    }

    if (severity === 'Atenção') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Atenção
        </span>
      )
    }

    return (
      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
        Informativo
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <HelpTip
            title="Para que serve o Dashboard?"
            description="O Dashboard reúne informações gerais da propriedade para facilitar uma consulta rápida do que está registrado no Agro360."
          />
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Visão geral da propriedade
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(card => {
          const Icon = card.icon

          return (
            <Card key={card.label} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>

                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {hasAgendaAccess && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="font-semibold">Atividades próximas</h2>

              <Link
                to="/agenda"
                className="inline-flex items-center text-sm text-green-600 hover:underline"
              >
                Ver Agenda
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {upcomingAgendaEntries.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma atividade próxima.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingAgendaEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{entry.title}</p>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(entry.date)}
                        {entry.time ? ` · ${entry.time}` : ''}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Origem: {entry.sourceLabel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="font-semibold">Alertas</h2>

              <Link
                to="/alertas"
                className="inline-flex items-center text-sm text-green-600 hover:underline"
              >
                Ver Alertas
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {visibleAlerts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <AlertTriangle className="w-4 h-4" />
                Nenhum alerta no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {alert.title}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {alert.message}
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Origem: {alert.sourceLabel}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {renderAlertSeverity(alert.severity)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}