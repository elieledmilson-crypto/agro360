import {
  FinancialCategory,
  FinancialTransaction,
  FinancialTransactionOrigin,
  FinancialTransactionOriginModule,
  FinancialTransactionOriginType,
  FinancialTransactionType,
} from '../types'
import { getStorageItem, setStorageItem, generateId } from './storage'
import { isFutureDate } from '../utils/date'

const CATEGORIES_KEY = 'agro360_financial_categories'
const CATEGORIES_INITIALIZED_KEY = 'agro360_financial_categories_initialized'

const TRANSACTIONS_KEY = 'agro360_financial_transactions'
const TRANSACTIONS_INITIALIZED_KEY =
  'agro360_financial_transactions_initialized'

const VALID_TYPES: FinancialTransactionType[] = ['Receita', 'Despesa']

const VALID_ORIGIN_MODULES: FinancialTransactionOriginModule[] = [
  'health',
  'crops',
  'machines',
  'inventory',
]

const VALID_ORIGIN_TYPES: FinancialTransactionOriginType[] = [
  'vaccination',
  'treatment',
  'crop-management',
  'machine-maintenance',
  'inventory-entry',
]

const VALID_ORIGIN_PAIRS: Array<{
  module: FinancialTransactionOriginModule
  type: FinancialTransactionOriginType
}> = [
  { module: 'health', type: 'vaccination' },
  { module: 'health', type: 'treatment' },
  { module: 'crops', type: 'crop-management' },
  { module: 'machines', type: 'machine-maintenance' },
  { module: 'inventory', type: 'inventory-entry' },
]

type FinancialCategoryInput = Omit<
  FinancialCategory,
  'id' | 'createdAt' | 'updatedAt'
>

type FinancialTransactionInput = Omit<
  FinancialTransaction,
  'id' | 'createdAt' | 'updatedAt'
>

function initializeCategoriesIfNeeded(): void {
  const initialized = getStorageItem<boolean>(
    CATEGORIES_INITIALIZED_KEY,
    false,
  )

  if (!initialized) {
    setStorageItem(CATEGORIES_KEY, [])
    setStorageItem(CATEGORIES_INITIALIZED_KEY, true)
  }
}

function initializeTransactionsIfNeeded(): void {
  const initialized = getStorageItem<boolean>(
    TRANSACTIONS_INITIALIZED_KEY,
    false,
  )

  if (!initialized) {
    setStorageItem(TRANSACTIONS_KEY, [])
    setStorageItem(TRANSACTIONS_INITIALIZED_KEY, true)
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
          year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)

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

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

function isValidOriginPair(module: string, type: string): boolean {
  return VALID_ORIGIN_PAIRS.some(
    pair => pair.module === module && pair.type === type,
  )
}

function isFinancialTransactionOrigin(
  value: unknown,
): value is FinancialTransactionOrigin {
  if (!value || typeof value !== 'object') return false

  const obj = value as Record<string, unknown>

  if (
    typeof obj.module !== 'string' ||
    !VALID_ORIGIN_MODULES.includes(
      obj.module as FinancialTransactionOriginModule,
    )
  ) {
    return false
  }

  if (
    typeof obj.type !== 'string' ||
    !VALID_ORIGIN_TYPES.includes(
      obj.type as FinancialTransactionOriginType,
    )
  ) {
    return false
  }

  if (!isValidOriginPair(obj.module, obj.type)) return false

  return isNonEmptyString(obj.recordId)
}

function isFinancialCategory(value: unknown): value is FinancialCategory {
  if (!value || typeof value !== 'object') return false

  const obj = value as Record<string, unknown>

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.name) &&
    typeof obj.type === 'string' &&
    VALID_TYPES.includes(obj.type as FinancialTransactionType) &&
    isOptionalString(obj.description) &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  )
}

function isFinancialTransaction(
  value: unknown,
): value is FinancialTransaction {
  if (!value || typeof value !== 'object') return false

  const obj = value as Record<string, unknown>

  if (
    !isNonEmptyString(obj.id) ||
    typeof obj.type !== 'string' ||
    !VALID_TYPES.includes(obj.type as FinancialTransactionType) ||
    typeof obj.date !== 'string' ||
    !isValidCivilDate(obj.date) ||
    !isNonEmptyString(obj.categoryId) ||
    !isNonEmptyString(obj.description) ||
    typeof obj.amount !== 'number' ||
    !Number.isFinite(obj.amount) ||
    obj.amount <= 0 ||
    !isOptionalString(obj.notes) ||
    typeof obj.createdAt !== 'string' ||
    typeof obj.updatedAt !== 'string'
  ) {
    return false
  }

  if (isFutureDate(obj.date)) return false

  if (obj.origin !== undefined) {
    if (!isFinancialTransactionOrigin(obj.origin)) return false
  }

  return true
}

function getRawCategoryEntries(): unknown[] {
  initializeCategoriesIfNeeded()

  const raw = getStorageItem<unknown>(CATEGORIES_KEY, [])

  return Array.isArray(raw) ? [...raw] : []
}

function getRawTransactionEntries(): unknown[] {
  initializeTransactionsIfNeeded()

  const raw = getStorageItem<unknown>(TRANSACTIONS_KEY, [])

  return Array.isArray(raw) ? [...raw] : []
}

export function getFinancialCategories(): FinancialCategory[] {
  initializeCategoriesIfNeeded()

  const raw = getStorageItem<unknown>(CATEGORIES_KEY, [])

  if (!Array.isArray(raw)) return []

  return raw
    .filter(isFinancialCategory)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function getFinancialCategoryById(
  id: string,
): FinancialCategory | undefined {
  return getFinancialCategories().find(category => category.id === id)
}

export function getFinancialCategoriesByType(
  type: FinancialTransactionType,
): FinancialCategory[] {
  return getFinancialCategories().filter(category => category.type === type)
}

function isDuplicateCategoryName(
  name: string,
  type: FinancialTransactionType,
  excludeId?: string,
): boolean {
  const normalized = normalizeName(name)

  return getFinancialCategories().some(category => {
    if (category.type !== type) return false
    if (excludeId !== undefined && category.id === excludeId) return false

    return normalizeName(category.name) === normalized
  })
}

function validateAndNormalizeCategoryInput(
  data: FinancialCategoryInput,
): FinancialCategoryInput {
  const name = data.name.trim()

  if (!name) throw new Error('Nome é obrigatório.')

  if (!VALID_TYPES.includes(data.type)) {
    throw new Error('Tipo é obrigatório.')
  }

  return {
    name,
    type: data.type,
    description: data.description?.trim() || undefined,
  }
}

export function createFinancialCategory(
  data: FinancialCategoryInput,
): FinancialCategory {
  initializeCategoriesIfNeeded()

  const normalized = validateAndNormalizeCategoryInput(data)

  if (isDuplicateCategoryName(normalized.name, normalized.type)) {
    throw new Error(
      'Já existe uma categoria com este nome para este tipo.',
    )
  }

  const rawEntries = getRawCategoryEntries()
  const now = new Date().toISOString()

  const newCategory: FinancialCategory = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  rawEntries.push(newCategory)

  setStorageItem(CATEGORIES_KEY, rawEntries)

  return newCategory
}

export function updateFinancialCategory(
  id: string,
  data: FinancialCategoryInput,
): FinancialCategory | undefined {
  const currentCategory = getFinancialCategoryById(id)

  if (!currentCategory) return undefined

  const normalized = validateAndNormalizeCategoryInput(data)

  if (
    currentCategory.type !== normalized.type &&
    financialCategoryHasTransactions(id)
  ) {
    throw new Error(
      'Não é possível alterar o tipo de uma categoria que já possui movimentações financeiras vinculadas.',
    )
  }

  if (isDuplicateCategoryName(normalized.name, normalized.type, id)) {
    throw new Error(
      'Já existe uma categoria com este nome para este tipo.',
    )
  }

  const rawEntries = getRawCategoryEntries()

  const targetIndex = rawEntries.findIndex(
    entry => isFinancialCategory(entry) && entry.id === id,
  )

  if (targetIndex === -1) return undefined

  const updatedCategory: FinancialCategory = {
    ...normalized,
    id: currentCategory.id,
    createdAt: currentCategory.createdAt,
    updatedAt: new Date().toISOString(),
  }

  rawEntries[targetIndex] = updatedCategory

  setStorageItem(CATEGORIES_KEY, rawEntries)

  return updatedCategory
}

export function deleteFinancialCategory(id: string): boolean {
  if (financialCategoryHasTransactions(id)) {
    throw new Error(
      'Não é possível excluir esta categoria porque ela possui movimentações financeiras vinculadas.',
    )
  }

  const rawEntries = getRawCategoryEntries()

  const targetIndex = rawEntries.findIndex(
    entry => isFinancialCategory(entry) && entry.id === id,
  )

  if (targetIndex === -1) return false

  rawEntries.splice(targetIndex, 1)

  setStorageItem(CATEGORIES_KEY, rawEntries)

  return true
}

export function financialCategoryHasTransactions(id: string): boolean {
  return getFinancialTransactions().some(
    transaction => transaction.categoryId === id,
  )
}

export function getFinancialCategoryTransactionCount(id: string): number {
  return getFinancialTransactions().filter(
    transaction => transaction.categoryId === id,
  ).length
}

export function getFinancialTransactions(): FinancialTransaction[] {
  initializeTransactionsIfNeeded()

  const raw = getStorageItem<unknown>(TRANSACTIONS_KEY, [])

  if (!Array.isArray(raw)) return []

  return raw
    .filter(isFinancialTransaction)
    .filter(transaction => {
      const category = getFinancialCategoryById(transaction.categoryId)

      if (!category) return false
      if (category.type !== transaction.type) return false

      return true
    })
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)

      if (dateCompare !== 0) return dateCompare

      return b.createdAt.localeCompare(a.createdAt)
    })
}

export function getFinancialTransactionById(
  id: string,
): FinancialTransaction | undefined {
  return getFinancialTransactions().find(
    transaction => transaction.id === id,
  )
}

export function getFinancialTransactionsByType(
  type: FinancialTransactionType,
): FinancialTransaction[] {
  return getFinancialTransactions().filter(
    transaction => transaction.type === type,
  )
}

export function getFinancialTransactionsByCategoryId(
  categoryId: string,
): FinancialTransaction[] {
  return getFinancialTransactions().filter(
    transaction => transaction.categoryId === categoryId,
  )
}

export function getFinancialTransactionsInPeriod(
  startDate?: string,
  endDate?: string,
): FinancialTransaction[] {
  return getFinancialTransactions().filter(transaction => {
    if (startDate && transaction.date < startDate) return false
    if (endDate && transaction.date > endDate) return false

    return true
  })
}

export function getFinancialTransactionsByOrigin(
  module: FinancialTransactionOriginModule,
  type: FinancialTransactionOriginType,
  recordId: string,
): FinancialTransaction[] {
  return getFinancialTransactions().filter(
    transaction =>
      transaction.origin !== undefined &&
      transaction.origin.module === module &&
      transaction.origin.type === type &&
      transaction.origin.recordId === recordId,
  )
}

export function hasFinancialTransactionByOrigin(
  module: FinancialTransactionOriginModule,
  type: FinancialTransactionOriginType,
  recordId: string,
): boolean {
  return (
    getFinancialTransactionsByOrigin(module, type, recordId).length > 0
  )
}

function validateAndNormalizeTransactionInput(
  data: FinancialTransactionInput,
): FinancialTransactionInput {
  if (!VALID_TYPES.includes(data.type)) {
    throw new Error('Tipo é obrigatório.')
  }

  const date = data.date.trim()

  if (!date) throw new Error('Data é obrigatória.')
  if (!isValidCivilDate(date)) throw new Error('Data inválida.')

  if (isFutureDate(date)) {
    throw new Error(
      'A data da movimentação financeira não pode ser futura.',
    )
  }

  const categoryId = data.categoryId.trim()

  if (!categoryId) throw new Error('Categoria é obrigatória.')

  const category = getFinancialCategoryById(categoryId)

  if (!category) {
    throw new Error('Categoria financeira não encontrada.')
  }

  if (category.type !== data.type) {
    throw new Error(
      'A categoria selecionada não é compatível com o tipo da movimentação.',
    )
  }

  const description = data.description.trim()

  if (!description) throw new Error('Descrição é obrigatória.')

  const amount = data.amount

  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error('O valor deve ser maior que zero.')
  }

  if (data.origin !== undefined) {
    if (!isFinancialTransactionOrigin(data.origin)) {
      throw new Error('Origem da movimentação financeira inválida.')
    }
  }

  return {
    type: data.type,
    date,
    categoryId,
    description,
    amount,
    notes: data.notes?.trim() || undefined,
    origin: data.origin,
  }
}

export function validateFinancialTransactionInput(
  data: FinancialTransactionInput,
): void {
  validateAndNormalizeTransactionInput(data)
}

export function createFinancialTransaction(
  data: FinancialTransactionInput,
): FinancialTransaction {
  initializeTransactionsIfNeeded()

  const normalized = validateAndNormalizeTransactionInput(data)

  if (
    normalized.origin !== undefined &&
    hasFinancialTransactionByOrigin(
      normalized.origin.module,
      normalized.origin.type,
      normalized.origin.recordId,
    )
  ) {
    throw new Error(
      'Este registro já possui lançamento financeiro vinculado.',
    )
  }

  const rawEntries = getRawTransactionEntries()
  const now = new Date().toISOString()

  const newTransaction: FinancialTransaction = {
    ...normalized,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  rawEntries.push(newTransaction)

  setStorageItem(TRANSACTIONS_KEY, rawEntries)

  return newTransaction
}

export function updateFinancialTransaction(
  id: string,
  data: FinancialTransactionInput,
): FinancialTransaction | undefined {
  const currentTransaction = getFinancialTransactionById(id)

  if (!currentTransaction) return undefined

  if (data.type !== currentTransaction.type) {
    throw new Error(
      'Não é possível alterar o tipo de uma movimentação financeira.',
    )
  }

  const normalized = validateAndNormalizeTransactionInput(data)

  const rawEntries = getRawTransactionEntries()

  const targetIndex = rawEntries.findIndex(
    entry => isFinancialTransaction(entry) && entry.id === id,
  )

  if (targetIndex === -1) return undefined

  const updatedTransaction: FinancialTransaction = {
    ...normalized,
    id: currentTransaction.id,
    createdAt: currentTransaction.createdAt,
    updatedAt: new Date().toISOString(),
  }

  rawEntries[targetIndex] = updatedTransaction

  setStorageItem(TRANSACTIONS_KEY, rawEntries)

  return updatedTransaction
}

export function deleteFinancialTransaction(id: string): boolean {
  const rawEntries = getRawTransactionEntries()

  const targetIndex = rawEntries.findIndex(
    entry => isFinancialTransaction(entry) && entry.id === id,
  )

  if (targetIndex === -1) return false

  rawEntries.splice(targetIndex, 1)

  setStorageItem(TRANSACTIONS_KEY, rawEntries)

  return true
}