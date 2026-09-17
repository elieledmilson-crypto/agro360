import {
  AnimalEvent,
  Vaccination,
  Treatment,
  HealthOccurrence,
} from '../types'

export type TimelineItemType =
  | 'admin'
  | 'vaccination'
  | 'treatment'
  | 'occurrence'

export interface TimelineItem {
  id: string
  date: string
  type: TimelineItemType
  description: string
  showTime: boolean
}

export function buildAnimalTimeline(
  animalId: string,
  animalEvents: AnimalEvent[],
  vaccinations: Vaccination[],
  treatments: Treatment[],
  occurrences: HealthOccurrence[],
): TimelineItem[] {
  const items: TimelineItem[] = []

  animalEvents.forEach(event => {
    items.push({
      id: `admin-${event.id}`,
      date: event.date,
      type: 'admin',
      description:
        event.description,
      showTime: true,
    })
  })

  vaccinations.forEach(
    vaccination => {
      if (
        vaccination.animalId !==
        animalId
      ) {
        return
      }

      items.push({
        id: `vac-${vaccination.id}`,
        date:
          `${vaccination.applicationDate}T00:00:00`,
        type: 'vaccination',
        description:
          `Vacinação: ${vaccination.vaccineName}`,
        showTime: false,
      })
    },
  )

  treatments.forEach(
    treatment => {
      if (
        treatment.animalId !==
        animalId
      ) {
        return
      }

      items.push({
        id:
          `trt-start-${treatment.id}`,
        date:
          `${treatment.startDate}T00:00:00`,
        type: 'treatment',
        description:
          `Tratamento iniciado: ${treatment.reason}`,
        showTime: false,
      })

      if (
        treatment.status ===
        'Concluído'
      ) {
        items.push({
          id:
            `trt-end-${treatment.id}`,
          date:
            treatment.endDate
              ? `${treatment.endDate}T00:00:00`
              : treatment.updatedAt,
          type: 'treatment',
          description:
            `Tratamento concluído: ${treatment.reason}`,
          showTime:
            !treatment.endDate,
        })
      } else if (
        treatment.status ===
        'Interrompido'
      ) {
        items.push({
          id:
            `trt-interrupted-${treatment.id}`,
          date:
            treatment.endDate
              ? `${treatment.endDate}T00:00:00`
              : treatment.updatedAt,
          type: 'treatment',
          description:
            `Tratamento interrompido: ${treatment.reason}`,
          showTime:
            !treatment.endDate,
        })
      }
    },
  )

  occurrences.forEach(
    occurrence => {
      if (
        occurrence.animalId !==
        animalId
      ) {
        return
      }

      items.push({
        id:
          `occ-${occurrence.id}`,
        date:
          `${occurrence.date}T00:00:00`,
        type: 'occurrence',
        description:
          `Ocorrência registrada: ${occurrence.title}`,
        showTime: false,
      })

      if (
        occurrence.status ===
        'Resolvida'
      ) {
        items.push({
          id:
            `occ-resolved-${occurrence.id}`,
          date:
            occurrence.updatedAt,
          type: 'occurrence',
          description:
            `Ocorrência resolvida: ${occurrence.title}`,
          showTime: true,
        })
      }
    },
  )

  return items.sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime(),
  )
}