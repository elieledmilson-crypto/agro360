import {
  RuralStructure,
  RuralStructureType,
  RuralStructureStatus,
  RuralStructureCondition,
  LandArea,
} from '../types'
import { getStorageItem, setStorageItem, generateId } from './storage'
import { getLandAreas } from './landService'

const STRUCTURES_KEY = 'agro360_rural_structures'
const INITIALIZED_KEY = 'agro360_rural_structures_initialized'

const VALID_TYPES: RuralStructureType[] = ['Cerca', 'Corredor', 'Porteira']
const VALID_STATUS: RuralStructureStatus[] = ['Em uso', 'Em manutenção', 'Inativa']
const VALID_CONDITIONS: RuralStructureCondition[] = ['Boa', 'Regular', 'Ruim']

type RuralStructureInput = Omit<RuralStructure, 'id' | 'createdAt' | 'updatedAt'>

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalNumber(value: unknown): value is number | undefined {
  if (value === undefined) return true
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isOptionalString(value: unknown): value is string | undefined {
  if (value === undefined) return true
  return typeof value === 'string'
}

function isRuralStructure(value: unknown): value is RuralStructure {
  if (!value || typeof value !== 'object') return false

  const obj = value as Record<string, unknown>

  return (
    typeof obj.id === 'string' &&
    isNonEmptyString(obj.code) &&
    isNonEmptyString(obj.name) &&
    typeof obj.type === 'string' &&
    VALID_TYPES.includes(obj.type as RuralStructureType) &&
    Array.isArray(obj.landAreaIds) &&
    obj.landAreaIds.every(id => typeof id === 'string') &&
    typeof obj.status === 'string' &&
    VALID_STATUS.includes(obj.status as RuralStructureStatus) &&
    typeof obj.condition === 'string' &&
    VALID_CONDITIONS.includes(obj.condition as RuralStructureCondition) &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string' &&
    isOptionalNumber(obj.lengthMeters) &&
    isOptionalNumber(obj.widthMeters) &&
    isOptionalString(obj.description)
  )
}

function initializeStructuresIfNeeded(): void {
  const initialized = getStorageItem<boolean>(INITIALIZED_KEY, false)

  if (!initialized) {
    setStorageItem(STRUCTURES_KEY, [])
    setStorageItem(INITIALIZED_KEY, true)
  }
}

function normalizeCode(code: string): string {
  return code.trim().toLowerCase()
}

function isDuplicateCode(code: string, excludeId?: string): boolean {
  const structures = getRuralStructures()
  const normalized = normalizeCode(code)

  return structures.some(
    structure =>
      normalizeCode(structure.code) === normalized &&
      structure.id !== excludeId
  )
}

function sanitizeLandAreaIds(landAreaIds: unknown): string[] {
  if (!Array.isArray(landAreaIds)) return []

  const existingAreaIds = new Set(getLandAreas().map(area => area.id))

  return Array.from(
    new Set(
      landAreaIds
        .filter((id): id is string => typeof id === 'string')
        .map(id => id.trim())
        .filter(id => id.length > 0)
    )
  ).filter(id => existingAreaIds.has(id))
}

function validateAndNormalizeStructureData(
  data: RuralStructureInput
): RuralStructureInput {
  const code = data.code.trim()

  if (!code) {
    throw new Error('Informe o código da estrutura.')
  }

  const name = data.name.trim()

  if (!name) {
    throw new Error('Informe o nome da estrutura.')
  }

  if (!VALID_TYPES.includes(data.type)) {
    throw new Error('Tipo de estrutura inválido.')
  }

  if (!VALID_STATUS.includes(data.status)) {
    throw new Error('Situação inválida.')
  }

  if (!VALID_CONDITIONS.includes(data.condition)) {
    throw new Error('Estado de conservação inválido.')
  }

  const lengthMeters = data.lengthMeters

  if (lengthMeters !== undefined) {
    if (!Number.isFinite(lengthMeters) || lengthMeters <= 0) {
      throw new Error('Comprimento deve ser maior que zero.')
    }
  }

  const widthMeters = data.widthMeters

  if (widthMeters !== undefined) {
    if (!Number.isFinite(widthMeters) || widthMeters <= 0) {
      throw new Error('Largura deve ser maior que zero.')
    }
  }

  return {
    code,
    name,
    type: data.type,
    landAreaIds: sanitizeLandAreaIds(data.landAreaIds),
    status: data.status,
    condition: data.condition,
    lengthMeters: lengthMeters ?? undefined,
    widthMeters: widthMeters ?? undefined,
    description: data.description?.trim() || undefined,
  }
}

export function getRuralStructures(): RuralStructure[] {
  initializeStructuresIfNeeded()

  const raw = getStorageItem<unknown>(STRUCTURES_KEY, [])

  if (!Array.isArray(raw)) return []

  return raw.filter(isRuralStructure)
}

export function getRuralStructureById(
  id: string
): RuralStructure | undefined {
  return getRuralStructures().find(structure => structure.id === id)
}

export function createRuralStructure(
  data: RuralStructureInput
): RuralStructure {
  initializeStructuresIfNeeded()

  const normalized = validateAndNormalizeStructureData(data)

  if (isDuplicateCode(normalized.code)) {
    throw new Error('Já existe uma estrutura com este código.')
  }

  const structures = getRuralStructures()
  const now = new Date().toISOString()

  const newStructure: RuralStructure = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  structures.push(newStructure)

  setStorageItem(STRUCTURES_KEY, structures)

  return newStructure
}

export function updateRuralStructure(
  id: string,
  data: RuralStructureInput
): RuralStructure | undefined {
  const structures = getRuralStructures()

  const index = structures.findIndex(
    structure => structure.id === id
  )

  if (index === -1) return undefined

  const normalized = validateAndNormalizeStructureData(data)

  if (isDuplicateCode(normalized.code, id)) {
    throw new Error('Já existe uma estrutura com este código.')
  }

  const oldStructure = structures[index]

  const updatedStructure: RuralStructure = {
    ...normalized,
    id: oldStructure.id,
    createdAt: oldStructure.createdAt,
    updatedAt: new Date().toISOString(),
  }

  structures[index] = updatedStructure

  setStorageItem(STRUCTURES_KEY, structures)

  return updatedStructure
}

export function deleteRuralStructure(id: string): boolean {
  const structures = getRuralStructures()

  const filtered = structures.filter(
    structure => structure.id !== id
  )

  if (filtered.length === structures.length) {
    return false
  }

  setStorageItem(STRUCTURES_KEY, filtered)

  return true
}

export function getRuralStructuresByLandAreaId(
  landAreaId: string
): RuralStructure[] {
  return getRuralStructures().filter(structure =>
    structure.landAreaIds.includes(landAreaId)
  )
}

export function getRuralStructureCountByType(
  type: RuralStructureType
): number {
  return getRuralStructures().filter(
    structure => structure.type === type
  ).length
}

export function getRuralStructureCountByStatus(
  status: RuralStructureStatus
): number {
  return getRuralStructures().filter(
    structure => structure.status === status
  ).length
}

export function getLandAreasForStructure(
  structure: RuralStructure
): LandArea[] {
  const areas = getLandAreas()

  return structure.landAreaIds
    .map(id => areas.find(area => area.id === id))
    .filter((area): area is LandArea => area !== undefined)
}