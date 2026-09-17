import {
  InventoryItem,
  InventoryItemCategory,
  InventoryItemStatus,
  InventoryItemUnit,
  InventoryMovement,
  InventoryMovementOrigin,
  InventoryMovementOriginModule,
  InventoryMovementOriginType,
  InventoryMovementType,
} from '../types'
import { getStorageItem, setStorageItem, generateId } from './storage'
import { isFutureDate } from '../utils/date'

const INVENTORY_ITEMS_KEY = 'agro360_inventory_items'
const INVENTORY_ITEMS_INITIALIZED_KEY = 'agro360_inventory_items_initialized'

const INVENTORY_MOVEMENTS_KEY = 'agro360_inventory_movements'
const INVENTORY_MOVEMENTS_INITIALIZED_KEY = 'agro360_inventory_movements_initialized'

const VALID_CATEGORIES: InventoryItemCategory[] = [
  'Ração',
  'Medicamento veterinário',
  'Vacina',
  'Semente',
  'Fertilizante',
  'Defensivo agrícola',
  'Combustível',
  'Lubrificante',
  'Peça',
  'Material',
  'Outro',
]

const VALID_UNITS: InventoryItemUnit[] = [
  'kg',
  'g',
  'L',
  'mL',
  'un',
  'sc',
  't',
  'm',
  'Outro',
]

const VALID_STATUSES: InventoryItemStatus[] = ['Ativo', 'Inativo']

const VALID_MOVEMENT_TYPES: InventoryMovementType[] = ['Entrada', 'Saída']

const VALID_ORIGIN_MODULES: InventoryMovementOriginModule[] = [
  'health',
  'crops',
  'machines',
]

const VALID_ORIGIN_TYPES: InventoryMovementOriginType[] = [
  'vaccination',
  'treatment',
  'crop-management',
  'machine-maintenance',
]

const VALID_ORIGIN_PAIRS: Array<{
  module: InventoryMovementOriginModule
  type: InventoryMovementOriginType
}> = [
  { module: 'health', type: 'vaccination' },
  { module: 'health', type: 'treatment' },
  { module: 'crops', type: 'crop-management' },
  { module: 'machines', type: 'machine-maintenance' },
]

const ALLOWED_CATEGORIES_BY_ORIGIN_TYPE: Record<
  InventoryMovementOriginType,
  InventoryItemCategory[]
> = {
  vaccination: ['Vacina'],
  treatment: ['Medicamento veterinário'],
  'crop-management': [
    'Semente',
    'Fertilizante',
    'Defensivo agrícola',
  ],
  'machine-maintenance': [
    'Peça',
    'Lubrificante',
    'Material',
  ],
}

type InventoryItemInput = Omit<
  InventoryItem,
  'id' | 'createdAt' | 'updatedAt'
>

type InventoryMovementInput = Omit<
  InventoryMovement,
  | 'id'
  | 'createdAt'
  | 'balanceBefore'
  | 'balanceAfter'
  | 'itemCodeSnapshot'
  | 'itemNameSnapshot'
  | 'unitSnapshot'
>

function initializeInventoryItemsIfNeeded(): void {
  const initialized = getStorageItem<boolean>(
    INVENTORY_ITEMS_INITIALIZED_KEY,
    false,
  )

  if (!initialized) {
    setStorageItem(INVENTORY_ITEMS_KEY, [])
    setStorageItem(INVENTORY_ITEMS_INITIALIZED_KEY, true)
  }
}

function initializeInventoryMovementsIfNeeded(): void {
  const initialized = getStorageItem<boolean>(
    INVENTORY_MOVEMENTS_INITIALIZED_KEY,
    false,
  )

  if (!initialized) {
    setStorageItem(INVENTORY_MOVEMENTS_KEY, [])
    setStorageItem(INVENTORY_MOVEMENTS_INITIALIZED_KEY, true)
  }
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
): value is string | undefined {
  if (value === undefined) return true
  return typeof value === 'string'
}

function isOptionalNonNegativeNumber(
  value: unknown,
): value is number | undefined {
  if (value === undefined) return true

  if (typeof value !== 'number') {
    return false
  }

  return (
    Number.isFinite(value) &&
    value >= 0
  )
}

function isNonNegativeNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0
  )
}

function isPositiveNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  )
}

function isValidCivilDate(
  dateString: string,
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false
  }

  const [year, month, day] =
    dateString.split('-').map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false
  }

  if (month < 1 || month > 12) {
    return false
  }

  const daysInMonth = (() => {
    switch (month) {
      case 1:
        return 31
      case 2: {
        const isLeapYear =
          year % 400 === 0 ||
          (
            year % 4 === 0 &&
            year % 100 !== 0
          )

        return isLeapYear
          ? 29
          : 28
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

  return (
    day >= 1 &&
    day <= daysInMonth
  )
}

function isValidOriginPair(
  module: string,
  type: string,
): boolean {
  return VALID_ORIGIN_PAIRS.some(
    pair =>
      pair.module === module &&
      pair.type === type,
  )
}

function isInventoryMovementOrigin(
  value: unknown,
): value is InventoryMovementOrigin {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return false
  }

  const obj =
    value as Record<string, unknown>

  if (
    typeof obj.module !== 'string' ||
    !VALID_ORIGIN_MODULES.includes(
      obj.module as InventoryMovementOriginModule,
    )
  ) {
    return false
  }

  if (
    typeof obj.type !== 'string' ||
    !VALID_ORIGIN_TYPES.includes(
      obj.type as InventoryMovementOriginType,
    )
  ) {
    return false
  }

  if (
    !isValidOriginPair(
      obj.module,
      obj.type,
    )
  ) {
    return false
  }

  return isNonEmptyString(
    obj.recordId,
  )
}

function isInventoryItem(
  value: unknown,
): value is InventoryItem {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return false
  }

  const obj =
    value as Record<string, unknown>

  const baseValid =
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.code) &&
    isNonEmptyString(obj.name) &&
    typeof obj.category === 'string' &&
    VALID_CATEGORIES.includes(
      obj.category as InventoryItemCategory,
    ) &&
    typeof obj.unit === 'string' &&
    VALID_UNITS.includes(
      obj.unit as InventoryItemUnit,
    ) &&
    isNonNegativeNumber(
      obj.currentQuantity,
    ) &&
    isOptionalNonNegativeNumber(
      obj.minimumQuantity,
    ) &&
    isOptionalString(obj.location) &&
    isOptionalString(obj.description) &&
    typeof obj.status === 'string' &&
    VALID_STATUSES.includes(
      obj.status as InventoryItemStatus,
    ) &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'

  if (!baseValid) {
    return false
  }

  if (
    obj.batchNumber !== undefined &&
    typeof obj.batchNumber !== 'string'
  ) {
    return false
  }

  if (
    obj.expirationDate !== undefined
  ) {
    if (
      typeof obj.expirationDate !== 'string' ||
      !isValidCivilDate(
        obj.expirationDate,
      )
    ) {
      return false
    }
  }

  return true
}

function isInventoryMovement(
  value: unknown,
): value is InventoryMovement {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return false
  }

  const obj =
    value as Record<string, unknown>

  const baseValid =
    isNonEmptyString(obj.id) &&
    isNonEmptyString(
      obj.inventoryItemId,
    ) &&
    typeof obj.type === 'string' &&
    VALID_MOVEMENT_TYPES.includes(
      obj.type as InventoryMovementType,
    ) &&
    typeof obj.movementDate === 'string' &&
    isValidCivilDate(
      obj.movementDate,
    ) &&
    isPositiveNumber(obj.quantity) &&
    isNonNegativeNumber(
      obj.balanceBefore,
    ) &&
    isNonNegativeNumber(
      obj.balanceAfter,
    ) &&
    isNonEmptyString(obj.reason) &&
    isOptionalString(
      obj.responsible,
    ) &&
    isOptionalString(obj.notes) &&
    typeof obj.createdAt === 'string'

  if (!baseValid) {
    return false
  }

  if (obj.origin !== undefined) {
    if (
      !isInventoryMovementOrigin(
        obj.origin,
      )
    ) {
      return false
    }

    if (
      !isNonEmptyString(
        obj.itemCodeSnapshot,
      )
    ) {
      return false
    }

    if (
      !isNonEmptyString(
        obj.itemNameSnapshot,
      )
    ) {
      return false
    }

    if (
      typeof obj.unitSnapshot !==
      'string'
    ) {
      return false
    }

    if (
      !VALID_UNITS.includes(
        obj.unitSnapshot as InventoryItemUnit,
      )
    ) {
      return false
    }
  } else {
    if (
      obj.itemCodeSnapshot !== undefined &&
      typeof obj.itemCodeSnapshot !==
        'string'
    ) {
      return false
    }

    if (
      obj.itemNameSnapshot !== undefined &&
      typeof obj.itemNameSnapshot !==
        'string'
    ) {
      return false
    }

    if (
      obj.unitSnapshot !== undefined
    ) {
      if (
        typeof obj.unitSnapshot !==
          'string' ||
        !VALID_UNITS.includes(
          obj.unitSnapshot as InventoryItemUnit,
        )
      ) {
        return false
      }
    }
  }

  return true
}

function getRawInventoryItemEntries(): unknown[] {
  initializeInventoryItemsIfNeeded()

  const raw =
    getStorageItem<unknown>(
      INVENTORY_ITEMS_KEY,
      [],
    )

  return Array.isArray(raw)
    ? [...raw]
    : []
}

function getRawInventoryMovementEntries(): unknown[] {
  initializeInventoryMovementsIfNeeded()

  const raw =
    getStorageItem<unknown>(
      INVENTORY_MOVEMENTS_KEY,
      [],
    )

  return Array.isArray(raw)
    ? [...raw]
    : []
}

function normalizeCode(
  code: string,
): string {
  return code.trim().toUpperCase()
}

function isDuplicateCode(
  code: string,
  excludeId?: string,
): boolean {
  const items =
    getInventoryItems()

  const normalized =
    normalizeCode(code)

  return items.some(
    item =>
      normalizeCode(item.code) ===
        normalized &&
      item.id !== excludeId,
  )
}

function validateAndNormalizeInventoryItemInput(
  data: InventoryItemInput,
): InventoryItemInput {
  const code =
    normalizeCode(data.code)

  if (!code) {
    throw new Error(
      'Código é obrigatório.',
    )
  }

  const name =
    data.name.trim()

  if (!name) {
    throw new Error(
      'Nome é obrigatório.',
    )
  }

  if (
    !VALID_CATEGORIES.includes(
      data.category,
    )
  ) {
    throw new Error(
      'Categoria inválida.',
    )
  }

  if (
    !VALID_UNITS.includes(
      data.unit,
    )
  ) {
    throw new Error(
      'Unidade inválida.',
    )
  }

  if (
    !VALID_STATUSES.includes(
      data.status,
    )
  ) {
    throw new Error(
      'Situação inválida.',
    )
  }

  const currentQuantity =
    data.currentQuantity

  if (
    typeof currentQuantity !== 'number' ||
    !Number.isFinite(currentQuantity) ||
    currentQuantity < 0
  ) {
    throw new Error(
      'Quantidade atual deve ser maior ou igual a zero.',
    )
  }

  const minimumQuantity =
    data.minimumQuantity

  if (
    minimumQuantity !== undefined
  ) {
    if (
      typeof minimumQuantity !==
        'number' ||
      !Number.isFinite(
        minimumQuantity,
      ) ||
      minimumQuantity < 0
    ) {
      throw new Error(
        'Quantidade mínima deve ser maior ou igual a zero.',
      )
    }
  }

  const batchNumber =
    data.batchNumber?.trim() ||
    undefined

  const expirationDate =
    data.expirationDate?.trim() ||
    undefined

  if (
    expirationDate !== undefined &&
    !isValidCivilDate(
      expirationDate,
    )
  ) {
    throw new Error(
      'Data de validade inválida.',
    )
  }

  return {
    code,
    name,
    category: data.category,
    unit: data.unit,
    currentQuantity,
    minimumQuantity,
    location:
      data.location?.trim() ||
      undefined,
    description:
      data.description?.trim() ||
      undefined,
    status: data.status,
    batchNumber,
    expirationDate,
  }
}

export function getInventoryItems():
  InventoryItem[] {
  initializeInventoryItemsIfNeeded()

  const raw =
    getStorageItem<unknown>(
      INVENTORY_ITEMS_KEY,
      [],
    )

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .filter(isInventoryItem)
    .sort((a, b) => {
      const codeCompare =
        a.code.localeCompare(
          b.code,
        )

      if (codeCompare !== 0) {
        return codeCompare
      }

      return a.name.localeCompare(
        b.name,
      )
    })
}

export function getInventoryItemById(
  id: string,
): InventoryItem | undefined {
  return getInventoryItems().find(
    item => item.id === id,
  )
}

export function createInventoryItem(
  data: InventoryItemInput,
): InventoryItem {
  initializeInventoryItemsIfNeeded()

  const normalized =
    validateAndNormalizeInventoryItemInput(
      data,
    )

  if (
    isDuplicateCode(
      normalized.code,
    )
  ) {
    throw new Error(
      'Já existe um item de estoque com este código.',
    )
  }

  const rawEntries =
    getRawInventoryItemEntries()

  const now =
    new Date().toISOString()

  const newItem:
    InventoryItem = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  rawEntries.push(
    newItem,
  )

  setStorageItem(
    INVENTORY_ITEMS_KEY,
    rawEntries,
  )

  return newItem
}

export function updateInventoryItem(
  id: string,
  data: InventoryItemInput,
): InventoryItem | undefined {
  const currentItem =
    getInventoryItemById(id)

  if (!currentItem) {
    return undefined
  }

  const normalized =
    validateAndNormalizeInventoryItemInput(
      data,
    )

  if (
    isDuplicateCode(
      normalized.code,
      id,
    )
  ) {
    throw new Error(
      'Já existe um item de estoque com este código.',
    )
  }

  if (
    currentItem.currentQuantity !==
    normalized.currentQuantity
  ) {
    throw new Error(
      'A quantidade atual não pode ser alterada diretamente. Utilize as movimentações de estoque.',
    )
  }

  if (
    currentItem.unit !==
    normalized.unit
  ) {
    const hasMovements =
      getInventoryMovementsByItemId(
        id,
      ).length > 0

    if (hasMovements) {
      throw new Error(
        'Não é possível alterar a unidade de um item que já possui movimentações.',
      )
    }
  }

  const rawEntries =
    getRawInventoryItemEntries()

  const targetIndex =
    rawEntries.findIndex(
      item =>
        isInventoryItem(item) &&
        item.id === id,
    )

  if (targetIndex === -1) {
    return undefined
  }

  const updatedItem:
    InventoryItem = {
    ...normalized,
    id: currentItem.id,
    createdAt:
      currentItem.createdAt,
    updatedAt:
      new Date().toISOString(),
  }

  rawEntries[targetIndex] =
    updatedItem

  setStorageItem(
    INVENTORY_ITEMS_KEY,
    rawEntries,
  )

  return updatedItem
}

export function deleteInventoryItem(
  id: string,
): boolean {
  const hasMovements =
    getInventoryMovementsByItemId(
      id,
    ).length > 0

  if (hasMovements) {
    throw new Error(
      'Não é possível excluir este item porque ele possui movimentações de estoque.',
    )
  }

  const rawEntries =
    getRawInventoryItemEntries()

  const targetIndex =
    rawEntries.findIndex(
      item =>
        isInventoryItem(item) &&
        item.id === id,
    )

  if (targetIndex === -1) {
    return false
  }

  rawEntries.splice(
    targetIndex,
    1,
  )

  setStorageItem(
    INVENTORY_ITEMS_KEY,
    rawEntries,
  )

  return true
}

export function isBelowMinimum(
  item: InventoryItem,
): boolean {
  if (
    item.minimumQuantity ===
    undefined
  ) {
    return false
  }

  return (
    item.currentQuantity <
    item.minimumQuantity
  )
}

export function getInventoryMovements():
  InventoryMovement[] {
  initializeInventoryMovementsIfNeeded()

  const raw =
    getStorageItem<unknown>(
      INVENTORY_MOVEMENTS_KEY,
      [],
    )

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .filter(isInventoryMovement)
    .sort((a, b) => {
      const dateCompare =
        b.movementDate.localeCompare(
          a.movementDate,
        )

      if (dateCompare !== 0) {
        return dateCompare
      }

      return b.createdAt.localeCompare(
        a.createdAt,
      )
    })
}

export function getInventoryMovementById(
  id: string,
): InventoryMovement | undefined {
  return getInventoryMovements().find(
    movement =>
      movement.id === id,
  )
}

export function getInventoryMovementsByItemId(
  inventoryItemId: string,
): InventoryMovement[] {
  return getInventoryMovements().filter(
    movement =>
      movement.inventoryItemId ===
      inventoryItemId,
  )
}

export function getInventoryMovementsByOrigin(
  module: InventoryMovementOriginModule,
  type: InventoryMovementOriginType,
  recordId: string,
): InventoryMovement[] {
  return getInventoryMovements().filter(
    movement =>
      movement.origin !== undefined &&
      movement.origin.module ===
        module &&
      movement.origin.type ===
        type &&
      movement.origin.recordId ===
        recordId,
  )
}

export function hasInventoryMovementByOrigin(
  module: InventoryMovementOriginModule,
  type: InventoryMovementOriginType,
  recordId: string,
): boolean {
  return (
    getInventoryMovementsByOrigin(
      module,
      type,
      recordId,
    ).length > 0
  )
}

function validateAndNormalizeInventoryMovementInput(
  data: InventoryMovementInput,
): InventoryMovementInput {
  const inventoryItemId =
    data.inventoryItemId.trim()

  if (!inventoryItemId) {
    throw new Error(
      'Item é obrigatório.',
    )
  }

  const item =
    getInventoryItemById(
      inventoryItemId,
    )

  if (!item) {
    throw new Error(
      'Item de estoque não encontrado.',
    )
  }

  if (
    item.status === 'Inativo'
  ) {
    throw new Error(
      'Não é possível movimentar um item inativo.',
    )
  }

  if (
    !VALID_MOVEMENT_TYPES.includes(
      data.type,
    )
  ) {
    throw new Error(
      'Tipo de movimentação inválido.',
    )
  }

  const movementDate =
    data.movementDate.trim()

  if (!movementDate) {
    throw new Error(
      'Informe a data da movimentação.',
    )
  }

  if (
    !isValidCivilDate(
      movementDate,
    )
  ) {
    throw new Error(
      'Data da movimentação inválida.',
    )
  }

  if (
    isFutureDate(
      movementDate,
    )
  ) {
    throw new Error(
      'A data da movimentação não pode ser futura.',
    )
  }

  const quantity =
    data.quantity

  if (
    typeof quantity !== 'number' ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      'Quantidade deve ser maior que zero.',
    )
  }

  const reason =
    data.reason.trim()

  if (!reason) {
    throw new Error(
      'Motivo é obrigatório.',
    )
  }

  if (
    data.type === 'Saída' &&
    quantity >
      item.currentQuantity
  ) {
    throw new Error(
      'Saldo insuficiente para realizar esta saída.',
    )
  }

  if (
    data.origin !== undefined &&
    !isInventoryMovementOrigin(
      data.origin,
    )
  ) {
    throw new Error(
      'Origem da movimentação inválida.',
    )
  }

  return {
    inventoryItemId,
    type: data.type,
    movementDate,
    quantity,
    reason,
    responsible:
      data.responsible?.trim() ||
      undefined,
    notes:
      data.notes?.trim() ||
      undefined,
    origin:
      data.origin,
  }
}

export function validateInventoryMovementInput(
  data: InventoryMovementInput,
): void {
  validateAndNormalizeInventoryMovementInput(
    data,
  )
}

function assertOriginMovementType(
  origin: InventoryMovementOrigin,
  type: InventoryMovementType,
): void {
  if (
    origin.module === 'health' &&
    origin.type === 'vaccination'
  ) {
    if (type !== 'Saída') {
      throw new Error(
        'A movimentação vinculada a uma vacinação deve ser do tipo Saída.',
      )
    }

    return
  }

  if (type !== 'Saída') {
    throw new Error(
      'Movimentações integradas com outros módulos devem ser do tipo Saída.',
    )
  }
}

function assertOriginItemCategory(
  origin: InventoryMovementOrigin,
  item: InventoryItem,
): void {
  const allowed =
    ALLOWED_CATEGORIES_BY_ORIGIN_TYPE[
      origin.type
    ]

  if (
    !allowed ||
    allowed.length === 0
  ) {
    return
  }

  if (
    allowed.includes(
      item.category,
    )
  ) {
    return
  }

  if (
    origin.type === 'vaccination'
  ) {
    throw new Error(
      'A baixa de uma vacinação deve utilizar um item da categoria Vacina.',
    )
  }

  if (
    origin.type === 'treatment'
  ) {
    throw new Error(
      'A baixa de um tratamento deve utilizar um item da categoria Medicamento veterinário.',
    )
  }

  if (
    origin.type ===
    'crop-management'
  ) {
    throw new Error(
      'A baixa de um manejo agrícola deve utilizar itens das categorias Semente, Fertilizante ou Defensivo agrícola.',
    )
  }

  if (
    origin.type ===
    'machine-maintenance'
  ) {
    throw new Error(
      'A baixa de uma manutenção deve utilizar itens das categorias Peça, Lubrificante ou Material.',
    )
  }

  throw new Error(
    'Categoria de item incompatível com esta integração.',
  )
}

export function validateIntegratedMovement(
  inventoryItemId: string,
  quantity: number,
  movementDate: string,
  origin: InventoryMovementOrigin,
  responsible?: string,
  reason?: string,
): void {
  validateInventoryMovementInput({
    inventoryItemId,
    type: 'Saída',
    movementDate,
    quantity,
    reason:
      reason ??
      'Baixa por consumo integrado',
    responsible,
    notes: undefined,
    origin,
  })

  assertOriginMovementType(
    origin,
    'Saída',
  )

  const item =
    getInventoryItemById(
      inventoryItemId,
    )

  if (!item) {
    throw new Error(
      'Item de estoque não encontrado.',
    )
  }

  assertOriginItemCategory(
    origin,
    item,
  )
}

export function validateIntegratedMovementsBatch(
  consumptions: Array<{
    inventoryItemId: string
    quantity: number
  }>,
  movementDate: string,
  origin: InventoryMovementOrigin,
  responsible?: string,
  reason?: string,
): void {
  if (
    !Array.isArray(consumptions) ||
    consumptions.length === 0
  ) {
    throw new Error(
      'Informe ao menos um item para baixa.',
    )
  }

  for (
    const line of consumptions
  ) {
    validateIntegratedMovement(
      line.inventoryItemId,
      line.quantity,
      movementDate,
      origin,
      responsible,
      reason,
    )
  }

  const totalByItemId =
    new Map<string, number>()

  for (
    const line of consumptions
  ) {
    const current =
      totalByItemId.get(
        line.inventoryItemId,
      ) ?? 0

    totalByItemId.set(
      line.inventoryItemId,
      current +
        line.quantity,
    )
  }

  for (
    const [
      itemId,
      total,
    ] of totalByItemId.entries()
  ) {
    const item =
      getInventoryItemById(
        itemId,
      )

    if (!item) {
      throw new Error(
        'Item de estoque não encontrado.',
      )
    }

    if (
      total >
      item.currentQuantity
    ) {
      throw new Error(
        'Saldo insuficiente para realizar esta saída.',
      )
    }
  }
}

export function validateVaccinationStockConsumption(
  inventoryItemId: string,
  quantity: number,
  movementDate: string,
  responsible?: string,
): void {
  validateIntegratedMovement(
    inventoryItemId,
    quantity,
    movementDate,
    {
      module: 'health',
      type: 'vaccination',
      recordId: '__pre__',
    },
    responsible,
    'Baixa por vacinação',
  )
}

interface MovementLine {
  item: InventoryItem
  rawInput: InventoryMovementInput
  normalized: InventoryMovementInput
}

function buildMovementLine(
  data: InventoryMovementInput,
  origin?: InventoryMovementOrigin,
): MovementLine {
  const normalized =
    validateAndNormalizeInventoryMovementInput({
      ...data,
      origin:
        origin ??
        data.origin,
    })

  const item =
    getInventoryItemById(
      normalized.inventoryItemId,
    )

  if (!item) {
    throw new Error(
      'Item de estoque não encontrado.',
    )
  }

  if (
    normalized.origin !==
    undefined
  ) {
    assertOriginMovementType(
      normalized.origin,
      normalized.type,
    )

    assertOriginItemCategory(
      normalized.origin,
      item,
    )
  }

  return {
    item,
    rawInput: data,
    normalized,
  }
}

function throwIdempotencyError(
  origin: InventoryMovementOrigin,
): never {
  if (
    origin.module === 'health' &&
    origin.type === 'vaccination'
  ) {
    throw new Error(
      'Esta vacinação já possui baixa de estoque registrada.',
    )
  }

  throw new Error(
    'Este registro já possui baixa de estoque vinculada.',
  )
}

export function createInventoryMovement(
  data: InventoryMovementInput,
): InventoryMovement {
  initializeInventoryItemsIfNeeded()
  initializeInventoryMovementsIfNeeded()

  const line =
    buildMovementLine(data)

  if (
    line.normalized.origin !==
    undefined
  ) {
    if (
      hasInventoryMovementByOrigin(
        line.normalized.origin.module,
        line.normalized.origin.type,
        line.normalized.origin.recordId,
      )
    ) {
      throwIdempotencyError(
        line.normalized.origin,
      )
    }
  }

  const balanceBefore =
    line.item.currentQuantity

  const balanceAfter =
    line.normalized.type ===
    'Entrada'
      ? balanceBefore +
        line.normalized.quantity
      : balanceBefore -
        line.normalized.quantity

  if (
    !Number.isFinite(
      balanceAfter,
    )
  ) {
    throw new Error(
      'O saldo resultante é inválido.',
    )
  }

  if (
    balanceAfter < 0
  ) {
    throw new Error(
      'Saldo insuficiente para realizar esta saída.',
    )
  }

  const now =
    new Date().toISOString()

  const newMovement:
    InventoryMovement = {
    ...line.normalized,
    id: generateId(),
    balanceBefore,
    balanceAfter,
    createdAt: now,
    ...(line.normalized.origin !==
    undefined
      ? {
          itemCodeSnapshot:
            line.item.code,
          itemNameSnapshot:
            line.item.name,
          unitSnapshot:
            line.item.unit,
        }
      : {}),
  }

  const rawItemsBefore =
    getRawInventoryItemEntries()

  const itemIndex =
    rawItemsBefore.findIndex(
      entry =>
        isInventoryItem(entry) &&
        entry.id ===
          line.item.id,
    )

  if (
    itemIndex === -1
  ) {
    throw new Error(
      'Item de estoque não encontrado.',
    )
  }

  const updatedItem:
    InventoryItem = {
    ...line.item,
    currentQuantity:
      balanceAfter,
    updatedAt: now,
  }

  const nextRawItems = [
    ...rawItemsBefore,
  ]

  nextRawItems[
    itemIndex
  ] = updatedItem

  const rawMovementsBefore =
    getRawInventoryMovementEntries()

  const nextRawMovements = [
    ...rawMovementsBefore,
    newMovement,
  ]

  setStorageItem(
    INVENTORY_ITEMS_KEY,
    nextRawItems,
  )

  try {
    setStorageItem(
      INVENTORY_MOVEMENTS_KEY,
      nextRawMovements,
    )
  } catch (error) {
    try {
      setStorageItem(
        INVENTORY_ITEMS_KEY,
        rawItemsBefore,
      )
    } catch {
      // mantém propagação do erro original
    }

    throw error
  }

  return newMovement
}

export function createInventoryMovementsBatch(
  inputs: InventoryMovementInput[],
): InventoryMovement[] {
  initializeInventoryItemsIfNeeded()
  initializeInventoryMovementsIfNeeded()

  if (
    inputs.length === 0
  ) {
    throw new Error(
      'Nenhuma movimentação informada.',
    )
  }

  const firstOrigin =
    inputs[0].origin

  if (!firstOrigin) {
    throw new Error(
      'Movimentações em lote exigem uma origem compartilhada.',
    )
  }

  for (
    const input of inputs
  ) {
    if (!input.origin) {
      throw new Error(
        'Movimentações em lote exigem uma origem compartilhada.',
      )
    }

    if (
      input.origin.module !==
        firstOrigin.module ||
      input.origin.type !==
        firstOrigin.type ||
      input.origin.recordId !==
        firstOrigin.recordId
    ) {
      throw new Error(
        'Todas as movimentações em lote devem compartilhar a mesma origem.',
      )
    }
  }

  if (
    hasInventoryMovementByOrigin(
      firstOrigin.module,
      firstOrigin.type,
      firstOrigin.recordId,
    )
  ) {
    throwIdempotencyError(
      firstOrigin,
    )
  }

  const lines:
    MovementLine[] =
    inputs.map(input =>
      buildMovementLine(
        input,
        firstOrigin,
      ),
    )

  const consumptionByItemId =
    new Map<string, number>()

  for (
    const line of lines
  ) {
    if (
      line.normalized.type !==
      'Saída'
    ) {
      throw new Error(
        'Movimentações integradas em lote devem ser do tipo Saída.',
      )
    }

    const id =
      line.normalized.inventoryItemId

    const current =
      consumptionByItemId.get(
        id,
      ) ?? 0

    consumptionByItemId.set(
      id,
      current +
        line.normalized.quantity,
    )
  }

  for (
    const [
      itemId,
      totalQuantity,
    ] of consumptionByItemId.entries()
  ) {
    const item =
      getInventoryItemById(
        itemId,
      )

    if (!item) {
      throw new Error(
        'Item de estoque não encontrado.',
      )
    }

    if (
      totalQuantity >
      item.currentQuantity
    ) {
      throw new Error(
        'Saldo insuficiente para realizar esta saída.',
      )
    }
  }

  const now =
    new Date().toISOString()

  const rawItemsBefore =
    getRawInventoryItemEntries()

  const rawMovementsBefore =
    getRawInventoryMovementEntries()

  const nextRawItems = [
    ...rawItemsBefore,
  ]

  const runningBalances =
    new Map<string, number>()

  const newMovements:
    InventoryMovement[] = []

  for (
    const line of lines
  ) {
    const itemId =
      line.normalized.inventoryItemId

    const itemIndex =
      nextRawItems.findIndex(
        entry =>
          isInventoryItem(entry) &&
          entry.id === itemId,
      )

    if (
      itemIndex === -1
    ) {
      throw new Error(
        'Item de estoque não encontrado.',
      )
    }

    const item =
      nextRawItems[
        itemIndex
      ] as InventoryItem

    const balanceBefore =
      runningBalances.get(
        itemId,
      ) ??
      item.currentQuantity

    const balanceAfter =
      balanceBefore -
      line.normalized.quantity

    if (
      !Number.isFinite(
        balanceAfter,
      )
    ) {
      throw new Error(
        'O saldo resultante é inválido.',
      )
    }

    if (
      balanceAfter < 0
    ) {
      throw new Error(
        'Saldo insuficiente para realizar esta saída.',
      )
    }

    runningBalances.set(
      itemId,
      balanceAfter,
    )

    const newMovement:
      InventoryMovement = {
      ...line.normalized,
      id: generateId(),
      balanceBefore,
      balanceAfter,
      createdAt: now,
      itemCodeSnapshot:
        item.code,
      itemNameSnapshot:
        item.name,
      unitSnapshot:
        item.unit,
    }

    newMovements.push(
      newMovement,
    )

    const updatedItem:
      InventoryItem = {
      ...item,
      currentQuantity:
        balanceAfter,
      updatedAt: now,
    }

    nextRawItems[
      itemIndex
    ] = updatedItem
  }

  const nextRawMovements = [
    ...rawMovementsBefore,
    ...newMovements,
  ]

  setStorageItem(
    INVENTORY_ITEMS_KEY,
    nextRawItems,
  )

  try {
    setStorageItem(
      INVENTORY_MOVEMENTS_KEY,
      nextRawMovements,
    )
  } catch (error) {
    try {
      setStorageItem(
        INVENTORY_ITEMS_KEY,
        rawItemsBefore,
      )
    } catch {
      // mantém propagação do erro original
    }

    throw error
  }

  return newMovements
}