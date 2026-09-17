import { AnimalStatus } from '../../types'

interface Props {
  status: AnimalStatus
}

const statusStyles: Record<AnimalStatus, string> = {
  Ativo:
    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Vendido:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Morto:
    'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  Descartado:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Transferido:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

export default function AnimalStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}
    >
      {status}
    </span>
  )
}