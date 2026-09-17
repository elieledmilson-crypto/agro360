import {
  FinancialTransactionOriginModule,
  User,
} from '../types'
import { userHasPermission } from './permissionService'
import { getAnimals } from './animalService'
import {
  getVaccinations,
  getVaccinationStatus,
  getTreatments,
  getHealthOccurrences,
} from './healthService'
import {
  getLandAreas,
  getTotalRegisteredHectares,
} from './landService'
import { getLandUseRecords } from './landUseService'
import {
  getPaddockCount,
  getOccupiedPaddockCount,
  getAvailablePaddockCount,
} from './paddockOccupationService'
import { getCropCycles } from './cropService'
import { getCropManagements } from './cropManagementService'
import {
  getHarvestRecords,
  getHarvestProductionKg,
} from './harvestService'
import { getMachines } from './machineService'
import { getMachineMaintenanceRecords } from './machineMaintenanceService'
import { getMachineUsageRecords } from './machineUsageService'
import {
  getInventoryItems,
  isBelowMinimum,
  getInventoryMovements,
} from './inventoryService'
import {
  getFinancialCategories,
  getFinancialTransactionsInPeriod,
} from './financeService'
import { getAgendaEntriesForUser } from './agendaService'
import { getAlertsForUser } from './alertService'
import { getExpirationStatus } from '../utils/date'

export interface ReportPeriod {
  startDate?: string
  endDate?: string
}

export interface ReportBreakdownItem {
  label: string
  value: number
}

export interface ReportAmountBreakdownItem {
  label: string
  value: number
}

export type ReportModuleKey =
  | 'animals'
  | 'health'
  | 'land'
  | 'crops'
  | 'machines'
  | 'inventory'
  | 'finance'
  | 'agenda'

export interface AnimalReportData {
  total: number
  active: number
  byStatus: ReportBreakdownItem[]
  bySpecies: ReportBreakdownItem[]
  byCategory: ReportBreakdownItem[]
  bySex: ReportBreakdownItem[]
}

export interface HealthReportData {
  pendingVaccinationsCurrent: number
  ongoingTreatmentsCurrent: number
  openOccurrencesCurrent: number
  vaccinationsInPeriod: number
  treatmentsInPeriod: number
  occurrencesInPeriod: number
  vaccinationStatusCurrent: ReportBreakdownItem[]
  openOccurrencesBySeverity: ReportBreakdownItem[]
}

export interface LandReportData {
  totalAreas: number
  totalHectares: number
  paddockCount: number
  occupiedPaddocks: number
  availablePaddocks: number
  byType: ReportBreakdownItem[]
  byStatus: ReportBreakdownItem[]
  landUseRecordsInPeriod: number
  landUseByTypeInPeriod: ReportBreakdownItem[]
}

export interface CropReportData {
  totalCycles: number
  plannedCycles: number
  activeCycles: number
  completedCycles: number
  cancelledCycles: number
  harvestsInPeriod: number
  managementsInPeriod: number
  totalProductionKg: number
  totalHarvestedAreaHectares: number
  productivityKgPerHectare: number
  cyclesByStatus: ReportBreakdownItem[]
  productionByCropKg: ReportBreakdownItem[]
  managementsByTypeInPeriod: ReportBreakdownItem[]
}

export interface MachineReportData {
  totalMachines: number
  operationalMachines: number
  maintenanceMachines: number
  inactiveMachines: number
  usageRecordsInPeriod: number
  workedHoursInPeriod: number
  maintenanceRecordsInPeriod: number
  byCategory: ReportBreakdownItem[]
  operationHoursByTypeInPeriod: ReportBreakdownItem[]
  maintenanceByTypeInPeriod: ReportBreakdownItem[]
}

export interface InventoryReportData {
  totalItems: number
  activeItems: number
  belowMinimumCurrent: number
  expiredCurrent: number
  expiringSoonCurrent: number
  movementsInPeriod: number
  entriesInPeriod: number
  exitsInPeriod: number
  itemsByCategory: ReportBreakdownItem[]
  movementsByTypeInPeriod: ReportBreakdownItem[]
  movementsByOriginInPeriod: ReportBreakdownItem[]
}

export interface FinanceReportData {
  revenues: number
  expenses: number
  balance: number
  transactionsCount: number
  revenueByCategory: ReportAmountBreakdownItem[]
  expenseByCategory: ReportAmountBreakdownItem[]
  expensesByOriginInPeriod: ReportAmountBreakdownItem[]
}

export interface AgendaReportData {
  entriesInPeriod: number
  pendingInPeriod: number
  overdueInPeriod: number
  completedInPeriod: number
  cancelledInPeriod: number
  currentAlerts: number
  urgentAlertsCurrent: number
  attentionAlertsCurrent: number
  informationalAlertsCurrent: number
  entriesByTypeInPeriod: ReportBreakdownItem[]
  entriesBySourceInPeriod: ReportBreakdownItem[]
}

export interface IntegratedReportData {
  period: ReportPeriod
  visibleModules: ReportModuleKey[]
  animals?: AnimalReportData
  health?: HealthReportData
  land?: LandReportData
  crops?: CropReportData
  machines?: MachineReportData
  inventory?: InventoryReportData
  finance?: FinanceReportData
  agenda?: AgendaReportData
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const DAYS_IN_MONTH_COMMON:
  readonly number[] = [
    31,
    28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]

function isLeapYear(
  year: number,
): boolean {
  return (
    year % 400 === 0 ||
    (
      year % 4 === 0 &&
      year % 100 !== 0
    )
  )
}

function isValidIsoDate(
  value: string,
): boolean {
  if (!ISO_DATE_RE.test(value)) {
    return false
  }

  const year =
    Number(value.slice(0, 4))

  const month =
    Number(value.slice(5, 7))

  const day =
    Number(value.slice(8, 10))

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

  if (day < 1) {
    return false
  }

  const daysInMonth =
    month === 2 &&
    isLeapYear(year)
      ? 29
      : DAYS_IN_MONTH_COMMON[
          month - 1
        ]

  return day <= daysInMonth
}

function isInPeriod(
  dateValue: string | undefined,
  period: ReportPeriod,
): boolean {
  if (!dateValue) {
    return false
  }

  const date =
    dateValue.slice(0, 10)

  if (!isValidIsoDate(date)) {
    return false
  }

  if (
    period.startDate &&
    date < period.startDate
  ) {
    return false
  }

  if (
    period.endDate &&
    date > period.endDate
  ) {
    return false
  }

  return true
}

function sortBreakdown(
  items: ReportBreakdownItem[],
): ReportBreakdownItem[] {
  return [...items].sort(
    (a, b) => {
      if (
        b.value !== a.value
      ) {
        return (
          b.value - a.value
        )
      }

      return a.label.localeCompare(
        b.label,
        'pt-BR',
      )
    },
  )
}

function groupCount(
  values: string[],
): ReportBreakdownItem[] {
  const map =
    new Map<string, number>()

  for (const value of values) {
    if (!value) continue

    map.set(
      value,
      (
        map.get(value) ??
        0
      ) + 1,
    )
  }

  return sortBreakdown(
    Array.from(
      map.entries(),
    ).map(
      ([label, value]) => ({
        label,
        value,
      }),
    ),
  )
}

function groupSum<T>(
  items: T[],
  getLabel: (item: T) => string,
  getValue: (item: T) => number,
): ReportBreakdownItem[] {
  const map =
    new Map<string, number>()

  for (const item of items) {
    const label =
      getLabel(item)

    const value =
      getValue(item)

    if (!label) continue
    if (!Number.isFinite(value)) {
      continue
    }

    map.set(
      label,
      (
        map.get(label) ??
        0
      ) + value,
    )
  }

  return sortBreakdown(
    Array.from(
      map.entries(),
    ).map(
      ([label, value]) => ({
        label,
        value,
      }),
    ),
  )
}

function originModuleLabel(
  module:
    FinancialTransactionOriginModule,
): string {
  switch (module) {
    case 'health':
      return 'Saúde Animal'
    case 'crops':
      return 'Cultivos'
    case 'machines':
      return 'Máquinas'
    case 'inventory':
      return 'Estoque'
    default:
      return 'Outro'
  }
}

export function validateReportPeriod(
  period: ReportPeriod,
): void {
  if (
    period.startDate !==
      undefined &&
    !isValidIsoDate(
      period.startDate,
    )
  ) {
    throw new Error(
      'Data inicial do relatório inválida.',
    )
  }

  if (
    period.endDate !==
      undefined &&
    !isValidIsoDate(
      period.endDate,
    )
  ) {
    throw new Error(
      'Data final do relatório inválida.',
    )
  }

  if (
    period.startDate !==
      undefined &&
    period.endDate !==
      undefined &&
    period.startDate >
      period.endDate
  ) {
    throw new Error(
      'Data inicial não pode ser posterior à data final.',
    )
  }
}

function buildAnimalReport():
  AnimalReportData {
  const animals = getAnimals()

  return {
    total: animals.length,
    active:
      animals.filter(
        animal =>
          animal.status ===
          'Ativo',
      ).length,
    byStatus:
      groupCount(
        animals.map(
          animal =>
            animal.status,
        ),
      ),
    bySpecies:
      groupCount(
        animals.map(
          animal =>
            animal.species,
        ),
      ),
    byCategory:
      groupCount(
        animals.map(
          animal =>
            animal.category,
        ),
      ),
    bySex:
      groupCount(
        animals.map(
          animal =>
            animal.sex,
        ),
      ),
  }
}

function buildHealthReport(
  period: ReportPeriod,
): HealthReportData {
  const vaccinations =
    getVaccinations()

  const treatments =
    getTreatments()

  const occurrences =
    getHealthOccurrences()

  const vaccinationStatuses =
    vaccinations.map(
      vaccination =>
        getVaccinationStatus(
          vaccination,
        ),
    )

  const vaccinationStatusCurrent =
    groupCount(
      vaccinationStatuses,
    )

  const pendingVaccinationsCurrent =
    vaccinationStatuses.filter(
      status =>
        status === 'Próxima' ||
        status === 'Vencida',
    ).length

  const ongoingTreatmentsCurrent =
    treatments.filter(
      treatment =>
        treatment.status ===
        'Em andamento',
    ).length

  const openOccurrences =
    occurrences.filter(
      occurrence =>
        occurrence.status ===
        'Aberta',
    )

  const openOccurrencesBySeverity =
    groupCount(
      openOccurrences.map(
        occurrence =>
          occurrence.severity,
      ),
    )

  const vaccinationsInPeriod =
    vaccinations.filter(
      vaccination =>
        isInPeriod(
          vaccination.applicationDate,
          period,
        ),
    ).length

  const treatmentsInPeriod =
    treatments.filter(
      treatment =>
        isInPeriod(
          treatment.startDate,
          period,
        ),
    ).length

  const occurrencesInPeriod =
    occurrences.filter(
      occurrence =>
        isInPeriod(
          occurrence.date,
          period,
        ),
    ).length

  return {
    pendingVaccinationsCurrent,
    ongoingTreatmentsCurrent,
    openOccurrencesCurrent:
      openOccurrences.length,
    vaccinationsInPeriod,
    treatmentsInPeriod,
    occurrencesInPeriod,
    vaccinationStatusCurrent,
    openOccurrencesBySeverity,
  }
}

function buildLandReport(
  period: ReportPeriod,
): LandReportData {
  const areas = getLandAreas()

  const landUseRecords =
    getLandUseRecords()

  const recordsInPeriod =
    landUseRecords.filter(
      record =>
        isInPeriod(
          record.startDate,
          period,
        ),
    )

  return {
    totalAreas:
      areas.length,
    totalHectares:
      getTotalRegisteredHectares(),
    paddockCount:
      getPaddockCount(),
    occupiedPaddocks:
      getOccupiedPaddockCount(),
    availablePaddocks:
      getAvailablePaddockCount(),
    byType:
      groupCount(
        areas.map(
          area =>
            area.type,
        ),
      ),
    byStatus:
      groupCount(
        areas.map(
          area =>
            area.status,
        ),
      ),
    landUseRecordsInPeriod:
      recordsInPeriod.length,
    landUseByTypeInPeriod:
      groupCount(
        recordsInPeriod.map(
          record =>
            record.type,
        ),
      ),
  }
}

function buildCropReport(
  period: ReportPeriod,
): CropReportData {
  const cycles =
    getCropCycles()

  const managements =
    getCropManagements()

  const harvests =
    getHarvestRecords()

  const managementsInPeriodArr =
    managements.filter(
      management =>
        isInPeriod(
          management.date,
          period,
        ),
    )

  const harvestsInPeriodArr =
    harvests.filter(
      harvest =>
        isInPeriod(
          harvest.harvestDate,
          period,
        ),
    )

  const cycleById = new Map(
    cycles.map(cycle => [
      cycle.id,
      cycle,
    ]),
  )

  let totalProductionKg = 0

  let totalHarvestedAreaHectares =
    0

  for (
    const harvest of
      harvestsInPeriodArr
  ) {
    const kg =
      getHarvestProductionKg(
        harvest,
      )

    if (Number.isFinite(kg)) {
      totalProductionKg += kg
    }

    const area =
      harvest.harvestedAreaHectares

    if (
      Number.isFinite(area)
    ) {
      totalHarvestedAreaHectares +=
        area
    }
  }

  const productivityKgPerHectare =
    totalHarvestedAreaHectares >
    0
      ? totalProductionKg /
        totalHarvestedAreaHectares
      : 0

  const productionByCropKg =
    groupSum(
      harvestsInPeriodArr,
      harvest =>
        cycleById.get(
          harvest.cropCycleId,
        )?.crop ??
        'Cultivo não encontrado',
      harvest =>
        getHarvestProductionKg(
          harvest,
        ),
    )

  return {
    totalCycles:
      cycles.length,
    plannedCycles:
      cycles.filter(
        cycle =>
          cycle.status ===
          'Planejado',
      ).length,
    activeCycles:
      cycles.filter(
        cycle =>
          cycle.status ===
          'Em andamento',
      ).length,
    completedCycles:
      cycles.filter(
        cycle =>
          cycle.status ===
          'Concluído',
      ).length,
    cancelledCycles:
      cycles.filter(
        cycle =>
          cycle.status ===
          'Cancelado',
      ).length,
    harvestsInPeriod:
      harvestsInPeriodArr.length,
    managementsInPeriod:
      managementsInPeriodArr.length,
    totalProductionKg,
    totalHarvestedAreaHectares,
    productivityKgPerHectare,
    cyclesByStatus:
      groupCount(
        cycles.map(
          cycle =>
            cycle.status,
        ),
      ),
    productionByCropKg,
    managementsByTypeInPeriod:
      groupCount(
        managementsInPeriodArr.map(
          management =>
            management.type,
        ),
      ),
  }
}

function buildMachineReport(
  period: ReportPeriod,
): MachineReportData {
  const machines =
    getMachines()

  const usages =
    getMachineUsageRecords()

  const maintenances =
    getMachineMaintenanceRecords()

  const usagesInPeriod =
    usages.filter(
      usage =>
        isInPeriod(
          usage.operationDate,
          period,
        ),
    )

  const maintenancesInPeriod =
    maintenances.filter(
      maintenance =>
        isInPeriod(
          maintenance.maintenanceDate,
          period,
        ),
    )

  let workedHoursInPeriod = 0

  for (
    const usage of
      usagesInPeriod
  ) {
    if (
      Number.isFinite(
        usage.workedHours,
      )
    ) {
      workedHoursInPeriod +=
        usage.workedHours
    }
  }

  return {
    totalMachines:
      machines.length,
    operationalMachines:
      machines.filter(
        machine =>
          machine.status ===
          'Operacional',
      ).length,
    maintenanceMachines:
      machines.filter(
        machine =>
          machine.status ===
          'Em manutenção',
      ).length,
    inactiveMachines:
      machines.filter(
        machine =>
          machine.status ===
          'Inativa',
      ).length,
    usageRecordsInPeriod:
      usagesInPeriod.length,
    workedHoursInPeriod,
    maintenanceRecordsInPeriod:
      maintenancesInPeriod.length,
    byCategory:
      groupCount(
        machines.map(
          machine =>
            machine.category,
        ),
      ),
    operationHoursByTypeInPeriod:
      groupSum(
        usagesInPeriod,
        usage =>
          usage.operationType,
        usage =>
          usage.workedHours,
      ),
    maintenanceByTypeInPeriod:
      groupCount(
        maintenancesInPeriod.map(
          maintenance =>
            maintenance.type,
        ),
      ),
  }
}

function buildInventoryReport(
  period: ReportPeriod,
): InventoryReportData {
  const items =
    getInventoryItems()

  const movements =
    getInventoryMovements()

  let belowMinimumCurrent = 0
  let expiredCurrent = 0
  let expiringSoonCurrent = 0

  for (const item of items) {
    if (
      isBelowMinimum(item)
    ) {
      belowMinimumCurrent += 1
    }

    const expStatus =
      getExpirationStatus(
        item.expirationDate,
      )

    if (
      expStatus === 'Vencido'
    ) {
      expiredCurrent += 1
    } else if (
      expStatus ===
      'Vence em breve'
    ) {
      expiringSoonCurrent += 1
    }
  }

  const movementsInPeriod =
    movements.filter(
      movement =>
        isInPeriod(
          movement.movementDate,
          period,
        ),
    )

  const movementsByOriginInPeriod =
    groupCount(
      movementsInPeriod
        .filter(
          movement =>
            movement.origin !==
            undefined,
        )
        .map(
          movement =>
            originModuleLabel(
              movement.origin!
                .module,
            ),
        ),
    )

  return {
    totalItems: items.length,
    activeItems:
      items.filter(
        item =>
          item.status === 'Ativo',
      ).length,
    belowMinimumCurrent,
    expiredCurrent,
    expiringSoonCurrent,
    movementsInPeriod:
      movementsInPeriod.length,
    entriesInPeriod:
      movementsInPeriod.filter(
        movement =>
          movement.type ===
          'Entrada',
      ).length,
    exitsInPeriod:
      movementsInPeriod.filter(
        movement =>
          movement.type ===
          'Saída',
      ).length,
    itemsByCategory:
      groupCount(
        items.map(
          item =>
            item.category,
        ),
      ),
    movementsByTypeInPeriod:
      groupCount(
        movementsInPeriod.map(
          movement =>
            movement.type,
        ),
      ),
    movementsByOriginInPeriod,
  }
}

function buildFinanceReport(
  period: ReportPeriod,
): FinanceReportData {
  const transactions =
    getFinancialTransactionsInPeriod(
      period.startDate,
      period.endDate,
    )

  const categories =
    getFinancialCategories()

  const categoryById = new Map(
    categories.map(category => [
      category.id,
      category,
    ]),
  )

  let revenues = 0
  let expenses = 0

  const revenueItems:
    ReportAmountBreakdownItem[] =
    []

  const expenseItems:
    ReportAmountBreakdownItem[] =
    []

  const expenseByOriginMap =
    new Map<string, number>()

  for (
    const transaction of
      transactions
  ) {
    if (
      !Number.isFinite(
        transaction.amount,
      )
    ) {
      continue
    }

    const label =
      categoryById.get(
        transaction.categoryId,
      )?.name ??
      'Categoria não encontrada'

    if (
      transaction.type ===
      'Receita'
    ) {
      revenues +=
        transaction.amount

      revenueItems.push({
        label,
        value:
          transaction.amount,
      })
    } else if (
      transaction.type ===
      'Despesa'
    ) {
      expenses +=
        transaction.amount

      expenseItems.push({
        label,
        value:
          transaction.amount,
      })

      if (transaction.origin) {
        const originLabel =
          originModuleLabel(
            transaction.origin.module,
          )

        expenseByOriginMap.set(
          originLabel,
          (
            expenseByOriginMap.get(
              originLabel,
            ) ?? 0
          ) +
            transaction.amount,
        )
      }
    }
  }

  const revenueByCategory =
    groupSum(
      revenueItems,
      item =>
        item.label,
      item =>
        item.value,
    )

  const expenseByCategory =
    groupSum(
      expenseItems,
      item =>
        item.label,
      item =>
        item.value,
    )

  const expensesByOriginInPeriod:
    ReportAmountBreakdownItem[] =
    Array.from(
      expenseByOriginMap.entries(),
    )
      .map(
        ([label, value]) => ({
          label,
          value,
        }),
      )
      .sort((a, b) => {
        if (
          b.value !== a.value
        ) {
          return (
            b.value - a.value
          )
        }

        return a.label.localeCompare(
          b.label,
          'pt-BR',
        )
      })

  return {
    revenues,
    expenses,
    balance:
      revenues - expenses,
    transactionsCount:
      transactions.length,
    revenueByCategory,
    expenseByCategory,
    expensesByOriginInPeriod,
  }
}

function buildAgendaReport(
  user: User,
  period: ReportPeriod,
): AgendaReportData {
  const entries =
    getAgendaEntriesForUser(user)

  const alerts =
    getAlertsForUser(user)

  const entriesInPeriod =
    entries.filter(
      entry =>
        isInPeriod(
          entry.date,
          period,
        ),
    )

  return {
    entriesInPeriod:
      entriesInPeriod.length,
    pendingInPeriod:
      entriesInPeriod.filter(
        entry =>
          entry.status ===
          'Pendente',
      ).length,
    overdueInPeriod:
      entriesInPeriod.filter(
        entry =>
          entry.status ===
          'Atrasada',
      ).length,
    completedInPeriod:
      entriesInPeriod.filter(
        entry =>
          entry.status ===
          'Concluída',
      ).length,
    cancelledInPeriod:
      entriesInPeriod.filter(
        entry =>
          entry.status ===
          'Cancelada',
      ).length,
    currentAlerts:
      alerts.length,
    urgentAlertsCurrent:
      alerts.filter(
        alert =>
          alert.severity ===
          'Urgente',
      ).length,
    attentionAlertsCurrent:
      alerts.filter(
        alert =>
          alert.severity ===
          'Atenção',
      ).length,
    informationalAlertsCurrent:
      alerts.filter(
        alert =>
          alert.severity ===
          'Informativo',
      ).length,
    entriesByTypeInPeriod:
      groupCount(
        entriesInPeriod.map(
          entry =>
            entry.type,
        ),
      ),
    entriesBySourceInPeriod:
      groupCount(
        entriesInPeriod.map(
          entry =>
            entry.sourceLabel,
        ),
      ),
  }
}

export function getIntegratedReportData(
  user: User | null,
  period: ReportPeriod,
): IntegratedReportData {
  const result:
    IntegratedReportData = {
      period,
      visibleModules: [],
    }

  if (!user) return result

  if (
    !userHasPermission(
      user,
      'reports',
    )
  ) {
    return result
  }

  validateReportPeriod(period)

  if (
    userHasPermission(
      user,
      'animals',
    )
  ) {
    result.animals =
      buildAnimalReport()

    result.visibleModules.push(
      'animals',
    )
  }

  if (
    userHasPermission(
      user,
      'health',
    )
  ) {
    result.health =
      buildHealthReport(
        period,
      )

    result.visibleModules.push(
      'health',
    )
  }

  if (
    userHasPermission(
      user,
      'land',
    )
  ) {
    result.land =
      buildLandReport(
        period,
      )

    result.visibleModules.push(
      'land',
    )
  }

  if (
    userHasPermission(
      user,
      'crops',
    )
  ) {
    result.crops =
      buildCropReport(
        period,
      )

    result.visibleModules.push(
      'crops',
    )
  }

  if (
    userHasPermission(
      user,
      'machines',
    )
  ) {
    result.machines =
      buildMachineReport(
        period,
      )

    result.visibleModules.push(
      'machines',
    )
  }

  if (
    userHasPermission(
      user,
      'inventory',
    )
  ) {
    result.inventory =
      buildInventoryReport(
        period,
      )

    result.visibleModules.push(
      'inventory',
    )
  }

  if (
    userHasPermission(
      user,
      'finance',
    )
  ) {
    result.finance =
      buildFinanceReport(
        period,
      )

    result.visibleModules.push(
      'finance',
    )
  }

  if (
    userHasPermission(
      user,
      'agenda',
    )
  ) {
    result.agenda =
      buildAgendaReport(
        user,
        period,
      )

    result.visibleModules.push(
      'agenda',
    )
  }

  return result
}