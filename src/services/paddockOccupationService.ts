import { PaddockOccupation, Animal } from '../types'
import { getStorageItem, setStorageItem, generateId } from './storage'
import { getLandAreas } from './landService'
import { getLotById } from './lotService'
import { getAnimals } from './animalService'

const OCCUPATIONS_KEY = 'agro360_paddock_occupations'
const INITIALIZED_KEY = 'agro360_paddock_occupations_initialized'

function initializeOccupationsIfNeeded(): void {
  const initialized = getStorageItem<boolean>(INITIALIZED_KEY, false)
  if (!initialized) {
    setStorageItem(OCCUPATIONS_KEY, [])
    setStorageItem(INITIALIZED_KEY, true)
  }
}

function isValidDateString(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false

  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function normalizeDate(dateString: string): string {
  const trimmed = dateString.trim()
  if (!isValidDateString(trimmed)) {
    throw new Error('Data inválida. Use o formato YYYY-MM-DD.')
  }
  return trimmed
}

function parseDateToUTC(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function todayLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isFutureDate(dateString: string): boolean {
  return parseDateToUTC(dateString).getTime() > parseDateToUTC(todayLocalDateString()).getTime()
}

function isEndBeforeStart(startDate: string, endDate: string): boolean {
  return parseDateToUTC(endDate).getTime() < parseDateToUTC(startDate).getTime()
}

function getActiveOccupations(): PaddockOccupation[] {
  return getPaddockOccupations().filter(occ => !occ.exitDate)
}

function getAnimalsByLotId(lotId: string): Animal[] {
  return getAnimals().filter(animal => animal.lotId === lotId)
}

function validateStartOccupation(data: {
  landAreaId: string
  lotId: string
  entryDate: string
  notes?: string
}): {
  landAreaId: string
  lotId: string
  entryDate: string
  notes?: string
} {
  const landAreaId = data.landAreaId.trim()
  if (!landAreaId) {
    throw new Error('Piquete é obrigatório.')
  }

  const lotId = data.lotId.trim()
  if (!lotId) {
    throw new Error('Lote é obrigatório.')
  }

  const entryDate = normalizeDate(data.entryDate)

  if (isFutureDate(entryDate)) {
    throw new Error('Data de entrada não pode ser futura.')
  }

  const area = getLandAreas().find(a => a.id === landAreaId)
  if (!area) {
    throw new Error('Área não encontrada.')
  }

  if (area.type !== 'Piquete') {
    throw new Error('Somente áreas do tipo Piquete podem receber ocupação.')
  }

  if (area.status === 'Inativa' || area.status === 'Em recuperação') {
    throw new Error('Este piquete não está disponível para ocupação devido à sua situação atual.')
  }

  const lot = getLotById(lotId)
  if (!lot) {
    throw new Error('Lote não encontrado.')
  }

  const activeAreaOccupation = getActiveOccupations().find(occ => occ.landAreaId === landAreaId)
  if (activeAreaOccupation) {
    throw new Error('Este piquete já possui ocupação ativa.')
  }

  const activeLotOccupation = getActiveOccupations().find(occ => occ.lotId === lotId)
  if (activeLotOccupation) {
    throw new Error('Este lote já possui ocupação ativa.')
  }

  return {
    landAreaId,
    lotId,
    entryDate,
    notes: data.notes?.trim() || undefined,
  }
}

export function getPaddockOccupations(): PaddockOccupation[] {
  initializeOccupationsIfNeeded()
  const raw = getStorageItem<PaddockOccupation[]>(OCCUPATIONS_KEY, [])
  return Array.isArray(raw) ? raw : []
}

export function getPaddockOccupationById(id: string): PaddockOccupation | undefined {
  return getPaddockOccupations().find(occ => occ.id === id)
}

export function getActivePaddockOccupations(): PaddockOccupation[] {
  return getPaddockOccupations()
    .filter(occ => !occ.exitDate)
    .sort((a, b) => parseDateToUTC(b.entryDate).getTime() - parseDateToUTC(a.entryDate).getTime())
}

export function getActiveOccupationByLandAreaId(landAreaId: string): PaddockOccupation | undefined {
  return getActivePaddockOccupations().find(occ => occ.landAreaId === landAreaId)
}

export function getActiveOccupationByLotId(lotId: string): PaddockOccupation | undefined {
  return getActivePaddockOccupations().find(occ => occ.lotId === lotId)
}

export function getOccupationHistoryByLandAreaId(landAreaId: string): PaddockOccupation[] {
  return getPaddockOccupations()
    .filter(occ => occ.landAreaId === landAreaId && occ.exitDate)
    .sort((a, b) => (b.exitDate ?? b.entryDate).localeCompare(a.exitDate ?? a.entryDate))
}

export function getOccupationHistoryByLotId(lotId: string): PaddockOccupation[] {
  return getPaddockOccupations()
    .filter(occ => occ.lotId === lotId && occ.exitDate)
    .sort((a, b) => (b.exitDate ?? b.entryDate).localeCompare(a.exitDate ?? a.entryDate))
}

export function startPaddockOccupation(data: {
  landAreaId: string
  lotId: string
  entryDate: string
  notes?: string
}): PaddockOccupation {
  const normalized = validateStartOccupation(data)

  const occupations = getPaddockOccupations()
  const now = new Date().toISOString()

  const newOccupation: PaddockOccupation = {
    id: generateId(),
    landAreaId: normalized.landAreaId,
    lotId: normalized.lotId,
    entryDate: normalized.entryDate,
    notes: normalized.notes,
    createdAt: now,
    updatedAt: now,
  }

  occupations.push(newOccupation)
  setStorageItem(OCCUPATIONS_KEY, occupations)
  return newOccupation
}

export function finishPaddockOccupation(id: string, exitDate: string): PaddockOccupation | undefined {
  const occupations = getPaddockOccupations()
  const index = occupations.findIndex(occ => occ.id === id)
  if (index === -1) {
    throw new Error('Ocupação não encontrada.')
  }

  const occupation = occupations[index]
  if (occupation.exitDate) {
    throw new Error('Esta ocupação já foi encerrada.')
  }

  const normalizedExitDate = normalizeDate(exitDate)

  if (isFutureDate(normalizedExitDate)) {
    throw new Error('Data de saída não pode ser futura.')
  }

  if (isEndBeforeStart(occupation.entryDate, normalizedExitDate)) {
    throw new Error('Data de saída não pode ser anterior à data de entrada.')
  }

  const updated: PaddockOccupation = {
    ...occupation,
    exitDate: normalizedExitDate,
    updatedAt: new Date().toISOString(),
  }

  occupations[index] = updated
  setStorageItem(OCCUPATIONS_KEY, occupations)
  return updated
}

export function getOccupiedPaddockCount(): number {
  return getActivePaddockOccupations().length
}

export function getPaddockCount(): number {
  return getLandAreas().filter(area => area.type === 'Piquete').length
}

export function getAvailablePaddockCount(): number {
  return getPaddockCount() - getOccupiedPaddockCount()
}

export function getCurrentLotsInPaddocksCount(): number {
  return getActivePaddockOccupations().length
}

export function getCurrentAnimalsInPaddocksCount(): number {
  const active = getActivePaddockOccupations()
  return active.reduce((total, occ) => {
    return total + getAnimalsByLotId(occ.lotId).length
  }, 0)
}

export function getAnimalsInPaddockOccupation(occupation: PaddockOccupation): Animal[] {
  return getAnimalsByLotId(occupation.lotId)
}

export function getDaysBetween(startDate: string, endDate: string): number {
  const start = parseDateToUTC(startDate)
  const end = parseDateToUTC(endDate)
  const ms = end.getTime() - start.getTime()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

export function getCurrentOccupationDays(occupation: PaddockOccupation): number {
  const end = occupation.exitDate ?? todayLocalDateString()
  return getDaysBetween(occupation.entryDate, end)
}