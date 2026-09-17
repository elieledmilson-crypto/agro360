import { TimelineItem } from '../../utils/animalTimeline'
import { User, Syringe, Activity, ClipboardList } from 'lucide-react'

interface Props {
  items: TimelineItem[]
}

export default function AnimalTimeline({ items }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Nenhum evento registrado.
      </p>
    )
  }

  const iconForType = (type: TimelineItem['type']) => {
    switch (type) {
      case 'admin':
        return <User className="w-4 h-4 text-gray-500" />
      case 'vaccination':
        return <Syringe className="w-4 h-4 text-blue-600" />
      case 'treatment':
        return <Activity className="w-4 h-4 text-emerald-600" />
      case 'occurrence':
        return <ClipboardList className="w-4 h-4 text-purple-600" />
    }
  }

  return (
    <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3">
      {items.map(item => {
        const date = new Date(item.date)

        return (
          <li key={item.id} className="mb-4 ml-6">
            <span className="absolute flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full -left-3 ring-4 ring-white dark:ring-gray-900">
              {iconForType(item.type)}
            </span>

            <p className="text-sm text-gray-700 dark:text-gray-300">
              {item.description}
            </p>

            <time className="text-xs text-gray-500 dark:text-gray-400">
              {date.toLocaleDateString('pt-BR')}
              {item.showTime &&
                ` às ${date.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`}
            </time>
          </li>
        )
      })}
    </ol>
  )
}