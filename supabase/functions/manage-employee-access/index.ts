import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const permissionKeys = new Set([
  'animals',
  'health',
  'land',
  'crops',
  'machines',
  'inventory',
  'finance',
  'property',
  'agenda',
  'reports',
  'map',
  'intelligence',
])

type EmployeeStatus = 'Ativo' | 'Inativo'
type AccountStatus = 'Ativo' | 'Inativo'
type UserRole = 'admin' | 'user'

interface EmployeePayload {
  id: string
  name: string
  function: string
  phone?: string | null
  email?: string | null
  status: EmployeeStatus
  notes?: string | null
}

interface AccountPayload {
  email: string
  password?: string
  role: UserRole
  permissions: string[]
  status: AccountStatus
}

interface RequestBody {
  action: 'create' | 'update'
  propertyId: string
  employee: EmployeePayload
  account?: AccountPayload | null
  accountUserId?: string | null
}

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function cleanOptional(value: unknown): string | null {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null
}

function normalizeBody(raw: unknown): RequestBody {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Requisição inválida.')
  }

  const body = raw as Record<string, unknown>
  const employeeRaw = body.employee as Record<string, unknown> | undefined
  const accountRaw = body.account as Record<string, unknown> | null | undefined

  if (body.action !== 'create' && body.action !== 'update') {
    throw new Error('Ação inválida.')
  }

  if (typeof body.propertyId !== 'string' || !body.propertyId.trim()) {
    throw new Error('Propriedade inválida.')
  }

  if (!employeeRaw || typeof employeeRaw !== 'object') {
    throw new Error('Funcionário inválido.')
  }

  const id =
    typeof employeeRaw.id === 'string' ? employeeRaw.id.trim() : ''
  const name =
    typeof employeeRaw.name === 'string' ? employeeRaw.name.trim() : ''
  const jobFunction =
    typeof employeeRaw.function === 'string'
      ? employeeRaw.function.trim()
      : ''
  const status = employeeRaw.status

  if (!id || !name || !jobFunction) {
    throw new Error('Preencha os dados obrigatórios do funcionário.')
  }

  if (status !== 'Ativo' && status !== 'Inativo') {
    throw new Error('Situação do funcionário inválida.')
  }

  let account: AccountPayload | null | undefined

  if (accountRaw === null || accountRaw === undefined) {
    account = accountRaw
  } else {
    const email =
      typeof accountRaw.email === 'string'
        ? accountRaw.email.trim().toLowerCase()
        : ''
    const role = accountRaw.role
    const accountStatus = accountRaw.status
    const permissions = Array.isArray(accountRaw.permissions)
      ? Array.from(
          new Set(
            accountRaw.permissions.filter(
              value =>
                typeof value === 'string' &&
                permissionKeys.has(value),
            ) as string[],
          ),
        )
      : []
    const password =
      typeof accountRaw.password === 'string' &&
      accountRaw.password.length > 0
        ? accountRaw.password
        : undefined

    if (!email) {
      throw new Error('E-mail de acesso é obrigatório.')
    }

    if (role !== 'admin' && role !== 'user') {
      throw new Error('Perfil de acesso inválido.')
    }

    if (accountStatus !== 'Ativo' && accountStatus !== 'Inativo') {
      throw new Error('Situação da conta inválida.')
    }

    account = {
      email,
      password,
      role,
      permissions: role === 'admin' ? [] : permissions,
      status: accountStatus,
    }
  }

  return {
    action: body.action,
    propertyId: body.propertyId.trim(),
    employee: {
      id,
      name,
      function: jobFunction,
      phone: cleanOptional(employeeRaw.phone),
      email: cleanOptional(employeeRaw.email),
      status,
      notes: cleanOptional(employeeRaw.notes),
    },
    account,
    accountUserId:
      typeof body.accountUserId === 'string' && body.accountUserId.trim()
        ? body.accountUserId.trim()
        : null,
  }
}

async function assertAdmin(
  admin: ReturnType<typeof createClient>,
  userId: string,
  propertyId: string,
) {
  const { data, error } = await admin
    .from('property_members')
    .select('id')
    .eq('property_id', propertyId)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .eq('status', 'Ativo')
    .maybeSingle()

  if (error) {
    throw new Error('Não foi possível validar o administrador.')
  }

  if (!data) {
    throw new Error('Somente administradores podem gerenciar acessos.')
  }
}

async function assertLastAdminSafe(
  admin: ReturnType<typeof createClient>,
  propertyId: string,
  targetUserId: string,
  currentRole: string,
  currentStatus: string,
  nextRole: UserRole,
  nextStatus: AccountStatus,
) {
  const losesActiveAdmin =
    currentRole === 'admin' &&
    currentStatus === 'Ativo' &&
    (nextRole !== 'admin' || nextStatus !== 'Ativo')

  if (!losesActiveAdmin) {
    return
  }

  const { count, error } = await admin
    .from('property_members')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId)
    .eq('role', 'admin')
    .eq('status', 'Ativo')
    .neq('user_id', targetUserId)

  if (error) {
    throw new Error('Não foi possível validar os administradores ativos.')
  }

  if (!count) {
    throw new Error(
      'Não é possível desativar ou remover o perfil do último administrador ativo.',
    )
  }
}

async function updateAuthState(
  admin: ReturnType<typeof createClient>,
  userId: string,
  propertyId: string,
  employee: EmployeePayload,
  account: AccountPayload,
  effectiveStatus: AccountStatus,
) {
  const attributes: Record<string, unknown> = {
    email: account.email,
    user_metadata: {
      name: employee.name,
      account_kind: 'employee',
      property_id: propertyId,
      employee_id: employee.id,
    },
    ban_duration:
      effectiveStatus === 'Ativo' ? 'none' : '876000h',
  }

  if (account.password) {
    if (account.password.length < 8) {
      throw new Error('A senha deve ter pelo menos 8 caracteres.')
    }

    attributes.password = account.password
  }

  const { error } = await admin.auth.admin.updateUserById(
    userId,
    attributes,
  )

  if (error) {
    throw new Error(error.message || 'Não foi possível atualizar a conta de acesso.')
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Método não permitido.' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Configuração do servidor incompleta.' })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    return json(401, { error: 'Sessão não encontrada.' })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const {
    data: { user: caller },
    error: callerError,
  } = await admin.auth.getUser(token)

  if (callerError || !caller) {
    return json(401, { error: 'Sessão inválida.' })
  }

  let body: RequestBody

  try {
    body = normalizeBody(await req.json())
    await assertAdmin(admin, caller.id, body.propertyId)
  } catch (error) {
    return json(400, {
      error:
        error instanceof Error
          ? error.message
          : 'Requisição inválida.',
    })
  }

  const employeeRow = {
    id: body.employee.id,
    property_id: body.propertyId,
    name: body.employee.name,
    job_function: body.employee.function,
    phone: body.employee.phone,
    email: body.employee.email,
    status: body.employee.status,
    notes: body.employee.notes,
    updated_at: new Date().toISOString(),
  }

  let employeeCreatedNow = false
  let createdAuthUserId: string | null = null

  try {
    const { data: existingEmployee, error: existingEmployeeError } =
      await admin
        .from('employees')
        .select('id, created_at')
        .eq('property_id', body.propertyId)
        .eq('id', body.employee.id)
        .maybeSingle()

    if (existingEmployeeError) {
      throw new Error('Não foi possível consultar o funcionário.')
    }

    let savedEmployee:
      | { id: string; created_at: string; updated_at: string }
      | null = null

    if (existingEmployee) {
      const { data, error } = await admin
        .from('employees')
        .update(employeeRow)
        .eq('property_id', body.propertyId)
        .eq('id', body.employee.id)
        .select('id, created_at, updated_at')
        .single()

      if (error) {
        throw new Error(error.message || 'Não foi possível atualizar o funcionário.')
      }

      savedEmployee = data
    } else {
      const { data, error } = await admin
        .from('employees')
        .insert(employeeRow)
        .select('id, created_at, updated_at')
        .single()

      if (error) {
        throw new Error(error.message || 'Não foi possível cadastrar o funcionário.')
      }

      employeeCreatedNow = true
      savedEmployee = data
    }

    let membership:
      | {
          id: string
          user_id: string
          role: string
          status: string
          created_at: string
        }
      | null = null

    const { data: byEmployee, error: byEmployeeError } = await admin
      .from('property_members')
      .select('id, user_id, role, status, created_at')
      .eq('property_id', body.propertyId)
      .eq('employee_id', body.employee.id)
      .maybeSingle()

    if (byEmployeeError) {
      throw new Error('Não foi possível consultar a conta de acesso.')
    }

    membership = byEmployee

    if (!membership && body.accountUserId) {
      const { data: byUser, error: byUserError } = await admin
        .from('property_members')
        .select('id, user_id, role, status, created_at')
        .eq('property_id', body.propertyId)
        .eq('user_id', body.accountUserId)
        .maybeSingle()

      if (byUserError) {
        throw new Error('Não foi possível consultar a conta de acesso.')
      }

      membership = byUser
    }

    if (!body.account) {
      if (
        membership &&
        body.employee.status === 'Inativo'
      ) {
        await assertLastAdminSafe(
          admin,
          body.propertyId,
          membership.user_id,
          membership.role,
          membership.status,
          membership.role === 'admin' ? 'admin' : 'user',
          'Inativo',
        )

        await admin
          .from('property_members')
          .update({
            status: 'Inativo',
            employee_id: body.employee.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', membership.id)

        const { error: banError } =
          await admin.auth.admin.updateUserById(
            membership.user_id,
            { ban_duration: '876000h' },
          )

        if (banError) {
          throw new Error(
            banError.message || 'Não foi possível desativar a conta de acesso.',
          )
        }
      }

      return json(200, {
        employee: {
          id: savedEmployee.id,
          createdAt: savedEmployee.created_at,
          updatedAt: savedEmployee.updated_at,
        },
        account: null,
      })
    }

    const effectiveStatus: AccountStatus =
      body.employee.status === 'Ativo'
        ? body.account.status
        : 'Inativo'

    if (membership) {
      await assertLastAdminSafe(
        admin,
        body.propertyId,
        membership.user_id,
        membership.role,
        membership.status,
        body.account.role,
        effectiveStatus,
      )

      await updateAuthState(
        admin,
        membership.user_id,
        body.propertyId,
        {
          ...body.employee,
        },
        body.account,
        effectiveStatus,
      )

      const { error: profileError } = await admin
        .from('profiles')
        .update({
          name: body.employee.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', membership.user_id)

      if (profileError) {
        throw new Error('Não foi possível atualizar o perfil da conta.')
      }

      const { data: updatedMembership, error: membershipError } =
        await admin
          .from('property_members')
          .update({
            employee_id: body.employee.id,
            role: body.account.role,
            permissions:
              body.account.role === 'admin'
                ? []
                : body.account.permissions,
            status: effectiveStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', membership.id)
          .select('user_id, created_at, updated_at')
          .single()

      if (membershipError) {
        throw new Error(
          membershipError.message ||
            'Não foi possível atualizar o vínculo de acesso.',
        )
      }

      return json(200, {
        employee: {
          id: savedEmployee.id,
          createdAt: savedEmployee.created_at,
          updatedAt: savedEmployee.updated_at,
        },
        account: {
          userId: updatedMembership.user_id,
          email: body.account.email,
          role: body.account.role,
          permissions:
            body.account.role === 'admin'
              ? []
              : body.account.permissions,
          status: effectiveStatus,
          createdAt: membership.created_at,
          updatedAt: updatedMembership.updated_at,
        },
      })
    }

    if (!body.account.password || body.account.password.length < 8) {
      throw new Error(
        'Informe uma senha inicial com pelo menos 8 caracteres para criar a conta de acesso.',
      )
    }

    const { data: createdUser, error: createUserError } =
      await admin.auth.admin.createUser({
        email: body.account.email,
        password: body.account.password,
        email_confirm: true,
        user_metadata: {
          name: body.employee.name,
          account_kind: 'employee',
          property_id: body.propertyId,
          employee_id: body.employee.id,
        },
      })

    if (createUserError || !createdUser.user) {
      throw new Error(
        createUserError?.message ||
          'Não foi possível criar a conta de acesso.',
      )
    }

    createdAuthUserId = createdUser.user.id

    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: createdAuthUserId,
        name: body.employee.name,
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      throw new Error('Não foi possível preparar o perfil da conta.')
    }

    const { data: createdMembership, error: membershipError } =
      await admin
        .from('property_members')
        .insert({
          property_id: body.propertyId,
          user_id: createdAuthUserId,
          employee_id: body.employee.id,
          role: body.account.role,
          permissions:
            body.account.role === 'admin'
              ? []
              : body.account.permissions,
          status: effectiveStatus,
        })
        .select('user_id, created_at, updated_at')
        .single()

    if (membershipError) {
      throw new Error(
        membershipError.message ||
          'Não foi possível vincular a conta à propriedade.',
      )
    }

    if (effectiveStatus === 'Inativo') {
      const { error: banError } =
        await admin.auth.admin.updateUserById(
          createdAuthUserId,
          { ban_duration: '876000h' },
        )

      if (banError) {
        throw new Error(
          banError.message || 'Não foi possível desativar a conta de acesso.',
        )
      }
    }

    return json(200, {
      employee: {
        id: savedEmployee.id,
        createdAt: savedEmployee.created_at,
        updatedAt: savedEmployee.updated_at,
      },
      account: {
        userId: createdMembership.user_id,
        email: body.account.email,
        role: body.account.role,
        permissions:
          body.account.role === 'admin'
            ? []
            : body.account.permissions,
        status: effectiveStatus,
        createdAt: createdMembership.created_at,
        updatedAt: createdMembership.updated_at,
      },
    })
  } catch (error) {
    if (createdAuthUserId) {
      await admin.auth.admin.deleteUser(createdAuthUserId)
    }

    if (employeeCreatedNow) {
      await admin
        .from('employees')
        .delete()
        .eq('property_id', body.propertyId)
        .eq('id', body.employee.id)
    }

    return json(400, {
      error:
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o funcionário.',
    })
  }
})
