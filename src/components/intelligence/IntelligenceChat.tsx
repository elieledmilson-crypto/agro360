import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Card from '../ui/Card'
import PageFeedback from '../ui/PageFeedback'
import IntelligenceChatMessage from './IntelligenceChatMessage'
import IntelligencePromptForm from './IntelligencePromptForm'
import IntelligenceActionConfirmation from './IntelligenceActionConfirmation'
import { useAuth } from '../../hooks/useAuth'
import { userHasPermission } from '../../services/permissionService'
import { buildIntelligenceContext } from '../../services/intelligenceContextService'
import { sendIntelligenceChat } from '../../services/aiChatService'
import {
  executeIntelligenceAction,
  getIntelligenceActionPermissionError,
} from '../../services/intelligenceActionService'
import {
  IntelligenceActionProposal,
  IntelligenceChatMessage as ChatMessage,
  PermissionKey,
} from '../../types'
import {
  ChevronDown,
  Plus,
} from 'lucide-react'

interface Suggestion {
  label: string
  permission?: PermissionKey
}

const SUGGESTIONS: Suggestion[] = [
  {
    label:
      'O que precisa da minha atenção hoje?',
  },
  {
    label:
      'Resuma minha propriedade.',
  },
  {
    label:
      'Como está meu estoque?',
    permission: 'inventory',
  },
  {
    label:
      'Como está a saúde animal?',
    permission: 'health',
  },
  {
    label:
      'Como estão os cultivos?',
    permission: 'crops',
  },
  {
    label:
      'Como estão as máquinas?',
    permission: 'machines',
  },
  {
    label:
      'Como está meu financeiro?',
    permission: 'finance',
  },
  {
    label:
      'Como estão minhas terras?',
    permission: 'land',
  },
  {
    label:
      'Como está a propriedade no mapa?',
    permission: 'map',
  },
]

const MAX_HISTORY_SENT = 12

const SCROLL_BOTTOM_THRESHOLD = 48

interface Props {
  onActionExecuted?: () => void
}

interface PendingAction {
  proposal: IntelligenceActionProposal
  executing: boolean
}

function makeId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function createWelcomeMessage(): ChatMessage {
  return {
    id: makeId(),
    role: 'assistant',
    content:
      'Olá! Posso ajudar a analisar os dados cadastrados da sua propriedade e propor ações com a sua confirmação. O que você gostaria de saber?',
    createdAt: new Date().toISOString(),
  }
}

function translateChatError(
  error: unknown,
): string {
  if (error instanceof Error) {
    if (error.message === 'OFFLINE') {
      return 'O Assistente de IA precisa de conexão com a internet. Os insights locais do Agro360 continuam disponíveis.'
    }

    if (
      error.message ===
      'CONFIGURATION_ERROR'
    ) {
      return 'O Assistente Agro360 ainda não está configurado neste ambiente.'
    }

    if (
      error.message ===
      'AI_TIMEOUT'
    ) {
      return 'O Assistente demorou demais para responder. Tente novamente.'
    }

    if (
      error.message ===
      'INVALID_REQUEST'
    ) {
      return 'Sua pergunta está muito longa. Resuma-a e tente novamente.'
    }
  }

  return 'Não foi possível obter uma resposta do Assistente agora. Tente novamente.'
}

export default function IntelligenceChat({
  onActionExecuted,
}: Props) {
  const { user } = useAuth()

  const [
    messages,
    setMessages,
  ] = useState<ChatMessage[]>(
    () => [
      createWelcomeMessage(),
    ],
  )

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  const [
    pendingAction,
    setPendingAction,
  ] =
    useState<PendingAction | null>(
      null,
    )

  const [
    showScrollToBottom,
    setShowScrollToBottom,
  ] = useState(false)

  const chatScrollRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const conversationStarted =
    useMemo(
      () =>
        messages.some(
          message =>
            message.role ===
            'user',
        ),
      [messages],
    )

  const availableSuggestions =
    useMemo(() => {
      return SUGGESTIONS.filter(
        suggestion => {
          if (
            !suggestion.permission
          ) {
            return true
          }

          return userHasPermission(
            user,
            suggestion.permission,
          )
        },
      )
    }, [user])

  const scrollToBottom =
    useCallback(
      (
        behavior:
          ScrollBehavior =
          'smooth',
      ) => {
        const element =
          chatScrollRef.current

        if (!element) {
          return
        }

        element.scrollTo({
          top:
            element.scrollHeight,
          behavior,
        })

        setShowScrollToBottom(
          false,
        )
      },
      [],
    )

  const updateScrollPosition =
    useCallback(() => {
      const element =
        chatScrollRef.current

      if (!element) {
        return
      }

      const distanceFromBottom =
        element.scrollHeight -
        element.scrollTop -
        element.clientHeight

      setShowScrollToBottom(
        distanceFromBottom >
          SCROLL_BOTTOM_THRESHOLD,
      )
    }, [])

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(
        () => {
          scrollToBottom(
            'smooth',
          )
        },
      )

    return () => {
      window.cancelAnimationFrame(
        frameId,
      )
    }
  }, [
    messages,
    pendingAction,
    loading,
    scrollToBottom,
  ])

  const appendMessage =
    useCallback(
      (
        role:
          | 'user'
          | 'assistant',
        content: string,
      ) => {
        const message: ChatMessage =
          {
            id: makeId(),
            role,
            content,
            createdAt:
              new Date().toISOString(),
          }

        setMessages(prev => [
          ...prev,
          message,
        ])
      },
      [],
    )

  const handleSend =
    useCallback(
      async (
        content: string,
      ) => {
        if (!user) {
          return
        }

        if (loading) {
          return
        }

        if (pendingAction) {
          return
        }

        appendMessage(
          'user',
          content,
        )

        setLoading(true)
        setError(null)

        try {
          const context =
            buildIntelligenceContext(
              user,
              content,
            )

          const history =
            messages
              .slice(
                -MAX_HISTORY_SENT,
              )
              .map(message => ({
                role:
                  message.role,
                content:
                  message.content,
              }))

          const response =
            await sendIntelligenceChat(
              {
                message: content,
                history,
                context,
              },
            )

          if (
            response.kind ===
            'message'
          ) {
            appendMessage(
              'assistant',
              response.answer,
            )
          } else {
            // Barreira local determinística:
            // nunca confiar apenas no modelo.
            //
            // Sem autorização local,
            // pendingAction não é criado
            // e nenhum getter do módulo
            // é consultado.
            const permissionError =
              getIntelligenceActionPermissionError(
                user,
                response.action,
              )

            if (
              permissionError
            ) {
              appendMessage(
                'assistant',
                permissionError,
              )
            } else {
              if (
                response.answer
              ) {
                appendMessage(
                  'assistant',
                  response.answer,
                )
              }

              setPendingAction({
                proposal:
                  response.action,
                executing: false,
              })
            }
          }
        } catch (err) {
          setError(
            translateChatError(
              err,
            ),
          )
        } finally {
          setLoading(false)
        }
      },
      [
        user,
        loading,
        messages,
        pendingAction,
        appendMessage,
      ],
    )

  const handleConfirmAction =
    useCallback(() => {
      if (!pendingAction) {
        return
      }

      setPendingAction(prev =>
        prev
          ? {
              ...prev,
              executing: true,
            }
          : prev,
      )

      const result =
        executeIntelligenceAction(
          user,
          pendingAction.proposal,
        )

      appendMessage(
        'assistant',
        result.message,
      )

      setPendingAction(null)

      if (
        result.success &&
        onActionExecuted
      ) {
        onActionExecuted()
      }
    }, [
      pendingAction,
      user,
      appendMessage,
      onActionExecuted,
    ])

  const handleCancelAction =
    useCallback(() => {
      setPendingAction(null)

      appendMessage(
        'assistant',
        'Ação cancelada. Nenhum registro foi alterado.',
      )
    }, [appendMessage])

  const newConversationDisabled =
    loading ||
    (pendingAction !== null &&
      pendingAction.executing)

  const handleNewConversation =
    useCallback(() => {
      if (
        newConversationDisabled
      ) {
        return
      }

      setMessages([
        createWelcomeMessage(),
      ])

      setError(null)
      setPendingAction(null)
      setShowScrollToBottom(
        false,
      )
    }, [
      newConversationDisabled,
    ])

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">
            Assistente Agro360
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Respostas baseadas nos dados cadastrados na propriedade.
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleNewConversation
          }
          disabled={
            newConversationDisabled
          }
          className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />

          Nova conversa
        </button>
      </div>

      <div className="relative">
        <div
          ref={chatScrollRef}
          onScroll={
            updateScrollPosition
          }
          className="max-h-96 overflow-y-auto space-y-3 py-2 pr-1 scroll-smooth"
          aria-live="polite"
        >
          {messages.map(
            message => (
              <IntelligenceChatMessage
                key={
                  message.id
                }
                message={
                  message
                }
              />
            ),
          )}

          {pendingAction && (
            <IntelligenceActionConfirmation
              proposal={
                pendingAction.proposal
              }
              executing={
                pendingAction.executing
              }
              onConfirm={
                handleConfirmAction
              }
              onCancel={
                handleCancelAction
              }
            />
          )}

          {loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Agro360 está analisando os dados...
            </p>
          )}
        </div>

        {showScrollToBottom && (
          <button
            type="button"
            onClick={() =>
              scrollToBottom(
                'smooth',
              )
            }
            aria-label="Ir para o final da conversa"
            title="Ir para o final da conversa"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <ChevronDown
              className="w-5 h-5"
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {error && (
        <PageFeedback
          type="error"
          message={error}
        />
      )}

      {!conversationStarted && (
        <div className="flex flex-wrap gap-2">
          {availableSuggestions.map(
            suggestion => (
              <button
                key={
                  suggestion.label
                }
                type="button"
                onClick={() =>
                  handleSend(
                    suggestion.label,
                  )
                }
                disabled={
                  loading ||
                  pendingAction !==
                    null
                }
                className="px-3 py-1.5 rounded-lg text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {
                  suggestion.label
                }
              </button>
            ),
          )}
        </div>
      )}

      <IntelligencePromptForm
        onSubmit={
          handleSend
        }
        disabled={
          loading ||
          pendingAction !== null
        }
      />

      <p className="text-xs text-gray-500 dark:text-gray-400">
        O Assistente utiliza apenas os dados necessários e autorizados
        para responder à sua pergunta. Ações propostas exigem
        confirmação explícita antes de serem executadas.
      </p>
    </Card>
  )
}