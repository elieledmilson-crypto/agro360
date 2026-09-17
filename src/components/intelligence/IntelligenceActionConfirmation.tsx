import {
  IntelligenceActionProposal,
} from '../../types'
import {
  describeAction,
} from '../../services/intelligenceActionService'
import Card from '../ui/Card'
import Button from '../ui/Button'
import {
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react'

interface Props {
  proposal:
    IntelligenceActionProposal
  executing: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function IntelligenceActionConfirmation({
  proposal,
  executing,
  onConfirm,
  onCancel,
}: Props) {
  const descriptor =
    describeAction(proposal)

  return (
    <Card className="p-4 space-y-3 border border-green-300 dark:border-green-800">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-green-700 dark:text-green-300 font-semibold">
            Ação proposta
          </p>

          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {descriptor.title}
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Módulo:{' '}
            {
              descriptor.moduleLabel
            }
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={executing}
          aria-label="Cancelar ação"
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {
          descriptor.fields.map(
            field => (
              <div
                key={
                  field.label
                }
                className="flex flex-col"
              >
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {
                    field.label
                  }
                </span>

                <span className="text-gray-900 dark:text-gray-100 break-words">
                  {
                    field.value
                  }
                </span>
              </div>
            ),
          )
        }
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200">
        <AlertTriangle
          className="w-4 h-4 mt-0.5 flex-shrink-0"
          aria-hidden="true"
        />

        <span>
          {
            descriptor.warning
          }
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          onClick={onConfirm}
          disabled={executing}
        >
          <CheckCircle className="w-4 h-4 mr-2 inline" />
          {
            executing
              ? 'Executando...'
              : 'Confirmar'
          }
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={executing}
        >
          Cancelar
        </Button>
      </div>
    </Card>
  )
}