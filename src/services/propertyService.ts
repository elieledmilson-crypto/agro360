import type { Farm } from '../types'
import { supabase } from '../lib/supabase'

export interface PropertyInput {
  name: string
  location: string
  totalArea: number
  owner: string
}

export type CreatePropertyInput = PropertyInput
export type UpdatePropertyInput = PropertyInput

function normalizePropertyInput(
  input: PropertyInput,
): PropertyInput {
  const name = input.name.trim()
  const location = input.location.trim()
  const owner = input.owner.trim()

  if (!name) {
    throw new Error('Nome da propriedade é obrigatório.')
  }

  if (!owner) {
    throw new Error('Nome do proprietário é obrigatório.')
  }

  if (
    !Number.isFinite(input.totalArea) ||
    input.totalArea < 0
  ) {
    throw new Error('Área total inválida.')
  }

  return {
    name,
    location,
    owner,
    totalArea: input.totalArea,
  }
}

function getPropertyErrorMessage(
  code: string | undefined,
  fallback: string,
): string {
  if (code === '42501') {
    return 'Sua conta não possui permissão para realizar esta operação.'
  }

  return fallback
}

function mapProperty(data: {
  id: string
  name: string
  location: string
  total_area: number | string
  owner_name: string
}): Farm {
  return {
    id: data.id,
    name: data.name,
    location: data.location,
    totalArea: Number(data.total_area),
    owner: data.owner_name,
  }
}

export async function createPropertyForCurrentUser(
  input: CreatePropertyInput,
): Promise<string> {
  const normalized = normalizePropertyInput(input)

  const { data, error } = await supabase.rpc(
    'create_property_for_current_user',
    {
      p_name: normalized.name,
      p_location: normalized.location,
      p_total_area: normalized.totalArea,
      p_owner_name: normalized.owner,
    },
  )

  if (error) {
    throw new Error(
      getPropertyErrorMessage(
        error.code,
        'Não foi possível criar a propriedade. Tente novamente.',
      ),
    )
  }

  if (!data) {
    throw new Error(
      'A propriedade não retornou um identificador válido.',
    )
  }

  return data
}

export async function getPropertyById(
  propertyId: string,
): Promise<Farm | undefined> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, name, location, total_area, owner_name')
    .eq('id', propertyId)
    .maybeSingle()

  if (error) {
    throw new Error(
      getPropertyErrorMessage(
        error.code,
        'Não foi possível carregar a propriedade.',
      ),
    )
  }

  if (!data) {
    return undefined
  }

  return mapProperty(data)
}

export async function updateProperty(
  propertyId: string,
  input: UpdatePropertyInput,
): Promise<Farm> {
  const normalized = normalizePropertyInput(input)

  const { data, error } = await supabase
    .from('properties')
    .update({
      name: normalized.name,
      location: normalized.location,
      total_area: normalized.totalArea,
      owner_name: normalized.owner,
    })
    .eq('id', propertyId)
    .select('id, name, location, total_area, owner_name')
    .single()

  if (error) {
    throw new Error(
      getPropertyErrorMessage(
        error.code,
        'Não foi possível atualizar a propriedade.',
      ),
    )
  }

  return mapProperty(data)
}

export async function deletePropertyPermanently(
  propertyId: string,
  propertyName: string,
  password: string,
): Promise<void> {
  const {
    data: { user: currentUser },
    error: currentUserError,
  } = await supabase.auth.getUser()

  if (currentUserError || !currentUser?.email) {
    throw new Error('Sua sessão expirou. Entre novamente para continuar.')
  }

  const { data: reauthenticated, error: reauthenticationError } =
    await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password,
    })

  if (
    reauthenticationError ||
    reauthenticated.user?.id !== currentUser.id
  ) {
    throw new Error('Senha incorreta. A exclusão não foi realizada.')
  }

  const { error: deletionError } = await supabase.functions.invoke(
    'delete-farm-completely',
    {
      body: { propertyId, propertyName },
    },
  )

  if (deletionError) {
    const context = (deletionError as { context?: Response }).context
    if (context && typeof context.json === 'function') {
      let payload: { error?: string } | null = null
      try {
        payload = await context.json() as { error?: string }
      } catch {
        payload = null
      }
      if (payload?.error) throw new Error(payload.error)
    }
    throw new Error(deletionError.message || 'Não foi possível excluir a fazenda.')
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
  if (signOutError) {
    throw new Error('A exclusão foi concluída, mas não foi possível limpar a sessão local. Feche e abra o Agro360 novamente.')
  }
}
