import {
  IntelligenceAnswer,
  IntelligenceAnswerItem,
  IntelligenceDataQualityIssue,
  IntelligenceInsight,
  IntelligenceMetricSummary,
  IntelligenceModule,
  IntelligenceQuestion,
  IntelligenceSeverity,
  PermissionKey,
  User,
} from '../types'
import { userHasPermission } from './permissionService'
import { getAnimals } from './animalService'
import {
  getHealthOccurrences,
  getTreatments,
  getVaccinations,
  getVaccinationStatus,
} from './healthService'
import { getLandAreas } from './landService'
import {
  getActivePaddockOccupations,
  getCurrentOccupationDays,
} from './paddockOccupationService'
import { getCropCycles } from './cropService'
import { getMachines } from './machineService'
import {
  getInventoryItems,
  isBelowMinimum,
} from './inventoryService'
import {
  getFinancialCategories,
  getFinancialTransactions,
} from './financeService'
import { getAgendaEntriesForUser } from './agendaService'
import {
  calculateGeographicAreaHectares,
  getLandAreaGeographicBoundaries,
  getPropertyGeographicBoundary,
} from './propertyMapService'
import {
  addDaysToCivilDate,
  getExpirationStatus,
  todayDateString,
} from '../utils/date'
import { formatCurrencyBRL, formatDate } from '../utils/format'

// -------------------- Constantes públicas --------------------

const MODULE_LABELS: Record<IntelligenceModule, string> = {
  animals: 'Animais',
  health: 'Saúde Animal',
  land: 'Terras',
  crops: 'Cultivos',
  machines: 'Máquinas',
  inventory: 'Estoque',
  finance: 'Financeiro',
  agenda: 'Agenda',
  map: 'Mapa',
}

const MODULE_PERMISSIONS: Record<IntelligenceModule, PermissionKey> = {
  animals: 'animals',
  health: 'health',
  land: 'land',
  crops: 'crops',
  machines: 'machines',
  inventory: 'inventory',
  finance: 'finance',
  agenda: 'agenda',
  map: 'map',
}

const SEVERITY_RANK: Record<IntelligenceSeverity, number> = {
  critical: 0,
  warning: 1,
  opportunity: 2,
  information: 3,
}

const ALL_MODULES: IntelligenceModule[] = [
  'animals',
  'health',
  'land',
  'crops',
  'machines',
  'inventory',
  'finance',
  'agenda',
  'map',
]

export const INTELLIGENCE_QUESTIONS: IntelligenceQuestion[] = [
  { id: 'attention', label: 'O que precisa da minha atenção hoje?' },
  { id: 'inventory', label: 'Como está meu estoque?' },
  { id: 'animals', label: 'Como estão os animais?' },
  { id: 'health', label: 'Como está a saúde animal?' },
  { id: 'crops', label: 'Como estão os cultivos?' },
  { id: 'machines', label: 'Como estão as máquinas?' },
  { id: 'finance', label: 'Como está o financeiro?' },
  { id: 'land', label: 'Como estão as terras?' },
  { id: 'map', label: 'Como está a propriedade no mapa?' },
]

// -------------------- Helpers internos --------------------

function hasIntelligenceAccess(user: User | null): boolean {
  if (!user) return false
  return userHasPermission(user, 'intelligence')
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const DAYS_IN_MONTH_COMMON: readonly number[] = [
  31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
]

function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)
}

function isValidCivilDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false

  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false
  }

  if (month < 1 || month > 12) return false
  if (day < 1) return false

  const maxDay =
    month === 2 && isLeapYear(year)
      ? 29
      : DAYS_IN_MONTH_COMMON[month - 1]

  return day <= maxDay
}

function safeFormatDate(value: string | undefined): string {
  if (!value) return 'data não informada'
  if (!isValidCivilDate(value)) return 'data inválida'

  try {
    return formatDate(value)
  } catch {
    return 'data inválida'
  }
}

function formatHectares(value: number): string {
  if (!Number.isFinite(value)) return '0,00 ha'

  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ha`
}

function formatSquareMeters(value: number): string {
  if (!Number.isFinite(value)) return '0,00 m²'

  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m²`
}

function hectaresToSquareMeters(hectares: number): number {
  if (!Number.isFinite(hectares)) return 0
  return hectares * 10000
}

function getExpirationStatusSafe(
  expirationDate: string | undefined,
): 'Vencido' | 'Vence em breve' | 'Ok' | 'Sem validade' {
  if (!expirationDate) return 'Sem validade'
  if (!isValidCivilDate(expirationDate)) return 'Ok'

  try {
    const status = getExpirationStatus(expirationDate)

    if (status === 'Vencido') return 'Vencido'
    if (status === 'Vence em breve') return 'Vence em breve'

    return 'Ok'
  } catch {
    return 'Ok'
  }
}

function sortInsights(
  insights: IntelligenceInsight[],
): IntelligenceInsight[] {
  return [...insights].sort((a, b) => {
    const d = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]

    if (d !== 0) return d

    const t = a.title.localeCompare(b.title, 'pt-BR')

    if (t !== 0) return t

    return a.id.localeCompare(b.id, 'pt-BR')
  })
}

// -------------------- Builders por módulo --------------------

function buildAnimalInsights(): IntelligenceInsight[] {
  const animals = getAnimals()

  if (animals.length === 0) return []

  const active = animals.filter(
    animal => animal.status === 'Ativo',
  ).length

  return [
    {
      id: 'animals-summary',
      title: 'Resumo do rebanho',
      description: `${animals.length} animais cadastrados, ${active} ativos.`,
      severity: 'information',
      module: 'animals',
      moduleLabel: MODULE_LABELS.animals,
      explanation: `Total de animais cadastrados: ${animals.length}. Animais com situação "Ativo": ${active}.`,
      sourcePath: '/animais',
    },
  ]
}

function buildHealthInsights(): IntelligenceInsight[] {
  const insights: IntelligenceInsight[] = []
  const today = todayDateString()
  const sevenDays = addDaysToCivilDate(today, 7)

  const vaccinations = getVaccinations()

  for (const vaccination of vaccinations) {
    const status = getVaccinationStatus(vaccination)

    if (status === 'Vencida') {
      insights.push({
        id: `health-vacc-overdue-${vaccination.id}`,
        title: 'Vacinação vencida',
        description: `${vaccination.vaccineName} está vencida desde ${safeFormatDate(
          vaccination.nextDoseDate,
        )}.`,
        severity: 'critical',
        module: 'health',
        moduleLabel: MODULE_LABELS.health,
        explanation: `A próxima dose desta vacinação estava prevista para ${safeFormatDate(
          vaccination.nextDoseDate,
        )} e essa data já passou.`,
        sourceRecordId: vaccination.id,
        sourcePath: '/saude-animal/vacinacoes',
      })
    } else if (status === 'Próxima') {
      insights.push({
        id: `health-vacc-due-${vaccination.id}`,
        title: 'Vacinação próxima',
        description: `${vaccination.vaccineName} tem próxima dose prevista em breve.`,
        severity: 'warning',
        module: 'health',
        moduleLabel: MODULE_LABELS.health,
        explanation: `A próxima dose desta vacinação está prevista para ${safeFormatDate(
          vaccination.nextDoseDate,
        )}.`,
        sourceRecordId: vaccination.id,
        sourcePath: '/saude-animal/vacinacoes',
      })
    }
  }

  const treatments = getTreatments()
  let ongoingTreatments = 0

  for (const treatment of treatments) {
    if (treatment.status !== 'Em andamento') continue

    ongoingTreatments += 1

    if (!treatment.endDate) continue
    if (!isValidCivilDate(treatment.endDate)) continue

    if (treatment.endDate < today) {
      insights.push({
        id: `health-treatment-overdue-${treatment.id}`,
        title: 'Tratamento com prazo vencido',
        description: treatment.reason,
        severity: 'critical',
        module: 'health',
        moduleLabel: MODULE_LABELS.health,
        explanation: `Este tratamento está em andamento com prazo previsto para ${safeFormatDate(
          treatment.endDate,
        )}, que já passou.`,
        sourceRecordId: treatment.id,
        sourcePath: '/saude-animal/tratamentos',
      })
    } else if (treatment.endDate <= sevenDays) {
      insights.push({
        id: `health-treatment-due-${treatment.id}`,
        title: 'Tratamento terminando em breve',
        description: treatment.reason,
        severity: 'warning',
        module: 'health',
        moduleLabel: MODULE_LABELS.health,
        explanation: `Este tratamento está em andamento e o prazo previsto (${safeFormatDate(
          treatment.endDate,
        )}) está nos próximos 7 dias.`,
        sourceRecordId: treatment.id,
        sourcePath: '/saude-animal/tratamentos',
      })
    }
  }

  if (ongoingTreatments > 0) {
    insights.push({
      id: 'health-treatments-ongoing',
      title: 'Tratamentos em andamento',
      description: `${ongoingTreatments} tratamento(s) em andamento.`,
      severity: 'information',
      module: 'health',
      moduleLabel: MODULE_LABELS.health,
      explanation: `Existem ${ongoingTreatments} tratamentos registrados com situação "Em andamento".`,
      sourcePath: '/saude-animal/tratamentos',
    })
  }

  const occurrences = getHealthOccurrences()

  const openOccurrences = occurrences.filter(
    occurrence => occurrence.status === 'Aberta',
  )

  const highOpen = openOccurrences.filter(
    occurrence => occurrence.severity === 'Alta',
  )

  const midOpen = openOccurrences.filter(
    occurrence => occurrence.severity === 'Média',
  )

  const lowOpen = openOccurrences.filter(
    occurrence => occurrence.severity === 'Baixa',
  )

  if (highOpen.length > 0) {
    insights.push({
      id: 'health-occurrences-high-open',
      title: 'Ocorrências abertas de severidade Alta',
      description: `${highOpen.length} ocorrência(s) aberta(s) de severidade Alta.`,
      severity: 'critical',
      module: 'health',
      moduleLabel: MODULE_LABELS.health,
      explanation: `Existem ${highOpen.length} ocorrências clínicas com situação "Aberta" e severidade "Alta" registradas no módulo de Saúde Animal.`,
      sourcePath: '/saude-animal/ocorrencias',
    })
  }

  if (midOpen.length > 0) {
    insights.push({
      id: 'health-occurrences-mid-open',
      title: 'Ocorrências abertas de severidade Média',
      description: `${midOpen.length} ocorrência(s) aberta(s) de severidade Média.`,
      severity: 'warning',
      module: 'health',
      moduleLabel: MODULE_LABELS.health,
      explanation: `Existem ${midOpen.length} ocorrências clínicas com situação "Aberta" e severidade "Média" registradas no módulo de Saúde Animal.`,
      sourcePath: '/saude-animal/ocorrencias',
    })
  }

  if (lowOpen.length > 0) {
    insights.push({
      id: 'health-occurrences-low-open',
      title: 'Ocorrências abertas de severidade Baixa',
      description: `${lowOpen.length} ocorrência(s) aberta(s) de severidade Baixa.`,
      severity: 'information',
      module: 'health',
      moduleLabel: MODULE_LABELS.health,
      explanation: `Existem ${lowOpen.length} ocorrências clínicas com situação "Aberta" e severidade "Baixa" registradas no módulo de Saúde Animal.`,
      sourcePath: '/saude-animal/ocorrencias',
    })
  }

  return insights
}

function buildInventoryInsights(): IntelligenceInsight[] {
  const items = getInventoryItems()

  if (items.length === 0) return []

  const insights: IntelligenceInsight[] = []

  for (const item of items) {
    if (item.status === 'Inativo') continue

    const expirationStatus = getExpirationStatusSafe(
      item.expirationDate,
    )

    if (expirationStatus === 'Vencido') {
      insights.push({
        id: `inventory-expired-${item.id}`,
        title: 'Produto vencido',
        description: `${item.code} — ${item.name} está vencido.`,
        severity: 'critical',
        module: 'inventory',
        moduleLabel: MODULE_LABELS.inventory,
        explanation: `A validade cadastrada para este item é ${safeFormatDate(
          item.expirationDate,
        )}.`,
        sourceRecordId: item.id,
        sourcePath: `/estoque/${item.id}`,
      })
    } else if (expirationStatus === 'Vence em breve') {
      insights.push({
        id: `inventory-expiring-${item.id}`,
        title: 'Produto próximo da validade',
        description: `${item.code} — ${item.name} está próximo do vencimento.`,
        severity: 'warning',
        module: 'inventory',
        moduleLabel: MODULE_LABELS.inventory,
        explanation: `A validade cadastrada para este item é ${safeFormatDate(
          item.expirationDate,
        )}.`,
        sourceRecordId: item.id,
        sourcePath: `/estoque/${item.id}`,
      })
    }

    if (item.currentQuantity === 0) {
      insights.push({
        id: `inventory-zero-${item.id}`,
        title: 'Item zerado',
        description: `${item.code} — ${item.name} está sem quantidade em estoque.`,
        severity: 'critical',
        module: 'inventory',
        moduleLabel: MODULE_LABELS.inventory,
        explanation: `A quantidade atual registrada para este item é 0 ${item.unit}.`,
        sourceRecordId: item.id,
        sourcePath: `/estoque/${item.id}`,
      })
    } else if (isBelowMinimum(item)) {
      insights.push({
        id: `inventory-low-${item.id}`,
        title: 'Estoque abaixo do mínimo',
        description: `${item.code} — ${item.name} possui ${item.currentQuantity} ${item.unit} disponíveis.`,
        severity: 'warning',
        module: 'inventory',
        moduleLabel: MODULE_LABELS.inventory,
        explanation: `O estoque mínimo cadastrado para este item é ${item.minimumQuantity} ${item.unit}. A quantidade atual está abaixo desse nível.`,
        sourceRecordId: item.id,
        sourcePath: `/estoque/${item.id}`,
      })
    }
  }

  return insights
}

function buildAgendaInsights(
  user: User,
): IntelligenceInsight[] {
  const entries = getAgendaEntriesForUser(user).filter(
    entry => entry.source === 'manual',
  )

  if (entries.length === 0) return []

  const today = todayDateString()
  const insights: IntelligenceInsight[] = []

  for (const entry of entries) {
    if (
      entry.status === 'Concluída' ||
      entry.status === 'Cancelada'
    ) {
      continue
    }

    const isLate = entry.status === 'Atrasada'
    const isToday = entry.date === today
    const isFuture = entry.date > today
    const isPending = entry.status === 'Pendente'
    const isHighPriority = entry.priority === 'Alta'

    if (isLate) {
      if (isHighPriority) {
        insights.push({
          id: `agenda-overdue-high-${entry.id}`,
          title: 'Atividade atrasada (prioridade Alta)',
          description: entry.title,
          severity: 'critical',
          module: 'agenda',
          moduleLabel: MODULE_LABELS.agenda,
          explanation: `Esta atividade estava prevista para ${safeFormatDate(
            entry.date,
          )} e continua pendente com prioridade Alta.`,
          sourceRecordId:
            entry.sourceRecordId ?? entry.id,
          sourcePath:
            entry.sourcePath ?? '/agenda',
        })
      } else {
        insights.push({
          id: `agenda-overdue-${entry.id}`,
          title: 'Atividade atrasada',
          description: entry.title,
          severity: 'warning',
          module: 'agenda',
          moduleLabel: MODULE_LABELS.agenda,
          explanation: `Esta atividade estava prevista para ${safeFormatDate(
            entry.date,
          )} e ainda não foi concluída.`,
          sourceRecordId:
            entry.sourceRecordId ?? entry.id,
          sourcePath:
            entry.sourcePath ?? '/agenda',
        })
      }

      continue
    }

    if (isToday) {
      if (isHighPriority) {
        insights.push({
          id: `agenda-today-high-${entry.id}`,
          title: 'Atividade de alta prioridade para hoje',
          description: entry.title,
          severity: 'warning',
          module: 'agenda',
          moduleLabel: MODULE_LABELS.agenda,
          explanation:
            'Esta atividade está marcada para hoje com prioridade Alta.',
          sourceRecordId:
            entry.sourceRecordId ?? entry.id,
          sourcePath:
            entry.sourcePath ?? '/agenda',
        })
      } else {
        insights.push({
          id: `agenda-today-${entry.id}`,
          title: 'Atividade para hoje',
          description: entry.title,
          severity: 'information',
          module: 'agenda',
          moduleLabel: MODULE_LABELS.agenda,
          explanation:
            'Esta atividade está marcada para hoje.',
          sourceRecordId:
            entry.sourceRecordId ?? entry.id,
          sourcePath:
            entry.sourcePath ?? '/agenda',
        })
      }

      continue
    }

    if (
      isFuture &&
      isPending &&
      isHighPriority
    ) {
      insights.push({
        id: `agenda-future-high-${entry.id}`,
        title: 'Atividade futura de alta prioridade',
        description: entry.title,
        severity: 'warning',
        module: 'agenda',
        moduleLabel: MODULE_LABELS.agenda,
        explanation:
          'Esta atividade está marcada como prioridade Alta e ainda está pendente.',
        sourceRecordId:
          entry.sourceRecordId ?? entry.id,
        sourcePath:
          entry.sourcePath ?? '/agenda',
      })
    }
  }

  return insights
}

function buildCropInsights(): IntelligenceInsight[] {
  const cycles = getCropCycles()

  if (cycles.length === 0) return []

  const insights: IntelligenceInsight[] = []
  const today = todayDateString()
  const sevenDays = addDaysToCivilDate(today, 7)

  const active = cycles.filter(
    cycle => cycle.status === 'Em andamento',
  )

  const planned = cycles.filter(
    cycle => cycle.status === 'Planejado',
  )

  if (active.length > 0) {
    insights.push({
      id: 'crops-active',
      title: 'Cultivos em andamento',
      description: `${active.length} ciclo(s) em andamento.`,
      severity: 'information',
      module: 'crops',
      moduleLabel: MODULE_LABELS.crops,
      explanation: `Existem ${active.length} ciclos de cultivo com situação "Em andamento" registrados.`,
      sourcePath: '/cultivos',
    })
  }

  if (planned.length > 0) {
    insights.push({
      id: 'crops-planned',
      title: 'Cultivos planejados',
      description: `${planned.length} ciclo(s) planejado(s).`,
      severity: 'information',
      module: 'crops',
      moduleLabel: MODULE_LABELS.crops,
      explanation: `Existem ${planned.length} ciclos de cultivo com situação "Planejado" registrados.`,
      sourcePath: '/cultivos',
    })
  }

  for (const cycle of planned) {
    if (!cycle.plantingDate) continue

    if (!isValidCivilDate(cycle.plantingDate)) {
      continue
    }

    if (cycle.plantingDate < today) {
      insights.push({
        id: `crops-planting-overdue-${cycle.id}`,
        title: 'Plantio planejado em atraso',
        description: `${cycle.crop} — plantio previsto para ${safeFormatDate(
          cycle.plantingDate,
        )}.`,
        severity: 'warning',
        module: 'crops',
        moduleLabel: MODULE_LABELS.crops,
        explanation:
          'A data de plantio cadastrada para este ciclo já passou e o ciclo ainda está como "Planejado".',
        sourceRecordId: cycle.id,
        sourcePath: `/cultivos/${cycle.id}`,
      })
    } else if (cycle.plantingDate <= sevenDays) {
      insights.push({
        id: `crops-planting-soon-${cycle.id}`,
        title: 'Plantio próximo',
        description: `${cycle.crop} — plantio previsto para ${safeFormatDate(
          cycle.plantingDate,
        )}.`,
        severity: 'opportunity',
        module: 'crops',
        moduleLabel: MODULE_LABELS.crops,
        explanation:
          'A data de plantio cadastrada para este ciclo está nos próximos 7 dias.',
        sourceRecordId: cycle.id,
        sourcePath: `/cultivos/${cycle.id}`,
      })
    }
  }

  for (const cycle of cycles) {
    if (
      cycle.status !== 'Planejado' &&
      cycle.status !== 'Em andamento'
    ) {
      continue
    }

    if (!cycle.expectedHarvestDate) continue

    if (
      !isValidCivilDate(
        cycle.expectedHarvestDate,
      )
    ) {
      continue
    }

    if (
      cycle.expectedHarvestDate <
      today
    ) {
      insights.push({
        id: `crops-harvest-overdue-${cycle.id}`,
        title: 'Colheita prevista vencida',
        description: `${cycle.crop} — colheita prevista para ${safeFormatDate(
          cycle.expectedHarvestDate,
        )}.`,
        severity: 'critical',
        module: 'crops',
        moduleLabel: MODULE_LABELS.crops,
        explanation: `A data prevista para colheita deste ciclo já passou e o ciclo ainda está com situação "${cycle.status}".`,
        sourceRecordId: cycle.id,
        sourcePath: `/cultivos/${cycle.id}`,
      })
    } else if (
      cycle.expectedHarvestDate <=
      sevenDays
    ) {
      insights.push({
        id: `crops-harvest-soon-${cycle.id}`,
        title: 'Colheita próxima',
        description: `${cycle.crop} — colheita prevista para ${safeFormatDate(
          cycle.expectedHarvestDate,
        )}.`,
        severity: 'opportunity',
        module: 'crops',
        moduleLabel: MODULE_LABELS.crops,
        explanation:
          'A data prevista para colheita deste ciclo está nos próximos 7 dias.',
        sourceRecordId: cycle.id,
        sourcePath: `/cultivos/${cycle.id}`,
      })
    }
  }

  return insights
}

function buildMachineInsights(): IntelligenceInsight[] {
  const machines = getMachines()

  if (machines.length === 0) return []

  const insights: IntelligenceInsight[] = []

  const maintenance = machines.filter(
    machine =>
      machine.status === 'Em manutenção',
  )

  const inactive = machines.filter(
    machine =>
      machine.status === 'Inativa',
  )

  if (maintenance.length > 0) {
    insights.push({
      id: 'machines-maintenance',
      title: 'Máquinas em manutenção',
      description: `${maintenance.length} máquina(s) em manutenção.`,
      severity: 'information',
      module: 'machines',
      moduleLabel: MODULE_LABELS.machines,
      explanation: `Existem ${maintenance.length} máquinas cadastradas com situação "Em manutenção".`,
      sourcePath: '/maquinas',
    })
  }

  if (inactive.length > 0) {
    insights.push({
      id: 'machines-inactive',
      title: 'Máquinas inativas',
      description: `${inactive.length} máquina(s) inativas.`,
      severity: 'information',
      module: 'machines',
      moduleLabel: MODULE_LABELS.machines,
      explanation: `Existem ${inactive.length} máquinas cadastradas com situação "Inativa".`,
      sourcePath: '/maquinas',
    })
  }

  return insights
}

function buildFinanceInsights(): IntelligenceInsight[] {
  const transactions = getFinancialTransactions()

  if (transactions.length === 0) return []

  let revenues = 0
  let expenses = 0

  for (const transaction of transactions) {
    if (
      !Number.isFinite(
        transaction.amount,
      )
    ) {
      continue
    }

    if (transaction.type === 'Receita') {
      revenues += transaction.amount
    } else if (
      transaction.type === 'Despesa'
    ) {
      expenses += transaction.amount
    }
  }

  const balance =
    revenues - expenses

  const insights: IntelligenceInsight[] = [
    {
      id: 'finance-summary',
      title: 'Resumo financeiro',
      description: `Receitas ${formatCurrencyBRL(
        revenues,
      )}, despesas ${formatCurrencyBRL(
        expenses,
      )}.`,
      severity: 'information',
      module: 'finance',
      moduleLabel: MODULE_LABELS.finance,
      explanation: `Foram consideradas ${
        transactions.length
      } transações registradas no sistema. Receitas: ${formatCurrencyBRL(
        revenues,
      )}. Despesas: ${formatCurrencyBRL(
        expenses,
      )}. Saldo: ${formatCurrencyBRL(
        balance,
      )}.`,
      sourcePath: '/financeiro',
    },
  ]

  const categories =
    getFinancialCategories()

  const categoryById =
    new Map(
      categories.map(category => [
        category.id,
        category,
      ]),
    )

  const totalsByCategory =
    new Map<string, number>()

  for (
    const transaction of transactions
  ) {
    if (
      transaction.type !==
      'Despesa'
    ) {
      continue
    }

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

    totalsByCategory.set(
      label,
      (
        totalsByCategory.get(label) ??
        0
      ) + transaction.amount,
    )
  }

  let topLabel: string | null =
    null

  let topValue = 0

  for (
    const [
      label,
      value,
    ] of totalsByCategory
  ) {
    if (value > topValue) {
      topValue = value
      topLabel = label
    }
  }

  if (
    topLabel &&
    topValue > 0 &&
    expenses > 0
  ) {
    const percentage =
      (
        topValue /
        expenses
      ) *
      100

    insights.push({
      id: 'finance-top-expense-category',
      title: 'Categoria com maior despesa',
      description: `${topLabel} representa ${percentage.toFixed(
        1,
      )}% das despesas registradas.`,
      severity: 'information',
      module: 'finance',
      moduleLabel: MODULE_LABELS.finance,
      explanation: `Somando todas as despesas cadastradas (${formatCurrencyBRL(
        expenses,
      )}), a categoria ${topLabel} é a que acumula o maior valor: ${formatCurrencyBRL(
        topValue,
      )}.`,
      sourcePath: '/financeiro',
    })
  }

  return insights
}

function buildLandInsights(): IntelligenceInsight[] {
  const areas = getLandAreas()

  if (areas.length === 0) return []

  const insights: IntelligenceInsight[] = []

  const byStatus =
    new Map<string, number>()

  for (const area of areas) {
    byStatus.set(
      area.status,
      (
        byStatus.get(
          area.status,
        ) ?? 0
      ) + 1,
    )
  }

  const statusParts: string[] = []

  for (
    const [
      status,
      count,
    ] of byStatus
  ) {
    statusParts.push(
      `${count} ${status.toLowerCase()}`,
    )
  }

  insights.push({
    id: 'land-summary',
    title: 'Resumo das áreas',
    description: `${areas.length} áreas cadastradas.`,
    severity: 'information',
    module: 'land',
    moduleLabel: MODULE_LABELS.land,
    explanation: `O sistema possui ${areas.length} áreas cadastradas. Situação: ${statusParts.join(
      ', ',
    )}.`,
    sourcePath: '/terras',
  })

  const activeOccupations =
    getActivePaddockOccupations()

  if (
    activeOccupations.length > 0
  ) {
    const details: string[] = []

    for (
      const occupation of
      activeOccupations
    ) {
      const area = areas.find(
        item =>
          item.id ===
          occupation.landAreaId,
      )

      if (!area) continue

      const days =
        getCurrentOccupationDays(
          occupation,
        )

      details.push(
        `${area.code} há ${days} dia(s)`,
      )
    }

    insights.push({
      id: 'land-paddocks-occupied',
      title: 'Piquetes ocupados',
      description: `${activeOccupations.length} piquete(s) ocupado(s).`,
      severity: 'information',
      module: 'land',
      moduleLabel: MODULE_LABELS.land,
      explanation:
        details.length > 0
          ? `Ocupações ativas: ${details.join(
              '; ',
            )}.`
          : `Existem ${activeOccupations.length} ocupações ativas registradas.`,
      sourcePath: '/terras/manejo',
    })
  }

  return insights
}

function buildMapInsights(
  user: User,
): IntelligenceInsight[] {
  const insights: IntelligenceInsight[] = []

  const propertyBoundary =
    getPropertyGeographicBoundary()

  if (!propertyBoundary) {
    insights.push({
      id: 'map-property-no-boundary',
      title:
        'Propriedade sem demarcação geral',
      description:
        'A propriedade ainda não possui polígono delimitado no mapa de satélite.',
      severity: 'information',
      module: 'map',
      moduleLabel:
        MODULE_LABELS.map,
      explanation:
        'Uma demarcação da propriedade permite calcular a área total do imóvel a partir de coordenadas geográficas registradas no mapa de satélite.',
      sourcePath: '/mapa',
    })
  } else {
    const areaHa =
      calculateGeographicAreaHectares(
        propertyBoundary.points,
      )

    const areaM2 =
      hectaresToSquareMeters(
        areaHa,
      )

    insights.push({
      id: 'map-property-area',
      title:
        'Área demarcada da propriedade',
      description: `${formatHectares(
        areaHa,
      )} (${formatSquareMeters(
        areaM2,
      )}).`,
      severity: 'information',
      module: 'map',
      moduleLabel:
        MODULE_LABELS.map,
      explanation: `A área demarcada da propriedade é ${formatHectares(
        areaHa,
      )} (${formatSquareMeters(
        areaM2,
      )}). É uma estimativa calculada a partir do polígono salvo no mapa de satélite e não substitui levantamento topográfico.`,
      sourcePath: '/mapa',
    })
  }

  if (
    userHasPermission(
      user,
      'land',
    )
  ) {
    const areas =
      getLandAreas()

    const areaById =
      new Map(
        areas.map(area => [
          area.id,
          area,
        ]),
      )

    const boundaries =
      getLandAreaGeographicBoundaries()

    let demarcatedCount = 0

    for (
      const boundary of
      boundaries
    ) {
      const area =
        areaById.get(
          boundary.landAreaId,
        )

      if (!area) continue

      const demarcatedHa =
        calculateGeographicAreaHectares(
          boundary.points,
        )

      const demarcatedM2 =
        hectaresToSquareMeters(
          demarcatedHa,
        )

      const registeredHa =
        area.areaHectares

      const registeredM2 =
        hectaresToSquareMeters(
          registeredHa,
        )

      const differenceHa =
        Math.abs(
          registeredHa -
            demarcatedHa,
        )

      const differenceM2 =
        hectaresToSquareMeters(
          differenceHa,
        )

      demarcatedCount += 1

      insights.push({
        id: `map-landarea-area-${area.id}`,
        title: `${area.code} — ${area.name}`,
        description: `Cadastrada: ${formatHectares(
          registeredHa,
        )} · Demarcada: ${formatHectares(
          demarcatedHa,
        )} · Diferença: ${formatHectares(
          differenceHa,
        )}.`,
        severity: 'information',
        module: 'map',
        moduleLabel:
          MODULE_LABELS.map,
        explanation: `Área cadastrada: ${formatHectares(
          registeredHa,
        )} (${formatSquareMeters(
          registeredM2,
        )}). Área demarcada: ${formatHectares(
          demarcatedHa,
        )} (${formatSquareMeters(
          demarcatedM2,
        )}). Diferença absoluta: ${formatHectares(
          differenceHa,
        )} (${formatSquareMeters(
          differenceM2,
        )}). A diferença apresentada é apenas uma comparação numérica entre a área cadastrada e a estimativa calculada a partir da demarcação no mapa.`,
        sourceRecordId:
          area.id,
        sourcePath: '/mapa',
      })
    }

    if (
      demarcatedCount > 0
    ) {
      insights.push({
        id: 'map-landareas-demarcated',
        title:
          'Áreas com demarcação geográfica',
        description: `${demarcatedCount} área(s) possuem demarcação no mapa.`,
        severity: 'information',
        module: 'map',
        moduleLabel:
          MODULE_LABELS.map,
        explanation: `Existem ${demarcatedCount} demarcações geográficas de áreas salvas no mapa de satélite.`,
        sourcePath: '/mapa',
      })
    }
  }

  return insights
}

// -------------------- Data quality --------------------

function buildDataQualityIssues(
  user: User,
): IntelligenceDataQualityIssue[] {
  const issues: IntelligenceDataQualityIssue[] = []

  if (
    userHasPermission(
      user,
      'map',
    )
  ) {
    const propertyBoundary =
      getPropertyGeographicBoundary()

    if (!propertyBoundary) {
      issues.push({
        id: 'quality-map-no-property-boundary',
        title:
          'Propriedade sem demarcação geográfica',
        description:
          'A propriedade ainda não possui polígono demarcado no mapa de satélite.',
        explanation:
          'Sem demarcação geral, a Intelligence não consegue comparar a área total do imóvel com informações do mapa.',
        module: 'map',
        moduleLabel:
          MODULE_LABELS.map,
        affectedCount: 1,
      })
    }

    if (
      userHasPermission(
        user,
        'land',
      )
    ) {
      const areas =
        getLandAreas()

      const boundaries =
        getLandAreaGeographicBoundaries()

      const idsWithBoundary =
        new Set(
          boundaries.map(
            boundary =>
              boundary.landAreaId,
          ),
        )

      const missing =
        areas.filter(
          area =>
            !idsWithBoundary.has(
              area.id,
            ),
        )

      if (
        missing.length > 0
      ) {
        issues.push({
          id: 'quality-map-landareas-without-boundary',
          title:
            'Áreas sem demarcação geográfica',
          description: `${missing.length} área(s) não possuem demarcação no mapa.`,
          explanation:
            'Sem demarcação, a comparação entre a área cadastrada e a área calculada pelo mapa não é possível para essas áreas.',
          module: 'map',
          moduleLabel:
            MODULE_LABELS.map,
          affectedCount:
            missing.length,
        })
      }
    }
  }

  return issues
}

// -------------------- API pública --------------------

export function getIntelligenceInsights(
  user: User | null,
): IntelligenceInsight[] {
  if (
    !hasIntelligenceAccess(
      user,
    ) ||
    !user
  ) {
    return []
  }

  const insights: IntelligenceInsight[] = []

  if (
    userHasPermission(
      user,
      'animals',
    )
  ) {
    insights.push(
      ...buildAnimalInsights(),
    )
  }

  if (
    userHasPermission(
      user,
      'health',
    )
  ) {
    insights.push(
      ...buildHealthInsights(),
    )
  }

  if (
    userHasPermission(
      user,
      'inventory',
    )
  ) {
    insights.push(
      ...buildInventoryInsights(),
    )
  }

  if (
    userHasPermission(
      user,
      'agenda',
    )
  ) {
    insights.push(
      ...buildAgendaInsights(
        user,
      ),
    )
  }

  if (
    userHasPermission(
      user,
      'crops',
    )
  ) {
    insights.push(
      ...buildCropInsights(),
    )
  }

  if (
    userHasPermission(
      user,
      'machines',
    )
  ) {
    insights.push(
      ...buildMachineInsights(),
    )
  }

  if (
    userHasPermission(
      user,
      'finance',
    )
  ) {
    insights.push(
      ...buildFinanceInsights(),
    )
  }

  if (
    userHasPermission(
      user,
      'land',
    )
  ) {
    insights.push(
      ...buildLandInsights(),
    )
  }

  if (
    userHasPermission(
      user,
      'map',
    )
  ) {
    insights.push(
      ...buildMapInsights(
        user,
      ),
    )
  }

  return sortInsights(
    insights,
  )
}

export function getIntelligenceMetricSummary(
  user: User | null,
): IntelligenceMetricSummary {
  if (
    !hasIntelligenceAccess(
      user,
    ) ||
    !user
  ) {
    return {
      needsAttention: 0,
      opportunities: 0,
      informations: 0,
      modulesAnalyzed: 0,
    }
  }

  const insights =
    getIntelligenceInsights(
      user,
    )

  let needsAttention = 0
  let opportunities = 0
  let informations = 0

  for (
    const insight of insights
  ) {
    if (
      insight.severity ===
        'critical' ||
      insight.severity ===
        'warning'
    ) {
      needsAttention += 1
    } else if (
      insight.severity ===
      'opportunity'
    ) {
      opportunities += 1
    } else if (
      insight.severity ===
      'information'
    ) {
      informations += 1
    }
  }

  let modulesAnalyzed = 0

  for (
    const moduleKey of
    ALL_MODULES
  ) {
    if (
      userHasPermission(
        user,
        MODULE_PERMISSIONS[
          moduleKey
        ],
      )
    ) {
      modulesAnalyzed += 1
    }
  }

  return {
    needsAttention,
    opportunities,
    informations,
    modulesAnalyzed,
  }
}

export function getIntelligenceDataQualityIssues(
  user: User | null,
): IntelligenceDataQualityIssue[] {
  if (
    !hasIntelligenceAccess(
      user,
    ) ||
    !user
  ) {
    return []
  }

  return buildDataQualityIssues(
    user,
  )
}

// -------------------- Assistente --------------------

function unavailableAnswer(
  questionId: string,
  moduleLabel: string,
): IntelligenceAnswer {
  return {
    questionId,
    title:
      'Consulta indisponível',
    summary: `Você não possui permissão para consultar informações de ${moduleLabel}.`,
    items: [],
    unavailable: true,
  }
}

function answerAttention(
  user: User,
): IntelligenceAnswer {
  const insights =
    getIntelligenceInsights(
      user,
    )

  const attention =
    insights.filter(
      insight =>
        insight.severity ===
          'critical' ||
        insight.severity ===
          'warning',
    )

  if (
    attention.length === 0
  ) {
    return {
      questionId:
        'attention',
      title:
        'O que precisa da minha atenção hoje?',
      summary:
        'Nenhuma situação crítica ou de atenção foi identificada nos dados disponíveis.',
      items: [],
      unavailable: false,
    }
  }

  const items: IntelligenceAnswerItem[] =
    attention
      .slice(0, 10)
      .map(insight => ({
        text: `${insight.title} — ${insight.description}`,
        sourcePath:
          insight.sourcePath,
      }))

  return {
    questionId:
      'attention',
    title:
      'O que precisa da minha atenção hoje?',
    summary: `Foram identificadas ${attention.length} situações que merecem atenção.`,
    items,
    unavailable: false,
  }
}

function answerInventory(
  user: User,
): IntelligenceAnswer {
  if (
    !userHasPermission(
      user,
      'inventory',
    )
  ) {
    return unavailableAnswer(
      'inventory',
      'Estoque',
    )
  }

  const items =
    getInventoryItems()

  if (
    items.length === 0
  ) {
    return {
      questionId:
        'inventory',
      title:
        'Como está meu estoque?',
      summary:
        'Nenhum item de estoque foi encontrado.',
      items: [],
      unavailable: false,
    }
  }

  const activeItems =
    items.filter(
      item =>
        item.status ===
        'Ativo',
    )

  const belowMinimum =
    activeItems.filter(
      item =>
        isBelowMinimum(
          item,
        ),
    )

  const zeroed =
    activeItems.filter(
      item =>
        item.currentQuantity ===
        0,
    )

  const answerItems: IntelligenceAnswerItem[] = []

  if (
    zeroed.length > 0
  ) {
    answerItems.push({
      text: `${zeroed.length} item(ns) estão sem quantidade em estoque.`,
      sourcePath:
        '/estoque',
    })
  }

  if (
    belowMinimum.length > 0
  ) {
    answerItems.push({
      text: `${belowMinimum.length} item(ns) estão abaixo do estoque mínimo.`,
      sourcePath:
        '/estoque',
    })
  }

  if (
    answerItems.length === 0
  ) {
    answerItems.push({
      text:
        'Nenhum item ativo está abaixo do estoque mínimo.',
      sourcePath:
        '/estoque',
    })
  }

  return {
    questionId:
      'inventory',
    title:
      'Como está meu estoque?',
    summary: `${activeItems.length} item(ns) ativos cadastrados.`,
    items:
      answerItems,
    unavailable: false,
  }
}

function answerAnimals(
  user: User,
): IntelligenceAnswer {
  if (
    !userHasPermission(
      user,
      'animals',
    )
  ) {
    return unavailableAnswer(
      'animals',
      'Animais',
    )
  }

  const animals =
    getAnimals()

  if (
    animals.length === 0
  ) {
    return {
      questionId:
        'animals',
      title:
        'Como estão os animais?',
      summary:
        'Nenhum animal foi cadastrado.',
      items: [],
      unavailable: false,
    }
  }

  const active =
    animals.filter(
      animal =>
        animal.status ===
        'Ativo',
    ).length

  return {
    questionId:
      'animals',
    title:
      'Como estão os animais?',
    summary: `${animals.length} animais cadastrados, ${active} ativos.`,
    items: [
      {
        text: `Total de animais: ${animals.length}.`,
        sourcePath:
          '/animais',
      },
      {
        text: `Animais ativos: ${active}.`,
        sourcePath:
          '/animais',
      },
    ],
    unavailable: false,
  }
}

function answerHealth(
  user: User,
): IntelligenceAnswer {
  if (
    !userHasPermission(
      user,
      'health',
    )
  ) {
    return unavailableAnswer(
      'health',
      'Saúde Animal',
    )
  }

  const vaccinations =
    getVaccinations()

  const treatments =
    getTreatments()

  const occurrences =
    getHealthOccurrences()

  let pendingVaccinations =
    0

  for (
    const vaccination of
    vaccinations
  ) {
    const status =
      getVaccinationStatus(
        vaccination,
      )

    if (
      status ===
        'Próxima' ||
      status ===
        'Vencida'
    ) {
      pendingVaccinations += 1
    }
  }

  const ongoingTreatments =
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
    ).length

  const answerItems: IntelligenceAnswerItem[] = [
    {
      text: `${pendingVaccinations} vacinação(ões) pendentes ou vencidas.`,
      sourcePath:
        '/saude-animal/vacinacoes',
    },
    {
      text: `${ongoingTreatments} tratamento(s) em andamento.`,
      sourcePath:
        '/saude-animal/tratamentos',
    },
    {
      text: `${openOccurrences} ocorrência(s) abertas.`,
      sourcePath:
        '/saude-animal/ocorrencias',
    },
  ]

  return {
    questionId:
      'health',
    title:
      'Como está a saúde animal?',
    summary: `${vaccinations.length} vacinações, ${treatments.length} tratamentos e ${occurrences.length} ocorrências registradas.`,
    items:
      answerItems,
    unavailable: false,
  }
}

function answerCrops(
  user: User,
): IntelligenceAnswer {
  if (
    !userHasPermission(
      user,
      'crops',
    )
  ) {
    return unavailableAnswer(
      'crops',
      'Cultivos',
    )
  }

  const cycles =
    getCropCycles()

  if (
    cycles.length === 0
  ) {
    return {
      questionId:
        'crops',
      title:
        'Como estão os cultivos?',
      summary:
        'Nenhum ciclo de cultivo cadastrado.',
      items: [],
      unavailable: false,
    }
  }

  const active =
    cycles.filter(
      cycle =>
        cycle.status ===
        'Em andamento',
    ).length

  const planned =
    cycles.filter(
      cycle =>
        cycle.status ===
        'Planejado',
    ).length

  const completed =
    cycles.filter(
      cycle =>
        cycle.status ===
        'Concluído',
    ).length

  return {
    questionId:
      'crops',
    title:
      'Como estão os cultivos?',
    summary: `${cycles.length} ciclo(s) registrados.`,
    items: [
      {
        text: `Em andamento: ${active}.`,
        sourcePath:
          '/cultivos',
      },
      {
        text: `Planejados: ${planned}.`,
        sourcePath:
          '/cultivos',
      },
      {
        text: `Concluídos: ${completed}.`,
        sourcePath:
          '/cultivos',
      },
    ],
    unavailable: false,
  }
}

function answerMachines(
  user: User,
): IntelligenceAnswer {
  if (
    !userHasPermission(
      user,
      'machines',
    )
  ) {
    return unavailableAnswer(
      'machines',
      'Máquinas',
    )
  }

  const machines =
    getMachines()

  if (
    machines.length === 0
  ) {
    return {
      questionId:
        'machines',
      title:
        'Como estão as máquinas?',
      summary:
        'Nenhuma máquina cadastrada.',
      items: [],
      unavailable: false,
    }
  }

  const operational =
    machines.filter(
      machine =>
        machine.status ===
        'Operacional',
    ).length

  const maintenance =
    machines.filter(
      machine =>
        machine.status ===
        'Em manutenção',
    ).length

  const inactive =
    machines.filter(
      machine =>
        machine.status ===
        'Inativa',
    ).length

  return {
    questionId:
      'machines',
    title:
      'Como estão as máquinas?',
    summary: `${machines.length} máquina(s) cadastradas.`,
    items: [
      {
        text: `Operacionais: ${operational}.`,
        sourcePath:
          '/maquinas',
      },
      {
        text: `Em manutenção: ${maintenance}.`,
        sourcePath:
          '/maquinas',
      },
      {
        text: `Inativas: ${inactive}.`,
        sourcePath:
          '/maquinas',
      },
    ],
    unavailable: false,
  }
}

function answerFinance(
  user: User,
): IntelligenceAnswer {
  if (
    !userHasPermission(
      user,
      'finance',
    )
  ) {
    return unavailableAnswer(
      'finance',
      'Financeiro',
    )
  }

  const transactions =
    getFinancialTransactions()

  if (
    transactions.length ===
    0
  ) {
    return {
      questionId:
        'finance',
      title:
        'Como está o financeiro?',
      summary:
        'Nenhuma transação financeira cadastrada.',
      items: [],
      unavailable: false,
    }
  }

  let revenues = 0
  let expenses = 0

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

    if (
      transaction.type ===
      'Receita'
    ) {
      revenues +=
        transaction.amount
    } else if (
      transaction.type ===
      'Despesa'
    ) {
      expenses +=
        transaction.amount
    }
  }

  const balance =
    revenues - expenses

  return {
    questionId:
      'finance',
    title:
      'Como está o financeiro?',
    summary: `${transactions.length} transação(ões) registradas.`,
    items: [
      {
        text: `Receitas: ${formatCurrencyBRL(
          revenues,
        )}.`,
        sourcePath:
          '/financeiro/receitas',
      },
      {
        text: `Despesas: ${formatCurrencyBRL(
          expenses,
        )}.`,
        sourcePath:
          '/financeiro/despesas',
      },
      {
        text: `Saldo: ${formatCurrencyBRL(
          balance,
        )}.`,
        sourcePath:
          '/financeiro',
      },
    ],
    unavailable: false,
  }
}

function answerLand(
  user: User,
): IntelligenceAnswer {
  if (
    !userHasPermission(
      user,
      'land',
    )
  ) {
    return unavailableAnswer(
      'land',
      'Terras',
    )
  }

  const areas =
    getLandAreas()

  if (
    areas.length === 0
  ) {
    return {
      questionId:
        'land',
      title:
        'Como estão as terras?',
      summary:
        'Nenhuma área cadastrada.',
      items: [],
      unavailable: false,
    }
  }

  const inUse =
    areas.filter(
      area =>
        area.status ===
        'Em uso',
    ).length

  const resting =
    areas.filter(
      area =>
        area.status ===
        'Em descanso',
    ).length

  const recovering =
    areas.filter(
      area =>
        area.status ===
        'Em recuperação',
    ).length

  const activeOccupations =
    getActivePaddockOccupations()

  return {
    questionId:
      'land',
    title:
      'Como estão as terras?',
    summary: `${areas.length} área(s) cadastradas.`,
    items: [
      {
        text: `Em uso: ${inUse}.`,
        sourcePath:
          '/terras',
      },
      {
        text: `Em descanso: ${resting}.`,
        sourcePath:
          '/terras',
      },
      {
        text: `Em recuperação: ${recovering}.`,
        sourcePath:
          '/terras',
      },
      {
        text: `Piquetes ocupados: ${activeOccupations.length}.`,
        sourcePath:
          '/terras/manejo',
      },
    ],
    unavailable: false,
  }
}

function answerMap(
  user: User,
): IntelligenceAnswer {
  if (
    !userHasPermission(
      user,
      'map',
    )
  ) {
    return unavailableAnswer(
      'map',
      'Mapa',
    )
  }

  const propertyBoundary =
    getPropertyGeographicBoundary()

  const answerItems: IntelligenceAnswerItem[] = []

  if (
    propertyBoundary
  ) {
    const areaHa =
      calculateGeographicAreaHectares(
        propertyBoundary.points,
      )

    const areaM2 =
      hectaresToSquareMeters(
        areaHa,
      )

    answerItems.push({
      text: `Área demarcada da propriedade: ${formatHectares(
        areaHa,
      )} (${formatSquareMeters(
        areaM2,
      )}).`,
      sourcePath:
        '/mapa',
    })
  } else {
    answerItems.push({
      text:
        'A propriedade ainda não possui demarcação geográfica.',
      sourcePath:
        '/mapa',
    })
  }

  if (
    userHasPermission(
      user,
      'land',
    )
  ) {
    const areas =
      getLandAreas()

    const areaById =
      new Map(
        areas.map(area => [
          area.id,
          area,
        ]),
      )

    const boundaries =
      getLandAreaGeographicBoundaries()

    let demarcatedCount = 0

    for (
      const boundary of
      boundaries
    ) {
      if (
        !areaById.has(
          boundary.landAreaId,
        )
      ) {
        continue
      }

      demarcatedCount += 1
    }

    answerItems.push({
      text: `${demarcatedCount} área(s) possuem demarcação no mapa.`,
      sourcePath:
        '/mapa',
    })
  }

  return {
    questionId:
      'map',
    title:
      'Como está a propriedade no mapa?',
    summary:
      propertyBoundary
        ? 'A propriedade possui demarcação geográfica registrada.'
        : 'A propriedade ainda não possui demarcação geográfica.',
    items:
      answerItems,
    unavailable: false,
  }
}

export function answerIntelligenceQuestion(
  questionId: string,
  user: User | null,
): IntelligenceAnswer {
  if (
    !user ||
    !hasIntelligenceAccess(
      user,
    )
  ) {
    return {
      questionId,
      title:
        'Indisponível',
      summary:
        'Você não possui permissão para acessar o Agro360 Intelligence.',
      items: [],
      unavailable: true,
    }
  }

  switch (questionId) {
    case 'attention':
      return answerAttention(
        user,
      )

    case 'inventory':
      return answerInventory(
        user,
      )

    case 'animals':
      return answerAnimals(
        user,
      )

    case 'health':
      return answerHealth(
        user,
      )

    case 'crops':
      return answerCrops(
        user,
      )

    case 'machines':
      return answerMachines(
        user,
      )

    case 'finance':
      return answerFinance(
        user,
      )

    case 'land':
      return answerLand(
        user,
      )

    case 'map':
      return answerMap(
        user,
      )

    default:
      return {
        questionId,
        title:
          'Pergunta desconhecida',
        summary:
          'Esta pergunta não está disponível.',
        items: [],
        unavailable: true,
      }
  }
}