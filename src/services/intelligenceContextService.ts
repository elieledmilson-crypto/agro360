import {
  Animal,
  FinancialCategory,
  IntelligenceActionCapabilities,
  IntelligenceContext,
  IntelligenceContextAgenda,
  IntelligenceContextAnimalLand,
  IntelligenceContextAnimalLandEntry,
  IntelligenceContextAnimals,
  IntelligenceContextCrops,
  IntelligenceContextFinance,
  IntelligenceContextFinanceBySource,
  IntelligenceContextFinanceCategory,
  IntelligenceContextFinanceCategoryOption,
  IntelligenceContextHealth,
  IntelligenceContextHealthEntry,
  IntelligenceContextInventory,
  IntelligenceContextInventoryConsumptionSource,
  IntelligenceContextInventoryIntegratedMovement,
  IntelligenceContextInventoryItem,
  IntelligenceContextInventoryItemOption,
  IntelligenceContextLand,
  IntelligenceContextLandLandAreaOption,
  IntelligenceContextList,
  IntelligenceContextMachineOption,
  IntelligenceContextMachines,
  IntelligenceContextMap,
  IntelligenceContextMapLandArea,
  InventoryItem,
  Machine,
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
import { getActivePaddockOccupations } from './paddockOccupationService'
import { getCropCycles } from './cropService'
import { getMachines } from './machineService'
import {
  getInventoryItems,
  getInventoryMovements,
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

const ALL_MODULE_PERMISSIONS: PermissionKey[] = [
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

const MODULE_KEYWORDS: Partial<
  Record<PermissionKey, string[]>
> = {
  animals: [
    'animal',
    'animais',
    'rebanho',
    'bovino',
    'gado',
    'lote',
    'espécie',
    'categoria',
    'bezerro',
    'vaca',
    'touro',
  ],
  health: [
    'saúde',
    'vacina',
    'vacinação',
    'vacinações',
    'tratamento',
    'tratamentos',
    'ocorrência',
    'ocorrências',
    'doença',
    'sintoma',
    'ferimento',
  ],
  land: [
    'terra',
    'terras',
    'piquete',
    'talhão',
    'pastagem',
    'hectare',
    'descanso',
    'recuperação',
    'área',
    'area',
    'pasto',
  ],
  crops: [
    'cultivo',
    'cultivos',
    'plantio',
    'colheita',
    'safra',
    'cultura',
    'manejo',
    'manejos',
    'solo',
  ],
  machines: [
    'máquina',
    'máquinas',
    'trator',
    'equipamento',
    'manutenção',
    'manutenções',
    'operacional',
    'horímetro',
  ],
  inventory: [
    'estoque',
    'produto',
    'quantidade',
    'validade',
    'item',
    'itens',
    'reposição',
    'entrada',
    'saída',
    'baixa',
    'consumo',
    'peça',
    'peças',
  ],
  finance: [
    'financeiro',
    'receita',
    'despesa',
    'saldo',
    'gasto',
    'custo',
    'dinheiro',
    'valor',
    'pago',
    'pagamento',
    'gastei',
  ],
  agenda: [
    'agenda',
    'atividade',
    'tarefa',
    'compromisso',
    'prazo',
    'pendente',
    'atrasada',
  ],
  map: [
    'mapa',
    'demarcação',
    'demarcada',
    'geográfic',
    'satélite',
    'coordenada',
  ],
}

const MAX_LIST_ITEMS = 20

function makeList<T>(
  items: T[],
): IntelligenceContextList<T> {
  if (items.length <= MAX_LIST_ITEMS) {
    return {
      total: items.length,
      truncated: false,
      items,
    }
  }

  return {
    total: items.length,
    truncated: true,
    items: items.slice(
      0,
      MAX_LIST_ITEMS,
    ),
  }
}

function normalizeKey(
  value: string,
): string {
  return value.toLowerCase().trim()
}

function prioritizeByKeys<T>(
  items: T[],
  question: string,
  getKeys: (item: T) => string[],
): T[] {
  if (!question) return items

  const q = question.toLowerCase()
  const mentioned: T[] = []
  const others: T[] = []

  for (const item of items) {
    const hit = getKeys(item).some(
      key => {
        const normalized =
          normalizeKey(key)

        return (
          normalized.length > 1 &&
          q.includes(normalized)
        )
      },
    )

    if (hit) {
      mentioned.push(item)
    } else {
      others.push(item)
    }
  }

  return [...mentioned, ...others]
}

interface PrioritizableByLabels {
  name?: string
  code?: string
}

function prioritizeMentioned<
  T extends PrioritizableByLabels,
>(
  items: T[],
  question: string,
): T[] {
  return prioritizeByKeys(
    items,
    question,
    item => [
      item.name ?? '',
      item.code ?? '',
    ],
  )
}

function originModuleLabel(
  module: PermissionKey,
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

export function selectModulesForQuestion(
  question: string,
): PermissionKey[] {
  const normalized =
    question.toLowerCase()

  const selected =
    new Set<PermissionKey>()

  for (
    const moduleKey of
      ALL_MODULE_PERMISSIONS
  ) {
    const keywords =
      MODULE_KEYWORDS[moduleKey]

    if (!keywords) continue

    for (const keyword of keywords) {
      if (
        normalized.includes(keyword)
      ) {
        selected.add(moduleKey)
        break
      }
    }
  }

  if (selected.size === 0) {
    return [
      ...ALL_MODULE_PERMISSIONS,
    ]
  }

  return Array.from(selected)
}

function buildAnimalsContext(
  animals: Animal[],
): IntelligenceContextAnimals {
  const bySpecies:
    Record<string, number> = {}

  const byStatus:
    Record<string, number> = {}

  for (const animal of animals) {
    bySpecies[animal.species] =
      (
        bySpecies[animal.species] ??
        0
      ) + 1

    byStatus[animal.status] =
      (
        byStatus[animal.status] ??
        0
      ) + 1
  }

  return {
    total: animals.length,
    active: animals.filter(
      animal =>
        animal.status === 'Ativo',
    ).length,
    bySpecies,
    byStatus,
  }
}

function buildHealthContext(
  user: User,
  animalById: Map<string, Animal>,
): IntelligenceContextHealth {
  const canSeeAnimalIdentity =
    userHasPermission(
      user,
      'animals',
    )

  const today = todayDateString()

  const sevenDays =
    addDaysToCivilDate(today, 7)

  function label(
    animalId: string,
  ): string | undefined {
    if (!canSeeAnimalIdentity) {
      return undefined
    }

    const animal =
      animalById.get(animalId)

    if (!animal) return undefined

    return animal.name
      ? `${animal.identification} — ${animal.name}`
      : animal.identification
  }

  const overdue:
    IntelligenceContextHealthEntry[] = []

  const upcoming:
    IntelligenceContextHealthEntry[] = []

  const ongoing:
    IntelligenceContextHealthEntry[] = []

  const openOccurrences:
    IntelligenceContextHealthEntry[] = []

  for (
    const vaccination of
      getVaccinations()
  ) {
    const status =
      getVaccinationStatus(
        vaccination,
      )

    if (status === 'Vencida') {
      const entry:
        IntelligenceContextHealthEntry =
        {
          description:
            `${vaccination.vaccineName} (vencida em ${
              vaccination.nextDoseDate ??
              'data não informada'
            })`,
        }

      const animalLabel =
        label(
          vaccination.animalId,
        )

      if (animalLabel) {
        entry.animalLabel =
          animalLabel
      }

      overdue.push(entry)
    } else if (
      status === 'Próxima'
    ) {
      const entry:
        IntelligenceContextHealthEntry =
        {
          description:
            `${vaccination.vaccineName} (próxima dose em ${
              vaccination.nextDoseDate ??
              'data não informada'
            })`,
        }

      const animalLabel =
        label(
          vaccination.animalId,
        )

      if (animalLabel) {
        entry.animalLabel =
          animalLabel
      }

      upcoming.push(entry)
    }
  }

  for (
    const treatment of
      getTreatments()
  ) {
    if (
      treatment.status !==
      'Em andamento'
    ) {
      continue
    }

    let description =
      treatment.reason

    if (treatment.endDate) {
      if (
        treatment.endDate <
        today
      ) {
        description +=
          ` (prazo vencido em ${treatment.endDate})`
      } else if (
        treatment.endDate <=
        sevenDays
      ) {
        description +=
          ` (termina em ${treatment.endDate})`
      }
    }

    const entry:
      IntelligenceContextHealthEntry =
      { description }

    const animalLabel =
      label(treatment.animalId)

    if (animalLabel) {
      entry.animalLabel =
        animalLabel
    }

    ongoing.push(entry)
  }

  for (
    const occurrence of
      getHealthOccurrences()
  ) {
    if (
      occurrence.status !==
      'Aberta'
    ) {
      continue
    }

    const entry:
      IntelligenceContextHealthEntry =
      {
        description:
          `${occurrence.title} (${occurrence.severity})`,
      }

    const animalLabel =
      label(occurrence.animalId)

    if (animalLabel) {
      entry.animalLabel =
        animalLabel
    }

    openOccurrences.push(entry)
  }

  return {
    overdueVaccinations:
      makeList(overdue),
    upcomingVaccinations:
      makeList(upcoming),
    ongoingTreatments:
      makeList(ongoing),
    openOccurrences:
      makeList(openOccurrences),
  }
}

function buildInventoryContext(
  user: User,
  items: InventoryItem[],
  question: string,
): IntelligenceContextInventory {
  const active = items.filter(
    item =>
      item.status === 'Ativo',
  )

  const zeroed:
    IntelligenceContextInventoryItem[] =
    []

  const belowMin:
    IntelligenceContextInventoryItem[] =
    []

  const expiring:
    IntelligenceContextInventoryItem[] =
    []

  for (const item of active) {
    const base:
      IntelligenceContextInventoryItem =
      {
        code: item.code,
        name: item.name,
        quantity:
          item.currentQuantity,
        unit: item.unit,
        minimum:
          item.minimumQuantity,
      }

    if (
      item.currentQuantity === 0
    ) {
      zeroed.push(base)
    } else if (
      isBelowMinimum(item)
    ) {
      belowMin.push(base)
    }

    if (item.expirationDate) {
      const status =
        getExpirationStatus(
          item.expirationDate,
        )

      if (
        status === 'Vencido' ||
        status === 'Vence em breve'
      ) {
        expiring.push(base)
      }
    }
  }

  const optionList:
    IntelligenceContextInventoryItemOption[] =
    active
      .map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        unit: item.unit,
        currentQuantity:
          item.currentQuantity,
      }))
      .sort((a, b) =>
        a.code.localeCompare(
          b.code,
          'pt-BR',
        ),
      )

  const prioritized =
    prioritizeMentioned(
      optionList,
      question,
    )

  const allMovements =
    getInventoryMovements()

  const visibleIntegratedMovements =
    allMovements.filter(
      movement => {
        if (!movement.origin) {
          return false
        }

        const permission =
          movement.origin
            .module as PermissionKey

        return userHasPermission(
          user,
          permission,
        )
      },
    )

  const consumptionBySourceMap =
    new Map<string, number>()

  for (
    const movement of
      visibleIntegratedMovements
  ) {
    const permission =
      movement.origin!
        .module as PermissionKey

    const label =
      originModuleLabel(permission)

    consumptionBySourceMap.set(
      label,
      (
        consumptionBySourceMap.get(
          label,
        ) ?? 0
      ) + 1,
    )
  }

  const consumptionBySource:
    IntelligenceContextInventoryConsumptionSource[] =
    Array.from(
      consumptionBySourceMap.entries(),
    )
      .map(
        ([
          sourceLabel,
          movementCount,
        ]) => ({
          sourceLabel,
          movementCount,
        }),
      )
      .sort((a, b) => {
        if (
          b.movementCount !==
          a.movementCount
        ) {
          return (
            b.movementCount -
            a.movementCount
          )
        }

        return a.sourceLabel.localeCompare(
          b.sourceLabel,
          'pt-BR',
        )
      })

  const integratedEntries:
    IntelligenceContextInventoryIntegratedMovement[] =
    visibleIntegratedMovements
      .map(movement => {
        const origin =
          movement.origin!

        return {
          itemCode:
            movement
              .itemCodeSnapshot ??
            '—',
          itemName:
            movement
              .itemNameSnapshot ??
            '—',
          quantity:
            movement.quantity,
          unit:
            movement
              .unitSnapshot ?? '',
          movementDate:
            movement.movementDate,
          sourceModule:
            origin.module,
          sourceLabel:
            originModuleLabel(
              origin.module as PermissionKey,
            ),
          sourceType:
            origin.type,
          sourceRecordId:
            origin.recordId,
        }
      })
      .sort((a, b) =>
        b.movementDate.localeCompare(
          a.movementDate,
        ),
      )

  const integratedPrioritized =
    prioritizeByKeys(
      integratedEntries,
      question,
      entry => [
        entry.itemCode,
        entry.itemName,
        entry.sourceLabel,
        entry.sourceType,
        entry.sourceRecordId,
      ],
    )

  return {
    activeItems: active.length,
    zeroedItems:
      makeList(zeroed),
    belowMinimumItems:
      makeList(belowMin),
    expiringItems:
      makeList(expiring),
    itemsLimited:
      makeList(prioritized),
    consumptionBySource:
      makeList(
        consumptionBySource,
      ),
    integratedMovements:
      makeList(
        integratedPrioritized,
      ),
  }
}

function buildFinanceContext(
  user: User,
  categories: FinancialCategory[],
  question: string,
): IntelligenceContextFinance {
  const transactions =
    getFinancialTransactions()

  let totalRevenues = 0
  let totalExpenses = 0

  const categoryById = new Map(
    categories.map(category => [
      category.id,
      category,
    ]),
  )

  const expenseByCategory =
    new Map<string, number>()

  const expenseBySourceMap =
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

    if (
      transaction.type ===
      'Receita'
    ) {
      totalRevenues +=
        transaction.amount
    } else if (
      transaction.type ===
      'Despesa'
    ) {
      totalExpenses +=
        transaction.amount

      const label =
        categoryById.get(
          transaction.categoryId,
        )?.name ??
        'Categoria não encontrada'

      expenseByCategory.set(
        label,
        (
          expenseByCategory.get(
            label,
          ) ?? 0
        ) + transaction.amount,
      )

      if (transaction.origin) {
        const permission =
          transaction.origin
            .module as PermissionKey

        if (
          userHasPermission(
            user,
            permission,
          )
        ) {
          const originLabel =
            originModuleLabel(
              permission,
            )

          expenseBySourceMap.set(
            originLabel,
            (
              expenseBySourceMap.get(
                originLabel,
              ) ?? 0
            ) +
              transaction.amount,
          )
        }
      }
    }
  }

  const topRaw:
    IntelligenceContextFinanceCategory[] =
    Array.from(
      expenseByCategory.entries(),
    )
      .map(
        ([label, amount]) => ({
          label,
          amount,
        }),
      )
      .sort((a, b) => {
        if (
          b.amount !== a.amount
        ) {
          return (
            b.amount - a.amount
          )
        }

        return a.label.localeCompare(
          b.label,
          'pt-BR',
        )
      })

  const topPrioritized =
    prioritizeByKeys(
      topRaw,
      question,
      item => [item.label],
    )

  const categoryOptions:
    IntelligenceContextFinanceCategoryOption[] =
    categories
      .map(category => ({
        id: category.id,
        name: category.name,
        type: category.type,
      }))
      .sort((a, b) =>
        a.name.localeCompare(
          b.name,
          'pt-BR',
        ),
      )

  const categoryPrioritized =
    prioritizeMentioned(
      categoryOptions,
      question,
    )

  const expensesBySource:
    IntelligenceContextFinanceBySource[] =
    Array.from(
      expenseBySourceMap.entries(),
    )
      .map(
        ([
          sourceLabel,
          amount,
        ]) => ({
          sourceLabel,
          amount,
        }),
      )
      .sort((a, b) => {
        if (
          b.amount !== a.amount
        ) {
          return (
            b.amount - a.amount
          )
        }

        return a.sourceLabel.localeCompare(
          b.sourceLabel,
          'pt-BR',
        )
      })

  return {
    totalRevenues,
    totalExpenses,
    balance:
      totalRevenues -
      totalExpenses,
    topExpenseCategories:
      makeList(topPrioritized),
    categoriesLimited:
      makeList(
        categoryPrioritized,
      ),
    expensesBySource:
      makeList(
        expensesBySource,
      ),
  }
}

function buildLandContext(
  question: string,
): IntelligenceContextLand {
  const areas = getLandAreas()

  const byStatus:
    Record<string, number> = {}

  for (const area of areas) {
    byStatus[area.status] =
      (
        byStatus[area.status] ??
        0
      ) + 1
  }

  const areaOptions:
    IntelligenceContextLandLandAreaOption[] =
    areas
      .map(area => ({
        id: area.id,
        code: area.code,
        name: area.name,
      }))
      .sort((a, b) =>
        a.code.localeCompare(
          b.code,
          'pt-BR',
        ),
      )

  const prioritized =
    prioritizeMentioned(
      areaOptions,
      question,
    )

  return {
    totalAreas: areas.length,
    byStatus,
    occupiedPaddocks:
      getActivePaddockOccupations()
        .length,
    areasLimited:
      makeList(prioritized),
  }
}

function buildCropsContext():
  IntelligenceContextCrops {
  const cycles = getCropCycles()
  const today = todayDateString()

  const sevenDays =
    addDaysToCivilDate(
      today,
      7,
    )

  const upcoming: string[] = []
  const overdue: string[] = []

  for (const cycle of cycles) {
    if (
      cycle.status !== 'Planejado' &&
      cycle.status !== 'Em andamento'
    ) {
      continue
    }

    if (
      !cycle.expectedHarvestDate
    ) {
      continue
    }

    const label =
      `${cycle.crop} (${cycle.season})`

    if (
      cycle.expectedHarvestDate <
      today
    ) {
      overdue.push(
        `${label} — prevista ${cycle.expectedHarvestDate}`,
      )
    } else if (
      cycle.expectedHarvestDate <=
      sevenDays
    ) {
      upcoming.push(
        `${label} — prevista ${cycle.expectedHarvestDate}`,
      )
    }
  }

  return {
    activeCycles:
      cycles.filter(
        cycle =>
          cycle.status ===
          'Em andamento',
      ).length,
    plannedCycles:
      cycles.filter(
        cycle =>
          cycle.status ===
          'Planejado',
      ).length,
    upcomingHarvests:
      makeList(upcoming),
    overdueHarvests:
      makeList(overdue),
  }
}

function buildMachinesContext(
  machines: Machine[],
  question: string,
): IntelligenceContextMachines {
  const optionList:
    IntelligenceContextMachineOption[] =
    machines
      .map(machine => ({
        code: machine.code,
        name: machine.name,
        status: machine.status,
      }))
      .sort((a, b) =>
        a.code.localeCompare(
          b.code,
          'pt-BR',
        ),
      )

  const maintenanceList =
    optionList.filter(
      machine =>
        machine.status ===
        'Em manutenção',
    )

  const prioritizedList =
    prioritizeMentioned(
      optionList,
      question,
    )

  return {
    total: machines.length,
    operational:
      machines.filter(
        machine =>
          machine.status ===
          'Operacional',
      ).length,
    maintenance:
      maintenanceList.length,
    inactive:
      machines.filter(
        machine =>
          machine.status ===
          'Inativa',
      ).length,
    maintenanceMachines:
      makeList(
        maintenanceList,
      ),
    machinesList:
      makeList(
        prioritizedList,
      ),
  }
}

function buildAgendaContext(
  user: User,
): IntelligenceContextAgenda {
  const entries =
    getAgendaEntriesForUser(
      user,
    ).filter(
      entry =>
        entry.source === 'manual',
    )

  const overdue: string[] = []
  const highPriorityPending:
    string[] = []

  for (const entry of entries) {
    if (
      entry.status === 'Atrasada'
    ) {
      overdue.push(
        `${entry.title} (${entry.date})`,
      )
    } else if (
      entry.status === 'Pendente' &&
      entry.priority === 'Alta'
    ) {
      highPriorityPending.push(
        `${entry.title} (${entry.date})`,
      )
    }
  }

  return {
    overdue:
      makeList(overdue),
    highPriorityPending:
      makeList(
        highPriorityPending,
      ),
  }
}

function buildMapContext(
  user: User,
): IntelligenceContextMap {
  const propertyBoundary =
    getPropertyGeographicBoundary()

  let propertyAreaHa:
    number | null = null

  let propertyAreaM2:
    number | null = null

  if (propertyBoundary) {
    propertyAreaHa =
      calculateGeographicAreaHectares(
        propertyBoundary.points,
      )

    propertyAreaM2 =
      propertyAreaHa * 10000
  }

  const demarcatedAreas:
    IntelligenceContextMapLandArea[] =
    []

  if (
    userHasPermission(
      user,
      'land',
    )
  ) {
    const areas =
      getLandAreas()

    const areaById = new Map(
      areas.map(area => [
        area.id,
        area,
      ]),
    )

    const boundaries =
      getLandAreaGeographicBoundaries()

    for (
      const boundary of
        boundaries
    ) {
      const area =
        areaById.get(
          boundary.landAreaId,
        )

      if (!area) continue

      const demarcadaHa =
        calculateGeographicAreaHectares(
          boundary.points,
        )

      demarcatedAreas.push({
        code: area.code,
        name: area.name,
        cadastradaHa:
          area.areaHectares,
        demarcadaHa,
        diffHa: Math.abs(
          area.areaHectares -
            demarcadaHa,
        ),
      })
    }
  }

  demarcatedAreas.sort(
    (a, b) => {
      if (
        b.diffHa !== a.diffHa
      ) {
        return (
          b.diffHa - a.diffHa
        )
      }

      return a.code.localeCompare(
        b.code,
        'pt-BR',
      )
    },
  )

  return {
    propertyAreaHa,
    propertyAreaM2,
    demarcatedAreas:
      makeList(
        demarcatedAreas,
      ),
  }
}

function buildAnimalLandContext(
  animals: Animal[],
  question: string,
): IntelligenceContextAnimalLand {
  const areaById = new Map(
    getLandAreas().map(area => [
      area.id,
      area,
    ]),
  )

  const entries:
    IntelligenceContextAnimalLandEntry[] =
    []

  const landAreasWithAnimals =
    new Set<string>()

  for (const animal of animals) {
    if (!animal.landAreaId) {
      continue
    }

    const area =
      areaById.get(
        animal.landAreaId,
      )

    if (!area) continue

    landAreasWithAnimals.add(
      area.id,
    )

    entries.push({
      animalLabel:
        animal.name
          ? `${animal.identification} — ${animal.name}`
          : animal.identification,
      landAreaLabel:
        `${area.code} — ${area.name}`,
    })
  }

  const prioritized =
    prioritizeByKeys(
      entries,
      question,
      entry => [
        entry.animalLabel,
        entry.landAreaLabel,
      ],
    )

  return {
    total: entries.length,
    landAreasWithAnimals:
      landAreasWithAnimals.size,
    entries:
      makeList(prioritized),
  }
}

function buildCapabilities(
  user: User,
): IntelligenceActionCapabilities {
  const land =
    userHasPermission(
      user,
      'land',
    )

  return {
    canCreateLandArea: land,
    canCreateAnimal:
      userHasPermission(
        user,
        'animals',
      ),
    canCreateAgendaActivity:
      userHasPermission(
        user,
        'agenda',
      ),
    canCreateFinancialTransaction:
      userHasPermission(
        user,
        'finance',
      ),
    canCreateInventoryMovement:
      userHasPermission(
        user,
        'inventory',
      ),
    canCreateCropCycle:
      userHasPermission(
        user,
        'crops',
      ) && land,
    canUpdateMachineStatus:
      userHasPermission(
        user,
        'machines',
      ),
  }
}

export function buildIntelligenceContext(
  user: User,
  question: string,
): IntelligenceContext {
  const selected =
    selectModulesForQuestion(
      question,
    )

  const context:
    IntelligenceContext = {
      metadata: {
        generatedAt:
          new Date().toISOString(),
        capabilities:
          buildCapabilities(user),
      },
    }

  const can = (
    permission: PermissionKey,
  ) =>
    userHasPermission(
      user,
      permission,
    )

  const wants = (
    permission: PermissionKey,
  ) =>
    selected.includes(
      permission,
    )

  const wantsAnimals =
    can('animals') &&
    wants('animals')

  const wantsHealth =
    can('health') &&
    wants('health')

  const wantsLand =
    can('land') &&
    wants('land')

  const needsAnimalData =
    wantsAnimals ||
    (
      wantsHealth &&
      can('animals')
    ) ||
    (
      wantsLand &&
      can('animals')
    )

  const animals: Animal[] =
    needsAnimalData
      ? getAnimals()
      : []

  const animalById =
    new Map(
      animals.map(animal => [
        animal.id,
        animal,
      ]),
    )

  if (wantsAnimals) {
    context.animals =
      buildAnimalsContext(
        animals,
      )
  }

  if (wantsHealth) {
    context.health =
      buildHealthContext(
        user,
        animalById,
      )
  }

  if (wantsLand) {
    context.land =
      buildLandContext(
        question,
      )
  }

  if (
    can('crops') &&
    wants('crops')
  ) {
    context.crops =
      buildCropsContext()
  }

  if (
    can('machines') &&
    wants('machines')
  ) {
    context.machines =
      buildMachinesContext(
        getMachines(),
        question,
      )
  }

  if (
    can('inventory') &&
    wants('inventory')
  ) {
    context.inventory =
      buildInventoryContext(
        user,
        getInventoryItems(),
        question,
      )
  }

  if (
    can('finance') &&
    wants('finance')
  ) {
    context.finance =
      buildFinanceContext(
        user,
        getFinancialCategories(),
        question,
      )
  }

  if (
    can('agenda') &&
    wants('agenda')
  ) {
    context.agenda =
      buildAgendaContext(user)
  }

  if (
    can('map') &&
    wants('map')
  ) {
    context.map =
      buildMapContext(user)
  }

  const wantsAnimalLand =
    can('animals') &&
    can('land') &&
    (
      wants('animals') ||
      wants('land')
    )

  if (wantsAnimalLand) {
    context.animalLand =
      buildAnimalLandContext(
        animals,
        question,
      )
  }

  return context
}