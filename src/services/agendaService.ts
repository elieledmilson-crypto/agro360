import {
  AgendaActivity,
  AgendaActivityPriority,
  AgendaActivityStatus,
  AgendaActivityType,
  AgendaDisplayStatus,
  AgendaEntry,
  User,
} from '../types'
import { getStorageItem, setStorageItem, generateId } from './storage'
import {
  addDaysToCivilDate,
  getExpirationStatus,
  todayDateString,
} from '../utils/date'
import { getEmployeeById, getEmployees } from './employeeService'
import { userHasPermission } from './permissionService'
import {
  getVaccinations,
  getVaccinationStatus,
  getTreatments,
} from './healthService'
import { getCropCycles } from './cropService'
import { getCropManagements } from './cropManagementService'
import { getInventoryItems } from './inventoryService'
import { getMachineMaintenanceRecords } from './machineMaintenanceService'

const ACTIVITIES_KEY = 'agro360_agenda_activities'
const INITIALIZED_KEY = 'agro360_agenda_activities_initialized'

const VALID_TYPES: AgendaActivityType[] = [
  'Tarefa',
  'Vacinação',
  'Tratamento',
  'Plantio',
  'Colheita',
  'Manutenção',
  'Irrigação',
  'Pagamento',
  'Reposição de estoque',
  'Outro',
]

const VALID_PRIORITIES: AgendaActivityPriority[] = [
  'Baixa',
  'Média',
  'Alta',
]

const VALID_STATUSES: AgendaActivityStatus[] = [
  'Pendente',
  'Concluída',
  'Cancelada',
]

type AgendaActivityInput = Omit<
  AgendaActivity,
  'id' | 'createdAt' | 'updatedAt'
>

function initializeAgendaIfNeeded(): void {
  const initialized = getStorageItem<boolean>(
    INITIALIZED_KEY,
    false,
  )

  if (!initialized) {
    setStorageItem(ACTIVITIES_KEY, [])
    setStorageItem(INITIALIZED_KEY, true)
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalString(value: unknown): value is string | undefined {
  if (value === undefined) return true

  return typeof value === 'string'
}

function isValidCivilDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false

  const [year, month, day] = dateString.split('-').map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false
  }

  if (month < 1 || month > 12) return false

  const daysInMonth = (() => {
    switch (month) {
      case 1:
        return 31
      case 2: {
        const isLeapYear =
          year % 400 === 0 ||
          (year % 4 === 0 && year % 100 !== 0)

        return isLeapYear ? 29 : 28
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

  return day >= 1 && day <= daysInMonth
}

function isValidTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false

  const [hours, minutes] = time.split(':').map(Number)

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return false
  }

  return (
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  )
}

function isAgendaActivity(
  value: unknown,
): value is AgendaActivity {
  if (!value || typeof value !== 'object') return false

  const obj = value as Record<string, unknown>

  if (
    !isNonEmptyString(obj.id) ||
    !isNonEmptyString(obj.title) ||
    typeof obj.type !== 'string' ||
    !VALID_TYPES.includes(obj.type as AgendaActivityType) ||
    typeof obj.date !== 'string' ||
    !isValidCivilDate(obj.date) ||
    typeof obj.priority !== 'string' ||
    !VALID_PRIORITIES.includes(
      obj.priority as AgendaActivityPriority,
    ) ||
    typeof obj.status !== 'string' ||
    !VALID_STATUSES.includes(
      obj.status as AgendaActivityStatus,
    ) ||
    !isOptionalString(obj.responsibleEmployeeId) ||
    !isOptionalString(obj.notes) ||
    typeof obj.createdAt !== 'string' ||
    typeof obj.updatedAt !== 'string'
  ) {
    return false
  }

  if (obj.time !== undefined) {
    if (
      typeof obj.time !== 'string' ||
      !isValidTime(obj.time)
    ) {
      return false
    }
  }

  return true
}

function getRawActivityEntries(): unknown[] {
  initializeAgendaIfNeeded()

  const raw = getStorageItem<unknown>(
    ACTIVITIES_KEY,
    [],
  )

  return Array.isArray(raw) ? [...raw] : []
}

function validateAndNormalizeInput(
  data: AgendaActivityInput,
): AgendaActivityInput {
  const title = data.title.trim()

  if (!title) throw new Error('Título é obrigatório.')

  if (!data.date || !data.date.trim()) {
    throw new Error('Data é obrigatória.')
  }

  const date = data.date.trim()

  if (!isValidCivilDate(date)) {
    throw new Error('Data da atividade inválida.')
  }

  const time = data.time?.trim() || undefined

  if (
    time !== undefined &&
    !isValidTime(time)
  ) {
    throw new Error('Horário da atividade inválido.')
  }

  if (!VALID_TYPES.includes(data.type)) {
    throw new Error('Tipo de atividade inválido.')
  }

  if (!VALID_PRIORITIES.includes(data.priority)) {
    throw new Error('Prioridade inválida.')
  }

  if (!VALID_STATUSES.includes(data.status)) {
    throw new Error('Situação da atividade inválida.')
  }

  const responsibleEmployeeId =
    data.responsibleEmployeeId?.trim() || undefined

  if (responsibleEmployeeId !== undefined) {
    const employee = getEmployeeById(
      responsibleEmployeeId,
    )

    if (!employee) {
      throw new Error(
        'Funcionário responsável não encontrado.',
      )
    }
  }

  return {
    title,
    type: data.type,
    date,
    time,
    priority: data.priority,
    status: data.status,
    responsibleEmployeeId,
    notes: data.notes?.trim() || undefined,
  }
}

export function getAgendaActivities(): AgendaActivity[] {
  initializeAgendaIfNeeded()

  const raw = getStorageItem<unknown>(
    ACTIVITIES_KEY,
    [],
  )

  if (!Array.isArray(raw)) return []

  return raw
    .filter(isAgendaActivity)
    .sort((a, b) => {
      const dateCompare =
        a.date.localeCompare(b.date)

      if (dateCompare !== 0) return dateCompare

      const aTime = a.time ?? ''
      const bTime = b.time ?? ''

      const timeCompare =
        aTime.localeCompare(bTime)

      if (timeCompare !== 0) return timeCompare

      return a.title.localeCompare(
        b.title,
        'pt-BR',
      )
    })
}

export function getAgendaActivityById(
  id: string,
): AgendaActivity | undefined {
  return getAgendaActivities().find(
    activity => activity.id === id,
  )
}

export function createAgendaActivity(
  data: AgendaActivityInput,
): AgendaActivity {
  initializeAgendaIfNeeded()

  const normalized =
    validateAndNormalizeInput(data)

  const now = new Date().toISOString()

  const newActivity: AgendaActivity = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  const raw = getRawActivityEntries()

  raw.push(newActivity)

  setStorageItem(ACTIVITIES_KEY, raw)

  return newActivity
}

export function updateAgendaActivity(
  id: string,
  data: AgendaActivityInput,
): AgendaActivity | undefined {
  const current =
    getAgendaActivityById(id)

  if (!current) return undefined

  const normalized =
    validateAndNormalizeInput(data)

  const raw = getRawActivityEntries()

  const index = raw.findIndex(
    entry =>
      isAgendaActivity(entry) &&
      entry.id === id,
  )

  if (index === -1) return undefined

  const updated: AgendaActivity = {
    ...normalized,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  }

  raw[index] = updated

  setStorageItem(ACTIVITIES_KEY, raw)

  return updated
}

export function deleteAgendaActivity(
  id: string,
): boolean {
  const raw = getRawActivityEntries()

  const index = raw.findIndex(
    entry =>
      isAgendaActivity(entry) &&
      entry.id === id,
  )

  if (index === -1) return false

  raw.splice(index, 1)

  setStorageItem(ACTIVITIES_KEY, raw)

  return true
}

export function getAgendaActivityDisplayStatus(
  activity: AgendaActivity,
): AgendaDisplayStatus {
  if (activity.status !== 'Pendente') {
    return activity.status
  }

  const today = todayDateString()

  if (activity.date < today) {
    return 'Atrasada'
  }

  return 'Pendente'
}

function getDerivedDisplayStatus(
  date: string,
): AgendaDisplayStatus {
  return date < todayDateString()
    ? 'Atrasada'
    : 'Pendente'
}

function buildActivityEntry(
  activity: AgendaActivity,
): AgendaEntry {
  const employee =
    activity.responsibleEmployeeId
      ? getEmployeeById(
          activity.responsibleEmployeeId,
        )
      : undefined

  return {
    id: `manual:${activity.id}`,
    title: activity.title,
    type: activity.type,
    date: activity.date,
    time: activity.time,
    priority: activity.priority,
    status:
      getAgendaActivityDisplayStatus(
        activity,
      ),
    source: 'manual',
    sourceLabel: 'Manual',
    sourceRecordId: activity.id,
    sourcePath: `/agenda/${activity.id}`,
    responsibleEmployeeId:
      activity.responsibleEmployeeId,
    responsibleName: employee?.name,
    notes: activity.notes,
    editable: true,
  }
}

function buildHealthEntries(
  entries: AgendaEntry[],
): void {
  const vaccinations = getVaccinations()

  for (const vaccination of vaccinations) {
    if (!vaccination.nextDoseDate) {
      continue
    }

    const status =
      getVaccinationStatus(vaccination)

    let priority: AgendaActivityPriority =
      'Baixa'

    if (status === 'Vencida') {
      priority = 'Alta'
    } else if (status === 'Próxima') {
      priority = 'Média'
    }

    entries.push({
      id: `health:vaccination:${vaccination.id}`,
      title: `Próxima dose: ${vaccination.vaccineName}`,
      type: 'Vacinação',
      date: vaccination.nextDoseDate,
      priority,
      status:
        getDerivedDisplayStatus(
          vaccination.nextDoseDate,
        ),
      source: 'health',
      sourceLabel: 'Saúde Animal',
      sourceRecordId: vaccination.id,
      sourcePath:
        `/saude-animal/vacinacoes/${vaccination.id}/editar`,
      editable: false,
    })
  }

  const treatments = getTreatments()

  for (const treatment of treatments) {
    if (
      treatment.status !== 'Em andamento'
    ) {
      continue
    }

    if (!treatment.endDate) {
      continue
    }

    const today = todayDateString()

    const priority: AgendaActivityPriority =
      treatment.endDate < today
        ? 'Alta'
        : 'Média'

    entries.push({
      id: `health:treatment:${treatment.id}`,
      title:
        `Término de tratamento: ${treatment.reason}`,
      type: 'Tratamento',
      date: treatment.endDate,
      priority,
      status:
        getDerivedDisplayStatus(
          treatment.endDate,
        ),
      source: 'health',
      sourceLabel: 'Saúde Animal',
      sourceRecordId: treatment.id,
      sourcePath:
        `/saude-animal/tratamentos/${treatment.id}/editar`,
      editable: false,
    })
  }
}

function buildCropsEntries(
  entries: AgendaEntry[],
): void {
  const cycles = getCropCycles()
  const today = todayDateString()

  for (const cycle of cycles) {
    if (
      cycle.status === 'Planejado' &&
      cycle.plantingDate
    ) {
      entries.push({
        id: `crops:planting:${cycle.id}`,
        title:
          `Plantio: ${cycle.crop} — ${cycle.season}`,
        type: 'Plantio',
        date: cycle.plantingDate,
        priority: 'Média',
        status:
          getDerivedDisplayStatus(
            cycle.plantingDate,
          ),
        source: 'crops',
        sourceLabel: 'Cultivos',
        sourceRecordId: cycle.id,
        sourcePath:
          `/cultivos/${cycle.id}`,
        editable: false,
      })
    }

    if (
      (
        cycle.status === 'Planejado' ||
        cycle.status === 'Em andamento'
      ) &&
      cycle.expectedHarvestDate
    ) {
      const priority:
        AgendaActivityPriority =
          cycle.expectedHarvestDate <
          today
            ? 'Alta'
            : 'Média'

      entries.push({
        id: `crops:harvest:${cycle.id}`,
        title:
          `Previsão de colheita: ${cycle.crop} — ${cycle.season}`,
        type: 'Colheita',
        date:
          cycle.expectedHarvestDate,
        priority,
        status:
          getDerivedDisplayStatus(
            cycle.expectedHarvestDate,
          ),
        source: 'crops',
        sourceLabel: 'Cultivos',
        sourceRecordId: cycle.id,
        sourcePath:
          `/cultivos/${cycle.id}`,
        editable: false,
      })
    }
  }

  const thirtyDaysAgo =
    addDaysToCivilDate(today, -30)

  const managements =
    getCropManagements()

  for (const management of managements) {
    if (
      management.date <
      thirtyDaysAgo
    ) {
      continue
    }

    entries.push({
      id:
        `crops:management:${management.id}`,
      title:
        `Manejo agrícola: ${management.type} — ${management.description}`,
      type: 'Outro',
      date: management.date,
      priority: 'Baixa',
      status: 'Concluída',
      source: 'crops',
      sourceLabel: 'Cultivos',
      sourceRecordId: management.id,
      sourcePath:
        `/cultivos/manejos/${management.id}`,
      editable: false,
    })
  }
}

function buildInventoryEntries(
  entries: AgendaEntry[],
): void {
  const items = getInventoryItems()

  for (const item of items) {
    if (item.status !== 'Ativo') {
      continue
    }

    if (!item.expirationDate) {
      continue
    }

    const expirationStatus =
      getExpirationStatus(
        item.expirationDate,
      )

    let priority:
      AgendaActivityPriority = 'Baixa'

    if (
      expirationStatus === 'Vencido'
    ) {
      priority = 'Alta'
    } else if (
      expirationStatus ===
      'Vence em breve'
    ) {
      priority = 'Média'
    }

    entries.push({
      id:
        `inventory:expiration:${item.id}`,
      title: `Validade: ${item.name}`,
      type: 'Validade de estoque',
      date: item.expirationDate,
      priority,
      status:
        getDerivedDisplayStatus(
          item.expirationDate,
        ),
      source: 'inventory',
      sourceLabel: 'Estoque',
      sourceRecordId: item.id,
      sourcePath: `/estoque/${item.id}`,
      editable: false,
    })
  }
}

function buildMachinesEntries(
  entries: AgendaEntry[],
): void {
  const today = todayDateString()

  const thirtyDaysAgo =
    addDaysToCivilDate(today, -30)

  const maintenances =
    getMachineMaintenanceRecords()

  for (
    const maintenance of maintenances
  ) {
    if (
      maintenance.maintenanceDate <
      thirtyDaysAgo
    ) {
      continue
    }

    if (
      maintenance.maintenanceDate >
      today
    ) {
      continue
    }

    entries.push({
      id:
        `machines:maintenance:${maintenance.id}`,
      title:
        `Manutenção realizada: ${maintenance.type} — ${maintenance.servicePerformed}`,
      type: 'Manutenção',
      date:
        maintenance.maintenanceDate,
      priority: 'Baixa',
      status: 'Concluída',
      source: 'machines',
      sourceLabel: 'Máquinas',
      sourceRecordId:
        maintenance.id,
      sourcePath:
        `/maquinas/manutencoes/${maintenance.id}`,
      editable: false,
    })
  }
}

export function getAgendaEntriesForUser(
  user: User | null,
): AgendaEntry[] {
  if (!user) return []

  if (
    !userHasPermission(user, 'agenda')
  ) {
    return []
  }

  const entries: AgendaEntry[] = []

  for (
    const activity of
      getAgendaActivities()
  ) {
    entries.push(
      buildActivityEntry(activity),
    )
  }

  if (
    userHasPermission(user, 'health')
  ) {
    buildHealthEntries(entries)
  }

  if (
    userHasPermission(user, 'crops')
  ) {
    buildCropsEntries(entries)
  }

  if (
    userHasPermission(
      user,
      'inventory',
    )
  ) {
    buildInventoryEntries(entries)
  }

  if (
    userHasPermission(
      user,
      'machines',
    )
  ) {
    buildMachinesEntries(entries)
  }

  return entries.sort((a, b) => {
    const dateCompare =
      a.date.localeCompare(b.date)

    if (dateCompare !== 0) {
      return dateCompare
    }

    const aTime = a.time ?? ''
    const bTime = b.time ?? ''

    const timeCompare =
      aTime.localeCompare(bTime)

    if (timeCompare !== 0) {
      return timeCompare
    }

    return a.title.localeCompare(
      b.title,
      'pt-BR',
    )
  })
}

export function getAgendaEmployeeOptions(): {
  id: string
  name: string
  inactive: boolean
}[] {
  return getEmployees()
    .map(employee => ({
      id: employee.id,
      name: employee.name,
      inactive:
        employee.status === 'Inativo',
    }))
    .sort((a, b) =>
      a.name.localeCompare(
        b.name,
        'pt-BR',
      ),
    )
}