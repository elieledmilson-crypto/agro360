import {
  MachineMaintenanceRecord,
  MachineMaintenanceType,
} from '../types'
import {
  getStorageItem,
  setStorageItem,
  generateId,
} from './storage'
import { getMachineById } from './machineService'
import { hasInventoryMovementByOrigin } from './inventoryService'

const MAINTENANCE_RECORDS_KEY =
  'agro360_machine_maintenance_records'

const INITIALIZED_KEY =
  'agro360_machine_maintenance_records_initialized'

const VALID_TYPES: MachineMaintenanceType[] = [
  'Preventiva',
  'Corretiva',
  'Inspeção',
  'Lubrificação',
  'Troca de óleo',
  'Troca de filtros',
  'Reparo',
  'Outro',
]

type MachineMaintenanceInput = Omit<
  MachineMaintenanceRecord,
  'id' | 'createdAt' | 'updatedAt'
>

function initializeMaintenanceRecordsIfNeeded(): void {
  const initialized = getStorageItem<boolean>(
    INITIALIZED_KEY,
    false
  )

  if (!initialized) {
    setStorageItem(
      MAINTENANCE_RECORDS_KEY,
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

function isOptionalString(
  value: unknown
): value is string | undefined {
  if (value === undefined) return true

  return typeof value === 'string'
}

function isOptionalNonNegativeNumber(
  value: unknown
): value is number | undefined {
  if (value === undefined) return true

  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0
  )
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
          (
            year % 4 === 0 &&
            year % 100 !== 0
          )

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

function isMachineMaintenanceRecord(
  value: unknown
): value is MachineMaintenanceRecord {
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
    typeof obj.maintenanceDate === 'string' &&
    isValidCivilDate(obj.maintenanceDate) &&
    typeof obj.type === 'string' &&
    VALID_TYPES.includes(
      obj.type as MachineMaintenanceType
    ) &&
    isOptionalNonNegativeNumber(
      obj.hourMeter
    ) &&
    isNonEmptyString(
      obj.servicePerformed
    ) &&
    isOptionalString(obj.responsible) &&
    isOptionalString(obj.notes) &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  )
}

function validateAndNormalizeMaintenanceInput(
  data: MachineMaintenanceInput
): MachineMaintenanceInput {
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

  const maintenanceDate =
    data.maintenanceDate.trim()

  if (!maintenanceDate) {
    throw new Error(
      'Informe a data da manutenção.'
    )
  }

  if (
    !isValidCivilDate(
      maintenanceDate
    )
  ) {
    throw new Error(
      'Data da manutenção inválida.'
    )
  }

  if (
    !VALID_TYPES.includes(
      data.type
    )
  ) {
    throw new Error(
      'Tipo de manutenção inválido.'
    )
  }

  const servicePerformed =
    data.servicePerformed.trim()

  if (!servicePerformed) {
    throw new Error(
      'Serviço realizado é obrigatório.'
    )
  }

  const hourMeter =
    data.hourMeter

  if (
    hourMeter !== undefined
  ) {
    if (
      typeof hourMeter !== 'number' ||
      !Number.isFinite(hourMeter) ||
      hourMeter < 0
    ) {
      throw new Error(
        'Horímetro da manutenção inválido.'
      )
    }
  }

  return {
    machineId,
    maintenanceDate,
    type: data.type,
    hourMeter,
    servicePerformed,
    responsible:
      data.responsible?.trim() || undefined,
    notes:
      data.notes?.trim() || undefined,
  }
}

function getRawMaintenanceEntries(): unknown[] {
  initializeMaintenanceRecordsIfNeeded()

  const raw =
    getStorageItem<unknown>(
      MAINTENANCE_RECORDS_KEY,
      []
    )

  return Array.isArray(raw)
    ? [...raw]
    : []
}

export function getMachineMaintenanceRecords():
  MachineMaintenanceRecord[] {
  initializeMaintenanceRecordsIfNeeded()

  const raw =
    getStorageItem<unknown>(
      MAINTENANCE_RECORDS_KEY,
      []
    )

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .filter(
      isMachineMaintenanceRecord
    )
    .sort((a, b) => {
      const dateCompare =
        b.maintenanceDate.localeCompare(
          a.maintenanceDate
        )

      if (dateCompare !== 0) {
        return dateCompare
      }

      return b.createdAt.localeCompare(
        a.createdAt
      )
    })
}

export function getMachineMaintenanceRecordById(
  id: string
): MachineMaintenanceRecord | undefined {
  return getMachineMaintenanceRecords().find(
    record => record.id === id
  )
}

export function getMachineMaintenanceRecordsByMachineId(
  machineId: string
): MachineMaintenanceRecord[] {
  return getMachineMaintenanceRecords().filter(
    record =>
      record.machineId === machineId
  )
}

export function createMachineMaintenanceRecord(
  data: MachineMaintenanceInput
): MachineMaintenanceRecord {
  const normalized =
    validateAndNormalizeMaintenanceInput(
      data
    )

  const rawEntries =
    getRawMaintenanceEntries()

  const now =
    new Date().toISOString()

  const newRecord:
    MachineMaintenanceRecord = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  rawEntries.push(
    newRecord
  )

  setStorageItem(
    MAINTENANCE_RECORDS_KEY,
    rawEntries
  )

  return newRecord
}

export function updateMachineMaintenanceRecord(
  id: string,
  data: MachineMaintenanceInput
): MachineMaintenanceRecord | undefined {
  const currentRecord =
    getMachineMaintenanceRecordById(
      id
    )

  if (!currentRecord) {
    return undefined
  }

  if (
    hasInventoryMovementByOrigin(
      'machines',
      'machine-maintenance',
      id
    )
  ) {
    const protectedFieldsChanged =
      data.machineId !==
        currentRecord.machineId ||
      data.maintenanceDate !==
        currentRecord.maintenanceDate ||
      data.type !==
        currentRecord.type

    if (protectedFieldsChanged) {
      throw new Error(
        'Não é possível alterar os dados principais desta manutenção porque ela possui baixa de estoque registrada.'
      )
    }
  }

  const normalized =
    validateAndNormalizeMaintenanceInput(
      data
    )

  const rawEntries =
    getRawMaintenanceEntries()

  const targetIndex =
    rawEntries.findIndex(
      item =>
        isMachineMaintenanceRecord(
          item
        ) &&
        item.id === id
    )

  if (
    targetIndex === -1
  ) {
    return undefined
  }

  const updatedRecord:
    MachineMaintenanceRecord = {
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
    MAINTENANCE_RECORDS_KEY,
    rawEntries
  )

  return updatedRecord
}

export function deleteMachineMaintenanceRecord(
  id: string
): boolean {
  if (
    hasInventoryMovementByOrigin(
      'machines',
      'machine-maintenance',
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir esta manutenção porque ela possui baixa de estoque registrada.'
    )
  }

  const rawEntries =
    getRawMaintenanceEntries()

  const targetIndex =
    rawEntries.findIndex(
      item =>
        isMachineMaintenanceRecord(
          item
        ) &&
        item.id === id
    )

  if (
    targetIndex === -1
  ) {
    return false
  }

  rawEntries.splice(
    targetIndex,
    1
  )

  setStorageItem(
    MAINTENANCE_RECORDS_KEY,
    rawEntries
  )

  return true
}

export function getMachineMaintenanceRecordsCount():
  number {
  return getMachineMaintenanceRecords().length
}

export function getMachineMaintenanceRecordsCountByMachineId(
  machineId: string
): number {
  return getMachineMaintenanceRecordsByMachineId(
    machineId
  ).length
}

export function getMachineMaintenanceRecordsByType(
  type: MachineMaintenanceType
): MachineMaintenanceRecord[] {
  return getMachineMaintenanceRecords().filter(
    record =>
      record.type === type
  )
}

export function machineHasMaintenanceWithStockConsumption(
  machineId: string
): boolean {
  const records =
    getMachineMaintenanceRecordsByMachineId(
      machineId
    )

  return records.some(
    record =>
      hasInventoryMovementByOrigin(
        'machines',
        'machine-maintenance',
        record.id
      )
  )
}