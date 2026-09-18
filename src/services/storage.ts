import type { Json } from '../lib/database.types'
import { supabase } from '../lib/supabase'

type StateModule =
  | 'animals'
  | 'health'
  | 'land'
  | 'crops'
  | 'machines'
  | 'inventory'
  | 'finance'
  | 'agenda'
  | 'map'
  | 'admin'

const MODULE_BY_KEY: Record<string, StateModule> = {
  agro360_animals: 'animals',
  agro360_animal_events: 'animals',
  agro360_animals_initialized: 'animals',
  agro360_lots: 'animals',

  agro360_vaccinations: 'health',
  agro360_treatments: 'health',
  agro360_health_occurrences: 'health',
  agro360_health_initialized: 'health',

  agro360_land_areas: 'land',
  agro360_land_areas_initialized: 'land',
  agro360_paddock_occupations: 'land',
  agro360_paddock_occupations_initialized: 'land',
  agro360_rural_structures: 'land',
  agro360_rural_structures_initialized: 'land',
  agro360_land_use_records: 'land',
  agro360_land_use_records_initialized: 'land',

  agro360_crop_cycles: 'crops',
  agro360_crop_cycles_initialized: 'crops',
  agro360_crop_managements: 'crops',
  agro360_crop_managements_initialized: 'crops',
  agro360_harvest_records: 'crops',
  agro360_harvest_records_initialized: 'crops',
  agro360_soil_analyses: 'crops',
  agro360_soil_analyses_initialized: 'crops',

  agro360_machines: 'machines',
  agro360_machines_initialized: 'machines',
  agro360_machine_maintenance_records: 'machines',
  agro360_machine_maintenance_records_initialized: 'machines',
  agro360_machine_usage_records: 'machines',
  agro360_machine_usage_records_initialized: 'machines',

  agro360_inventory_items: 'inventory',
  agro360_inventory_items_initialized: 'inventory',
  agro360_inventory_movements: 'inventory',
  agro360_inventory_movements_initialized: 'inventory',

  agro360_financial_categories: 'finance',
  agro360_financial_categories_initialized: 'finance',
  agro360_financial_transactions: 'finance',
  agro360_financial_transactions_initialized: 'finance',

  agro360_agenda_activities: 'agenda',
  agro360_agenda_activities_initialized: 'agenda',

  'agro360:propertyMap:location': 'map',
  'agro360:propertyMap:layouts': 'map',
  'agro360:propertyMap:geoBoundary:property': 'map',
  'agro360:propertyMap:geoBoundary:landareas': 'map',

  agro360_employees: 'admin',
  agro360_employees_initialized: 'admin',
  agro360_access_accounts: 'admin',
  agro360_access_accounts_initialized: 'admin',
}

const INITIALIZED_KEYS_BY_MODULE: Partial<
  Record<StateModule, string[]>
> = {
  animals: ['agro360_animals_initialized'],
  health: ['agro360_health_initialized'],
  land: [
    'agro360_land_areas_initialized',
    'agro360_paddock_occupations_initialized',
    'agro360_rural_structures_initialized',
    'agro360_land_use_records_initialized',
  ],
  crops: [
    'agro360_crop_cycles_initialized',
    'agro360_crop_managements_initialized',
    'agro360_harvest_records_initialized',
    'agro360_soil_analyses_initialized',
  ],
  machines: [
    'agro360_machines_initialized',
    'agro360_machine_maintenance_records_initialized',
    'agro360_machine_usage_records_initialized',
  ],
  inventory: [
    'agro360_inventory_items_initialized',
    'agro360_inventory_movements_initialized',
  ],
  finance: [
    'agro360_financial_categories_initialized',
    'agro360_financial_transactions_initialized',
  ],
  agenda: ['agro360_agenda_activities_initialized'],
  admin: [
    'agro360_employees_initialized',
    'agro360_access_accounts_initialized',
  ],
}

const memory = new Map<string, unknown>()

let activePropertyId: string | null = null
let activeScope: string | null = null
let ready = false
let initialization: Promise<void> | null = null
let writeChain: Promise<void> = Promise.resolve()
let lastWriteError: Error | null = null
let generation = 0

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

function getModuleForKey(key: string): StateModule {
  const moduleKey = MODULE_BY_KEY[key]

  if (!moduleKey) {
    throw new Error(
      `Chave de persistência não registrada no Supabase: ${key}.`,
    )
  }

  return moduleKey
}


async function seedAdminDirectory(
  propertyId: string,
  userId: string,
): Promise<void> {
  const hasEmployees = memory.has('agro360_employees')
  const hasAccounts = memory.has('agro360_access_accounts')
  const hasEmployeeFlag = memory.has(
    'agro360_employees_initialized',
  )
  const hasAccountFlag = memory.has(
    'agro360_access_accounts_initialized',
  )

  if (
    hasEmployees &&
    hasAccounts &&
    hasEmployeeFlag &&
    hasAccountFlag
  ) {
    return
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error(
      'Não foi possível carregar o administrador da propriedade.',
    )
  }

  const email = user.email ?? ''
  const metadataName =
    typeof user.user_metadata?.name === 'string'
      ? user.user_metadata.name.trim()
      : ''
  const name =
    metadataName ||
    email.split('@')[0] ||
    'Administrador'
  const now = new Date().toISOString()

  const employee = {
    id: userId,
    name,
    function: 'Administrador',
    email,
    status: 'Ativo',
    createdAt: now,
    updatedAt: now,
  }

  const account = {
    id: userId,
    employeeId: userId,
    email,
    role: 'admin',
    permissions: [],
    status: 'Ativo',
    createdAt: now,
    updatedAt: now,
  }

  const values: Array<{
    key: string
    value: unknown
  }> = [
    {
      key: 'agro360_employees',
      value: hasEmployees
        ? memory.get('agro360_employees')
        : [employee],
    },
    {
      key: 'agro360_access_accounts',
      value: hasAccounts
        ? memory.get('agro360_access_accounts')
        : [account],
    },
    {
      key: 'agro360_employees_initialized',
      value: true,
    },
    {
      key: 'agro360_access_accounts_initialized',
      value: true,
    },
  ]

  for (const item of values) {
    memory.set(item.key, cloneValue(item.value))
  }

  const rows = values.map(item => ({
    property_id: propertyId,
    state_key: item.key,
    module_key: 'admin' as const,
    payload: toJson(item.value),
  }))

  const { error } = await supabase
    .from('property_state')
    .upsert(rows, {
      onConflict: 'property_id,state_key',
    })

  if (error) {
    throw new Error(
      error.message ||
        'Não foi possível preparar os dados do administrador.',
    )
  }
}

function seedUnauthorizedModules(
  role: 'admin' | 'user',
  permissions: string[],
): void {
  if (role === 'admin') {
    return
  }

  const allowed = new Set(permissions)

  for (const [moduleKey, initializedKeys] of Object.entries(
    INITIALIZED_KEYS_BY_MODULE,
  )) {
    const isAllowed =
      moduleKey !== 'admin' && allowed.has(moduleKey)

    if (isAllowed) {
      continue
    }

    for (const key of initializedKeys ?? []) {
      memory.set(key, true)
    }
  }
}

export async function initializeStorageBackend(
  propertyId: string,
  userId: string,
): Promise<void> {
  const scope = `${userId}:${propertyId}`

  if (ready && activeScope === scope) {
    return
  }

  if (initialization && activeScope === scope) {
    return initialization
  }

  generation += 1
  const requestedGeneration = generation

  activePropertyId = propertyId
  activeScope = scope
  ready = false
  memory.clear()
  lastWriteError = null

  initialization = (async () => {
    const [stateResult, membershipResult] = await Promise.all([
      supabase
        .from('property_state')
        .select('state_key, payload')
        .eq('property_id', propertyId),
      supabase
        .from('property_members')
        .select('role, permissions, status')
        .eq('property_id', propertyId)
        .eq('user_id', userId)
        .eq('status', 'Ativo')
        .maybeSingle(),
    ])

    if (requestedGeneration !== generation) {
      return
    }

    if (membershipResult.error) {
      throw new Error(
        membershipResult.error.message ||
          'Não foi possível carregar as permissões da propriedade.',
      )
    }

    if (!membershipResult.data) {
      throw new Error(
        'Seu usuário não possui vínculo ativo com esta propriedade.',
      )
    }

    if (stateResult.error) {
      throw new Error(
        stateResult.error.message ||
          'Não foi possível carregar os dados da propriedade.',
      )
    }

    for (const row of stateResult.data ?? []) {
      memory.set(row.state_key, cloneValue(row.payload))
    }

    const role =
      membershipResult.data.role === 'admin'
        ? 'admin'
        : 'user'

    seedUnauthorizedModules(
      role,
      membershipResult.data.permissions ?? [],
    )

    if (role === 'admin') {
      await seedAdminDirectory(propertyId, userId)
    }

    ready = true
  })()

  try {
    await initialization
  } finally {
    if (requestedGeneration === generation) {
      initialization = null
    }
  }
}

export function resetStorageBackend(): void {
  generation += 1
  activePropertyId = null
  activeScope = null
  ready = false
  initialization = null
  memory.clear()
  lastWriteError = null
  writeChain = Promise.resolve()
}

export function isStorageBackendReady(): boolean {
  return ready
}

export function getStorageItem<T>(
  key: string,
  fallback: T,
): T {
  if (!ready || !memory.has(key)) {
    return cloneValue(fallback)
  }

  return cloneValue(memory.get(key) as T)
}

function enqueueWrite(operation: () => Promise<void>): void {
  writeChain = writeChain
    .then(operation)
    .catch(error => {
      const normalized =
        error instanceof Error
          ? error
          : new Error('Falha ao salvar dados no Supabase.')

      lastWriteError = normalized
      console.error('[Agro360] Falha de persistência:', normalized)
    })
}

export function setStorageItem<T>(
  key: string,
  value: T,
): void {
  if (!ready || !activePropertyId) {
    throw new Error(
      'O banco da propriedade ainda não terminou de carregar.',
    )
  }

  const moduleKey = getModuleForKey(key)
  const safeValue = cloneValue(value)
  const propertyId = activePropertyId

  memory.set(key, safeValue)

  enqueueWrite(async () => {
    const { error } = await supabase
      .from('property_state')
      .upsert(
        {
          property_id: propertyId,
          state_key: key,
          module_key: moduleKey,
          payload: toJson(safeValue),
        },
        {
          onConflict: 'property_id,state_key',
        },
      )

    if (error) {
      throw new Error(
        error.message || 'Não foi possível salvar os dados.',
      )
    }
  })
}

export function removeStorageItem(key: string): void {
  if (!ready || !activePropertyId) {
    throw new Error(
      'O banco da propriedade ainda não terminou de carregar.',
    )
  }

  getModuleForKey(key)

  const propertyId = activePropertyId
  memory.delete(key)

  enqueueWrite(async () => {
    const { error } = await supabase
      .from('property_state')
      .delete()
      .eq('property_id', propertyId)
      .eq('state_key', key)

    if (error) {
      throw new Error(
        error.message || 'Não foi possível remover os dados.',
      )
    }
  })
}

export async function flushStorageWrites(): Promise<void> {
  await writeChain

  if (lastWriteError) {
    const error = lastWriteError
    lastWriteError = null
    throw error
  }
}

export function generateId(): string {
  if (
    typeof crypto !== 'undefined' &&
    'randomUUID' in crypto
  ) {
    return crypto.randomUUID()
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  )
}
