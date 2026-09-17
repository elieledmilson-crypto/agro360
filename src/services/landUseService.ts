import { LandUseRecord, LandUseType } from '../types'
import { getStorageItem, setStorageItem, generateId } from './storage'
import { getLandAreaById } from './landService'

const LAND_USE_RECORDS_KEY = 'agro360_land_use_records'
const INITIALIZED_KEY = 'agro360_land_use_records_initialized'

const VALID_LAND_USE_TYPES: LandUseType[] = [
  'Uso produtivo',
  'Descanso',
  'Recuperação',
  'Preservação',
  'Manutenção',
  'Outro',
]

type LandUseRecordInput =
  Omit<LandUseRecord, 'id' | 'createdAt' | 'updatedAt'>

function initializeLandUseRecordsIfNeeded(): void {
  const initialized = getStorageItem<boolean>(
    INITIALIZED_KEY,
    false
  )

  if (!initialized) {
    setStorageItem(LAND_USE_RECORDS_KEY, [])
    setStorageItem(INITIALIZED_KEY, true)
  }
}

function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  )
}

function isValidCivilDate(
  dateString: string
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false
  }

  const [year, month, day] = dateString
    .split('-')
    .map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false
  }

  if (month < 1 || month > 12) {
    return false
  }

  const daysInMonth = (() => {
    switch (month) {
      case 1:
        return 31

      case 2: {
        const isLeapYear =
          year % 400 === 0 ||
          (year % 4 === 0 && year % 100 !== 0)

        return isLeapYear ? 29 : 28
      }

      case 3:
        return 31

      case 4:
        return 30

      case 5:
        return 31

      case 6:
        return 30

      case 7:
        return 31

      case 8:
        return 31

      case 9:
        return 30

      case 10:
        return 31

      case 11:
        return 30

      case 12:
        return 31

      default:
        return 0
    }
  })()

  return day >= 1 && day <= daysInMonth
}

function isValidEndDate(
  startDate: string,
  endDate: unknown
): endDate is string | undefined {
  if (endDate === undefined) return true

  if (typeof endDate !== 'string') {
    return false
  }

  if (!isValidCivilDate(endDate)) {
    return false
  }

  return endDate >= startDate
}

function isLandUseRecord(
  value: unknown
): value is LandUseRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.landAreaId) &&
    typeof obj.type === 'string' &&
    VALID_LAND_USE_TYPES.includes(
      obj.type as LandUseType
    ) &&
    typeof obj.startDate === 'string' &&
    isValidCivilDate(obj.startDate) &&
    isValidEndDate(
      obj.startDate,
      obj.endDate
    ) &&
    (
      obj.description === undefined ||
      typeof obj.description === 'string'
    ) &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  )
}

function validateAndNormalizeLandUseRecordInput(
  data: LandUseRecordInput
): LandUseRecordInput {
  const landAreaId = data.landAreaId.trim()

  if (!landAreaId) {
    throw new Error('Área é obrigatória.')
  }

  const area = getLandAreaById(landAreaId)

  if (!area) {
    throw new Error('Área não encontrada.')
  }

  if (
    !VALID_LAND_USE_TYPES.includes(data.type)
  ) {
    throw new Error(
      'Tipo de utilização inválido.'
    )
  }

  const startDate = data.startDate.trim()

  if (!startDate) {
    throw new Error(
      'Data de início é obrigatória.'
    )
  }

  if (!isValidCivilDate(startDate)) {
    throw new Error(
      'Data de início inválida.'
    )
  }

  if (data.endDate !== undefined) {
    const endDate = data.endDate.trim()

    if (!isValidCivilDate(endDate)) {
      throw new Error(
        'Data de término inválida.'
      )
    }

    if (endDate < startDate) {
      throw new Error(
        'Data de término não pode ser anterior à data de início.'
      )
    }
  }

  return {
    landAreaId,
    type: data.type,
    startDate,
    endDate:
      data.endDate !== undefined
        ? data.endDate.trim()
        : undefined,
    description:
      data.description?.trim() || undefined,
  }
}

export function getLandUseRecords(): LandUseRecord[] {
  initializeLandUseRecordsIfNeeded()

  const raw = getStorageItem<unknown>(
    LAND_USE_RECORDS_KEY,
    []
  )

  if (!Array.isArray(raw)) return []

  return raw
    .filter(isLandUseRecord)
    .sort((a, b) => {
      const startCompare =
        b.startDate.localeCompare(a.startDate)

      if (startCompare !== 0) {
        return startCompare
      }

      return b.createdAt.localeCompare(
        a.createdAt
      )
    })
}

export function getLandUseRecordById(
  id: string
): LandUseRecord | undefined {
  return getLandUseRecords().find(
    record => record.id === id
  )
}

export function createLandUseRecord(
  data: LandUseRecordInput
): LandUseRecord {
  initializeLandUseRecordsIfNeeded()

  const normalized =
    validateAndNormalizeLandUseRecordInput(data)

  const records = getLandUseRecords()

  const now = new Date().toISOString()

  const newRecord: LandUseRecord = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  records.push(newRecord)

  setStorageItem(
    LAND_USE_RECORDS_KEY,
    records
  )

  return newRecord
}

export function updateLandUseRecord(
  id: string,
  data: LandUseRecordInput
): LandUseRecord | undefined {
  const records = getLandUseRecords()

  const index = records.findIndex(
    record => record.id === id
  )

  if (index === -1) return undefined

  const normalized =
    validateAndNormalizeLandUseRecordInput(data)

  const oldRecord = records[index]

  const updatedRecord: LandUseRecord = {
    ...normalized,
    id: oldRecord.id,
    createdAt: oldRecord.createdAt,
    updatedAt: new Date().toISOString(),
  }

  records[index] = updatedRecord

  setStorageItem(
    LAND_USE_RECORDS_KEY,
    records
  )

  return updatedRecord
}

export function deleteLandUseRecord(
  id: string
): boolean {
  const records = getLandUseRecords()

  const filtered = records.filter(
    record => record.id !== id
  )

  if (filtered.length === records.length) {
    return false
  }

  setStorageItem(
    LAND_USE_RECORDS_KEY,
    filtered
  )

  return true
}

export function getLandUseRecordsByLandAreaId(
  landAreaId: string
): LandUseRecord[] {
  return getLandUseRecords()
    .filter(
      record =>
        record.landAreaId === landAreaId
    )
    .sort((a, b) => {
      const startCompare =
        b.startDate.localeCompare(a.startDate)

      if (startCompare !== 0) {
        return startCompare
      }

      return b.createdAt.localeCompare(
        a.createdAt
      )
    })
}