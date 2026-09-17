export function formatDate(
  dateString: string,
): string {
  const date = new Date(
    dateString + 'T00:00:00',
  )

  return date.toLocaleDateString(
    'pt-BR',
  )
}

export function formatCurrencyBRL(
  value: number,
): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}