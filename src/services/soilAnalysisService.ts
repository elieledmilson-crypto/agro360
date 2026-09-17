import { SoilAnalysis } from '../types'
import {
  getStorageItem,
  setStorageItem,
  generateId,
} from './storage'
import { getLandAreaById } from './landService'

const SOIL_ANALYSES_KEY =
  'agro360_soil_analyses'

const INITIALIZED_KEY =
  'agro360_soil_analyses_initialized'

type SoilAnalysisInput = Omit<
  SoilAnalysis,
  'id' | 'createdAt' | 'updatedAt'
>

function initializeSoilAnalysesIfNeeded(): void {
  const initialized =
    getStorageItem<boolean>(
      INITIALIZED_KEY,
      false
    )

  if (!initialized) {
    setStorageItem(
      SOIL_ANALYSES_KEY,
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
          (year % 4 === 0 &&
            year % 100 !== 0)

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

function isOptionalNumberInRange(
  value: unknown,
  min: number,
  max: number
): value is number | undefined {
  if (value === undefined) {
    return true
  }

  if (
    typeof value !== 'number'
  ) {
    return false
  }

  return (
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  )
}

function isOptionalNonNegativeNumber(
  value: unknown
): value is number | undefined {
  if (value === undefined) {
    return true
  }

  if (
    typeof value !== 'number'
  ) {
    return false
  }

  return (
    Number.isFinite(value) &&
    value >= 0
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

function isSoilAnalysis(
  value: unknown
): value is SoilAnalysis {
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
    isNonEmptyString(
      obj.landAreaId
    ) &&
    typeof obj.sampleDate ===
      'string' &&
    isValidCivilDate(
      obj.sampleDate
    ) &&
    isOptionalString(
      obj.laboratory
    ) &&
    isOptionalString(
      obj.sampleCode
    ) &&
    isOptionalString(
      obj.sampleDepth
    ) &&
    isOptionalNumberInRange(
      obj.ph,
      0,
      14
    ) &&
    isOptionalNumberInRange(
      obj.organicMatter,
      0,
      100
    ) &&
    isOptionalNonNegativeNumber(
      obj.phosphorus
    ) &&
    isOptionalNonNegativeNumber(
      obj.potassium
    ) &&
    isOptionalNonNegativeNumber(
      obj.calcium
    ) &&
    isOptionalNonNegativeNumber(
      obj.magnesium
    ) &&
    isOptionalNonNegativeNumber(
      obj.aluminum
    ) &&
    isOptionalNonNegativeNumber(
      obj.cec
    ) &&
    isOptionalNumberInRange(
      obj.baseSaturation,
      0,
      100
    ) &&
    isOptionalNumberInRange(
      obj.aluminumSaturation,
      0,
      100
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

function validateAndNormalizeSoilAnalysisInput(
  data: SoilAnalysisInput
): SoilAnalysisInput {
  const landAreaId =
    data.landAreaId.trim()

  if (!landAreaId) {
    throw new Error(
      'Área é obrigatória.'
    )
  }

  const area =
    getLandAreaById(
      landAreaId
    )

  if (!area) {
    throw new Error(
      'Área não encontrada.'
    )
  }

  if (
    area.type !== 'Talhão'
  ) {
    throw new Error(
      'Somente áreas do tipo Talhão podem receber análises de solo.'
    )
  }

  const sampleDate =
    data.sampleDate.trim()

  if (!sampleDate) {
    throw new Error(
      'Informe a data da análise.'
    )
  }

  if (
    !isValidCivilDate(
      sampleDate
    )
  ) {
    throw new Error(
      'Data da análise inválida.'
    )
  }

  const validateRange = (
    value: number | undefined,
    min: number,
    max: number,
    errorMessage: string
  ): void => {
    if (
      value === undefined
    ) {
      return
    }

    if (
      !Number.isFinite(value) ||
      value < min ||
      value > max
    ) {
      throw new Error(
        errorMessage
      )
    }
  }

  const validateNonNegative = (
    value: number | undefined,
    errorMessage: string
  ): void => {
    if (
      value === undefined
    ) {
      return
    }

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new Error(
        errorMessage
      )
    }
  }

  validateRange(
    data.ph,
    0,
    14,
    'O pH deve estar entre 0 e 14.'
  )

  validateRange(
    data.organicMatter,
    0,
    100,
    'A matéria orgânica deve estar entre 0 e 100%.'
  )

  validateRange(
    data.baseSaturation,
    0,
    100,
    'A saturação por bases deve estar entre 0 e 100%.'
  )

  validateRange(
    data.aluminumSaturation,
    0,
    100,
    'A saturação por alumínio deve estar entre 0 e 100%.'
  )

  validateNonNegative(
    data.phosphorus,
    'O fósforo não pode ser negativo.'
  )

  validateNonNegative(
    data.potassium,
    'O potássio não pode ser negativo.'
  )

  validateNonNegative(
    data.calcium,
    'O cálcio não pode ser negativo.'
  )

  validateNonNegative(
    data.magnesium,
    'O magnésio não pode ser negativo.'
  )

  validateNonNegative(
    data.aluminum,
    'O alumínio não pode ser negativo.'
  )

  validateNonNegative(
    data.cec,
    'A CTC não pode ser negativa.'
  )

  return {
    landAreaId,
    sampleDate,
    laboratory:
      data.laboratory?.trim() ||
      undefined,
    sampleCode:
      data.sampleCode?.trim() ||
      undefined,
    sampleDepth:
      data.sampleDepth?.trim() ||
      undefined,
    ph: data.ph,
    organicMatter:
      data.organicMatter,
    phosphorus:
      data.phosphorus,
    potassium:
      data.potassium,
    calcium:
      data.calcium,
    magnesium:
      data.magnesium,
    aluminum:
      data.aluminum,
    cec: data.cec,
    baseSaturation:
      data.baseSaturation,
    aluminumSaturation:
      data.aluminumSaturation,
    notes:
      data.notes?.trim() ||
      undefined,
  }
}

export function getSoilAnalyses(): SoilAnalysis[] {
  initializeSoilAnalysesIfNeeded()

  const raw =
    getStorageItem<unknown>(
      SOIL_ANALYSES_KEY,
      []
    )

  if (
    !Array.isArray(raw)
  ) {
    return []
  }

  return raw
    .filter(isSoilAnalysis)
    .sort((a, b) => {
      const dateCompare =
        b.sampleDate.localeCompare(
          a.sampleDate
        )

      if (
        dateCompare !== 0
      ) {
        return dateCompare
      }

      return b.createdAt.localeCompare(
        a.createdAt
      )
    })
}

export function getSoilAnalysisById(
  id: string
): SoilAnalysis | undefined {
  return getSoilAnalyses().find(
    analysis =>
      analysis.id === id
  )
}

export function getSoilAnalysesByLandAreaId(
  landAreaId: string
): SoilAnalysis[] {
  return getSoilAnalyses().filter(
    analysis =>
      analysis.landAreaId ===
      landAreaId
  )
}

export function getLatestSoilAnalysisByLandAreaId(
  landAreaId: string
): SoilAnalysis | undefined {
  return getSoilAnalysesByLandAreaId(
    landAreaId
  )[0]
}

export function createSoilAnalysis(
  data: SoilAnalysisInput
): SoilAnalysis {
  initializeSoilAnalysesIfNeeded()

  const normalized =
    validateAndNormalizeSoilAnalysisInput(
      data
    )

  const analyses =
    getSoilAnalyses()

  const now =
    new Date().toISOString()

  const newSoilAnalysis:
    SoilAnalysis = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  analyses.push(
    newSoilAnalysis
  )

  setStorageItem(
    SOIL_ANALYSES_KEY,
    analyses
  )

  return newSoilAnalysis
}

export function updateSoilAnalysis(
  id: string,
  data: SoilAnalysisInput
): SoilAnalysis | undefined {
  const analyses =
    getSoilAnalyses()

  const index =
    analyses.findIndex(
      analysis =>
        analysis.id === id
    )

  if (index === -1) {
    return undefined
  }

  const normalized =
    validateAndNormalizeSoilAnalysisInput(
      data
    )

  const oldAnalysis =
    analyses[index]

  const updatedSoilAnalysis:
    SoilAnalysis = {
    ...normalized,
    id: oldAnalysis.id,
    createdAt:
      oldAnalysis.createdAt,
    updatedAt:
      new Date().toISOString(),
  }

  analyses[index] =
    updatedSoilAnalysis

  setStorageItem(
    SOIL_ANALYSES_KEY,
    analyses
  )

  return updatedSoilAnalysis
}

export function deleteSoilAnalysis(
  id: string
): boolean {
  const analyses =
    getSoilAnalyses()

  const filtered =
    analyses.filter(
      analysis =>
        analysis.id !== id
    )

  if (
    filtered.length ===
    analyses.length
  ) {
    return false
  }

  setStorageItem(
    SOIL_ANALYSES_KEY,
    filtered
  )

  return true
}

export function getSoilAnalysesCount(): number {
  return getSoilAnalyses().length
}