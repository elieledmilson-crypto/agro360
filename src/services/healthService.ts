import {
  Vaccination,
  Treatment,
  HealthOccurrence,
  VaccinationStatus,
} from '../types'
import {
  getStorageItem,
  setStorageItem,
  generateId,
} from './storage'
import { hasInventoryMovementByOrigin } from './inventoryService'

const VACCINATIONS_KEY =
  'agro360_vaccinations'

const TREATMENTS_KEY =
  'agro360_treatments'

const OCCURRENCES_KEY =
  'agro360_health_occurrences'

const INITIALIZED_KEY =
  'agro360_health_initialized'

const ANIMALS_KEY =
  'agro360_animals'

function initializeHealthIfNeeded(): void {
  const initialized =
    getStorageItem<boolean>(
      INITIALIZED_KEY,
      false,
    )

  if (!initialized) {
    setStorageItem(
      VACCINATIONS_KEY,
      [],
    )

    setStorageItem(
      TREATMENTS_KEY,
      [],
    )

    setStorageItem(
      OCCURRENCES_KEY,
      [],
    )

    setStorageItem(
      INITIALIZED_KEY,
      true,
    )
  }
}

function assertAnimalExists(
  animalId: string,
): void {
  const animals =
    getStorageItem<
      { id: string }[]
    >(
      ANIMALS_KEY,
      [],
    )

  const exists = animals.some(
    animal =>
      animal.id === animalId,
  )

  if (!exists) {
    throw new Error(
      'Animal não encontrado.',
    )
  }
}

function vaccinationHasStockConsumption(
  vaccinationId: string,
): boolean {
  return hasInventoryMovementByOrigin(
    'health',
    'vaccination',
    vaccinationId,
  )
}

function treatmentHasStockConsumption(
  treatmentId: string,
): boolean {
  return hasInventoryMovementByOrigin(
    'health',
    'treatment',
    treatmentId,
  )
}

// VACINAÇÕES

export function getVaccinations(): Vaccination[] {
  initializeHealthIfNeeded()

  return getStorageItem<
    Vaccination[]
  >(
    VACCINATIONS_KEY,
    [],
  )
}

export function getVaccinationById(
  id: string,
): Vaccination | undefined {
  return getVaccinations().find(
    vaccination =>
      vaccination.id === id,
  )
}

export function createVaccination(
  data: Omit<
    Vaccination,
    'id' | 'createdAt' | 'updatedAt'
  >,
): Vaccination {
  assertAnimalExists(data.animalId)

  const vaccinations =
    getVaccinations()

  const now =
    new Date().toISOString()

  const newVaccination: Vaccination =
    {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }

  vaccinations.push(
    newVaccination,
  )

  setStorageItem(
    VACCINATIONS_KEY,
    vaccinations,
  )

  return newVaccination
}

export function updateVaccination(
  id: string,
  data: Partial<Vaccination>,
): Vaccination | undefined {
  if (
    data.animalId !== undefined
  ) {
    assertAnimalExists(
      data.animalId,
    )
  }

  const vaccinations =
    getVaccinations()

  const index =
    vaccinations.findIndex(
      vaccination =>
        vaccination.id === id,
    )

  if (index === -1) {
    return undefined
  }

  const current = vaccinations[index]

  if (vaccinationHasStockConsumption(id)) {
    const protectedFieldsChanged =
      ('animalId' in data &&
        data.animalId !== current.animalId) ||
      ('vaccineName' in data &&
        data.vaccineName !== current.vaccineName) ||
      ('applicationDate' in data &&
        data.applicationDate !== current.applicationDate) ||
      ('dose' in data &&
        data.dose !== current.dose) ||
      ('batch' in data &&
        data.batch !== current.batch)

    if (protectedFieldsChanged) {
      throw new Error(
        'Não é possível alterar os dados principais desta vacinação porque ela possui baixa de estoque registrada.',
      )
    }
  }

  const updated: Vaccination = {
    ...current,
    ...data,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt:
      new Date().toISOString(),
  }

  vaccinations[index] = updated

  setStorageItem(
    VACCINATIONS_KEY,
    vaccinations,
  )

  return updated
}

export function deleteVaccination(
  id: string,
): boolean {
  if (vaccinationHasStockConsumption(id)) {
    throw new Error(
      'Não é possível excluir esta vacinação porque ela possui baixa de estoque registrada.',
    )
  }

  const vaccinations =
    getVaccinations()

  const filtered =
    vaccinations.filter(
      vaccination =>
        vaccination.id !== id,
    )

  if (
    filtered.length ===
    vaccinations.length
  ) {
    return false
  }

  setStorageItem(
    VACCINATIONS_KEY,
    filtered,
  )

  return true
}

export function getVaccinationsByAnimal(
  animalId: string,
): Vaccination[] {
  return getVaccinations()
    .filter(
      vaccination =>
        vaccination.animalId ===
        animalId,
    )
    .sort(
      (a, b) =>
        new Date(
          b.applicationDate,
        ).getTime() -
        new Date(
          a.applicationDate,
        ).getTime(),
    )
}

export function animalHasVaccinationWithStockConsumption(
  animalId: string,
): boolean {
  const vaccinations =
    getVaccinationsByAnimal(animalId)

  return vaccinations.some(
    vaccination =>
      vaccinationHasStockConsumption(
        vaccination.id,
      ),
  )
}

export function getVaccinationStatus(
  vaccination: Vaccination,
): VaccinationStatus {
  if (!vaccination.nextDoseDate) {
    return 'Sem próxima dose'
  }

  const today = new Date()

  today.setHours(
    0,
    0,
    0,
    0,
  )

  const nextDose = new Date(
    vaccination.nextDoseDate +
      'T00:00:00',
  )

  const diffDays = Math.ceil(
    (
      nextDose.getTime() -
      today.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  )

  if (diffDays < 0) {
    return 'Vencida'
  }

  if (diffDays <= 7) {
    return 'Próxima'
  }

  return 'Em dia'
}

// TRATAMENTOS

export function getTreatments(): Treatment[] {
  initializeHealthIfNeeded()

  return getStorageItem<
    Treatment[]
  >(
    TREATMENTS_KEY,
    [],
  )
}

export function getTreatmentById(
  id: string,
): Treatment | undefined {
  return getTreatments().find(
    treatment =>
      treatment.id === id,
  )
}

export function createTreatment(
  data: Omit<
    Treatment,
    'id' | 'createdAt' | 'updatedAt'
  >,
): Treatment {
  assertAnimalExists(data.animalId)

  const treatments =
    getTreatments()

  const now =
    new Date().toISOString()

  const newTreatment: Treatment = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  treatments.push(newTreatment)

  setStorageItem(
    TREATMENTS_KEY,
    treatments,
  )

  return newTreatment
}

export function updateTreatment(
  id: string,
  data: Partial<Treatment>,
): Treatment | undefined {
  if (
    data.animalId !== undefined
  ) {
    assertAnimalExists(
      data.animalId,
    )
  }

  const treatments =
    getTreatments()

  const index =
    treatments.findIndex(
      treatment =>
        treatment.id === id,
    )

  if (index === -1) {
    return undefined
  }

  const current = treatments[index]

  // Proteção: se há baixa de estoque vinculada, campos principais não podem mudar.
  // Usamos `in` para detectar presença real de propriedades opcionais,
  // cobrindo chamadas como { medication: undefined }.
  if (treatmentHasStockConsumption(id)) {
    const protectedFieldsChanged =
      ('animalId' in data &&
        data.animalId !== current.animalId) ||
      ('reason' in data &&
        data.reason !== current.reason) ||
      ('medication' in data &&
        data.medication !== current.medication) ||
      ('dosage' in data &&
        data.dosage !== current.dosage) ||
      ('startDate' in data &&
        data.startDate !== current.startDate)

    if (protectedFieldsChanged) {
      throw new Error(
        'Não é possível alterar os dados principais deste tratamento porque ele possui baixa de estoque registrada.',
      )
    }
  }

  const updated: Treatment = {
    ...current,
    ...data,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt:
      new Date().toISOString(),
  }

  treatments[index] = updated

  setStorageItem(
    TREATMENTS_KEY,
    treatments,
  )

  return updated
}

export function deleteTreatment(
  id: string,
): boolean {
  if (treatmentHasStockConsumption(id)) {
    throw new Error(
      'Não é possível excluir este tratamento porque ele possui baixa de estoque registrada.',
    )
  }

  const treatments =
    getTreatments()

  const filtered =
    treatments.filter(
      treatment =>
        treatment.id !== id,
    )

  if (
    filtered.length ===
    treatments.length
  ) {
    return false
  }

  setStorageItem(
    TREATMENTS_KEY,
    filtered,
  )

  return true
}

export function getTreatmentsByAnimal(
  animalId: string,
): Treatment[] {
  return getTreatments()
    .filter(
      treatment =>
        treatment.animalId ===
        animalId,
    )
    .sort(
      (a, b) =>
        new Date(
          b.startDate,
        ).getTime() -
        new Date(
          a.startDate,
        ).getTime(),
    )
}

export function animalHasTreatmentWithStockConsumption(
  animalId: string,
): boolean {
  const treatments =
    getTreatmentsByAnimal(animalId)

  return treatments.some(
    treatment =>
      treatmentHasStockConsumption(
        treatment.id,
      ),
  )
}

// OCORRÊNCIAS

export function getHealthOccurrences(): HealthOccurrence[] {
  initializeHealthIfNeeded()

  return getStorageItem<
    HealthOccurrence[]
  >(
    OCCURRENCES_KEY,
    [],
  )
}

export function getHealthOccurrenceById(
  id: string,
): HealthOccurrence | undefined {
  return getHealthOccurrences().find(
    occurrence =>
      occurrence.id === id,
  )
}

export function createHealthOccurrence(
  data: Omit<
    HealthOccurrence,
    'id' | 'createdAt' | 'updatedAt'
  >,
): HealthOccurrence {
  assertAnimalExists(data.animalId)

  const occurrences =
    getHealthOccurrences()

  const now =
    new Date().toISOString()

  const newOccurrence:
    HealthOccurrence = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }

  occurrences.push(
    newOccurrence,
  )

  setStorageItem(
    OCCURRENCES_KEY,
    occurrences,
  )

  return newOccurrence
}

export function updateHealthOccurrence(
  id: string,
  data: Partial<HealthOccurrence>,
): HealthOccurrence | undefined {
  if (
    data.animalId !== undefined
  ) {
    assertAnimalExists(
      data.animalId,
    )
  }

  const occurrences =
    getHealthOccurrences()

  const index =
    occurrences.findIndex(
      occurrence =>
        occurrence.id === id,
    )

  if (index === -1) {
    return undefined
  }

  const updated:
    HealthOccurrence = {
      ...occurrences[index],
      ...data,
      id: occurrences[index].id,
      createdAt:
        occurrences[index]
          .createdAt,
      updatedAt:
        new Date().toISOString(),
    }

  occurrences[index] = updated

  setStorageItem(
    OCCURRENCES_KEY,
    occurrences,
  )

  return updated
}

export function deleteHealthOccurrence(
  id: string,
): boolean {
  const occurrences =
    getHealthOccurrences()

  const filtered =
    occurrences.filter(
      occurrence =>
        occurrence.id !== id,
    )

  if (
    filtered.length ===
    occurrences.length
  ) {
    return false
  }

  setStorageItem(
    OCCURRENCES_KEY,
    filtered,
  )

  return true
}

export function getHealthOccurrencesByAnimal(
  animalId: string,
): HealthOccurrence[] {
  return getHealthOccurrences()
    .filter(
      occurrence =>
        occurrence.animalId ===
        animalId,
    )
    .sort(
      (a, b) =>
        new Date(
          b.date,
        ).getTime() -
        new Date(
          a.date,
        ).getTime(),
    )
}

export function getPendingVaccinationCount(): number {
  const vaccinations =
    getVaccinations()

  return vaccinations.filter(
    vaccination => {
      const status =
        getVaccinationStatus(
          vaccination,
        )

      return (
        status === 'Próxima' ||
        status === 'Vencida'
      )
    },
  ).length
}