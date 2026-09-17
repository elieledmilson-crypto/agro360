import { useMemo } from 'react'
import {
  getVaccinations,
  getVaccinationStatus,
  getTreatments,
  getHealthOccurrences,
} from '../../services/healthService'
import Card from '../ui/Card'
import {
  Syringe,
  CalendarClock,
  AlertTriangle,
  Activity,
  ClipboardList,
} from 'lucide-react'

export default function HealthSummaryCards() {
  const vaccinations = useMemo(
    () => getVaccinations(),
    [],
  )

  const treatments = useMemo(
    () => getTreatments(),
    [],
  )

  const occurrences = useMemo(
    () => getHealthOccurrences(),
    [],
  )

  const upcomingVaccines =
    vaccinations.filter(
      vaccination =>
        getVaccinationStatus(
          vaccination,
        ) === 'Próxima',
    ).length

  const overdueVaccines =
    vaccinations.filter(
      vaccination =>
        getVaccinationStatus(
          vaccination,
        ) === 'Vencida',
    ).length

  const ongoingTreatments =
    treatments.filter(
      treatment =>
        treatment.status ===
        'Em andamento',
    ).length

  const openOccurrences =
    occurrences.filter(
      occurrence =>
        occurrence.status === 'Aberta',
    ).length

  const cards = [
    {
      label: 'Vacinações registradas',
      value: vaccinations.length,
      icon: Syringe,
      color:
        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Próximas doses',
      value: upcomingVaccines,
      icon: CalendarClock,
      color:
        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    },
    {
      label: 'Doses vencidas',
      value: overdueVaccines,
      icon: AlertTriangle,
      color:
        'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    },
    {
      label:
        'Tratamentos em andamento',
      value: ongoingTreatments,
      icon: Activity,
      color:
        'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Ocorrências abertas',
      value: openOccurrences,
      icon: ClipboardList,
      color:
        'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(card => {
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
  )
}