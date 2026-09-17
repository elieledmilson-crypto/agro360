import {
  CheckCircle,
  CheckCircle2,
  Package,
  Users,
  XCircle,
} from 'lucide-react'
import { Animal, Lot } from '../../types'
import Card from '../ui/Card'

interface Props {
  animals: Animal[]
  lots: Lot[]
}

export default function AnimalSummaryCards({
  animals,
  lots,
}: Props) {
  const total = animals.length
  const active = animals.filter(
    animal => animal.status === 'Ativo',
  ).length
  const males = animals.filter(
    animal => animal.sex === 'Macho',
  ).length
  const females = animals.filter(
    animal => animal.sex === 'Fêmea',
  ).length
  const lotCount = lots.length

  const cards = [
    {
      label: 'Total de animais',
      value: total,
      icon: Users,
      color:
        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Ativos',
      value: active,
      icon: CheckCircle2,
      color:
        'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    },
    {
      label: 'Machos',
      value: males,
      icon: XCircle,
      color:
        'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    },
    {
      label: 'Fêmeas',
      value: females,
      icon: CheckCircle,
      color:
        'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    },
    {
      label: 'Lotes',
      value: lotCount,
      icon: Package,
      color:
        'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
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