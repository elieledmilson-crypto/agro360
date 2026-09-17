import {
  Machine,
  MachineCategory,
  MachineStatus,
} from '../types'
import {
  getStorageItem,
  setStorageItem,
  generateId,
} from './storage'
import { hasInventoryMovementByOrigin } from './inventoryService'

const MACHINES_KEY =
  'agro360_machines'

const INITIALIZED_KEY =
  'agro360_machines_initialized'

const MAINTENANCE_RECORDS_KEY =
  'agro360_machine_maintenance_records'

const USAGE_RECORDS_KEY =
  'agro360_machine_usage_records'

const VALID_CATEGORIES:
  MachineCategory[] = [
  'Trator',
  'Colheitadeira',
  'Pulverizador',
  'Plantadeira',
  'Semeadora',
  'Grade',
  'Arado',
  'Roçadeira',
  'Distribuidor',
  'Implemento',
  'Veículo',
  'Outro',
]

const VALID_STATUSES:
  MachineStatus[] = [
  'Operacional',
  'Em manutenção',
  'Inativa',
]

type MachineInput = Omit<
  Machine,
  'id' | 'createdAt' | 'updatedAt'
>

function initializeMachinesIfNeeded(): void {
  const initialized =
    getStorageItem<boolean>(
      INITIALIZED_KEY,
      false
    )

  if (!initialized) {
    setStorageItem(
      MACHINES_KEY,
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
  if (value === undefined) {
    return true
  }

  return typeof value === 'string'
}

function isOptionalValidYear(
  value: unknown
): value is number | undefined {
  if (value === undefined) {
    return true
  }

  if (typeof value !== 'number') {
    return false
  }

  return (
    Number.isInteger(value) &&
    value >= 1900 &&
    value <= 2100
  )
}

function isOptionalNonNegativeNumber(
  value: unknown
): value is number | undefined {
  if (value === undefined) {
    return true
  }

  if (typeof value !== 'number') {
    return false
  }

  return (
    Number.isFinite(value) &&
    value >= 0
  )
}

function isMachine(
  value: unknown
): value is Machine {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return false
  }

  const obj =
    value as Record<
      string,
      unknown
    >

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.code) &&
    isNonEmptyString(obj.name) &&
    typeof obj.category ===
      'string' &&
    VALID_CATEGORIES.includes(
      obj.category as
        MachineCategory
    ) &&
    isOptionalString(
      obj.brand
    ) &&
    isOptionalString(
      obj.model
    ) &&
    isOptionalValidYear(
      obj.year
    ) &&
    isOptionalString(
      obj.identification
    ) &&
    isOptionalNonNegativeNumber(
      obj.hourMeter
    ) &&
    typeof obj.status ===
      'string' &&
    VALID_STATUSES.includes(
      obj.status as MachineStatus
    ) &&
    isOptionalString(
      obj.notes
    ) &&
    typeof obj.createdAt ===
      'string' &&
    typeof obj.updatedAt ===
      'string'
  )
}

function normalizeCode(
  code: string
): string {
  return code.trim().toUpperCase()
}

function isDuplicateCode(
  code: string,
  excludeId?: string
): boolean {
  const machines =
    getMachines()

  const normalized =
    normalizeCode(code)

  return machines.some(
    machine =>
      normalizeCode(
        machine.code
      ) === normalized &&
      machine.id !== excludeId
  )
}

function readRawArray(
  key: string
): Record<string, unknown>[] {
  const raw =
    getStorageItem<unknown>(
      key,
      []
    )

  if (!Array.isArray(raw)) {
    return []
  }

  return raw.filter(
    (
      item
    ): item is Record<
      string,
      unknown
    > =>
      !!item &&
      typeof item === 'object'
  )
}

function hasMaintenanceRecordsByMachineId(
  machineId: string
): boolean {
  return readRawArray(
    MAINTENANCE_RECORDS_KEY
  ).some(
    record =>
      typeof record.machineId ===
        'string' &&
      record.machineId ===
        machineId
  )
}

function hasUsageRecordsByMachineId(
  machineId: string
): boolean {
  return readRawArray(
    USAGE_RECORDS_KEY
  ).some(
    record =>
      typeof record.machineId ===
        'string' &&
      record.machineId ===
        machineId
  )
}

/**
 * Cascata: retorna true se alguma manutenção vinculada a esta máquina
 * possui baixa de estoque registrada.
 *
 * Implementado localmente para evitar dependência circular com
 * machineMaintenanceService (que importa machineService).
 */
function machineHasMaintenanceWithStockConsumption(
  machineId: string
): boolean {
  const records =
    readRawArray(
      MAINTENANCE_RECORDS_KEY
    )

  return records.some(record => {
    if (
      typeof record.machineId !==
        'string' ||
      record.machineId !==
        machineId
    ) {
      return false
    }

    if (
      typeof record.id !== 'string'
    ) {
      return false
    }

    return hasInventoryMovementByOrigin(
      'machines',
      'machine-maintenance',
      record.id
    )
  })
}

function validateAndNormalizeMachineInput(
  data: MachineInput
): MachineInput {
  const code =
    normalizeCode(data.code)

  if (!code) {
    throw new Error(
      'Código é obrigatório.'
    )
  }

  const name =
    data.name.trim()

  if (!name) {
    throw new Error(
      'Nome é obrigatório.'
    )
  }

  if (
    !VALID_CATEGORIES.includes(
      data.category
    )
  ) {
    throw new Error(
      'Categoria inválida.'
    )
  }

  if (
    !VALID_STATUSES.includes(
      data.status
    )
  ) {
    throw new Error(
      'Situação inválida.'
    )
  }

  const year = data.year

  if (year !== undefined) {
    if (
      typeof year !== 'number' ||
      !Number.isFinite(year) ||
      !Number.isInteger(year) ||
      year < 1900 ||
      year > 2100
    ) {
      throw new Error(
        'Ano inválido.'
      )
    }
  }

  const hourMeter =
    data.hourMeter

  if (hourMeter !== undefined) {
    if (
      typeof hourMeter !== 'number' ||
      !Number.isFinite(hourMeter) ||
      hourMeter < 0
    ) {
      throw new Error(
        'Horímetro inválido.'
      )
    }
  }

  return {
    code,
    name,
    category: data.category,
    brand:
      data.brand?.trim() ||
      undefined,
    model:
      data.model?.trim() ||
      undefined,
    year,
    identification:
      data.identification?.trim() ||
      undefined,
    hourMeter,
    status: data.status,
    notes:
      data.notes?.trim() ||
      undefined,
  }
}

export function getMachines():
  Machine[] {
  initializeMachinesIfNeeded()

  const raw =
    getStorageItem<unknown>(
      MACHINES_KEY,
      []
    )

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .filter(isMachine)
    .sort((a, b) => {
      const codeCompare =
        a.code.localeCompare(
          b.code
        )

      if (codeCompare !== 0) {
        return codeCompare
      }

      return a.name.localeCompare(
        b.name
      )
    })
}

export function getMachineById(
  id: string
): Machine | undefined {
  return getMachines().find(
    machine => machine.id === id
  )
}

export function getMachineByCode(
  code: string
): Machine | undefined {
  const normalized =
    normalizeCode(code)

  return getMachines().find(
    machine =>
      normalizeCode(
        machine.code
      ) === normalized
  )
}

export function createMachine(
  data: MachineInput
): Machine {
  initializeMachinesIfNeeded()

  const normalized =
    validateAndNormalizeMachineInput(
      data
    )

  if (
    isDuplicateCode(
      normalized.code
    )
  ) {
    throw new Error(
      'Já existe uma máquina ou equipamento com este código.'
    )
  }

  const machines =
    getMachines()

  const now =
    new Date().toISOString()

  const newMachine:
    Machine = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  machines.push(newMachine)

  setStorageItem(
    MACHINES_KEY,
    machines
  )

  return newMachine
}

export function updateMachine(
  id: string,
  data: MachineInput
): Machine | undefined {
  const machines =
    getMachines()

  const index =
    machines.findIndex(
      machine =>
        machine.id === id
    )

  if (index === -1) {
    return undefined
  }

  const normalized =
    validateAndNormalizeMachineInput(
      data
    )

  if (
    isDuplicateCode(
      normalized.code,
      id
    )
  ) {
    throw new Error(
      'Já existe uma máquina ou equipamento com este código.'
    )
  }

  const oldMachine =
    machines[index]

  const updatedMachine:
    Machine = {
    ...normalized,
    id: oldMachine.id,
    createdAt:
      oldMachine.createdAt,
    updatedAt:
      new Date().toISOString(),
  }

  machines[index] =
    updatedMachine

  setStorageItem(
    MACHINES_KEY,
    machines
  )

  return updatedMachine
}

export function deleteMachine(
  id: string
): boolean {
  const machines =
    getMachines()

  const machine =
    machines.find(
      item => item.id === id
    )

  if (!machine) {
    return false
  }

  // Cascata — proteção PRÉVIA, antes de qualquer escrita.
  // Manutenção com baixa de estoque bloqueia a exclusão da máquina.
  if (
    machineHasMaintenanceWithStockConsumption(
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir esta máquina ou equipamento porque possui manutenção com baixa de estoque registrada.'
    )
  }

  if (
    hasMaintenanceRecordsByMachineId(
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir esta máquina ou equipamento porque existem registros de manutenção vinculados.'
    )
  }

  if (
    hasUsageRecordsByMachineId(
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir esta máquina ou equipamento porque existem registros de utilização vinculados.'
    )
  }

  const filtered =
    machines.filter(
      item => item.id !== id
    )

  if (
    filtered.length ===
    machines.length
  ) {
    return false
  }

  setStorageItem(
    MACHINES_KEY,
    filtered
  )

  return true
}

export function getMachinesCount():
  number {
  return getMachines().length
}

export function getMachinesCountByStatus(
  status: MachineStatus
): number {
  return getMachines().filter(
    machine =>
      machine.status === status
  ).length
}

export function getMachinesByCategory(
  category: MachineCategory
): Machine[] {
  return getMachines().filter(
    machine =>
      machine.category ===
      category
  )
}