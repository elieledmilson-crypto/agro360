// Integração do Agro360 Intelligence com o Google Gemini.
//
// Este arquivo é o ÚNICO ponto do projeto que conhece o provedor de IA.
// O frontend continua conversando apenas com o backend do Agro360.
//
// Se a resposta não for JSON válido no formato esperado, o texto bruto
// é devolvido como mensagem simples — nunca quebramos a UX.

import { SYSTEM_PROMPT } from './systemPrompt.mjs'

const REQUEST_TIMEOUT_MS = 45000

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error(
      'CONFIGURATION_ERROR: GEMINI_API_KEY não configurada.',
    )
  }

  return apiKey
}

function getModel() {
  const configuredModel =
    process.env.GEMINI_MODEL?.trim()

  if (!configuredModel) {
    throw new Error(
      'CONFIGURATION_ERROR: GEMINI_MODEL não configurado.',
    )
  }

  // Aceita tanto:
  // GEMINI_MODEL=gemini-3.6-flash
  // quanto:
  // GEMINI_MODEL=models/gemini-3.6-flash
  return configuredModel.startsWith('models/')
    ? configuredModel.slice('models/'.length)
    : configuredModel
}

const ALLOWED_ACTION_TYPES = new Set([
  'create_land_area',
  'create_animal',
  'create_agenda_activity',
  'create_financial_transaction',
  'create_inventory_movement',
  'create_crop_cycle',
  'update_machine_status',
])

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}

function isNonEmptyString(value) {
  return (
    typeof value === 'string' &&
    value.trim() !== ''
  )
}

function isPositiveNumber(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  )
}

// Validação estrutural mínima do backend.
//
// O frontend (aiChatService) e o Action Service
// revalidam antes de executar.
//
// Aqui rejeitamos propostas evidentemente malformadas.
function isStructurallyValidAction(action) {
  if (!isPlainObject(action)) return false

  if (typeof action.type !== 'string') {
    return false
  }

  if (!ALLOWED_ACTION_TYPES.has(action.type)) {
    return false
  }

  if (!isPlainObject(action.data)) {
    return false
  }

  const d = action.data

  switch (action.type) {
    case 'create_land_area':
      return (
        isNonEmptyString(d.code) &&
        isNonEmptyString(d.name) &&
        typeof d.type === 'string' &&
        typeof d.status === 'string' &&
        isPositiveNumber(d.areaHectares)
      )

    case 'create_animal':
      return (
        isNonEmptyString(d.identification) &&
        typeof d.species === 'string' &&
        isNonEmptyString(d.breed) &&
        typeof d.sex === 'string' &&
        typeof d.category === 'string' &&
        typeof d.status === 'string'
      )

    case 'create_agenda_activity':
      return (
        isNonEmptyString(d.title) &&
        typeof d.type === 'string' &&
        typeof d.date === 'string' &&
        typeof d.priority === 'string' &&
        typeof d.status === 'string'
      )

    case 'create_financial_transaction':
      return (
        (d.type === 'Receita' ||
          d.type === 'Despesa') &&
        typeof d.date === 'string' &&
        isNonEmptyString(d.categoryId) &&
        isNonEmptyString(d.description) &&
        isPositiveNumber(d.amount)
      )

    case 'create_inventory_movement':
      return (
        isNonEmptyString(d.inventoryItemId) &&
        (d.type === 'Entrada' ||
          d.type === 'Saída') &&
        typeof d.movementDate === 'string' &&
        isPositiveNumber(d.quantity) &&
        isNonEmptyString(d.reason)
      )

    case 'create_crop_cycle':
      return (
        isNonEmptyString(d.landAreaId) &&
        isNonEmptyString(d.crop) &&
        isNonEmptyString(d.season) &&
        typeof d.status === 'string'
      )

    case 'update_machine_status':
      return (
        isNonEmptyString(d.machineCode) &&
        typeof d.newStatus === 'string'
      )

    default:
      return false
  }
}

function tryParseJson(text) {
  if (typeof text !== 'string') {
    return null
  }

  const trimmed = text.trim()

  if (!trimmed.startsWith('{')) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed)

    return isPlainObject(parsed)
      ? parsed
      : null
  } catch {
    return null
  }
}

function normalizeResponse(rawText) {
  const parsed =
    tryParseJson(rawText)

  if (!parsed) {
    return {
      kind: 'message',
      answer: rawText,
    }
  }

  const kind = parsed.kind

  const answer =
    typeof parsed.answer === 'string'
      ? parsed.answer
      : ''

  if (
    kind === 'action' &&
    isStructurallyValidAction(
      parsed.action,
    )
  ) {
    return {
      kind: 'action',
      answer,
      action: {
        type: parsed.action.type,
        data: parsed.action.data,
      },
    }
  }

  return {
    kind: 'message',
    answer:
      answer ||
      rawText,
  }
}

function isTimeoutError(error) {
  if (
    !error ||
    typeof error !== 'object'
  ) {
    return false
  }

  return (
    error.name === 'AbortError' ||
    error.code === 'ETIMEDOUT'
  )
}

function buildGeminiHistory(history) {
  return history.map(item => ({
    role:
      item.role === 'assistant'
        ? 'model'
        : 'user',

    parts: [
      {
        text: item.content,
      },
    ],
  }))
}

function extractGeminiText(data) {
  const parts =
    data?.candidates?.[0]
      ?.content?.parts

  if (!Array.isArray(parts)) {
    return ''
  }

  return parts
    .map(part =>
      typeof part?.text === 'string'
        ? part.text
        : '',
    )
    .filter(Boolean)
    .join('\n')
    .trim()
}

export async function generateAnswer(
  message,
  history,
  context,
) {
  const apiKey =
    getApiKey()

  const model =
    getModel()

  const contextBlock =
    'CONTEXTO ATUAL DA PROPRIEDADE (JSON):\n' +
    JSON.stringify(context) +
    '\n\nPERGUNTA DO USUÁRIO:\n' +
    message

  const contents = [
    ...buildGeminiHistory(
      history,
    ),
    {
      role: 'user',
      parts: [
        {
          text: contextBlock,
        },
      ],
    },
  ]

  const requestBody =
    JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              SYSTEM_PROMPT,
          },
        ],
      },

      contents,

      generationConfig: {
        responseMimeType:
          'application/json',
      },
    })

  const fallbackModel =
    'gemini-3.5-flash'

  const modelsToTry =
    [model, fallbackModel]
      .filter(
        (value, index, list) =>
          list.indexOf(value) === index,
      )

  let lastError =
    'AI_PROVIDER_ERROR'

  for (
    const currentModel of
    modelsToTry
  ) {
    for (
      let attempt = 1;
      attempt <= 3;
      attempt += 1
    ) {
      const controller =
        new AbortController()

      const timeout =
        setTimeout(
          () => {
            controller.abort()
          },
          REQUEST_TIMEOUT_MS,
        )

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `${encodeURIComponent(currentModel)}:generateContent` +
        `?key=${encodeURIComponent(apiKey)}`

      let response

      try {
        response = await fetch(
          url,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            signal:
              controller.signal,

            body:
              requestBody,
          },
        )
      } catch (error) {
        clearTimeout(timeout)

        if (
          isTimeoutError(error)
        ) {
          lastError =
            'AI_TIMEOUT'

          if (attempt < 3) {
            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  attempt * 700,
                ),
            )

            continue
          }

          break
        }

        lastError =
          'AI_PROVIDER_ERROR'

        if (attempt < 3) {
          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                attempt * 700,
              ),
          )

          continue
        }

        break
      } finally {
        clearTimeout(timeout)
      }

      if (!response.ok) {
        let details = ''

        try {
          details =
            await response.text()
        } catch {
          details = ''
        }

        console.error(
          `[ai-server] Gemini HTTP ${response.status} model=${currentModel} attempt=${attempt} ${details.slice(0, 300)}`,
        )

        lastError =
          `AI_PROVIDER_ERROR: Gemini respondeu HTTP ${response.status}.`

        const retryable =
          response.status === 429 ||
          response.status === 500 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504

        if (
          retryable &&
          attempt < 3
        ) {
          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                attempt * 700,
              ),
          )

          continue
        }

        break
      }

      let data

      try {
        data =
          await response.json()
      } catch {
        lastError =
          'AI_PROVIDER_ERROR: resposta inválida do Gemini.'

        continue
      }

      const raw =
        extractGeminiText(data)

      if (!raw) {
        lastError =
          'AI_PROVIDER_ERROR: resposta vazia do provedor.'

        continue
      }

      return normalizeResponse(
        raw,
      )
    }
  }

  throw new Error(
    lastError,
  )
}
