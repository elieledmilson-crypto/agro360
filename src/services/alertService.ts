import {
  AgroAlert,
  AgroAlertSeverity,
  AgroAlertSource,
  User,
} from '../types'
import {
  isAdmin,
  userHasPermission,
} from './permissionService'
import {
  getAgendaActivities,
  getAgendaActivityDisplayStatus,
} from './agendaService'
import {
  getHealthOccurrences,
  getTreatments,
  getVaccinationStatus,
  getVaccinations,
} from './healthService'
import { getCropCycles } from './cropService'
import {
  getInventoryItems,
  isBelowMinimum,
} from './inventoryService'
import { getMachines } from './machineService'
import {
  addDaysToCivilDate,
  getExpirationStatus,
  todayDateString,
} from '../utils/date'

const SEVERITY_ORDER: Record<AgroAlertSeverity, number> = {
  Urgente: 0,
  Atenção: 1,
  Informativo: 2,
}

function sortAlerts(alerts: AgroAlert[]): AgroAlert[] {
  return [...alerts].sort((a, b) => {
    const sevCompare =
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    if (sevCompare !== 0) return sevCompare

    const aDate = a.date ?? ''
    const bDate = b.date ?? ''
    if (aDate !== bDate) return aDate.localeCompare(bDate)

    return a.title.localeCompare(b.title, 'pt-BR')
  })
}

// -------------------- Fontes --------------------

function buildAgendaAlerts(): AgroAlert[] {
  const today = todayDateString()
  const alerts: AgroAlert[] = []

  for (const activity of getAgendaActivities()) {
    const displayStatus = getAgendaActivityDisplayStatus(activity)

    if (displayStatus !== 'Atrasada' && displayStatus !== 'Pendente') {
      continue
    }

    if (displayStatus === 'Atrasada') {
      const severity: AgroAlertSeverity =
        activity.priority === 'Alta' ? 'Urgente' : 'Atenção'

      alerts.push({
        id: `agenda:overdue:${activity.id}`,
        title: `Atividade atrasada: ${activity.title}`,
        message: `A atividade "${activity.title}" está atrasada desde ${activity.date}.`,
        severity,
        source: 'agenda',
        sourceLabel: 'Agenda',
        date: activity.date,
        sourcePath: `/agenda/${activity.id}`,
      })
      continue
    }

    if (activity.date === today) {
      const severity: AgroAlertSeverity =
        activity.priority === 'Alta' ? 'Atenção' : 'Informativo'

      alerts.push({
        id: `agenda:today:${activity.id}`,
        title: `Atividade para hoje: ${activity.title}`,
        message: `A atividade "${activity.title}" está marcada para hoje.`,
        severity,
        source: 'agenda',
        sourceLabel: 'Agenda',
        date: activity.date,
        sourcePath: `/agenda/${activity.id}`,
      })
    }
  }

  return alerts
}

function buildHealthAlerts(): AgroAlert[] {
  const alerts: AgroAlert[] = []
  const today = todayDateString()
  const sevenDays = addDaysToCivilDate(today, 7)

  for (const vaccination of getVaccinations()) {
    const status = getVaccinationStatus(vaccination)

    if (status === 'Vencida') {
      alerts.push({
        id: `health:vaccination:overdue:${vaccination.id}`,
        title: `Vacinação atrasada: ${vaccination.vaccineName}`,
        message: `A dose de ${vaccination.vaccineName} está vencida.`,
        severity: 'Urgente',
        source: 'health',
        sourceLabel: 'Saúde Animal',
        date: vaccination.nextDoseDate,
        sourcePath: '/saude-animal/vacinacoes',
      })
      continue
    }

    if (status === 'Próxima') {
      alerts.push({
        id: `health:vaccination:soon:${vaccination.id}`,
        title: `Vacinação próxima: ${vaccination.vaccineName}`,
        message: `A próxima dose de ${vaccination.vaccineName} está se aproximando.`,
        severity: 'Atenção',
        source: 'health',
        sourceLabel: 'Saúde Animal',
        date: vaccination.nextDoseDate,
        sourcePath: '/saude-animal/vacinacoes',
      })
    }
  }

  for (const treatment of getTreatments()) {
    if (treatment.status !== 'Em andamento') continue
    if (!treatment.endDate) continue

    if (treatment.endDate < today) {
      alerts.push({
        id: `health:treatment:overdue:${treatment.id}`,
        title: `Tratamento com prazo vencido: ${treatment.reason}`,
        message: `O tratamento "${treatment.reason}" venceu em ${treatment.endDate}.`,
        severity: 'Urgente',
        source: 'health',
        sourceLabel: 'Saúde Animal',
        date: treatment.endDate,
        sourcePath: '/saude-animal/tratamentos',
      })
      continue
    }

    if (treatment.endDate >= today && treatment.endDate <= sevenDays) {
      alerts.push({
        id: `health:treatment:soon:${treatment.id}`,
        title: `Tratamento próximo do término: ${treatment.reason}`,
        message: `O tratamento "${treatment.reason}" termina em ${treatment.endDate}.`,
        severity: 'Atenção',
        source: 'health',
        sourceLabel: 'Saúde Animal',
        date: treatment.endDate,
        sourcePath: '/saude-animal/tratamentos',
      })
    }
  }

  for (const occurrence of getHealthOccurrences()) {
    if (occurrence.status !== 'Aberta') continue

    let severity: AgroAlertSeverity = 'Informativo'
    if (occurrence.severity === 'Alta') severity = 'Urgente'
    else if (occurrence.severity === 'Média') severity = 'Atenção'

    alerts.push({
      id: `health:occurrence:${occurrence.id}`,
      title: `Ocorrência de saúde: ${occurrence.title}`,
      message: occurrence.description ?? 'Ocorrência aberta na saúde animal.',
      severity,
      source: 'health',
      sourceLabel: 'Saúde Animal',
      date: occurrence.date,
      sourcePath: '/saude-animal/ocorrencias',
    })
  }

  return alerts
}

function buildCropsAlerts(): AgroAlert[] {
  const alerts: AgroAlert[] = []
  const today = todayDateString()
  const sevenDays = addDaysToCivilDate(today, 7)
  const cycles = getCropCycles()

  for (const cycle of cycles) {
    if (cycle.status === 'Planejado' && cycle.plantingDate) {
      if (cycle.plantingDate < today) {
        alerts.push({
          id: `crops:planting:overdue:${cycle.id}`,
          title: `Plantio planejado em atraso: ${cycle.crop}`,
          message: `O plantio de ${cycle.crop} estava previsto para ${cycle.plantingDate}.`,
          severity: 'Atenção',
          source: 'crops',
          sourceLabel: 'Cultivos',
          date: cycle.plantingDate,
          sourcePath: `/cultivos/${cycle.id}`,
        })
      } else if (
        cycle.plantingDate >= today &&
        cycle.plantingDate <= sevenDays
      ) {
        alerts.push({
          id: `crops:planting:soon:${cycle.id}`,
          title: `Plantio próximo: ${cycle.crop}`,
          message: `O plantio de ${cycle.crop} está previsto para ${cycle.plantingDate}.`,
          severity: 'Informativo',
          source: 'crops',
          sourceLabel: 'Cultivos',
          date: cycle.plantingDate,
          sourcePath: `/cultivos/${cycle.id}`,
        })
      }
    }

    if (
      (cycle.status === 'Planejado' || cycle.status === 'Em andamento') &&
      cycle.expectedHarvestDate
    ) {
      if (cycle.expectedHarvestDate < today) {
        alerts.push({
          id: `crops:harvest:overdue:${cycle.id}`,
          title: `Previsão de colheita vencida: ${cycle.crop}`,
          message: `A colheita de ${cycle.crop} estava prevista para ${cycle.expectedHarvestDate}.`,
          severity: 'Urgente',
          source: 'crops',
          sourceLabel: 'Cultivos',
          date: cycle.expectedHarvestDate,
          sourcePath: `/cultivos/${cycle.id}`,
        })
      } else if (
        cycle.expectedHarvestDate >= today &&
        cycle.expectedHarvestDate <= sevenDays
      ) {
        alerts.push({
          id: `crops:harvest:soon:${cycle.id}`,
          title: `Colheita próxima: ${cycle.crop}`,
          message: `A colheita de ${cycle.crop} está prevista para ${cycle.expectedHarvestDate}.`,
          severity: 'Atenção',
          source: 'crops',
          sourceLabel: 'Cultivos',
          date: cycle.expectedHarvestDate,
          sourcePath: `/cultivos/${cycle.id}`,
        })
      }
    }
  }

  return alerts
}

function buildInventoryAlerts(): AgroAlert[] {
  const alerts: AgroAlert[] = []
  const items = getInventoryItems()

  for (const item of items) {
    if (item.status !== 'Ativo') continue

    if (isBelowMinimum(item)) {
      alerts.push({
        id: `inventory:below-min:${item.id}`,
        title: `Estoque abaixo do mínimo: ${item.name}`,
        message: `O saldo atual de ${item.name} está abaixo do mínimo definido.`,
        severity: 'Atenção',
        source: 'inventory',
        sourceLabel: 'Estoque',
        sourcePath: `/estoque/${item.id}`,
      })
    }

    const expirationStatus = getExpirationStatus(item.expirationDate)

    if (expirationStatus === 'Vencido') {
      alerts.push({
        id: `inventory:expired:${item.id}`,
        title: `Produto vencido: ${item.name}`,
        message: `${item.name} está vencido.`,
        severity: 'Urgente',
        source: 'inventory',
        sourceLabel: 'Estoque',
        date: item.expirationDate,
        sourcePath: `/estoque/${item.id}`,
      })
    } else if (expirationStatus === 'Vence em breve') {
      alerts.push({
        id: `inventory:expiring:${item.id}`,
        title: `Produto próximo do vencimento: ${item.name}`,
        message: `${item.name} está próximo do vencimento.`,
        severity: 'Atenção',
        source: 'inventory',
        sourceLabel: 'Estoque',
        date: item.expirationDate,
        sourcePath: `/estoque/${item.id}`,
      })
    }
  }

  return alerts
}

function buildMachinesAlerts(): AgroAlert[] {
  const alerts: AgroAlert[] = []
  const machines = getMachines()

  for (const machine of machines) {
    if (machine.status !== 'Em manutenção') continue

    alerts.push({
      id: `machines:maintenance:${machine.id}`,
      title: `Máquina em manutenção: ${machine.name}`,
      message: `${machine.name} está atualmente em manutenção.`,
      severity: 'Atenção',
      source: 'machines',
      sourceLabel: 'Máquinas',
      sourcePath: `/maquinas/${machine.id}`,
    })
  }

  return alerts
}

// -------------------- API --------------------

function sourceRequiresPermission(
  source: AgroAlertSource,
): 'health' | 'crops' | 'inventory' | 'machines' | null {
  if (source === 'health') return 'health'
  if (source === 'crops') return 'crops'
  if (source === 'inventory') return 'inventory'
  if (source === 'machines') return 'machines'
  return null
}

export function getAlertsForUser(user: User | null): AgroAlert[] {
  if (!user) return []
  if (!userHasPermission(user, 'agenda')) return []

  const all: AgroAlert[] = [
    ...buildAgendaAlerts(),
    ...buildHealthAlerts(),
    ...buildCropsAlerts(),
    ...buildInventoryAlerts(),
    ...buildMachinesAlerts(),
  ]

  const admin = isAdmin(user)

  const visible = all.filter(alert => {
    const requiredPermission = sourceRequiresPermission(alert.source)

    if (requiredPermission === null) return true
    if (admin) return true

    return userHasPermission(user, requiredPermission)
  })

  return sortAlerts(visible)
}

export function getAlertCountForUser(user: User | null): number {
  return getAlertsForUser(user).length
}