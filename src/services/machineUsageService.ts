import {
  MachineUsageRecord,
  MachineOperationType,
} from '../types'
import {
  getStorageItem,
  setStorageItem,
  generateId,
} from './storage'
import { getMachineById } from './machineService'
import { getLandAreaById } from './landService'
import { getCropCycleById } from './cropService'

const MACHINE_USAGE_RECORDS_KEY =
  'agro360_machine_usage_records'

const INITIALIZED_KEY =
  'agro360_machine_usage_records_initialized'

const VALID_OPERATION_TYPES:
  MachineOperationType[] = [
  'Preparo do solo',
  'Plantio',
  'Semeadura',
  'Adubação',
  'Pulverização',
  'Colheita',
  'Roçada',
  'Irrigação',
  'Transporte',
  'Outro',
]

type MachineUsageInput = Omit<
  MachineUsageRecord,
  'id' | 'createdAt' | 'updatedAt'
>

function initializeMachineUsageRecordsIfNeeded(): void {
  const initialized =
    getStorageItem<boolean>(
      INITIALIZED_KEY,
      false
    )

  if (!initialized) {
    setStorageItem(
      MACHINE_USAGE_RECORDS_KEY,
      []
    )

    setStorageItem(
      INITIALIZED_KEY,
      true
    )
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

function isOptionalNonEmptyString(
  value: unknown
): value is string | undefined {
  if (value === undefined) return true

  return (
    typeof value === 'string' &&
    value.trim().length > 0
  )
}

function isOptionalString(
  value: unknown
): value is string | undefined {
  if (value === undefined) return true
  return typeof value === 'string'
}

function isValidCivilDate(
  dateString: string
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    return false
  }

  const [year, month, day] =
    dateString.split('-').map(Number)

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
          (year % 4 === 0 &&
            year % 100 !== 0)

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

  return (
    day >= 1 &&
    day <= daysInMonth
  )
}

function isMachineUsageRecord(
  value: unknown
): value is MachineUsageRecord {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return false
  }

  const obj =
    value as Record<string, unknown>

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.machineId) &&
    isNonEmptyString(obj.landAreaId) &&
    isOptionalNonEmptyString(
      obj.cropCycleId
    ) &&
    typeof obj.operationDate ===
      'string' &&
    isValidCivilDate(
      obj.operationDate
    ) &&
    typeof obj.operationType ===
      'string' &&
    VALID_OPERATION_TYPES.includes(
      obj.operationType as
        MachineOperationType
    ) &&
    typeof obj.workedHours ===
      'number' &&
    Number.isFinite(obj.workedHours) &&
    obj.workedHours > 0 &&
    isOptionalString(obj.notes) &&
    typeof obj.createdAt ===
      'string' &&
    typeof obj.updatedAt ===
      'string'
  )
}

function validateAndNormalizeMachineUsageInput(
  data: MachineUsageInput
): MachineUsageInput {
  const machineId =
    data.machineId.trim()

  if (!machineId) {
    throw new Error(
      'Máquina ou equipamento é obrigatório.'
    )
  }

  const machine =
    getMachineById(machineId)

  if (!machine) {
    throw new Error(
      'Máquina ou equipamento não encontrado.'
    )
  }

  const landAreaId =
    data.landAreaId.trim()

  if (!landAreaId) {
    throw new Error(
      'Talhão é obrigatório.'
    )
  }

  const landArea =
    getLandAreaById(landAreaId)

  if (!landArea) {
    throw new Error(
      'Talhão não encontrado.'
    )
  }

  if (landArea.type !== 'Talhão') {
    throw new Error(
      'A área selecionada deve ser um talhão.'
    )
  }

  let cropCycleId:
    string | undefined

  if (
    data.cropCycleId !== undefined
  ) {
    cropCycleId =
      data.cropCycleId.trim()

    if (!cropCycleId) {
      cropCycleId = undefined
    } else {
      const cropCycle =
        getCropCycleById(cropCycleId)

      if (!cropCycle) {
        throw new Error(
          'Cultivo não encontrado.'
        )
      }

      if (
        cropCycle.landAreaId !==
        landAreaId
      ) {
        throw new Error(
          'O cultivo selecionado não pertence ao talhão informado.'
        )
      }
    }
  }

  const operationDate =
    data.operationDate.trim()

  if (!operationDate) {
    throw new Error(
      'Informe a data da utilização.'
    )
  }

  if (
    !isValidCivilDate(operationDate)
  ) {
    throw new Error(
      'Data da utilização inválida.'
    )
  }

  if (
    !VALID_OPERATION_TYPES.includes(
      data.operationType
    )
  ) {
    throw new Error(
      'Tipo de operação inválido.'
    )
  }

  const workedHours =
    data.workedHours

  if (
    typeof workedHours !== 'number' ||
    !Number.isFinite(workedHours) ||
    workedHours <= 0
  ) {
    throw new Error(
      'Horas trabalhadas devem ser maiores que zero.'
    )
  }

  return {
    machineId,
    landAreaId,
    cropCycleId,
    operationDate,
    operationType:
      data.operationType,
    workedHours,
    notes:
      data.notes?.trim() || undefined,
  }
}

function getRawMachineUsageEntries():
  unknown[] {
  initializeMachineUsageRecordsIfNeeded()

  const raw =
    getStorageItem<unknown>(
      MACHINE_USAGE_RECORDS_KEY,
      []
    )

  return Array.isArray(raw)
    ? [...raw]
    : []
}

export function getMachineUsageRecords():
  MachineUsageRecord[] {
  initializeMachineUsageRecordsIfNeeded()

  const raw =
    getStorageItem<unknown>(
      MACHINE_USAGE_RECORDS_KEY,
      []
    )

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .filter(isMachineUsageRecord)
    .sort((a, b) => {
      const dateCompare =
        b.operationDate.localeCompare(
          a.operationDate
        )

      if (dateCompare !== 0) {
        return dateCompare
      }

      return b.createdAt.localeCompare(
        a.createdAt
      )
    })
}

export function getMachineUsageRecordById(
  id: string
): MachineUsageRecord | undefined {
  return getMachineUsageRecords().find(
    record => record.id === id
  )
}

export function getMachineUsageRecordsByMachineId(
  machineId: string
): MachineUsageRecord[] {
  return getMachineUsageRecords().filter(
    record =>
      record.machineId === machineId
  )
}

export function getMachineUsageRecordsByLandAreaId(
  landAreaId: string
): MachineUsageRecord[] {
  return getMachineUsageRecords().filter(
    record =>
      record.landAreaId === landAreaId
  )
}

export function getMachineUsageRecordsByCropCycleId(
  cropCycleId: string
): MachineUsageRecord[] {
  return getMachineUsageRecords().filter(
    record =>
      record.cropCycleId === cropCycleId
  )
}

export function createMachineUsageRecord(
  data: MachineUsageInput
): MachineUsageRecord {
  const normalized =
    validateAndNormalizeMachineUsageInput(
      data
    )

  const rawEntries =
    getRawMachineUsageEntries()

  const now =
    new Date().toISOString()

  const newRecord:
    MachineUsageRecord = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  rawEntries.push(newRecord)

  setStorageItem(
    MACHINE_USAGE_RECORDS_KEY,
    rawEntries
  )

  return newRecord
}

export function updateMachineUsageRecord(
  id: string,
  data: MachineUsageInput
): MachineUsageRecord | undefined {
  const currentRecord =
    getMachineUsageRecordById(id)

  if (!currentRecord) {
    return undefined
  }

  const normalized =
    validateAndNormalizeMachineUsageInput(
      data
    )

  const rawEntries =
    getRawMachineUsageEntries()

  const targetIndex =
    rawEntries.findIndex(
      item =>
        isMachineUsageRecord(item) &&
        item.id === id
    )

  if (targetIndex === -1) {
    return undefined
  }

  const updatedRecord:
    MachineUsageRecord = {
    ...normalized,
    id: currentRecord.id,
    createdAt:
      currentRecord.createdAt,
    updatedAt:
      new Date().toISOString(),
  }

  rawEntries[targetIndex] =
    updatedRecord

  setStorageItem(
    MACHINE_USAGE_RECORDS_KEY,
    rawEntries
  )

  return updatedRecord
}

export function deleteMachineUsageRecord(
  id: string
): boolean {
  const rawEntries =
    getRawMachineUsageEntries()

  const targetIndex =
    rawEntries.findIndex(
      item =>
        isMachineUsageRecord(item) &&
        item.id === id
    )

  if (targetIndex === -1) {
    return false
  }

  rawEntries.splice(targetIndex, 1)

  setStorageItem(
    MACHINE_USAGE_RECORDS_KEY,
    rawEntries
  )

  return true
}

export function getMachineUsageRecordsCount():
  number {
  return getMachineUsageRecords().length
}

export function getMachineUsageRecordsCountByMachineId(
  machineId: string
): number {
  return getMachineUsageRecordsByMachineId(
    machineId
  ).length
}

export function getMachineUsageRecordsCountByLandAreaId(
  landAreaId: string
): number {
  return getMachineUsageRecordsByLandAreaId(
    landAreaId
  ).length
}

export function getMachineUsageRecordsCountByCropCycleId(
  cropCycleId: string
): number {
  return getMachineUsageRecordsByCropCycleId(
    cropCycleId
  ).length
}

export function getMachineUsageRecordsByOperationType(
  operationType: MachineOperationType
): MachineUsageRecord[] {
  return getMachineUsageRecords().filter(
    record =>
      record.operationType ===
      operationType
  )
}