import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  transactionDescription?: string
}

export default function DeleteFinancialTransactionDialog({
  open,
  onClose,
  onConfirm,
  transactionDescription,
}: Props) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      window.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

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
        aria-labelledby="delete-financial-title"
      >
        <h2
          id="delete-financial-title"
          className="text-xl font-bold text-gray-900 dark:text-gray-100"
        >
          Excluir despesa?
        </h2>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Esta ação removerá a despesa permanentemente.

          {transactionDescription && (
            <>
              <br />
              Despesa: <strong>{transactionDescription}</strong>
            </>
          )}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            autoFocus
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}