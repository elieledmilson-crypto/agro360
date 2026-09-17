import {
  FinancialTransaction,
  FinancialTransactionOrigin,
  FinancialTransactionOriginType,
  PermissionKey,
  User,
} from '../types'
import {
  createFinancialTransaction,
  hasFinancialTransactionByOrigin,
  validateFinancialTransactionInput,
} from './financeService'
import { requirePermissions, userHasPermission } from './permissionService'

export interface IntegratedFinancialInput {
  type: 'Despesa'
  date: string
  categoryId: string
  description: string
  amount: number
  notes?: string
}

function getOriginPermission(
  origin: FinancialTransactionOrigin,
): PermissionKey | null {
  switch (origin.module) {
    case 'health':
      return 'health'
    case 'crops':
      return 'crops'
    case 'machines':
      return 'machines'
    case 'inventory':
      return 'inventory'
    default:
      return null
  }
}

export function preflightIntegratedFinancial(
  user: User | null,
  input: IntegratedFinancialInput,
  origin: FinancialTransactionOrigin,
): void {
  const originPermission = getOriginPermission(origin)

  if (originPermission) {
    requirePermissions(user, ['finance', originPermission])
  } else {
    requirePermissions(user, ['finance'])
  }

  validateFinancialTransactionInput({
    type: input.type,
    date: input.date,
    categoryId: input.categoryId,
    description: input.description,
    amount: input.amount,
    notes: input.notes,
    origin,
  })
}

export function createFinancialTransactionWithOrigin(
  user: User | null,
  input: IntegratedFinancialInput,
  origin: FinancialTransactionOrigin,
): FinancialTransaction {
  preflightIntegratedFinancial(user, input, origin)

  if (
    hasFinancialTransactionByOrigin(
      origin.module,
      origin.type,
      origin.recordId,
    )
  ) {
    throw new Error(
      'Este registro já possui lançamento financeiro vinculado.',
    )
  }

  return createFinancialTransaction({
    type: input.type,
    date: input.date,
    categoryId: input.categoryId,
    description: input.description,
    amount: input.amount,
    notes: input.notes,
    origin,
  })
}

export function canUseFinancialIntegration(
  user: User | null,
  modulePermission: PermissionKey,
): boolean {
  return (
    userHasPermission(user, 'finance') &&
    userHasPermission(user, modulePermission)
  )
}

/**
 * Erro informativo quando o Financeiro falha após principal + estoque
 * já terem sido persistidos. Não remove nada; apenas sinaliza.
 */
export function buildPostPersistenceFinancialError(): Error {
  return new Error(
    'Registro principal e movimentação de estoque foram salvos, mas o lançamento financeiro não pôde ser criado. Verifique o Financeiro manualmente.',
  )
}

// Reexport para conveniência dos formulários
export type { FinancialTransactionOriginType }