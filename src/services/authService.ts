import type { User } from '../types'
import { supabase } from '../lib/supabase'
import { isPermissionKey } from './permissionService'

export interface RegisterResponse {
  user: User | null
  confirmationRequired: boolean
}

function normalizePermissions(values: string[] | null): User['permissions'] {
  if (!values) return []

  return values.filter(isPermissionKey)
}

async function buildCurrentUser(): Promise<User | null> {
  const {
    data: { user: authUser },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !authUser) {
    return null
  }

  const [{ data: profile, error: profileError }, membershipResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('name')
        .eq('id', authUser.id)
        .maybeSingle(),
      supabase
        .from('property_members')
        .select(
          'property_id, employee_id, role, permissions, status, created_at',
        )
        .eq('user_id', authUser.id)
        .eq('status', 'Ativo')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])

  if (profileError) {
    throw new Error(
      profileError.message || 'Não foi possível carregar o perfil.',
    )
  }

  if (membershipResult.error) {
    throw new Error(
      membershipResult.error.message ||
        'Não foi possível carregar o vínculo com a propriedade.',
    )
  }

  const membership = membershipResult.data
  const email = authUser.email ?? ''
  const fallbackName =
    typeof authUser.user_metadata?.name === 'string'
      ? authUser.user_metadata.name
      : email.split('@')[0] || 'Usuário'

  return {
    id: authUser.id,
    name: profile?.name?.trim() || fallbackName,
    email,
    role: membership?.role === 'admin' ? 'admin' : 'user',
    propertyId: membership?.property_id ?? undefined,
    employeeId: membership?.employee_id ?? undefined,
    permissions:
      membership?.role === 'admin'
        ? []
        : normalizePermissions(membership?.permissions ?? null),
  }
}

export async function login(
  email: string,
  password: string,
): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase()

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (error) {
    throw new Error(
      error.message === 'Invalid login credentials'
        ? 'E-mail ou senha inválidos.'
        : error.message,
    )
  }

  const user = await buildCurrentUser()

  if (!user) {
    throw new Error('Não foi possível restaurar a sessão do usuário.')
  }

  return user
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const normalizedName = name.trim()
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedName) {
    throw new Error('Nome é obrigatório.')
  }

  if (!normalizedEmail) {
    throw new Error('E-mail é obrigatório.')
  }

  if (password.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.')
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name: normalizedName,
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data.session) {
    return {
      user: null,
      confirmationRequired: true,
    }
  }

  return {
    user: await buildCurrentUser(),
    confirmationRequired: false,
  }
}

export async function getCurrentUser(): Promise<User | null> {
  return buildCurrentUser()
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}
