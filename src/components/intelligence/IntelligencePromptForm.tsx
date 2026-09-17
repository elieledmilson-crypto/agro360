import {
  FormEvent,
  KeyboardEvent,
  useState,
} from 'react'
import Button from '../ui/Button'

interface Props {
  onSubmit:
    (message: string) => void
  disabled: boolean
}

const MAX_LENGTH = 4000

export default function IntelligencePromptForm({
  onSubmit,
  disabled,
}: Props) {
  const [value, setValue] =
    useState('')

  function submit() {
    const trimmed =
      value.trim()

    if (
      !trimmed ||
      disabled
    ) {
      return
    }

    if (
      trimmed.length >
      MAX_LENGTH
    ) {
      return
    }

    onSubmit(trimmed)
    setValue('')
  }

  function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(
    event:
      KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key ===
        'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2"
    >
      <label
        htmlFor="intelligence-prompt"
        className="sr-only"
      >
        Pergunta para o Assistente Agro360
      </label>

      <textarea
        id="intelligence-prompt"
        value={value}
        onChange={event =>
          setValue(
            event.target.value,
          )
        }
        onKeyDown={
          handleKeyDown
        }
        placeholder="Pergunte qualquer coisa sobre sua propriedade..."
        rows={3}
        maxLength={
          MAX_LENGTH
        }
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {value.length}/
          {MAX_LENGTH}
        </span>

        <Button
          type="submit"
          disabled={
            disabled ||
            !value.trim()
          }
        >
          Enviar
        </Button>
      </div>
    </form>
  )
}