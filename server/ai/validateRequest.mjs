// Validação defensiva do payload recebido em POST /api/intelligence/chat.
//
// Observação: o Agro360 ainda não possui autenticação server-side real.
// Esta validação cobre formato e tamanho. A autorização forte (inclusive
// para escrita) virá com a migração para banco/autenticação.

const MAX_MESSAGE_LENGTH = 4000
const MAX_HISTORY_ITEMS = 12
const MAX_HISTORY_CONTENT_LENGTH = 4000
const MAX_CONTEXT_JSON_LENGTH = 200000

function isValidRole(value) {
  return value === 'user' || value === 'assistant'
}

export function validateChatRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'INVALID_REQUEST' }
  }

  const message = body.message
  const history = body.history
  const context = body.context

  if (typeof message !== 'string') {
    return { valid: false, error: 'INVALID_REQUEST' }
  }

  const trimmed = message.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: 'INVALID_REQUEST' }
  }

  if (!Array.isArray(history)) {
    return { valid: false, error: 'INVALID_REQUEST' }
  }

  if (history.length > MAX_HISTORY_ITEMS) {
    return { valid: false, error: 'INVALID_REQUEST' }
  }

  const normalizedHistory = []

  for (const item of history) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { valid: false, error: 'INVALID_REQUEST' }
    }
    if (!isValidRole(item.role)) {
      return { valid: false, error: 'INVALID_REQUEST' }
    }
    if (typeof item.content !== 'string') {
      return { valid: false, error: 'INVALID_REQUEST' }
    }
    if (item.content.length > MAX_HISTORY_CONTENT_LENGTH) {
      return { valid: false, error: 'INVALID_REQUEST' }
    }
    normalizedHistory.push({
      role: item.role,
      content: item.content,
    })
  }

  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return { valid: false, error: 'INVALID_REQUEST' }
  }

  try {
    const serialized = JSON.stringify(context)
    if (serialized.length > MAX_CONTEXT_JSON_LENGTH) {
      return { valid: false, error: 'INVALID_REQUEST' }
    }
  } catch {
    return { valid: false, error: 'INVALID_REQUEST' }
  }

  return {
    valid: true,
    data: {
      message: trimmed,
      history: normalizedHistory,
      context,
    },
  }
}