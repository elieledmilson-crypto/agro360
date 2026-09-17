import { AnimalEvent } from '../../types'

interface Props {
  events: AnimalEvent[]
}

export default function AnimalHistory({
  events,
}: Props) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Nenhum evento registrado.
      </p>
    )
  }

  return (
    <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3">
      {events.map(event => (
        <li
          key={event.id}
          className="mb-4 ml-6"
        >
          <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3 ring-4 ring-white dark:ring-gray-900 dark:bg-green-900">
            <span className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
          </span>

          <p className="text-sm text-gray-700 dark:text-gray-300">
            {event.description}
          </p>

          <time className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(event.date).toLocaleDateString(
              'pt-BR',
            )}{' '}
            às{' '}
            {new Date(event.date).toLocaleTimeString(
              'pt-BR',
              {
                hour: '2-digit',
                minute: '2-digit',
              },
            )}
          </time>
        </li>
      ))}
    </ol>
  )
}