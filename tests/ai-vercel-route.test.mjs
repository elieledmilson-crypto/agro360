import test from 'node:test'
import assert from 'node:assert/strict'

import handler from '../api/intelligence/chat.mjs'

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    payload: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.payload = payload
      return this
    },
  }
}

function validRequest(overrides = {}) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer test-access-token',
    },
    body: {
      message: 'Olá, Agro360',
      history: [],
      context: {},
    },
    ...overrides,
  }
}

test('recusa métodos diferentes de POST', async () => {
  const req = validRequest({ method: 'GET' })
  const res = createResponse()

  await handler(req, res)

  assert.equal(res.statusCode, 405)
  assert.equal(res.payload.error, 'METHOD_NOT_ALLOWED')
})

test('recusa chamadas sem sessão autenticada', async () => {
  const req = validRequest({
    headers: { 'content-type': 'application/json' },
  })
  const res = createResponse()

  await handler(req, res)

  assert.equal(res.statusCode, 401)
  assert.equal(res.payload.error, 'UNAUTHENTICATED')
})

test('recusa payloads inválidos antes de consultar provedores externos', async () => {
  const req = validRequest({
    body: { message: '', history: [], context: {} },
  })
  const res = createResponse()

  await handler(req, res)

  assert.equal(res.statusCode, 400)
  assert.equal(res.payload.error, 'INVALID_REQUEST')
})

test('autentica a sessão e devolve a resposta do Gemini', async () => {
  const originalFetch = globalThis.fetch
  const originalEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  }

  process.env.SUPABASE_URL = 'https://unit-test.supabase.co'
  process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_unit_test'
  process.env.GEMINI_API_KEY = 'unit-test-gemini-key'
  process.env.GEMINI_MODEL = 'gemini-3.6-flash'

  let geminiCalled = false

  globalThis.fetch = async (input) => {
    const url = String(input)

    if (url === 'https://unit-test.supabase.co/auth/v1/user') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'unit-test-user' }),
      }
    }

    if (url.includes('generativelanguage.googleapis.com')) {
      geminiCalled = true
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  kind: 'message',
                  answer: 'IA conectada corretamente.',
                }),
              }],
            },
          }],
        }),
      }
    }

    throw new Error('URL inesperada no teste')
  }

  try {
    const req = validRequest()
    const res = createResponse()

    await handler(req, res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.payload.kind, 'message')
    assert.equal(res.payload.answer, 'IA conectada corretamente.')
    assert.equal(geminiCalled, true)
  } finally {
    globalThis.fetch = originalFetch

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
})
