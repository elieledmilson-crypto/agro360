import { Lot, PaddockOccupation } from '../types'
import { getStorageItem, setStorageItem, generateId } from './storage'

const STORAGE_KEY = 'agro360_lots'
const OCCUPATIONS_KEY = 'agro360_paddock_occupations'

export function getLots(): Lot[] {
  const raw = getStorageItem<Lot[]>(STORAGE_KEY, [])
  return Array.isArray(raw) ? raw : []
}

export function getLotById(id: string): Lot | undefined {
  return getLots().find(lot => lot.id === id)
}

export function createLot(name: string, description?: string): Lot {
  const lots = getLots()
  const newLot: Lot = {
    id: generateId(),
    name: name.trim(),
    description: description?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }
  lots.push(newLot)
  setStorageItem(STORAGE_KEY, lots)
  return newLot
}

export function updateLot(id: string, data: Partial<Omit<Lot, 'id' | 'createdAt'>>): Lot | undefined {
  const lots = getLots()
  const index = lots.findIndex(lot => lot.id === id)
  if (index === -1) return undefined

  const oldLot = lots[index]
  const updated: Lot = {
    ...oldLot,
    ...data,
    id: oldLot.id,
    createdAt: oldLot.createdAt,
  }
  lots[index] = updated
  setStorageItem(STORAGE_KEY, lots)
  return updated
}

export function deleteLot(id: string): boolean {
  const raw = getStorageItem<PaddockOccupation[]>(OCCUPATIONS_KEY, [])
  const occupations = Array.isArray(raw) ? raw : []
  const hasOccupation = occupations.some(occ => occ.lotId === id)

  if (hasOccupation) {
    throw new Error('Não é possível excluir este lote porque existem registros de ocupação vinculados.')
  }

  const lots = getLots()
  const filtered = lots.filter(lot => lot.id !== id)
  if (filtered.length === lots.length) return false
  setStorageItem(STORAGE_KEY, filtered)
  return true
}