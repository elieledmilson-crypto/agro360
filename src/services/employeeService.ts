import {
  AccessAccount,
  AccessAccountStatus,
  Employee,
  EmployeeStatus,
  User,
  UserRole,
} from '../types'
import { getStorageItem, setStorageItem, generateId } from './storage'
import { isPermissionKey } from './permissionService'

const EMPLOYEES_KEY = 'agro360_employees'
const EMPLOYEES_INITIALIZED_KEY = 'agro360_employees_initialized'

const ACCOUNTS_KEY = 'agro360_access_accounts'
const ACCOUNTS_INITIALIZED_KEY = 'agro360_access_accounts_initialized'


const VALID_ROLES: UserRole[] = ['admin', 'user']
const VALID_EMPLOYEE_STATUSES: EmployeeStatus[] = ['Ativo', 'Inativo']
const VALID_ACCOUNT_STATUSES: AccessAccountStatus[] = ['Ativo', 'Inativo']

type EmployeeInput = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>

type AccessAccountInput = Omit<AccessAccount, 'id' | 'createdAt' | 'updatedAt'>

// -------------------- Helpers --------------------

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalString(value: unknown): value is string | undefined {
  if (value === undefined) return true
  return typeof value === 'string'
}

export function normalizeAccessEmail(email: string): string {
  return email.trim().toLowerCase()
}

// -------------------- Type guards --------------------

function isEmployee(value: unknown): value is Employee {
  if (!value || typeof value !== 'object') return false

  const obj = value as Record<string, unknown>

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.name) &&
    isNonEmptyString(obj.function) &&
    isOptionalString(obj.phone) &&
    isOptionalString(obj.email) &&
    typeof obj.status === 'string' &&
    VALID_EMPLOYEE_STATUSES.includes(obj.status as EmployeeStatus) &&
    isOptionalString(obj.notes) &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  )
}

function isAccessAccount(value: unknown): value is AccessAccount {
  if (!value || typeof value !== 'object') return false

  const obj = value as Record<string, unknown>

  if (
    !isNonEmptyString(obj.id) ||
    !isNonEmptyString(obj.employeeId) ||
    !isNonEmptyString(obj.email) ||
    typeof obj.role !== 'string' ||
    !VALID_ROLES.includes(obj.role as UserRole) ||
    !Array.isArray(obj.permissions) ||
    typeof obj.status !== 'string' ||
    !VALID_ACCOUNT_STATUSES.includes(obj.status as AccessAccountStatus) ||
    typeof obj.createdAt !== 'string' ||
    typeof obj.updatedAt !== 'string'
  ) {
    return false
  }

  return obj.permissions.every(isPermissionKey)
}

// -------------------- Inicialização --------------------

function initializeEmployeesIfNeeded(): void {
  const initialized = getStorageItem<boolean>(
    EMPLOYEES_INITIALIZED_KEY,
    false,
  )

  if (initialized) return

  setStorageItem(EMPLOYEES_KEY, [])
  setStorageItem(ACCOUNTS_KEY, [])
  setStorageItem(EMPLOYEES_INITIALIZED_KEY, true)
  setStorageItem(ACCOUNTS_INITIALIZED_KEY, true)
}

function initializeAccountsIfNeeded(): void {
  initializeEmployeesIfNeeded()

  const initialized = getStorageItem<boolean>(
    ACCOUNTS_INITIALIZED_KEY,
    false,
  )

  if (!initialized) {
    setStorageItem(ACCOUNTS_KEY, [])
    setStorageItem(ACCOUNTS_INITIALIZED_KEY, true)
  }
}

// -------------------- Leitura RAW --------------------

function getRawEmployeeEntries(): unknown[] {
  initializeEmployeesIfNeeded()

  const raw = getStorageItem<unknown>(EMPLOYEES_KEY, [])

  return Array.isArray(raw) ? [...raw] : []
}

function getRawAccountEntries(): unknown[] {
  initializeAccountsIfNeeded()

  const raw = getStorageItem<unknown>(ACCOUNTS_KEY, [])

  return Array.isArray(raw) ? [...raw] : []
}

// -------------------- Employees: leitura --------------------

export function getEmployees(): Employee[] {
  initializeEmployeesIfNeeded()

  const raw = getStorageItem<unknown>(EMPLOYEES_KEY, [])

  if (!Array.isArray(raw)) return []

  return raw
    .filter(isEmployee)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function getEmployeeById(id: string): Employee | undefined {
  return getEmployees().find(employee => employee.id === id)
}

// -------------------- Accounts: leitura --------------------

export function getAccessAccounts(): AccessAccount[] {
  initializeAccountsIfNeeded()

  const employees = getEmployees()
  const employeeIds = new Set(employees.map(e => e.id))

  const raw = getStorageItem<unknown>(ACCOUNTS_KEY, [])

  if (!Array.isArray(raw)) return []

  return raw
    .filter(isAccessAccount)
    .filter(account => employeeIds.has(account.employeeId))
    .sort((a, b) => a.email.localeCompare(b.email, 'pt-BR'))
}

export function getAccessAccountById(
  id: string,
): AccessAccount | undefined {
  return getAccessAccounts().find(account => account.id === id)
}

export function getAccessAccountByEmployeeId(
  employeeId: string,
): AccessAccount | undefined {
  return getAccessAccounts().find(
    account => account.employeeId === employeeId,
  )
}

export function getAccessAccountByEmail(
  email: string,
): AccessAccount | undefined {
  const normalized = normalizeAccessEmail(email)

  return getAccessAccounts().find(
    account => normalizeAccessEmail(account.email) === normalized,
  )
}

export function employeeHasAccessAccount(employeeId: string): boolean {
  return getAccessAccountByEmployeeId(employeeId) !== undefined
}

export function getPrimaryAdminLoginEmail(): string | undefined {
  const accounts = getAccessAccounts()
  const employees = getEmployees()

  const activeAdminAccount = accounts.find(account => {
    if (account.role !== 'admin') return false
    if (account.status !== 'Ativo') return false

    const employee = employees.find(e => e.id === account.employeeId)

    return employee?.status === 'Ativo'
  })

  return activeAdminAccount?.email
}

// -------------------- Validação de input --------------------

function validateAndNormalizeEmployeeInput(
  data: EmployeeInput,
): EmployeeInput {
  const name = data.name.trim()

  if (!name) {
    throw new Error('Nome é obrigatório.')
  }

  const func = data.function.trim()

  if (!func) {
    throw new Error('Função é obrigatória.')
  }

  if (!VALID_EMPLOYEE_STATUSES.includes(data.status)) {
    throw new Error('Situação do funcionário inválida.')
  }

  return {
    name,
    function: func,
    phone: data.phone?.trim() || undefined,
    email: data.email?.trim() || undefined,
    status: data.status,
    notes: data.notes?.trim() || undefined,
  }
}

function validateAndNormalizeAccountInput(
  data: AccessAccountInput,
): AccessAccountInput {
  if (!isNonEmptyString(data.employeeId)) {
    throw new Error('Funcionário é obrigatório para a conta.')
  }

  const email = normalizeAccessEmail(data.email)

  if (!email) {
    throw new Error('E-mail de acesso é obrigatório.')
  }

  if (!VALID_ROLES.includes(data.role)) {
    throw new Error('Perfil de acesso inválido.')
  }

  if (!VALID_ACCOUNT_STATUSES.includes(data.status)) {
    throw new Error('Situação da conta inválida.')
  }

  const permissions = Array.isArray(data.permissions)
    ? data.permissions.filter(isPermissionKey)
    : []

  const uniquePermissions = Array.from(new Set(permissions))

  return {
    employeeId: data.employeeId,
    email,
    role: data.role,
    permissions: uniquePermissions,
    status: data.status,
  }
}

function ensureEmailIsUnique(
  email: string,
  excludeAccountId?: string,
): void {
  const normalized = normalizeAccessEmail(email)

  const existing = getAccessAccounts().find(account => {
    if (excludeAccountId && account.id === excludeAccountId) return false
    return normalizeAccessEmail(account.email) === normalized
  })

  if (existing) {
    throw new Error('Já existe uma conta de acesso com este e-mail.')
  }
}

// -------------------- Proteção do último admin --------------------

interface ProjectedState {
  employees: Employee[]
  accounts: AccessAccount[]
}

function countActiveAdmins(state: ProjectedState): number {
  return state.accounts.filter(account => {
    if (account.role !== 'admin') return false
    if (account.status !== 'Ativo') return false

    const employee = state.employees.find(e => e.id === account.employeeId)

    return employee?.status === 'Ativo'
  }).length
}

function assertLastAdminProtected(state: ProjectedState): void {
  if (countActiveAdmins(state) < 1) {
    throw new Error(
      'Não é possível desativar ou remover o perfil do último administrador ativo do sistema.',
    )
  }
}

// -------------------- Escrita: employees + accounts --------------------

export interface EmployeeWithAccountInput {
  employee: EmployeeInput
  account?: AccessAccountInput | null
}

export interface EmployeeWithAccountResult {
  employee: Employee
  account?: AccessAccount
}

export function createEmployeeWithOptionalAccount(
  data: EmployeeWithAccountInput,
): EmployeeWithAccountResult {
  initializeEmployeesIfNeeded()

  const normalizedEmployee = validateAndNormalizeEmployeeInput(data.employee)

  const now = new Date().toISOString()

  const newEmployee: Employee = {
    ...normalizedEmployee,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  let newAccount: AccessAccount | undefined

  if (data.account) {
    const normalizedAccount = validateAndNormalizeAccountInput({
      ...data.account,
      employeeId: newEmployee.id,
    })

    ensureEmailIsUnique(normalizedAccount.email)

    newAccount = {
      ...normalizedAccount,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
  }

  // Simula estado resultante
  const employeesBefore = getRawEmployeeEntries()
  const accountsBefore = getRawAccountEntries()

  const projectedEmployees = [
    ...employeesBefore.filter(isEmployee),
    newEmployee,
  ]

  const projectedAccounts = [
    ...accountsBefore.filter(isAccessAccount),
    ...(newAccount ? [newAccount] : []),
  ]

  assertLastAdminProtected({
    employees: projectedEmployees,
    accounts: projectedAccounts,
  })

  const nextEmployees = [...employeesBefore, newEmployee]
  const nextAccounts = newAccount
    ? [...accountsBefore, newAccount]
    : accountsBefore

  setStorageItem(EMPLOYEES_KEY, nextEmployees)

  if (newAccount) {
    setStorageItem(ACCOUNTS_KEY, nextAccounts)
  }

  return {
    employee: newEmployee,
    account: newAccount,
  }
}

export function updateEmployeeWithOptionalAccount(
  employeeId: string,
  data: EmployeeWithAccountInput,
): EmployeeWithAccountResult | undefined {
  initializeEmployeesIfNeeded()

  const currentEmployee = getEmployeeById(employeeId)

  if (!currentEmployee) return undefined

  const normalizedEmployee = validateAndNormalizeEmployeeInput(data.employee)

  const currentAccount = getAccessAccountByEmployeeId(employeeId)

  let normalizedAccount: AccessAccountInput | undefined

  if (data.account && data.account.employeeId !== employeeId) {
    // força consistência
    normalizedAccount = validateAndNormalizeAccountInput({
      ...data.account,
      employeeId,
    })
  } else if (data.account) {
    normalizedAccount = validateAndNormalizeAccountInput(data.account)
  }

  if (normalizedAccount) {
    ensureEmailIsUnique(
      normalizedAccount.email,
      currentAccount?.id,
    )

    if (!currentAccount && employeeHasAccessAccount(employeeId)) {
      throw new Error(
        'Este funcionário já possui uma conta de acesso vinculada.',
      )
    }
  }

  const now = new Date().toISOString()

  const updatedEmployee: Employee = {
    ...normalizedEmployee,
    id: currentEmployee.id,
    createdAt: currentEmployee.createdAt,
    updatedAt: now,
  }

  let updatedAccount: AccessAccount | undefined

  if (normalizedAccount && currentAccount) {
    updatedAccount = {
      ...normalizedAccount,
      id: currentAccount.id,
      createdAt: currentAccount.createdAt,
      updatedAt: now,
    }
  } else if (normalizedAccount && !currentAccount) {
    updatedAccount = {
      ...normalizedAccount,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
  }

  // Simula estado resultante
  const employeesBefore = getRawEmployeeEntries()
  const accountsBefore = getRawAccountEntries()

  const projectedEmployees = employeesBefore
    .filter(isEmployee)
    .map(e => (e.id === employeeId ? updatedEmployee : e))

  let projectedAccounts: AccessAccount[]

  if (updatedAccount) {
    const existsInProjected = accountsBefore
      .filter(isAccessAccount)
      .some(a => a.id === updatedAccount!.id)

    projectedAccounts = existsInProjected
      ? accountsBefore
          .filter(isAccessAccount)
          .map(a =>
            a.id === updatedAccount!.id ? updatedAccount! : a,
          )
      : [...accountsBefore.filter(isAccessAccount), updatedAccount]
  } else {
    projectedAccounts = accountsBefore.filter(isAccessAccount)
  }

  assertLastAdminProtected({
    employees: projectedEmployees,
    accounts: projectedAccounts,
  })

  // Persistir
  const nextEmployees = employeesBefore.map(entry =>
    isEmployee(entry) && entry.id === employeeId
      ? updatedEmployee
      : entry,
  )

  setStorageItem(EMPLOYEES_KEY, nextEmployees)

  if (updatedAccount) {
    const nextAccounts = accountsBefore.some(
      entry => isAccessAccount(entry) && entry.id === updatedAccount!.id,
    )
      ? accountsBefore.map(entry =>
          isAccessAccount(entry) && entry.id === updatedAccount!.id
            ? updatedAccount!
            : entry,
        )
      : [...accountsBefore, updatedAccount]

    setStorageItem(ACCOUNTS_KEY, nextAccounts)
  }

  return {
    employee: updatedEmployee,
    account: updatedAccount,
  }
}

// -------------------- Restauração de sessão --------------------

export function buildUserFromAccount(
  account: AccessAccount,
  employee: Employee,
): User {
  return {
    id: account.id,
    employeeId: employee.id,
    name: employee.name,
    email: account.email,
    role: account.role,
    permissions: account.role === 'admin' ? [] : account.permissions,
  }
}

export interface ResolvedSession {
  user: User
  account: AccessAccount
  employee: Employee
}

export function resolveSessionCandidate(
  candidate: unknown,
): ResolvedSession | null {
  if (!candidate || typeof candidate !== 'object') return null

  const obj = candidate as Record<string, unknown>

  const accountId = isNonEmptyString(obj.id) ? obj.id : undefined
  const employeeId = isNonEmptyString(obj.employeeId)
    ? obj.employeeId
    : undefined
  const email = isNonEmptyString(obj.email)
    ? normalizeAccessEmail(obj.email)
    : undefined

  const accounts = getAccessAccounts()
  const employees = getEmployees()

  let account: AccessAccount | undefined

  if (accountId) {
    account = accounts.find(a => a.id === accountId)
  }

  if (!account && employeeId) {
    account = accounts.find(a => a.employeeId === employeeId)
  }

  if (!account && email) {
    account = accounts.find(
      a => normalizeAccessEmail(a.email) === email,
    )
  }

  if (!account) return null

  if (account.status !== 'Ativo') return null

  const employee = employees.find(e => e.id === account!.employeeId)

  if (!employee) return null
  if (employee.status !== 'Ativo') return null

  return {
    user: buildUserFromAccount(account, employee),
    account,
    employee,
  }
}