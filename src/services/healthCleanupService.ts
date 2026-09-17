import {
  getStorageItem,
  setStorageItem,
} from './storage'

const VACCINATIONS_KEY =
  'agro360_vaccinations'

const TREATMENTS_KEY =
  'agro360_treatments'

const OCCURRENCES_KEY =
  'agro360_health_occurrences'

export function clearHealthRecordsForAnimal(
  animalId: string,
): void {
  const vaccinations =
    getStorageItem<
      { animalId: string }[]
    >(
      VACCINATIONS_KEY,
      [],
    )

  const filteredVaccinations =
    vaccinations.filter(
      vaccination =>
        vaccination.animalId !==
        animalId,
    )

  setStorageItem(
    VACCINATIONS_KEY,
    filteredVaccinations,
  )

  const treatments =
    getStorageItem<
      { animalId: string }[]
    >(
      TREATMENTS_KEY,
      [],
    )

  const filteredTreatments =
    treatments.filter(
      treatment =>
        treatment.animalId !==
        animalId,
    )

  setStorageItem(
    TREATMENTS_KEY,
    filteredTreatments,
  )

  const occurrences =
    getStorageItem<
      { animalId: string }[]
    >(
      OCCURRENCES_KEY,
      [],
    )

  const filteredOccurrences =
    occurrences.filter(
      occurrence =>
        occurrence.animalId !==
        animalId,
    )

  setStorageItem(
    OCCURRENCES_KEY,
    filteredOccurrences,
  )
}