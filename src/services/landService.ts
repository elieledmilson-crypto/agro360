import {
  LandArea,
  LandAreaType,
  LandAreaStatus,
  PaddockOccupation,
} from '../types'
import {
  getStorageItem,
  setStorageItem,
  generateId,
} from './storage'

const LAND_AREAS_KEY =
  'agro360_land_areas'

const INITIALIZED_KEY =
  'agro360_land_areas_initialized'

const OCCUPATIONS_KEY =
  'agro360_paddock_occupations'

const STRUCTURES_KEY =
  'agro360_rural_structures'

const LAND_USE_RECORDS_KEY =
  'agro360_land_use_records'

const CROP_CYCLES_KEY =
  'agro360_crop_cycles'

const SOIL_ANALYSES_KEY =
  'agro360_soil_analyses'

const LAND_AREA_TYPES:
  LandAreaType[] = [
  'Piquete',
  'Talhão',
  'Pastagem',
  'Reserva/APP',
  'Infraestrutura',
  'Área ociosa',
  'Outro',
]

const LAND_AREA_STATUSES:
  LandAreaStatus[] = [
  'Em uso',
  'Em descanso',
  'Em recuperação',
  'Inativa',
]

type LandAreaInput = Omit<
  LandArea,
  'id' | 'createdAt' | 'updatedAt'
>

function initializeLandAreasIfNeeded(): void {
  const initialized =
    getStorageItem<boolean>(
      INITIALIZED_KEY,
      false
    )

  if (!initialized) {
    setStorageItem(
      LAND_AREAS_KEY,
      []
    )

    setStorageItem(
      INITIALIZED_KEY,
      true
    )
  }
}

function normalizeCode(
  code: string
): string {
  return code
    .trim()
    .toLowerCase()
}

function isDuplicateCode(
  code: string,
  excludeId?: string
): boolean {
  const areas =
    getLandAreas()

  const normalized =
    normalizeCode(code)

  return areas.some(
    area =>
      normalizeCode(
        area.code
      ) === normalized &&
      area.id !== excludeId
  )
}

function validateAndNormalizeLandAreaData(
  data: LandAreaInput
): LandAreaInput {
  const code =
    data.code.trim()

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
    !LAND_AREA_TYPES.includes(
      data.type
    )
  ) {
    throw new Error(
      'Tipo de área inválido.'
    )
  }

  if (
    !Number.isFinite(
      data.areaHectares
    ) ||
    data.areaHectares <= 0
  ) {
    throw new Error(
      'Área em hectares deve ser maior que zero.'
    )
  }

  if (
    !LAND_AREA_STATUSES.includes(
      data.status
    )
  ) {
    throw new Error(
      'Situação de área inválida.'
    )
  }

  const purpose =
    data.purpose?.trim() ||
    undefined

  const description =
    data.description?.trim() ||
    undefined

  return {
    code,
    name,
    type: data.type,
    areaHectares:
      data.areaHectares,
    purpose,
    status: data.status,
    description,
  }
}

function getOccupationsByLandAreaId(
  landAreaId: string
): PaddockOccupation[] {
  const raw =
    getStorageItem<
      PaddockOccupation[]
    >(
      OCCUPATIONS_KEY,
      []
    )

  if (!Array.isArray(raw)) {
    return []
  }

  return raw.filter(
    occ =>
      occ.landAreaId ===
      landAreaId
  )
}

function hasActiveOccupation(
  landAreaId: string
): boolean {
  return getOccupationsByLandAreaId(
    landAreaId
  ).some(
    occ => !occ.exitDate
  )
}

function hasLandUseRecordsByAreaId(
  landAreaId: string
): boolean {
  const raw =
    getStorageItem<unknown>(
      LAND_USE_RECORDS_KEY,
      []
    )

  if (!Array.isArray(raw)) {
    return false
  }

  return raw.some(item => {
    if (
      !item ||
      typeof item !== 'object'
    ) {
      return false
    }

    const record =
      item as Record<
        string,
        unknown
      >

    return (
      typeof record.landAreaId ===
        'string' &&
      record.landAreaId ===
        landAreaId
    )
  })
}

function hasCropCyclesByAreaId(
  landAreaId: string
): boolean {
  const raw =
    getStorageItem<unknown>(
      CROP_CYCLES_KEY,
      []
    )

  if (!Array.isArray(raw)) {
    return false
  }

  return raw.some(item => {
    if (
      !item ||
      typeof item !== 'object'
    ) {
      return false
    }

    const record =
      item as Record<
        string,
        unknown
      >

    return (
      typeof record.landAreaId ===
        'string' &&
      record.landAreaId ===
        landAreaId
    )
  })
}

function hasSoilAnalysesByAreaId(
  landAreaId: string
): boolean {
  const raw =
    getStorageItem<unknown>(
      SOIL_ANALYSES_KEY,
      []
    )

  if (!Array.isArray(raw)) {
    return false
  }

  return raw.some(item => {
    if (
      !item ||
      typeof item !== 'object'
    ) {
      return false
    }

    const record =
      item as Record<
        string,
        unknown
      >

    return (
      typeof record.landAreaId ===
        'string' &&
      record.landAreaId ===
        landAreaId
    )
  })
}

function removeLandAreaFromStructures(
  landAreaId: string
): void {
  const raw =
    getStorageItem<unknown>(
      STRUCTURES_KEY,
      []
    )

  if (!Array.isArray(raw)) {
    return
  }

  const updated = raw
    .filter(
      (
        item
      ): item is Record<
        string,
        unknown
      > =>
        !!item &&
        typeof item ===
          'object'
    )
    .map(item => {
      const landAreaIds =
        item.landAreaIds

      if (
        !Array.isArray(
          landAreaIds
        )
      ) {
        return item
      }

      const validIds =
        landAreaIds.filter(
          (
            id
          ): id is string =>
            typeof id ===
            'string'
        )

      if (
        !validIds.includes(
          landAreaId
        )
      ) {
        return item
      }

      return {
        ...item,
        landAreaIds:
          validIds.filter(
            id =>
              id !==
              landAreaId
          ),
        updatedAt:
          new Date().toISOString(),
      }
    })

  setStorageItem(
    STRUCTURES_KEY,
    updated
  )
}

export function getLandAreas(): LandArea[] {
  initializeLandAreasIfNeeded()

  const stored =
    getStorageItem<
      LandArea[]
    >(
      LAND_AREAS_KEY,
      []
    )

  return Array.isArray(stored)
    ? stored
    : []
}

export function getLandAreaById(
  id: string
): LandArea | undefined {
  return getLandAreas().find(
    area =>
      area.id === id
  )
}

export function getLandAreaByCode(
  code: string
): LandArea | undefined {
  const normalized =
    normalizeCode(code)

  return getLandAreas().find(
    area =>
      normalizeCode(
        area.code
      ) === normalized
  )
}

export function createLandArea(
  data: LandAreaInput
): LandArea {
  initializeLandAreasIfNeeded()

  const normalized =
    validateAndNormalizeLandAreaData(
      data
    )

  if (
    isDuplicateCode(
      normalized.code
    )
  ) {
    throw new Error(
      'Já existe uma área cadastrada com este código.'
    )
  }

  const areas =
    getLandAreas()

  const now =
    new Date().toISOString()

  const newArea: LandArea = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  areas.push(newArea)

  setStorageItem(
    LAND_AREAS_KEY,
    areas
  )

  return newArea
}

export function updateLandArea(
  id: string,
  data: LandAreaInput
): LandArea | undefined {
  const areas =
    getLandAreas()

  const index =
    areas.findIndex(
      area =>
        area.id === id
    )

  if (index === -1) {
    return undefined
  }

  const oldArea =
    areas[index]

  const normalized =
    validateAndNormalizeLandAreaData(
      data
    )

  if (
    isDuplicateCode(
      normalized.code,
      id
    )
  ) {
    throw new Error(
      'Já existe uma área cadastrada com este código.'
    )
  }

  if (
    oldArea.type ===
      'Piquete' &&
    normalized.type !==
      'Piquete'
  ) {
    const hasOccupationHistory =
      getOccupationsByLandAreaId(
        id
      ).length > 0

    if (
      hasOccupationHistory
    ) {
      throw new Error(
        'Não é possível alterar o tipo deste piquete porque existem registros de ocupação vinculados.'
      )
    }
  }

  if (
    hasActiveOccupation(id) &&
    (
      normalized.status ===
        'Inativa' ||
      normalized.status ===
        'Em recuperação'
    )
  ) {
    throw new Error(
      'Encerre a ocupação atual antes de alterar o piquete para esta situação.'
    )
  }

  if (
    oldArea.type ===
      'Talhão' &&
    normalized.type !==
      'Talhão'
  ) {
    const hasCropHistory =
      hasCropCyclesByAreaId(
        id
      )

    if (hasCropHistory) {
      throw new Error(
        'Não é possível alterar o tipo deste talhão porque existem registros de cultivo vinculados.'
      )
    }
  }

  if (
    oldArea.type ===
      'Talhão' &&
    normalized.type !==
      'Talhão'
  ) {
    const hasSoilHistory =
      hasSoilAnalysesByAreaId(
        id
      )

    if (hasSoilHistory) {
      throw new Error(
        'Não é possível alterar o tipo deste talhão porque existem análises de solo vinculadas.'
      )
    }
  }

  const updatedArea:
    LandArea = {
    ...normalized,
    id: oldArea.id,
    createdAt:
      oldArea.createdAt,
    updatedAt:
      new Date().toISOString(),
  }

  areas[index] =
    updatedArea

  setStorageItem(
    LAND_AREAS_KEY,
    areas
  )

  return updatedArea
}

export function deleteLandArea(
  id: string
): boolean {
  const areas =
    getLandAreas()

  const area =
    areas.find(
      a => a.id === id
    )

  if (!area) {
    return false
  }

  if (
    getOccupationsByLandAreaId(
      id
    ).length > 0
  ) {
    throw new Error(
      'Não é possível excluir este piquete porque existem registros de ocupação vinculados.'
    )
  }

  if (
    hasLandUseRecordsByAreaId(
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir esta área porque existem registros de utilização vinculados.'
    )
  }

  if (
    hasCropCyclesByAreaId(
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir este talhão porque existem registros de cultivo vinculados.'
    )
  }

  if (
    hasSoilAnalysesByAreaId(
      id
    )
  ) {
    throw new Error(
      'Não é possível excluir este talhão porque existem análises de solo vinculadas.'
    )
  }

  const filtered =
    areas.filter(
      area =>
        area.id !== id
    )

  if (
    filtered.length ===
    areas.length
  ) {
    return false
  }

  setStorageItem(
    LAND_AREAS_KEY,
    filtered
  )

  removeLandAreaFromStructures(
    id
  )

  return true
}

export function getLandAreaCount(): number {
  return getLandAreas().length
}

export function getTotalRegisteredHectares(): number {
  return getLandAreas().reduce(
    (sum, area) =>
      sum +
      area.areaHectares,
    0
  )
}