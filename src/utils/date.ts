export function calculateAge(
  birthDate: string,
): string {
  const today = new Date()

  const birth = new Date(
    birthDate + 'T00:00:00',
  )

  let years =
    today.getFullYear() -
    birth.getFullYear()

  let months =
    today.getMonth() -
    birth.getMonth()

  if (
    today.getDate() <
    birth.getDate()
  ) {
    months--
  }

  if (months < 0) {
    years--
    months += 12
  }

  return `${years} ano(s) e ${months} mes(es)`
}

export function isFutureDate(
  dateString: string,
): boolean {
  const today = new Date()

  today.setHours(
    0,
    0,
    0,
    0,
  )

  const date = new Date(
    dateString + 'T00:00:00',
  )

  return date > today
}

export function isEndDateBeforeStartDate(
  startDate: string,
  endDate: string,
): boolean {
  return (
    new Date(
      endDate + 'T00:00:00',
    ) <
    new Date(
      startDate + 'T00:00:00',
    )
  )
}

export function formatDateToBR(
  dateString: string,
): string {
  return new Date(
    dateString + 'T00:00:00',
  ).toLocaleDateString('pt-BR')
}

export function todayDateString(): string {
  const today = new Date()

  const year =
    today.getFullYear()

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    today.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// -------------------- Cálculos civis adicionais (Etapa 7.4) --------------------

function parseCivilDate(
  dateString: string,
): Date {
  const [year, month, day] = dateString
    .split('-')
    .map(Number)

  return new Date(
    Date.UTC(year, month - 1, day),
  )
}

/**
 * Diferença em dias entre duas datas civis (YYYY-MM-DD).
 * Positivo se `to` for depois de `from`.
 */
export function diffDaysBetweenCivilDates(
  from: string,
  to: string,
): number {
  const a = parseCivilDate(from).getTime()
  const b = parseCivilDate(to).getTime()

  return Math.round(
    (b - a) / (1000 * 60 * 60 * 24),
  )
}

/**
 * Soma dias a uma data civil (YYYY-MM-DD).
 */
export function addDaysToCivilDate(
  dateString: string,
  days: number,
): string {
  const date = parseCivilDate(dateString)
  date.setUTCDate(date.getUTCDate() + days)

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export type ExpirationStatus =
  | 'Sem validade'
  | 'Vencido'
  | 'Vence em breve'
  | 'Válido'

/**
 * Status de validade de uma data civil, usando hoje como referência.
 *
 * - Sem data → 'Sem validade'
 * - data < hoje → 'Vencido'
 * - hoje <= data <= hoje + 30 dias → 'Vence em breve'
 * - data > hoje + 30 dias → 'Válido'
 */
export function getExpirationStatus(
  expirationDate: string | undefined,
): ExpirationStatus {
  if (!expirationDate) {
    return 'Sem validade'
  }

  const today = todayDateString()

  const daysUntil = diffDaysBetweenCivilDates(
    today,
    expirationDate,
  )

  if (daysUntil < 0) {
    return 'Vencido'
  }

  if (daysUntil <= 30) {
    return 'Vence em breve'
  }

  return 'Válido'
}