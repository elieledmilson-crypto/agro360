import {
  AccessAccount,
  AccessAccountStatus,
  Employee,
  EmployeeStatus,
  User,
  UserRole,
} from '../types'
import {
  flushStorageWrites,
  generateId,
  getStorageItem,
  setStorageItem,
} from './storage'
import { supabase } from '../lib/supabase'
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

type AccessAccountProvisionInput = AccessAccountInput & {
  password?: string
}

export interface EmployeeWithAccountInput {
  employee: EmployeeInput
  account?: AccessAccountProvisionInput | null
}

export interface EmployeeWithAccountResult {
  employee: Employee
  account?: AccessAccount
}

interface RemoteEmployeeResponse {
  employee: {
    id: string
    createdAt: string
    updatedAt: string
  }
  account: {
    userId: string
    email: string
    role: UserRole
    permissions: string[]
    status: AccessAccountStatus
    createdAt: string
    updatedAt: string
  } | null
}

async function getFunctionErrorMessage(
  error: unknown,
): Promise<string> {
  if (error && typeof error === 'object') {
    const context = (
      error as {
        context?: Response
      }
    ).context

    if (
      context &&
      typeof context.json === 'function'
    ) {
      try {
        const body = await context.json() as unknown

        if (
          body &&
          typeof body === 'object' &&
          typeof (
            body as Record<string, unknown>
          ).error === 'string'
        ) {
          return (
            body as Record<string, string>
          ).error
        }
      } catch {
        // Usa a mensagem original abaixo.
      }
    }

    const message = (
      error as {
        message?: unknown
      }
    ).message

    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return 'Não foi possível salvar o funcionário.'
}

async function invokeEmployeeAccess(
  propertyId: string,
  action: 'create' | 'update',
  employee: Employee & {
    passwordNeverStored?: never
  },
  account:
    | (
        AccessAccountInput & {
          password?: string
        }
      )
    | null,
  accountUserId?: string,
): Promise<RemoteEmployeeResponse> {
  const {
    data,
    error,
  } = await supabase.functions.invoke<RemoteEmployeeResponse>(
    'manage-employee-access',
    {
      body: {
        action,
        propertyId,
        employee: {
          id: employee.id,
          name: employee.name,
          function: employee.function,
          phone: employee.phone ?? null,
          email: employee.email ?? null,
          status: employee.status,
          notes: employee.notes ?? null,
        },
        account: account
          ? {
              email: account.email,
              password: account.password,
              role: account.role,
              permissions: account.permissions,
              status: account.status,
            }
          : null,
        accountUserId: accountUserId ?? null,
      },
    },
  )

  if (error) {
    throw new Error(
      await getFunctionErrorMessage(error),
    )
  }

  if (
    !data ||
    !data.employee ||
    typeof data.employee.id !== 'string'
  ) {
    throw new Error(
      'O servidor não retornou os dados do funcionário.',
    )
  }

  return data
}

function toRemoteAccountInput(
  data: AccessAccountProvisionInput,
  employeeId: string,
): AccessAccountInput & {
  password?: string
} {
  const normalized =
    validateAndNormalizeAccountInput({
      ...data,
      employeeId,
    })

  return {
    ...normalized,
    password:
      typeof data.password === 'string' &&
      data.password.length > 0
        ? data.password
        : undefined,
  }
}

function toLocalAccount(
  employeeId: string,
  remote: NonNullable<
    RemoteEmployeeResponse['account']
  >,
): AccessAccount {
  return {
    id: remote.userId,
    employeeId,
    email: normalizeAccessEmail(remote.email),
    role: remote.role,
    permissions: remote.permissions.filter(isPermissionKey),
    status: remote.status,
    createdAt: remote.createdAt,
    updatedAt: remote.updatedAt,
  }
}

export async function createEmployeeWithOptionalAccount(
  propertyId: string,
  data: EmployeeWithAccountInput,
): Promise<EmployeeWithAccountResult> {
  initializeEmployeesIfNeeded()

  if (!propertyId.trim()) {
    throw new Error('Propriedade não encontrada.')
  }

  const normalizedEmployee =
    validateAndNormalizeEmployeeInput(data.employee)

  const employeeId = generateId()
  const now = new Date().toISOString()

  const pendingEmployee: Employee = {
    ...normalizedEmployee,
    id: employeeId,
    createdAt: now,
    updatedAt: now,
  }

  let normalizedAccount:
    | (
        AccessAccountInput & {
          password?: string
        }
      )
    | undefined

  if (data.account) {
    normalizedAccount =
      toRemoteAccountInput(
        data.account,
        employeeId,
      )

    ensureEmailIsUnique(
      normalizedAccount.email,
    )

    if (
      !normalizedAccount.password ||
      normalizedAccount.password.length < 8
    ) {
      throw new Error(
        'A senha inicial deve ter pelo menos 8 caracteres.',
      )
    }
  }

  const employeesBefore =
    getRawEmployeeEntries()
  const accountsBefore =
    getRawAccountEntries()

  const projectedEmployees = [
    ...employeesBefore.filter(isEmployee),
    pendingEmployee,
  ]

  const projectedAccounts: AccessAccount[] = [
    ...accountsBefore.filter(isAccessAccount),
    ...(normalizedAccount
      ? [
          {
            ...normalizedAccount,
            id: 'pending-auth-user',
            employeeId,
            createdAt: now,
            updatedAt: now,
          },
        ]
      : []),
  ]

  assertLastAdminProtected({
    employees: projectedEmployees,
    accounts: projectedAccounts,
  })

  const remote =
    await invokeEmployeeAccess(
      propertyId,
      'create',
      pendingEmployee,
      normalizedAccount ?? null,
    )

  const newEmployee: Employee = {
    ...normalizedEmployee,
    id: employeeId,
    createdAt:
      remote.employee.createdAt || now,
    updatedAt:
      remote.employee.updatedAt || now,
  }

  const newAccount =
    remote.account
      ? toLocalAccount(
          employeeId,
          remote.account,
        )
      : undefined

  setStorageItem(
    EMPLOYEES_KEY,
    [
      ...employeesBefore,
      newEmployee,
    ],
  )

  if (newAccount) {
    setStorageItem(
      ACCOUNTS_KEY,
      [
        ...accountsBefore,
        newAccount,
      ],
    )
  }

  await flushStorageWrites()

  return {
    employee: newEmployee,
    account: newAccount,
  }
}

export async function updateEmployeeWithOptionalAccount(
  propertyId: string,
  employeeId: string,
  data: EmployeeWithAccountInput,
): Promise<EmployeeWithAccountResult | undefined> {
  initializeEmployeesIfNeeded()

  if (!propertyId.trim()) {
    throw new Error('Propriedade não encontrada.')
  }

  const currentEmployee =
    getEmployeeById(employeeId)

  if (!currentEmployee) {
    return undefined
  }

  const normalizedEmployee =
    validateAndNormalizeEmployeeInput(data.employee)

  const currentAccount =
    getAccessAccountByEmployeeId(employeeId)

  let normalizedAccount:
    | (
        AccessAccountInput & {
          password?: string
        }
      )
    | undefined

  if (data.account) {
    normalizedAccount =
      toRemoteAccountInput(
        data.account,
        employeeId,
      )

    ensureEmailIsUnique(
      normalizedAccount.email,
      currentAccount?.id,
    )

    if (
      !currentAccount &&
      (
        !normalizedAccount.password ||
        normalizedAccount.password.length < 8
      )
    ) {
      throw new Error(
        'Informe uma senha inicial com pelo menos 8 caracteres para criar a conta de acesso.',
      )
    }
  }

  const now = new Date().toISOString()

  const pendingEmployee: Employee = {
    ...normalizedEmployee,
    id: currentEmployee.id,
    createdAt: currentEmployee.createdAt,
    updatedAt: now,
  }

  let pendingAccount:
    | AccessAccount
    | undefined

  if (normalizedAccount) {
    pendingAccount = {
      ...normalizedAccount,
      id:
        currentAccount?.id ??
        'pending-auth-user',
      employeeId,
      createdAt:
        currentAccount?.createdAt ??
        now,
      updatedAt: now,
    }
  }

  const employeesBefore =
    getRawEmployeeEntries()
  const accountsBefore =
    getRawAccountEntries()

  const projectedEmployees =
    employeesBefore
      .filter(isEmployee)
      .map(employee =>
        employee.id === employeeId
          ? pendingEmployee
          : employee,
      )

  const projectedAccounts =
    pendingAccount
      ? accountsBefore
          .filter(isAccessAccount)
          .filter(
            account =>
              account.employeeId !== employeeId,
          )
          .concat(pendingAccount)
      : accountsBefore.filter(isAccessAccount)

  assertLastAdminProtected({
    employees: projectedEmployees,
    accounts: projectedAccounts,
  })

  const remote =
    await invokeEmployeeAccess(
      propertyId,
      'update',
      pendingEmployee,
      normalizedAccount ?? null,
      currentAccount?.id,
    )

  const updatedEmployee: Employee = {
    ...normalizedEmployee,
    id: currentEmployee.id,
    createdAt:
      remote.employee.createdAt ||
      currentEmployee.createdAt,
    updatedAt:
      remote.employee.updatedAt ||
      now,
  }

  const updatedAccount =
    remote.account
      ? toLocalAccount(
          employeeId,
          remote.account,
        )
      : undefined

  const nextEmployees =
    employeesBefore.map(entry =>
      isEmployee(entry) &&
      entry.id === employeeId
        ? updatedEmployee
        : entry,
    )

  setStorageItem(
    EMPLOYEES_KEY,
    nextEmployees,
  )

  if (updatedAccount) {
    const withoutCurrent =
      accountsBefore.filter(
        entry =>
          !(
            isAccessAccount(entry) &&
            entry.employeeId === employeeId
          ),
      )

    setStorageItem(
      ACCOUNTS_KEY,
      [
        ...withoutCurrent,
        updatedAccount,
      ],
    )
  }

  await flushStorageWrites()

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