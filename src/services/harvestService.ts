import {
  HarvestRecord,
  HarvestProductionUnit,
} from '../types'
import {
  getStorageItem,
  setStorageItem,
  generateId,
} from './storage'
import {
  getCropCycleById,
  getCropCyclesByLandAreaId,
} from './cropService'
import { getLandAreaById } from './landService'

const HARVEST_RECORDS_KEY = 'agro360_harvest_records'
const INITIALIZED_KEY = 'agro360_harvest_records_initialized'

const VALID_UNITS: HarvestProductionUnit[] = ['kg', 't', 'sc']

type HarvestRecordInput = Omit<
  HarvestRecord,
  'id' | 'createdAt' | 'updatedAt'
>

function initializeHarvestRecordsIfNeeded(): void {
  const initialized = getStorageItem<boolean>(INITIALIZED_KEY, false)
  if (!initialized) {
    setStorageItem(HARVEST_RECORDS_KEY, [])
    setStorageItem(INITIALIZED_KEY, true)
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalString(value: unknown): value is string | undefined {
  if (value === undefined) return true
  return typeof value === 'string'
}

function isOptionalPositiveNumber(value: unknown): value is number | undefined {
  if (value === undefined) return true
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isValidCivilDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false

  const [year, month, day] = dateString.split('-').map(Number)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false
  }

  if (month < 1 || month > 12) return false

  const daysInMonth = (() => {
    switch (month) {
      case 1: return 31
      case 2: {
        const isLeapYear =
          year % 400 === 0 ||
          (year % 4 === 0 && year % 100 !== 0)
        return isLeapYear ? 29 : 28
      }
      case 3: return 31
      case 4: return 30
      case 5: return 31
      case 6: return 30
      case 7: return 31
      case 8: return 31
      case 9: return 30
      case 10: return 31
      case 11: return 30
      case 12: return 31
      default: return 0
    }
  })()

  return day >= 1 && day <= daysInMonth
}

function isHarvestRecord(value: unknown): value is HarvestRecord {
  if (!value || typeof value !== 'object') return false

  const obj = value as Record<string, unknown>

  if (
    !isNonEmptyString(obj.id) ||
    !isNonEmptyString(obj.cropCycleId) ||
    typeof obj.harvestDate !== 'string' ||
    !isValidCivilDate(obj.harvestDate) ||
    typeof obj.harvestedAreaHectares !== 'number' ||
    !Number.isFinite(obj.harvestedAreaHectares) ||
    obj.harvestedAreaHectares <= 0 ||
    typeof obj.productionQuantity !== 'number' ||
    !Number.isFinite(obj.productionQuantity) ||
    obj.productionQuantity <= 0 ||
    typeof obj.productionUnit !== 'string' ||
    !VALID_UNITS.includes(obj.productionUnit as HarvestProductionUnit) ||
    !isOptionalPositiveNumber(obj.sackWeightKg) ||
    !isOptionalString(obj.notes) ||
    typeof obj.createdAt !== 'string' ||
    typeof obj.updatedAt !== 'string'
  ) {
    return false
  }

  if (
    obj.productionUnit === 'sc' &&
    (obj.sackWeightKg === undefined || obj.sackWeightKg <= 0)
  ) {
    return false
  }

  return true
}

function validateAndNormalizeHarvestRecordInput(
  data: HarvestRecordInput,
  excludeId?: string
): HarvestRecordInput {
  const cropCycleId = data.cropCycleId.trim()
  if (!cropCycleId) {
    throw new Error('Cultivo é obrigatório.')
  }

  const cropCycle = getCropCycleById(cropCycleId)
  if (!cropCycle) {
    throw new Error('Cultivo não encontrado.')
  }

  const harvestDate = data.harvestDate.trim()
  if (!harvestDate) {
    throw new Error('Informe a data da colheita.')
  }

  if (!isValidCivilDate(harvestDate)) {
    throw new Error('Data da colheita inválida.')
  }

  if (
    cropCycle.plantingDate &&
    harvestDate < cropCycle.plantingDate
  ) {
    throw new Error(
      'A data da colheita não pode ser anterior à data de plantio.'
    )
  }

  const harvestedAreaHectares = data.harvestedAreaHectares

  if (
    !Number.isFinite(harvestedAreaHectares) ||
    harvestedAreaHectares <= 0
  ) {
    throw new Error('Área colhida deve ser maior que zero.')
  }

  const landArea = getLandAreaById(cropCycle.landAreaId)
  if (
    landArea &&
    harvestedAreaHectares > landArea.areaHectares
  ) {
    throw new Error(
      'A área colhida não pode ser maior que a área do talhão.'
    )
  }

  const productionQuantity = data.productionQuantity

  if (
    !Number.isFinite(productionQuantity) ||
    productionQuantity <= 0
  ) {
    throw new Error('Produção total deve ser maior que zero.')
  }

  if (!VALID_UNITS.includes(data.productionUnit)) {
    throw new Error('Unidade de produção inválida.')
  }

  const sackWeightKg = data.productionUnit === 'sc'
    ? data.sackWeightKg
    : undefined

  if (
    data.productionUnit === 'sc' &&
    (sackWeightKg === undefined ||
      !Number.isFinite(sackWeightKg) ||
      sackWeightKg <= 0)
  ) {
    throw new Error('Informe o peso da saca em kg.')
  }

  const existingHarvest = getHarvestRecordByCropCycleId(cropCycleId)
  if (existingHarvest && existingHarvest.id !== excludeId) {
    throw new Error('Este cultivo já possui um registro de colheita.')
  }

  return {
    cropCycleId,
    harvestDate,
    harvestedAreaHectares,
    productionQuantity,
    productionUnit: data.productionUnit,
    sackWeightKg,
    notes: data.notes?.trim() || undefined,
  }
}

export function getHarvestRecords(): HarvestRecord[] {
  initializeHarvestRecordsIfNeeded()
  const raw = getStorageItem<unknown>(HARVEST_RECORDS_KEY, [])

  if (!Array.isArray(raw)) return []

  return raw
    .filter(isHarvestRecord)
    .sort((a, b) => {
      const dateCompare = b.harvestDate.localeCompare(a.harvestDate)
      if (dateCompare !== 0) return dateCompare
      return b.createdAt.localeCompare(a.createdAt)
    })
}

export function getHarvestRecordById(id: string): HarvestRecord | undefined {
  return getHarvestRecords().find(record => record.id === id)
}

export function getHarvestRecordByCropCycleId(
  cropCycleId: string
): HarvestRecord | undefined {
  return getHarvestRecords().find(
    record => record.cropCycleId === cropCycleId
  )
}

export function getHarvestRecordsByLandAreaId(
  landAreaId: string
): HarvestRecord[] {
  const cropCycles = getCropCyclesByLandAreaId(landAreaId)
  const cropCycleIds = new Set(cropCycles.map(cycle => cycle.id))

  return getHarvestRecords().filter(record =>
    cropCycleIds.has(record.cropCycleId)
  )
}

export function createHarvestRecord(
  data: HarvestRecordInput
): HarvestRecord {
  initializeHarvestRecordsIfNeeded()

  const normalized = validateAndNormalizeHarvestRecordInput(data)

  const records = getHarvestRecords()
  const now = new Date().toISOString()

  const newHarvestRecord: HarvestRecord = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  records.push(newHarvestRecord)
  setStorageItem(HARVEST_RECORDS_KEY, records)
  return newHarvestRecord
}

export function updateHarvestRecord(
  id: string,
  data: HarvestRecordInput
): HarvestRecord | undefined {
  const records = getHarvestRecords()
  const index = records.findIndex(record => record.id === id)
  if (index === -1) return undefined

  const normalized = validateAndNormalizeHarvestRecordInput(data, id)

  const oldRecord = records[index]

  const updatedHarvestRecord: HarvestRecord = {
    ...normalized,
    id: oldRecord.id,
    createdAt: oldRecord.createdAt,
    updatedAt: new Date().toISOString(),
  }

  records[index] = updatedHarvestRecord
  setStorageItem(HARVEST_RECORDS_KEY, records)
  return updatedHarvestRecord
}

export function deleteHarvestRecord(id: string): boolean {
  const records = getHarvestRecords()
  const filtered = records.filter(record => record.id !== id)
  if (filtered.length === records.length) return false
  setStorageItem(HARVEST_RECORDS_KEY, filtered)
  return true
}

export function getHarvestRecordsCount(): number {
  return getHarvestRecords().length
}

// -------------------- Helpers de cálculo --------------------

export function getHarvestProductionKg(record: HarvestRecord): number {
  switch (record.productionUnit) {
    case 'kg':
      return record.productionQuantity
    case 't':
      return record.productionQuantity * 1000
    case 'sc': {
      if (!record.sackWeightKg) return 0
      return record.productionQuantity * record.sackWeightKg
    }
    default:
      return 0
  }
}

export function getHarvestProductivityKgPerHectare(
  record: HarvestRecord
): number {
  const productionKg = getHarvestProductionKg(record)

  if (
    !Number.isFinite(record.harvestedAreaHectares) ||
    record.harvestedAreaHectares <= 0
  ) {
    return 0
  }

  return productionKg / record.harvestedAreaHectares
}

export function getHarvestProductivityInOriginalUnitPerHectare(
  record: HarvestRecord
): number {
  if (
    !Number.isFinite(record.harvestedAreaHectares) ||
    record.harvestedAreaHectares <= 0
  ) {
    return 0
  }

  return record.productionQuantity / record.harvestedAreaHectares
}