import {
  CropCycle,
  CropCycleStatus,
} from '../types'
import {
  getStorageItem,
  setStorageItem,
  generateId,
} from './storage'
import { getLandAreaById } from './landService'
import { hasInventoryMovementByOrigin } from './inventoryService'

const CROP_CYCLES_KEY =
  'agro360_crop_cycles'

const INITIALIZED_KEY =
  'agro360_crop_cycles_initialized'

const CROP_MANAGEMENTS_KEY =
  'agro360_crop_managements'

const HARVEST_RECORDS_KEY =
  'agro360_harvest_records'

const MACHINE_USAGE_RECORDS_KEY =
  'agro360_machine_usage_records'

const VALID_STATUS:
  CropCycleStatus[] = [
  'Planejado',
  'Em andamento',
  'Concluído',
  'Cancelado',
]

type CropCycleInput = Omit<
  CropCycle,
  'id' | 'createdAt' | 'updatedAt'
>

function initializeCropCyclesIfNeeded(): void {
  const initialized =
    getStorageItem<boolean>(
      INITIALIZED_KEY,
      false
    )

  if (!initialized) {
    setStorageItem(
      CROP_CYCLES_KEY,
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

function isValidCivilDate(
  dateString: string
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateString
    )
  ) {
    return false
  }

  const [year, month, day] =
    dateString
      .split('-')
      .map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false
  }

  if (
    month < 1 ||
    month > 12
  ) {
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

        return isLeapYear
          ? 29
          : 28
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

function isOptionalValidDate(
  value: unknown
): value is string | undefined {
  if (value === undefined) {
    return true
  }

  if (
    typeof value !== 'string'
  ) {
    return false
  }

  return isValidCivilDate(
    value
  )
}

function isCropCycle(
  value: unknown
): value is CropCycle {
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

  const plantingDateValid =
    isOptionalValidDate(
      obj.plantingDate
    )

  const expectedHarvestDateValid =
    isOptionalValidDate(
      obj.expectedHarvestDate
    )

  if (
    !plantingDateValid ||
    !expectedHarvestDateValid
  ) {
    return false
  }

  const plantingDate =
    obj.plantingDate as
      | string
      | undefined

  const expectedHarvestDate =
    obj.expectedHarvestDate as
      | string
      | undefined

  if (
    plantingDate !== undefined &&
    expectedHarvestDate !== undefined &&
    expectedHarvestDate <
      plantingDate
  ) {
    return false
  }

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(
      obj.landAreaId
    ) &&
    isNonEmptyString(obj.crop) &&
    (
      obj.cultivar === undefined ||
      typeof obj.cultivar ===
        'string'
    ) &&
    isNonEmptyString(
      obj.season
    ) &&
    typeof obj.status ===
      'string' &&
    VALID_STATUS.includes(
      obj.status as
        CropCycleStatus
    ) &&
    (
      obj.notes === undefined ||
      typeof obj.notes ===
        'string'
    ) &&
    typeof obj.createdAt ===
      'string' &&
    typeof obj.updatedAt ===
      'string'
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

function hasCropManagementsByCropCycleId(
  cropCycleId: string
): boolean {
  return readRawArray(
    CROP_MANAGEMENTS_KEY
  ).some(
    record =>
      typeof record.cropCycleId ===
        'string' &&
      record.cropCycleId ===
        cropCycleId
  )
}

function hasHarvestRecordByCropCycleId(
  cropCycleId: string
): boolean {
  return readRawArray(
    HARVEST_RECORDS_KEY
  ).some(
    record =>
      typeof record.cropCycleId ===
        'string' &&
      record.cropCycleId ===
        cropCycleId
  )
}

function hasMachineUsageByCropCycleId(
  cropCycleId: string
): boolean {
  return readRawArray(
    MACHINE_USAGE_RECORDS_KEY
  ).some(
    record =>
      typeof record.cropCycleId ===
        'string' &&
      record.cropCycleId ===
        cropCycleId
  )
}

/**
 * Cascata: retorna true se algum manejo vinculado a este ciclo agrícola
 * possui baixa de estoque registrada.
 *
 * Implementado localmente para evitar dependência circular com
 * cropManagementService (que importa cropService).
 */
function cropCycleHasManagementWithStockConsumption(
  cropCycleId: string
): boolean {
  const managements =
    readRawArray(
      CROP_MANAGEMENTS_KEY
    )

  return managements.some(
    record => {
      if (
        typeof record.cropCycleId !==
          'string' ||
        record.cropCycleId !==
          cropCycleId
      ) {
        return false
      }

      if (
        typeof record.id !== 'string'
      ) {
        return false
      }

      return hasInventoryMovementByOrigin(
        'crops',
        'crop-management',
        record.id
      )
    }
  )
}

function validateAndNormalizeCropCycleInput(
  data: CropCycleInput,
  excludeId?: string
): CropCycleInput {
  const landAreaId =
    data.landAreaId.trim()

  if (!landAreaId) {
    throw new Error(
      'Área é obrigatória.'
    )
  }

  const area =
    getLandAreaById(landAreaId)

  if (!area) {
    throw new Error(
      'Área não encontrada.'
    )
  }

  if (area.type !== 'Talhão') {
    throw new Error(
      'Somente áreas do tipo Talhão podem receber cultivos.'
    )
  }

  const crop =
    data.crop.trim()

  if (!crop) {
    throw new Error(
      'Informe a cultura.'
    )
  }

  const season =
    data.season.trim()

  if (!season) {
    throw new Error(
      'Informe a safra.'
    )
  }

  if (
    !VALID_STATUS.includes(
      data.status
    )
  ) {
    throw new Error(
      'Situação inválida.'
    )
  }

  const plantingDate =
    data.plantingDate?.trim() ||
    undefined

  const expectedHarvestDate =
    data.expectedHarvestDate?.trim() ||
    undefined

  if (
    plantingDate !== undefined &&
    !isValidCivilDate(
      plantingDate
    )
  ) {
    throw new Error(
      'Data de plantio inválida.'
    )
  }

  if (
    expectedHarvestDate !==
      undefined &&
    !isValidCivilDate(
      expectedHarvestDate
    )
  ) {
    throw new Error(
      'Previsão de colheita inválida.'
    )
  }

  if (
    plantingDate !== undefined &&
    expectedHarvestDate !== undefined &&
    expectedHarvestDate <
      plantingDate
  ) {
    throw new Error(
      'A previsão de colheita não pode ser anterior à data de plantio.'
    )
  }

  if (
    data.status ===
    'Em andamento'
  ) {
    const active =
      getActiveCropCycleByLandAreaId(
        landAreaId
      )

    if (
      active &&
      active.id !== excludeId
    ) {
      throw new Error(
        'Este talhão já possui um cultivo em andamento.'
      )
    }
  }

  return {
    landAreaId,
    crop,
    cultivar:
      data.cultivar?.trim() ||
      undefined,
    season,
    status: data.status,
    plantingDate,
    expectedHarvestDate,
    notes:
      data.notes?.trim() ||
      undefined,
  }
}

export function getCropCycles():
  CropCycle[] {
  initializeCropCyclesIfNeeded()

  const raw =
    getStorageItem<unknown>(
      CROP_CYCLES_KEY,
      []
    )

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .filter(isCropCycle)
    .sort((a, b) => {
      const aDate =
        a.plantingDate ?? ''

      const bDate =
        b.plantingDate ?? ''

      if (aDate !== bDate) {
        return bDate.localeCompare(
          aDate
        )
      }

      return b.createdAt.localeCompare(
        a.createdAt
      )
    })
}

export function getCropCycleById(
  id: string
): CropCycle | undefined {
  return getCropCycles().find(
    crop => crop.id === id
  )
}

export function getCropCyclesByLandAreaId(
  landAreaId: string
): CropCycle[] {
  return getCropCycles().filter(
    crop =>
      crop.landAreaId ===
      landAreaId
  )
}

export function getActiveCropCycleByLandAreaId(
  landAreaId: string
): CropCycle | undefined {
  return getCropCycles().find(
    crop =>
      crop.landAreaId ===
        landAreaId &&
      crop.status ===
        'Em andamento'
  )
}

export function createCropCycle(
  data: CropCycleInput
): CropCycle {
  initializeCropCyclesIfNeeded()

  const normalized =
    validateAndNormalizeCropCycleInput(
      data
    )

  const cycles =
    getCropCycles()

  const now =
    new Date().toISOString()

  const newCropCycle:
    CropCycle = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  cycles.push(newCropCycle)

  setStorageItem(
    CROP_CYCLES_KEY,
    cycles
  )

  return newCropCycle
}

export function updateCropCycle(
  id: string,
  data: CropCycleInput
): CropCycle | undefined {
  const cycles =
    getCropCycles()

  const index =
    cycles.findIndex(
      cycle =>
        cycle.id === id
    )

  if (index === -1) {
    return undefined
  }

  const oldCycle =
    cycles[index]

  const normalized =
    validateAndNormalizeCropCycleInput(
      data,
      id
    )

  if (
    oldCycle.landAreaId !==
      normalized.landAreaId &&
    hasCropManagementsByCropCycleId(
      id
    )
  ) {
    throw new Error(
      'Não é possível alterar o talhão deste cultivo porque existem registros de manejo vinculados.'
    )
  }

  if (
    oldCycle.landAreaId !==
      normalized.landAreaId &&
    hasHarvestRecordByCropCycleId(
      id
    )
  ) {
    throw new Error(
      'Não é possível alterar o talhão deste cultivo porque existe registro de colheita vinculado.'
    )
  }

  if (
    oldCycle.landAreaId !==
      normalized.landAreaId &&
    hasMachineUsageByCropCycleId(
      id
    )
  ) {
    throw new Error(
      'Não é possível alterar o talhão deste cultivo porque existem registros de utilização de máquinas vinculados.'
    )
  }

  const updatedCropCycle:
    CropCycle = {
    ...normalized,
    id: oldCycle.id,
    createdAt:
      oldCycle.createdAt,
    updatedAt:
      new Date().toISOString(),
  }

  cycles[index] =
    updatedCropCycle

  setStorageItem(
    CROP_CYCLES_KEY,
    cycles
  )

  return updatedCropCycle
}

export function deleteCropCycle(
  id: string
): boolean {
  const cycles =
    getCropCycles()

  const cycle =
    cycles.find(
      item => item.id === id
    )

  if (!cycle) {
    return false
  }

  // Cascata — proteção PRÉVIA, antes de qualquer escrita.
  // Manejo com baixa de estoque bloqueia a exclusão do ciclo.
  if (
    cropCycleHasManagementWithStockConsumption(
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir este cultivo porque ele possui manejo com baixa de estoque registrada.'
    )
  }

  if (
    hasCropManagementsByCropCycleId(
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir este cultivo porque existem registros de manejo vinculados.'
    )
  }

  if (
    hasHarvestRecordByCropCycleId(
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir este cultivo porque existe registro de colheita vinculado.'
    )
  }

  if (
    hasMachineUsageByCropCycleId(
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir este cultivo porque existem registros de utilização de máquinas vinculados.'
    )
  }

  const filtered =
    cycles.filter(
      item => item.id !== id
    )

  if (
    filtered.length ===
    cycles.length
  ) {
    return false
  }

  setStorageItem(
    CROP_CYCLES_KEY,
    filtered
  )

  return true
}

export function getActiveCropCyclesCount():
  number {
  return getCropCycles().filter(
    cycle =>
      cycle.status ===
      'Em andamento'
  ).length
}