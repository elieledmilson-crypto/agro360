import { getExpirationStatus } from '../../utils/date'

interface Props {
  expirationDate?: string
}

export default function InventoryExpirationBadge({
  expirationDate,
}: Props) {
  const status =
    getExpirationStatus(
      expirationDate
    )

  if (
    status === 'Sem validade'
  ) {
    return null
  }

  const styles: Record<
    string,
    string
  > = {
    Vencido:
      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',

    'Vence em breve':
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',

    Válido:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  }

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
        styles[status] ?? ''
      }`}
    >
      {status}
    </span>
  )
}