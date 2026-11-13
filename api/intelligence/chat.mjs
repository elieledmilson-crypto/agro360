import { validateChatRequest } from '../../server/ai/validateRequest.mjs'
import { generateAnswer } from '../../server/ai/aiService.mjs'

const MAX_REQUEST_BYTES = 256 * 1024
const AUTH_TIMEOUT_MS = 5000

function sendJson(res, status, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(status).json(payload)
}

function parseBody(req) {
  const contentLength = Number(req.headers?.['content-length'])

  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { error: 'PAYLOAD_TOO_LARGE' }
  }

  let body = req.body

  if (Buffer.isBuffer(body)) {
    body = body.toString('utf8')
  }

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return { error: 'INVALID_REQUEST' }
    }
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'INVALID_REQUEST' }
  }

  try {
    if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_REQUEST_BYTES) {
      return { error: 'PAYLOAD_TOO_LARGE' }
    }
  } catch {
    return { error: 'INVALID_REQUEST' }
  }

  return { body }
}

async function verifySupabaseSession(req) {
  const rawAuthorization =
    req.headers?.authorization ?? req.headers?.Authorization ?? ''

  const match =
    typeof rawAuthorization === 'string'
      ? rawAuthorization.match(/^Bearer\s+(\S+)$/i)
      : null

  if (!match) {
    return false
  }

  const supabaseUrl = (
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    ''
  ).trim().replace(/\/+$/, '')

  const publishableKey = (
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    ''
  ).trim()

  if (!supabaseUrl || !publishableKey) {
    throw new Error('SUPABASE_CONFIGURATION_ERROR')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS)

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${match[1]}`,
      },
      signal: controller.signal,
    })

    if (response.status === 401 || response.status === 403) {
      return false
    }

    if (!response.ok) {
      throw new Error('SUPABASE_AUTH_UNAVAILABLE')
    }

    const user = await response.json()
    return Boolean(user && typeof user.id === 'string' && user.id.length > 0)
  } catch (error) {
    if (error instanceof Error && error.message === 'SUPABASE_CONFIGURATION_ERROR') {
      throw error
    }

    throw new Error('SUPABASE_AUTH_UNAVAILABLE')
  } finally {
    clearTimeout(timeout)
  }
}

export default async function handler(req, res) {
  const startedAt = Date.now()

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' })
  }

  const contentType = req.headers?.['content-type'] ?? ''
  if (typeof contentType !== 'string' || !contentType.toLowerCase().includes('application/json')) {
    return sendJson(res, 415, { error: 'UNSUPPORTED_MEDIA_TYPE' })
  }

  const parsed = parseBody(req)
  if (parsed.error === 'PAYLOAD_TOO_LARGE') {
    return sendJson(res, 413, { error: 'INVALID_REQUEST' })
  }

  if (parsed.error || !parsed.body) {
    return sendJson(res, 400, { error: 'INVALID_REQUEST' })
  }

  const validation = validateChatRequest(parsed.body)
  if (!validation.valid) {
    return sendJson(res, 400, { error: validation.error })
  }

  let authenticated = false

  try {
    authenticated = await verifySupabaseSession(req)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (message === 'SUPABASE_CONFIGURATION_ERROR') {
      console.error('[ai-api] Supabase authentication variables are missing')
      return sendJson(res, 503, { error: 'CONFIGURATION_ERROR' })
    }

    console.error('[ai-api] Supabase session verification failed')
    return sendJson(res, 503, { error: 'AUTH_PROVIDER_ERROR' })
  }

  if (!authenticated) {
    return sendJson(res, 401, { error: 'UNAUTHENTICATED' })
  }

  try {
    const result = await generateAnswer(
      validation.data.message,
      validation.data.history,
      validation.data.context,
    )

    console.log(`[ai-api] 200 ${Date.now() - startedAt}ms`)
    return sendJson(res, 200, result)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''

    if (message.startsWith('CONFIGURATION_ERROR')) {
      console.error('[ai-api] Gemini configuration is missing')
      return sendJson(res, 503, { error: 'CONFIGURATION_ERROR' })
    }

    if (message.startsWith('AI_TIMEOUT')) {
      console.error(`[ai-api] AI_TIMEOUT ${Date.now() - startedAt}ms`)
      return sendJson(res, 504, { error: 'AI_TIMEOUT' })
    }

    console.error(`[ai-api] AI_PROVIDER_ERROR ${Date.now() - startedAt}ms: ${message}`)
    return sendJson(res, 502, { error: 'AI_PROVIDER_ERROR' })
  }
}
