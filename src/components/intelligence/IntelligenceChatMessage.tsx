import type { ReactNode } from 'react'
import { IntelligenceChatMessage as ChatMessage } from '../../types'

interface Props {
  message: ChatMessage
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+?\*\*)/g)

  return parts
    .filter(part => part !== '')
    .map((part, index) => {
      const isBold =
        part.startsWith('**') &&
        part.endsWith('**') &&
        part.length > 4

      if (isBold) {
        return (
          <strong key={`${index}-${part}`} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        )
      }

      return (
        <span key={`${index}-${part}`}>
          {part}
        </span>
      )
    })
}

function renderMessageContent(content: string): ReactNode[] {
  return content.split('\n').map((line, index) => {
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/)

    if (bulletMatch) {
      return (
        <div
          key={`line-${index}`}
          className="flex items-start gap-2"
        >
          <span
            className="flex-shrink-0"
            aria-hidden="true"
          >
            •
          </span>

          <span className="min-w-0">
            {renderInlineMarkdown(bulletMatch[1])}
          </span>
        </div>
      )
    }

    const numberedMatch = line.match(
      /^\s*(\d+)\.\s+(.*)$/,
    )

    if (numberedMatch) {
      return (
        <div
          key={`line-${index}`}
          className="flex items-start gap-2"
        >
          <span className="flex-shrink-0">
            {numberedMatch[1]}.
          </span>

          <span className="min-w-0">
            {renderInlineMarkdown(numberedMatch[2])}
          </span>
        </div>
      )
    }

    if (line.trim() === '') {
      return (
        <div
          key={`line-${index}`}
          className="h-2"
          aria-hidden="true"
        />
      )
    }

    return (
      <div key={`line-${index}`}>
        {renderInlineMarkdown(line)}
      </div>
    )
  })
}

export default function IntelligenceChatMessage({
  message,
}: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex ${
        isUser
          ? 'justify-end'
          : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}
      >
        {renderMessageContent(message.content)}
      </div>
    </div>
  )
}