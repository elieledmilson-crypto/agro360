import { Animal, AnimalEvent, Lot, User } from '../types'
import { getStorageItem, setStorageItem, generateId } from './storage'
import { getLots } from './lotService'
import { clearHealthRecordsForAnimal } from './healthCleanupService'
import {
  animalHasVaccinationWithStockConsumption,
  animalHasTreatmentWithStockConsumption,
} from './healthService'
import { getLandAreaById } from './landService'
import {
  requirePermissions,
  userHasPermission,
} from './permissionService'

const ANIMALS_KEY = 'agro360_animals'
const EVENTS_KEY = 'agro360_animal_events'
const INITIALIZED_KEY = 'agro360_animals_initialized'

function getInitialAnimals(): Animal[] {
  return []
}

function initializeAnimalsIfNeeded(): void {
  const initialized = getStorageItem<boolean>(INITIALIZED_KEY, false)

  if (!initialized) {
    const initial = getInitialAnimals()

    setStorageItem(ANIMALS_KEY, initial)
    setStorageItem(INITIALIZED_KEY, true)
  }
}

function normalizeIdentification(identification: string): string {
  return identification.trim().toLowerCase()
}

function isDuplicateIdentification(
  identification: string,
  excludeId?: string,
): boolean {
  const animals = getAnimals()
  const normalized = normalizeIdentification(identification)

  return animals.some(
    animal =>
      normalizeIdentification(animal.identification) === normalized &&
      animal.id !== excludeId,
  )
}

export function getAnimals(): Animal[] {
  initializeAnimalsIfNeeded()

  return getStorageItem<Animal[]>(ANIMALS_KEY, [])
}

export function getAnimalById(id: string): Animal | undefined {
  return getAnimals().find(animal => animal.id === id)
}

export function createAnimal(
  data: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>,
  user?: User | null,
): Animal {
  getAnimals()

  if (data.landAreaId !== undefined && data.landAreaId !== null) {
    if (!user) {
      throw new Error(
        'Permissão necessária para associar um animal a uma área.',
      )
    }

    requirePermissions(user, ['animals', 'land'])

    const landArea = getLandAreaById(data.landAreaId)

    if (!landArea) {
      throw new Error('Área não encontrada.')
    }
  }

  if (isDuplicateIdentification(data.identification)) {
    throw new Error(
      'Já existe um animal cadastrado com esta identificação.',
    )
  }

  const animals = getAnimals()
  const now = new Date().toISOString()

  const newAnimal: Animal = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  animals.push(newAnimal)

  setStorageItem(ANIMALS_KEY, animals)

  addAnimalEvent({
    animalId: newAnimal.id,
    type: 'created',
    description: 'Animal cadastrado',
  })

  if (newAnimal.landAreaId) {
    const landArea = getLandAreaById(newAnimal.landAreaId)

    addAnimalEvent({
      animalId: newAnimal.id,
      type: 'land_change',
      description: `Associado à área "${landArea?.code ?? '—'}"`,
    })
  }

  return newAnimal
}

export function updateAnimal(
  user: User | null,
  id: string,
  data: Partial<Animal>,
): Animal | undefined {
  requirePermissions(user, ['animals'])

  const animals = getAnimals()
  const index = animals.findIndex(animal => animal.id === id)

  if (index === -1) return undefined

  const oldAnimal = animals[index]

  if (data.identification !== undefined) {
    const oldNormalized = normalizeIdentification(oldAnimal.identification)
    const newNormalized = normalizeIdentification(data.identification)

    if (
      oldNormalized !== newNormalized &&
      isDuplicateIdentification(data.identification, id)
    ) {
      throw new Error(
        'Já existe um animal cadastrado com esta identificação.',
      )
    }
  }

  if ('landAreaId' in data) {
    if (!userHasPermission(user, 'land')) {
      throw new Error(
        'Permissão necessária para alterar a associação com Terras.',
      )
    }

    if (data.landAreaId !== undefined && data.landAreaId !== null) {
      const landArea = getLandAreaById(data.landAreaId)

      if (!landArea) {
        throw new Error('Área não encontrada.')
      }
    }
  }

  const now = new Date().toISOString()

  const updatedAnimal: Animal = {
    ...oldAnimal,
    ...data,
    id: oldAnimal.id,
    createdAt: oldAnimal.createdAt,
    updatedAt: now,
  }

  animals[index] = updatedAnimal

  setStorageItem(ANIMALS_KEY, animals)

  addAnimalEvent({
    animalId: id,
    type: 'updated',
    description: 'Cadastro atualizado',
  })

  if ('lotId' in data) {
    const oldLotId = oldAnimal.lotId
    const newLotId = data.lotId

    if (oldLotId !== newLotId) {
      const oldLotName = oldLotId ? getLotName(oldLotId) : 'Sem lote'
      const newLotName = newLotId ? getLotName(newLotId) : 'Sem lote'

      addAnimalEvent({
        animalId: id,
        type: 'lot_change',
        description: `Transferido do lote "${oldLotName}" para "${newLotName}"`,
      })
    }
  }

  if ('landAreaId' in data) {
    const oldAreaId = oldAnimal.landAreaId
    const newAreaId = data.landAreaId

    if (oldAreaId !== newAreaId) {
      const oldLabel = oldAreaId
        ? getLandAreaById(oldAreaId)?.code ?? 'Área desconhecida'
        : 'Sem área'

      const newLabel = newAreaId
        ? getLandAreaById(newAreaId)?.code ?? 'Área desconhecida'
        : 'Sem área'

      addAnimalEvent({
        animalId: id,
        type: 'land_change',
        description: `Área alterada de "${oldLabel}" para "${newLabel}"`,
      })
    }
  }

  if (
    data.status !== undefined &&
    data.status !== oldAnimal.status
  ) {
    addAnimalEvent({
      animalId: id,
      type: 'status_change',
      description: `Situação alterada de "${oldAnimal.status}" para "${data.status}"`,
    })
  }

  return updatedAnimal
}

export function deleteAnimal(id: string): boolean {
  if (animalHasVaccinationWithStockConsumption(id)) {
    throw new Error(
      'Não é possível excluir este animal porque ele possui vacinação com baixa de estoque registrada.',
    )
  }

  if (animalHasTreatmentWithStockConsumption(id)) {
    throw new Error(
      'Não é possível excluir este animal porque ele possui tratamento com baixa de estoque registrada.',
    )
  }

  const animals = getAnimals()

  const filtered = animals.filter(animal => animal.id !== id)

  if (filtered.length === animals.length) return false

  setStorageItem(ANIMALS_KEY, filtered)

  const allEvents = getStorageItem<AnimalEvent[]>(EVENTS_KEY, [])
  const filteredEvents = allEvents.filter(event => event.animalId !== id)

  setStorageItem(EVENTS_KEY, filteredEvents)

  clearHealthRecordsForAnimal(id)

  return true
}

export function clearLotFromAnimals(
  lotId: string,
  lotName?: string,
): void {
  const animals = getAnimals()
  const name = lotName ?? getLotName(lotId)

  const updatedAnimals = animals.map(animal => {
    if (animal.lotId === lotId) {
      addAnimalEvent({
        animalId: animal.id,
        type: 'lot_change',
        description: `Transferido do lote "${name}" para "Sem lote"`,
      })

      return {
        ...animal,
        lotId: undefined,
        updatedAt: new Date().toISOString(),
      }
    }

    return animal
  })

  setStorageItem(ANIMALS_KEY, updatedAnimals)
}

export function getAnimalEvents(animalId: string): AnimalEvent[] {
  const allEvents = getStorageItem<AnimalEvent[]>(EVENTS_KEY, [])

  return allEvents
    .filter(event => event.animalId === animalId)
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
}

function addAnimalEvent(
  event: Omit<AnimalEvent, 'id' | 'date'>,
): AnimalEvent {
  const events = getStorageItem<AnimalEvent[]>(EVENTS_KEY, [])

  const newEvent: AnimalEvent = {
    ...event,
    id: generateId(),
    date: new Date().toISOString(),
  }

  events.push(newEvent)

  setStorageItem(EVENTS_KEY, events)

  return newEvent
}

export function getAnimalLots(): Lot[] {
  return getLots()
}

export function getLotName(lotId: string): string {
  const lot = getLots().find(lot => lot.id === lotId)

  return lot?.name ?? 'Lote desconhecido'
}

export function getAnimalsByLandAreaId(landAreaId: string): Animal[] {
  return getAnimals().filter(animal => animal.landAreaId === landAreaId)
}
