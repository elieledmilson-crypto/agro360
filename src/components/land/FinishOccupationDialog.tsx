import { useState, useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (exitDate: string) => void
  occupationInfo: {
    paddockCode: string
    paddockName: string
    lotName: string
    entryDate: string
  } | null
  submitError?: string
  onClearSubmitError?: () => void
}

export default function FinishOccupationDialog({
  open,
  onClose,
  onConfirm,
  occupationInfo,
  submitError,
  onClearSubmitError,
}: Props) {
  const [exitDate, setExitDate] = useState('')
  const [fieldError, setFieldError] = useState('')

  useEffect(() => {
    if (open) {
      setExitDate('')
      setFieldError('')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleConfirm = () => {
    if (!exitDate) {
      setFieldError('Data de saída é obrigatória')
      return
    }

    onConfirm(exitDate)
  }

  if (!open || !occupationInfo) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Encerrar ocupação
        </h2>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Piquete:{' '}
          <strong>
            {occupationInfo.paddockCode} — {occupationInfo.paddockName}
          </strong>
          <br />

          Lote: <strong>{occupationInfo.lotName}</strong>
          <br />

          Data de entrada:{' '}
          <strong>
            {new Date(
              occupationInfo.entryDate + 'T00:00:00'
            ).toLocaleDateString('pt-BR')}
          </strong>
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Data de saída *
          </label>

          <input
            type="date"
            value={exitDate}
            onChange={e => {
              setExitDate(e.target.value)
              setFieldError('')
              onClearSubmitError?.()
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {fieldError && (
            <p className="mt-1 text-sm text-red-600">
              {fieldError}
            </p>
          )}

          {submitError && (
            <p className="mt-1 text-sm text-red-600">
              {submitError}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}