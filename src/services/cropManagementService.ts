import {
  CropManagement,
  CropManagementType,
} from '../types'
import { getStorageItem, setStorageItem, generateId } from './storage'
import {
  getCropCycleById,
  getCropCyclesByLandAreaId,
} from './cropService'
import { hasInventoryMovementByOrigin } from './inventoryService'

const CROP_MANAGEMENTS_KEY = 'agro360_crop_managements'
const INITIALIZED_KEY = 'agro360_crop_managements_initialized'

const CROP_MANAGEMENT_TYPES: CropManagementType[] = [
  'Adubação',
  'Irrigação',
  'Pulverização',
  'Capina',
  'Controle de plantas daninhas',
  'Controle de pragas',
  'Controle de doenças',
  'Manejo cultural',
  'Outro',
]

type CropManagementInput = Omit<
  CropManagement,
  'id' | 'createdAt' | 'updatedAt'
>

function initializeCropManagementsIfNeeded(): void {
  const initialized = getStorageItem<boolean>(INITIALIZED_KEY, false)

  if (!initialized) {
    setStorageItem(CROP_MANAGEMENTS_KEY, [])
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

function isValidCivilDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false

  const [year, month, day] = dateString.split('-').map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false
  }

  if (month < 1 || month > 12) return false

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

function isCropManagement(value: unknown): value is CropManagement {
  if (!value || typeof value !== 'object') return false

  const obj = value as Record<string, unknown>

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.cropCycleId) &&
    typeof obj.date === 'string' &&
    isValidCivilDate(obj.date) &&
    typeof obj.type === 'string' &&
    CROP_MANAGEMENT_TYPES.includes(obj.type as CropManagementType) &&
    isNonEmptyString(obj.description) &&
    isOptionalString(obj.productOrMaterial) &&
    isOptionalString(obj.doseOrQuantity) &&
    isOptionalString(obj.responsible) &&
    isOptionalString(obj.notes) &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  )
}

function validateAndNormalizeCropManagementInput(
  data: CropManagementInput
): CropManagementInput {
  const cropCycleId = data.cropCycleId.trim()

  if (!cropCycleId) {
    throw new Error('Cultivo é obrigatório.')
  }

  const cropCycle = getCropCycleById(cropCycleId)

  if (!cropCycle) {
    throw new Error('Cultivo não encontrado.')
  }

  const date = data.date.trim()

  if (!date) {
    throw new Error('Informe a data do manejo.')
  }

  if (!isValidCivilDate(date)) {
    throw new Error('Data do manejo inválida.')
  }

  if (!CROP_MANAGEMENT_TYPES.includes(data.type)) {
    throw new Error('Tipo de manejo inválido.')
  }

  const description = data.description.trim()

  if (!description) {
    throw new Error('Descrição é obrigatória.')
  }

  return {
    cropCycleId,
    date,
    type: data.type,
    description,
    productOrMaterial:
      data.productOrMaterial?.trim() || undefined,
    doseOrQuantity:
      data.doseOrQuantity?.trim() || undefined,
    responsible:
      data.responsible?.trim() || undefined,
    notes:
      data.notes?.trim() || undefined,
  }
}

export function getCropManagements(): CropManagement[] {
  initializeCropManagementsIfNeeded()

  const raw = getStorageItem<unknown>(
    CROP_MANAGEMENTS_KEY,
    []
  )

  if (!Array.isArray(raw)) return []

  return raw
    .filter(isCropManagement)
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)

      if (dateCompare !== 0) return dateCompare

      return b.createdAt.localeCompare(a.createdAt)
    })
}

export function getCropManagementById(
  id: string
): CropManagement | undefined {
  return getCropManagements().find(
    management => management.id === id
  )
}

export function getCropManagementsByCropCycleId(
  cropCycleId: string
): CropManagement[] {
  return getCropManagements().filter(
    management => management.cropCycleId === cropCycleId
  )
}

export function getCropManagementsByLandAreaId(
  landAreaId: string
): CropManagement[] {
  const cropCycles = getCropCyclesByLandAreaId(landAreaId)
  const cropCycleIds = new Set(cropCycles.map(cycle => cycle.id))

  return getCropManagements().filter(
    management => cropCycleIds.has(management.cropCycleId)
  )
}

export function createCropManagement(
  data: CropManagementInput
): CropManagement {
  initializeCropManagementsIfNeeded()

  const normalized =
    validateAndNormalizeCropManagementInput(data)

  const managements = getCropManagements()
  const now = new Date().toISOString()

  const newCropManagement: CropManagement = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  managements.push(newCropManagement)

  setStorageItem(
    CROP_MANAGEMENTS_KEY,
    managements
  )

  return newCropManagement
}

export function updateCropManagement(
  id: string,
  data: CropManagementInput
): CropManagement | undefined {
  const managements = getCropManagements()

  const index = managements.findIndex(
    management => management.id === id
  )

  if (index === -1) return undefined

  const oldManagement = managements[index]

  if (
    hasInventoryMovementByOrigin(
      'crops',
      'crop-management',
      id
    )
  ) {
    const protectedFieldsChanged =
      data.cropCycleId !== oldManagement.cropCycleId ||
      data.date !== oldManagement.date ||
      data.type !== oldManagement.type

    if (protectedFieldsChanged) {
      throw new Error(
        'Não é possível alterar os dados principais deste manejo porque ele possui baixa de estoque registrada.'
      )
    }
  }

  const normalized =
    validateAndNormalizeCropManagementInput(data)

  const updatedCropManagement: CropManagement = {
    ...normalized,
    id: oldManagement.id,
    createdAt: oldManagement.createdAt,
    updatedAt: new Date().toISOString(),
  }

  managements[index] = updatedCropManagement

  setStorageItem(
    CROP_MANAGEMENTS_KEY,
    managements
  )

  return updatedCropManagement
}

export function deleteCropManagement(id: string): boolean {
  if (
    hasInventoryMovementByOrigin(
      'crops',
      'crop-management',
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir este manejo porque ele possui baixa de estoque registrada.'
    )
  }

  const managements = getCropManagements()

  const filtered = managements.filter(
    management => management.id !== id
  )

  if (filtered.length === managements.length) {
    return false
  }

  setStorageItem(
    CROP_MANAGEMENTS_KEY,
    filtered
  )

  return true
}

export function getCropManagementsCount(): number {
  return getCropManagements().length
}

export function getCropManagementsCountByCropCycleId(
  cropCycleId: string
): number {
  return getCropManagementsByCropCycleId(cropCycleId).length
}

export function cropCycleHasManagementWithStockConsumption(
  cropCycleId: string
): boolean {
  const managements =
    getCropManagementsByCropCycleId(cropCycleId)

  return managements.some(
    management =>
      hasInventoryMovementByOrigin(
        'crops',
        'crop-management',
        management.id
      )
  )
}