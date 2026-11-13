import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function isMissingUser(error: { status?: number; message?: string } | null) {
  if (!error) return false
  return error.status === 404 || /user.*not found|not found.*user/i.test(error.message ?? '')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Método não permitido.' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Configuração segura do servidor não encontrada.' })
  }

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json(401, { error: 'Sessão não encontrada.' })

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: authResult, error: authError } = await admin.auth.getUser(token)
  const caller = authResult.user
  if (authError || !caller) return json(401, { error: 'Sessão inválida. Entre novamente.' })

  let body: { propertyId?: unknown; propertyName?: unknown }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Corpo da requisição inválido.' })
  }

  const propertyId = typeof body.propertyId === 'string' ? body.propertyId.trim() : ''
  const propertyName = typeof body.propertyName === 'string' ? body.propertyName.trim() : ''
  if (!propertyId || !propertyName) {
    return json(400, { error: 'Informe a propriedade e o nome para confirmar a exclusão.' })
  }

  const { data: property, error: propertyError } = await admin
    .from('properties')
    .select('id, name, created_by')
    .eq('id', propertyId)
    .maybeSingle()

  if (propertyError) return json(500, { error: 'Não foi possível localizar a propriedade com segurança.' })
  if (!property) return json(404, { error: 'A propriedade não existe ou já foi excluída.' })
  if (property.name.trim() !== propertyName) {
    return json(400, { error: 'O nome informado não corresponde exatamente ao nome da fazenda.' })
  }

  const { data: callerMembership, error: membershipError } = await admin
    .from('property_members')
    .select('id')
    .eq('property_id', propertyId)
    .eq('user_id', caller.id)
    .eq('role', 'admin')
    .eq('status', 'Ativo')
    .maybeSingle()

  if (membershipError) return json(500, { error: 'Não foi possível validar sua permissão de administrador.' })
  if (!callerMembership) return json(403, { error: 'Somente o administrador ativo pode excluir a fazenda.' })

  const { data: memberships, error: membersError } = await admin
    .from('property_members')
    .select('user_id')
    .eq('property_id', propertyId)

  if (membersError) return json(500, { error: 'Não foi possível identificar todas as contas vinculadas à fazenda.' })

  const userIds = Array.from(new Set([
    property.created_by,
    ...(memberships ?? []).map(row => row.user_id),
  ].filter((id): id is string => typeof id === 'string' && id.length > 0)))

  // A conta será removida por completo. Não apagar uma conta compartilhada
  // com outra propriedade para evitar destruir o acesso de terceiros.
  const { data: otherMemberships, error: otherMembershipsError } = await admin
    .from('property_members')
    .select('user_id')
    .in('user_id', userIds)
    .neq('property_id', propertyId)

  if (otherMembershipsError) {
    return json(500, { error: 'Não foi possível verificar se existem contas compartilhadas com outras propriedades.' })
  }
  if ((otherMemberships ?? []).length > 0) {
    return json(409, {
      error: 'Uma ou mais contas vinculadas também pertencem a outra propriedade. Remova esses vínculos antes de excluir esta fazenda, para evitar apagar o acesso de outra propriedade.',
    })
  }

  // Exclui primeiro as contas secundárias. Se alguma falhar, a fazenda e a
  // conta principal continuam disponíveis para corrigir e tentar novamente.
  for (const userId of userIds.filter(id => id !== caller.id)) {
    const { data: existingUser, error: lookupError } = await admin.auth.admin.getUserById(userId)
    if (lookupError && !isMissingUser(lookupError)) {
      return json(500, { error: 'Não foi possível verificar uma das contas de funcionário. Nenhum dado da fazenda foi removido.' })
    }
    if (!existingUser.user) continue

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId)
    if (deleteUserError) {
      return json(500, {
        error: 'Não foi possível excluir uma das contas vinculadas. A fazenda e a conta principal foram preservadas; tente novamente ou contate o suporte.',
      })
    }
  }

  const { data: deletedProperty, error: deletePropertyError } = await admin
    .from('properties')
    .delete()
    .eq('id', propertyId)
    .select('id')
    .maybeSingle()

  if (deletePropertyError || !deletedProperty) {
    return json(500, {
      error: 'As contas secundárias foram processadas, mas não foi possível concluir a remoção dos dados da fazenda. A conta principal permanece ativa.',
    })
  }

  // O administrador é removido por último para que a operação possa ser
  // autorizada e concluída mesmo depois de revogar as demais contas.
  const { error: deleteOwnerError } = await admin.auth.admin.deleteUser(caller.id)
  if (deleteOwnerError) {
    return json(500, {
      error: 'Os dados da fazenda foram excluídos, mas não foi possível remover a conta principal. Entre em contato com o suporte para concluir a exclusão da conta.',
    })
  }

  return json(200, { success: true, message: 'Fazenda e todas as contas vinculadas foram excluídas permanentemente.' })
})
