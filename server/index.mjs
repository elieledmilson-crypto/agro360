// Servidor HTTP mínimo para o Assistente Agro360.
//
// - Não usa Express: apenas `node:http`.
// - Carrega `.env` manualmente usando `node:fs` (sem dependência extra).
// - As credenciais e configurações do provedor de IA ficam apenas
//   no servidor e nunca são enviadas ao frontend.

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateChatRequest } from './ai/validateRequest.mjs'
import { generateAnswer } from './ai/aiService.mjs'

// -------- Carregamento de .env (sem dependência) --------
function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env')
  let content

  try {
    content = readFileSync(envPath, 'utf8')
  } catch {
    return
  }

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const eq = line.indexOf('=')

    if (eq === -1) {
      continue
    }

    const key = line.slice(0, eq).trim()

    if (!key) {
      continue
    }

    let value = line.slice(eq + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvFile()

const PORT =
  Number(process.env.AI_SERVER_PORT) ||
  8787

const MAX_BODY_BYTES =
  256 * 1024

function sendJson(
  res,
  status,
  payload,
) {
  const body =
    JSON.stringify(payload)

  res.writeHead(status, {
    'Content-Type':
      'application/json; charset=utf-8',

    'Content-Length':
      Buffer.byteLength(body),
  })

  res.end(body)
}

// Leitura limitada do body.
//
// Ao ultrapassar o limite, para de acumular dados
// e rejeita a Promise sem destruir o socket,
// permitindo responder com HTTP 413.
function readBody(req) {
  return new Promise(
    (resolvePromise, rejectPromise) => {
      const chunks = []
      let total = 0
      let settled = false

      function settle(fn) {
        if (settled) {
          return
        }

        settled = true
        fn()
      }

      req.on(
        'data',
        chunk => {
          if (settled) {
            return
          }

          total +=
            chunk.length

          if (
            total >
            MAX_BODY_BYTES
          ) {
            settle(() =>
              rejectPromise(
                new Error(
                  'PAYLOAD_TOO_LARGE',
                ),
              ),
            )

            return
          }

          chunks.push(chunk)
        },
      )

      req.on(
        'end',
        () => {
          if (settled) {
            return
          }

          settle(() =>
            resolvePromise(
              Buffer.concat(
                chunks,
              ).toString(
                'utf8',
              ),
            ),
          )
        },
      )

      req.on(
        'error',
        error => {
          settle(() =>
            rejectPromise(
              error,
            ),
          )
        },
      )
    },
  )
}

const server =
  createServer(
    async (
      req,
      res,
    ) => {
      const started =
        Date.now()

      const url =
        req.url || ''

      if (
        url !==
        '/api/intelligence/chat'
      ) {
        sendJson(
          res,
          404,
          {
            error:
              'NOT_FOUND',
          },
        )

        return
      }

      if (
        req.method !==
        'POST'
      ) {
        sendJson(
          res,
          405,
          {
            error:
              'METHOD_NOT_ALLOWED',
          },
        )

        return
      }

      const contentType =
        req.headers[
          'content-type'
        ] || ''

      if (
        !contentType.includes(
          'application/json',
        )
      ) {
        sendJson(
          res,
          415,
          {
            error:
              'UNSUPPORTED_MEDIA_TYPE',
          },
        )

        return
      }

      let rawBody

      try {
        rawBody =
          await readBody(req)
      } catch (error) {
        if (
          error instanceof
            Error &&
          error.message ===
            'PAYLOAD_TOO_LARGE'
        ) {
          sendJson(
            res,
            413,
            {
              error:
                'INVALID_REQUEST',
            },
          )

          return
        }

        sendJson(
          res,
          400,
          {
            error:
              'INVALID_REQUEST',
          },
        )

        return
      }

      let parsed

      try {
        parsed =
          JSON.parse(
            rawBody,
          )
      } catch {
        sendJson(
          res,
          400,
          {
            error:
              'INVALID_REQUEST',
          },
        )

        return
      }

      const validation =
        validateChatRequest(
          parsed,
        )

      if (
        !validation.valid
      ) {
        sendJson(
          res,
          400,
          {
            error:
              validation.error,
          },
        )

        return
      }

      try {
        const result =
          await generateAnswer(
            validation.data
              .message,
            validation.data
              .history,
            validation.data
              .context,
          )

        sendJson(
          res,
          200,
          result,
        )

        console.log(
          `[ai-server] 200 ${Date.now() - started}ms`,
        )
      } catch (error) {
        const message =
          error instanceof
          Error
            ? error.message
            : ''

        if (
          message.startsWith(
            'CONFIGURATION_ERROR',
          )
        ) {
          console.error(
            `[ai-server] CONFIGURATION_ERROR ${Date.now() - started}ms`,
          )

          sendJson(
            res,
            503,
            {
              error:
                'CONFIGURATION_ERROR',
            },
          )

          return
        }

        if (
          message.startsWith(
            'AI_TIMEOUT',
          )
        ) {
          console.error(
            `[ai-server] AI_TIMEOUT ${Date.now() - started}ms`,
          )

          sendJson(
            res,
            504,
            {
              error:
                'AI_TIMEOUT',
            },
          )

          return
        }

        console.error(
          `[ai-server] AI_PROVIDER_ERROR ${Date.now() - started}ms`,
        )

        sendJson(
          res,
          502,
          {
            error:
              'AI_PROVIDER_ERROR',
          },
        )
      }
    },
  )

server.listen(
  PORT,
  () => {
    console.log(
      `[ai-server] listening on port ${PORT}`,
    )
  },
)