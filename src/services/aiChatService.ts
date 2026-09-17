import {
  AgendaActivityPriority,
  AgendaActivityStatus,
  AgendaActivityType,
  AnimalCategory,
  AnimalSex,
  AnimalSpecies,
  AnimalStatus,
  CreateAgendaActivityActionData,
  CreateAnimalActionData,
  CreateCropCycleActionData,
  CreateFinancialTransactionActionData,
  CreateInventoryMovementActionData,
  CreateLandAreaActionData,
  CropCycleStatus,
  FinancialTransactionType,
  IntelligenceActionProposal,
  IntelligenceContext,
  InventoryMovementType,
  LandAreaStatus,
  LandAreaType,
  MachineStatus,
  UpdateMachineStatusActionData,
} from '../types'

export interface AIChatHistoryItem {
  role:
    | 'user'
    | 'assistant'
  content: string
}

export interface AIChatRequest {
  message: string
  history: AIChatHistoryItem[]
  context: IntelligenceContext
}

export type AIChatResponse =
  | {
      kind: 'message'
      answer: string
    }
  | {
      kind: 'action'
      answer: string
      action:
        IntelligenceActionProposal
    }

const TIMEOUT_MS = 45000

function isPlainObject(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}

const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}$/

const HHMM_RE =
  /^([01]\d|2[0-3]):[0-5]\d$/

const DAYS_IN_MONTH = [
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

function isValidCivilDate(
  value: unknown,
): value is string {
  if (
    typeof value !== 'string'
  ) {
    return false
  }

  if (
    !ISO_DATE_RE.test(value)
  ) {
    return false
  }

  const year =
    Number(
      value.slice(0, 4),
    )

  const month =
    Number(
      value.slice(5, 7),
    )

  const day =
    Number(
      value.slice(8, 10),
    )

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

  const maxDay =
    month === 2 &&
    isLeapYear(year)
      ? 29
      : DAYS_IN_MONTH[
          month - 1
        ]

  return day <= maxDay
}

function isValidTime(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    HHMM_RE.test(value)
  )
}

function isFinitePositive(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  )
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  )
}

function isOptionalString(
  value: unknown,
): value is
  | string
  | undefined
  | null {
  return (
    value === undefined ||
    value === null ||
    typeof value === 'string'
  )
}

function isInList<
  T extends string,
>(
  value: unknown,
  options: readonly T[],
): value is T {
  return (
    typeof value ===
      'string' &&
    (
      options as readonly string[]
    ).includes(value)
  )
}

const LAND_AREA_TYPES:
  readonly LandAreaType[] = [
    'Piquete',
    'Talhão',
    'Pastagem',
    'Reserva/APP',
    'Infraestrutura',
    'Área ociosa',
    'Outro',
  ]

const LAND_AREA_STATUSES:
  readonly LandAreaStatus[] = [
    'Em uso',
    'Em descanso',
    'Em recuperação',
    'Inativa',
  ]

const ANIMAL_SPECIES:
  readonly AnimalSpecies[] = [
    'Bovino',
    'Bubalino',
    'Ovino',
    'Caprino',
    'Equino',
    'Suíno',
    'Outro',
  ]

const ANIMAL_SEX:
  readonly AnimalSex[] = [
    'Macho',
    'Fêmea',
  ]

const ANIMAL_CATEGORIES:
  readonly AnimalCategory[] = [
    'Bezerro',
    'Bezerra',
    'Novilho',
    'Novilha',
    'Vaca',
    'Touro',
    'Boi',
    'Matriz',
    'Reprodutor',
    'Outro',
  ]

const ANIMAL_STATUSES:
  readonly AnimalStatus[] = [
    'Ativo',
    'Vendido',
    'Morto',
    'Descartado',
    'Transferido',
  ]

const AGENDA_TYPES:
  readonly AgendaActivityType[] =
    [
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

const AGENDA_PRIORITIES:
  readonly AgendaActivityPriority[] =
    [
      'Baixa',
      'Média',
      'Alta',
    ]

const AGENDA_STATUSES:
  readonly AgendaActivityStatus[] =
    [
      'Pendente',
      'Concluída',
      'Cancelada',
    ]

const FINANCIAL_TYPES:
  readonly FinancialTransactionType[] =
    [
      'Receita',
      'Despesa',
    ]

const INVENTORY_MOVEMENT_TYPES:
  readonly InventoryMovementType[] =
    [
      'Entrada',
      'Saída',
    ]

const CROP_CYCLE_STATUSES:
  readonly CropCycleStatus[] =
    [
      'Planejado',
      'Em andamento',
      'Concluído',
      'Cancelado',
    ]

const MACHINE_STATUSES:
  readonly MachineStatus[] = [
    'Operacional',
    'Em manutenção',
    'Inativa',
  ]

function validateCreateLandArea(
  raw: unknown,
): CreateLandAreaActionData | null {
  if (!isPlainObject(raw)) {
    return null
  }

  const {
    code,
    name,
    type,
    areaHectares,
    status,
    purpose,
    description,
  } = raw

  if (
    !isNonEmptyString(code)
  ) {
    return null
  }

  if (
    !isNonEmptyString(name)
  ) {
    return null
  }

  if (
    !isInList(
      type,
      LAND_AREA_TYPES,
    )
  ) {
    return null
  }

  if (
    !isFinitePositive(
      areaHectares,
    )
  ) {
    return null
  }

  if (
    !isInList(
      status,
      LAND_AREA_STATUSES,
    )
  ) {
    return null
  }

  if (
    !isOptionalString(purpose)
  ) {
    return null
  }

  if (
    !isOptionalString(
      description,
    )
  ) {
    return null
  }

  return {
    code: code.trim(),
    name: name.trim(),
    type,
    areaHectares,
    status,
    purpose:
      purpose ?? null,
    description:
      description ?? null,
  }
}

function validateCreateAnimal(
  raw: unknown,
): CreateAnimalActionData | null {
  if (!isPlainObject(raw)) {
    return null
  }

  const {
    identification,
    name,
    species,
    breed,
    sex,
    birthDate,
    category,
    status,
    lotId,
    currentWeight,
    origin,
    notes,
  } = raw

  if (
    !isNonEmptyString(
      identification,
    )
  ) {
    return null
  }

  if (
    !isOptionalString(name)
  ) {
    return null
  }

  if (
    !isInList(
      species,
      ANIMAL_SPECIES,
    )
  ) {
    return null
  }

  if (
    !isNonEmptyString(breed)
  ) {
    return null
  }

  if (
    !isInList(
      sex,
      ANIMAL_SEX,
    )
  ) {
    return null
  }

  if (
    !isInList(
      category,
      ANIMAL_CATEGORIES,
    )
  ) {
    return null
  }

  if (
    !isInList(
      status,
      ANIMAL_STATUSES,
    )
  ) {
    return null
  }

  let normalizedBirth:
    string | null = null

  if (
    birthDate !== undefined &&
    birthDate !== null
  ) {
    if (
      !isValidCivilDate(
        birthDate,
      )
    ) {
      return null
    }

    normalizedBirth =
      birthDate
  }

  let normalizedWeight:
    number | null = null

  if (
    currentWeight !==
      undefined &&
    currentWeight !== null
  ) {
    if (
      !isFinitePositive(
        currentWeight,
      )
    ) {
      return null
    }

    normalizedWeight =
      currentWeight
  }

  if (
    !isOptionalString(lotId)
  ) {
    return null
  }

  if (
    !isOptionalString(origin)
  ) {
    return null
  }

  if (
    !isOptionalString(notes)
  ) {
    return null
  }

  return {
    identification:
      identification.trim(),
    name:
      name ?? null,
    species,
    breed:
      breed.trim(),
    sex,
    birthDate:
      normalizedBirth,
    category,
    status,
    lotId:
      lotId ?? null,
    currentWeight:
      normalizedWeight,
    origin:
      origin ?? null,
    notes:
      notes ?? null,
  }
}

function validateCreateAgendaActivity(
  raw: unknown,
): CreateAgendaActivityActionData | null {
  if (!isPlainObject(raw)) {
    return null
  }

  const {
    title,
    type,
    date,
    time,
    priority,
    status,
    responsibleEmployeeId,
    notes,
  } = raw

  if (
    !isNonEmptyString(title)
  ) {
    return null
  }

  if (
    !isInList(
      type,
      AGENDA_TYPES,
    )
  ) {
    return null
  }

  if (
    !isValidCivilDate(date)
  ) {
    return null
  }

  if (
    !isInList(
      priority,
      AGENDA_PRIORITIES,
    )
  ) {
    return null
  }

  if (
    !isInList(
      status,
      AGENDA_STATUSES,
    )
  ) {
    return null
  }

  let normalizedTime:
    string | null = null

  if (
    time !== undefined &&
    time !== null
  ) {
    if (
      !isValidTime(time)
    ) {
      return null
    }

    normalizedTime = time
  }

  if (
    !isOptionalString(
      responsibleEmployeeId,
    )
  ) {
    return null
  }

  if (
    !isOptionalString(notes)
  ) {
    return null
  }

  return {
    title:
      title.trim(),
    type,
    date,
    time:
      normalizedTime,
    priority,
    status,
    responsibleEmployeeId:
      responsibleEmployeeId ??
      null,
    notes:
      notes ?? null,
  }
}

function validateCreateFinancialTransaction(
  raw: unknown,
): CreateFinancialTransactionActionData | null {
  if (!isPlainObject(raw)) {
    return null
  }

  const {
    type,
    date,
    categoryId,
    description,
    amount,
    notes,
  } = raw

  if (
    !isInList(
      type,
      FINANCIAL_TYPES,
    )
  ) {
    return null
  }

  if (
    !isValidCivilDate(date)
  ) {
    return null
  }

  if (
    !isNonEmptyString(
      categoryId,
    )
  ) {
    return null
  }

  if (
    !isNonEmptyString(
      description,
    )
  ) {
    return null
  }

  if (
    !isFinitePositive(amount)
  ) {
    return null
  }

  if (
    !isOptionalString(notes)
  ) {
    return null
  }

  return {
    type,
    date,
    categoryId:
      categoryId.trim(),
    description:
      description.trim(),
    amount,
    notes:
      notes ?? null,
  }
}

function validateCreateInventoryMovement(
  raw: unknown,
): CreateInventoryMovementActionData | null {
  if (!isPlainObject(raw)) {
    return null
  }

  const {
    inventoryItemId,
    type,
    movementDate,
    quantity,
    reason,
    responsible,
    notes,
  } = raw

  if (
    !isNonEmptyString(
      inventoryItemId,
    )
  ) {
    return null
  }

  if (
    !isInList(
      type,
      INVENTORY_MOVEMENT_TYPES,
    )
  ) {
    return null
  }

  if (
    !isValidCivilDate(
      movementDate,
    )
  ) {
    return null
  }

  if (
    !isFinitePositive(
      quantity,
    )
  ) {
    return null
  }

  if (
    !isNonEmptyString(
      reason,
    )
  ) {
    return null
  }

  if (
    !isOptionalString(
      responsible,
    )
  ) {
    return null
  }

  if (
    !isOptionalString(notes)
  ) {
    return null
  }

  return {
    inventoryItemId:
      inventoryItemId.trim(),
    type,
    movementDate,
    quantity,
    reason:
      reason.trim(),
    responsible:
      responsible ?? null,
    notes:
      notes ?? null,
  }
}

function validateCreateCropCycle(
  raw: unknown,
): CreateCropCycleActionData | null {
  if (!isPlainObject(raw)) {
    return null
  }

  const {
    landAreaId,
    crop,
    cultivar,
    season,
    status,
    plantingDate,
    expectedHarvestDate,
    notes,
  } = raw

  if (
    !isNonEmptyString(
      landAreaId,
    )
  ) {
    return null
  }

  if (
    !isNonEmptyString(crop)
  ) {
    return null
  }

  if (
    !isOptionalString(cultivar)
  ) {
    return null
  }

  if (
    !isNonEmptyString(season)
  ) {
    return null
  }

  if (
    !isInList(
      status,
      CROP_CYCLE_STATUSES,
    )
  ) {
    return null
  }

  let normalizedPlanting:
    string | null = null

  if (
    plantingDate !==
      undefined &&
    plantingDate !== null
  ) {
    if (
      !isValidCivilDate(
        plantingDate,
      )
    ) {
      return null
    }

    normalizedPlanting =
      plantingDate
  }

  let normalizedHarvest:
    string | null = null

  if (
    expectedHarvestDate !==
      undefined &&
    expectedHarvestDate !==
      null
  ) {
    if (
      !isValidCivilDate(
        expectedHarvestDate,
      )
    ) {
      return null
    }

    normalizedHarvest =
      expectedHarvestDate
  }

  if (
    !isOptionalString(notes)
  ) {
    return null
  }

  return {
    landAreaId:
      landAreaId.trim(),
    crop:
      crop.trim(),
    cultivar:
      cultivar ?? null,
    season:
      season.trim(),
    status,
    plantingDate:
      normalizedPlanting,
    expectedHarvestDate:
      normalizedHarvest,
    notes:
      notes ?? null,
  }
}

function validateUpdateMachineStatus(
  raw: unknown,
): UpdateMachineStatusActionData | null {
  if (!isPlainObject(raw)) {
    return null
  }

  const {
    machineCode,
    newStatus,
  } = raw

  if (
    !isNonEmptyString(
      machineCode,
    )
  ) {
    return null
  }

  if (
    !isInList(
      newStatus,
      MACHINE_STATUSES,
    )
  ) {
    return null
  }

  return {
    machineCode:
      machineCode.trim(),
    newStatus,
  }
}

function validateAction(
  raw: unknown,
): IntelligenceActionProposal | null {
  if (!isPlainObject(raw)) {
    return null
  }

  if (
    typeof raw.type !== 'string'
  ) {
    return null
  }

  if (
    !isPlainObject(raw.data)
  ) {
    return null
  }

  switch (raw.type) {
    case 'create_land_area': {
      const data =
        validateCreateLandArea(
          raw.data,
        )

      return data
        ? {
            type:
              'create_land_area',
            data,
          }
        : null
    }

    case 'create_animal': {
      const data =
        validateCreateAnimal(
          raw.data,
        )

      return data
        ? {
            type:
              'create_animal',
            data,
          }
        : null
    }

    case 'create_agenda_activity': {
      const data =
        validateCreateAgendaActivity(
          raw.data,
        )

      return data
        ? {
            type:
              'create_agenda_activity',
            data,
          }
        : null
    }

    case 'create_financial_transaction': {
      const data =
        validateCreateFinancialTransaction(
          raw.data,
        )

      return data
        ? {
            type:
              'create_financial_transaction',
            data,
          }
        : null
    }

    case 'create_inventory_movement': {
      const data =
        validateCreateInventoryMovement(
          raw.data,
        )

      return data
        ? {
            type:
              'create_inventory_movement',
            data,
          }
        : null
    }

    case 'create_crop_cycle': {
      const data =
        validateCreateCropCycle(
          raw.data,
        )

      return data
        ? {
            type:
              'create_crop_cycle',
            data,
          }
        : null
    }

    case 'update_machine_status': {
      const data =
        validateUpdateMachineStatus(
          raw.data,
        )

      return data
        ? {
            type:
              'update_machine_status',
            data,
          }
        : null
    }

    default:
      return null
  }
}

function normalizeResponse(
  data: unknown,
): AIChatResponse {
  if (!isPlainObject(data)) {
    throw new Error(
      'AI_PROVIDER_ERROR',
    )
  }

  const kind = data.kind

  const answer =
    typeof data.answer ===
      'string'
      ? data.answer
      : ''

  if (kind === 'action') {
    const proposal =
      validateAction(
        data.action,
      )

    if (proposal) {
      return {
        kind: 'action',
        answer,
        action: proposal,
      }
    }

    return {
      kind: 'message',
      answer,
    }
  }

  return {
    kind: 'message',
    answer,
  }
}

export async function sendIntelligenceChat(
  payload: AIChatRequest,
): Promise<AIChatResponse> {
  if (
    typeof navigator !==
      'undefined' &&
    navigator.onLine === false
  ) {
    throw new Error(
      'OFFLINE',
    )
  }

  const controller =
    new AbortController()

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      TIMEOUT_MS,
    )

  try {
    const response =
      await fetch(
        '/api/intelligence/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body:
            JSON.stringify(
              payload,
            ),
          signal:
            controller.signal,
        },
      )

    if (!response.ok) {
      let code =
        'AI_PROVIDER_ERROR'

      try {
        const body:
          unknown =
            await response.json()

        if (
          isPlainObject(body) &&
          typeof body.error ===
            'string'
        ) {
          code = body.error
        }
      } catch {
        // mantém código padrão
      }

      throw new Error(code)
    }

    const data:
      unknown =
        await response.json()

    return normalizeResponse(
      data,
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.name ===
        'AbortError'
    ) {
      throw new Error(
        'AI_TIMEOUT',
      )
    }

    if (
      error instanceof Error
    ) {
      throw error
    }

    throw new Error(
      'AI_PROVIDER_ERROR',
    )
  } finally {
    clearTimeout(timeout)
  }
}