import { useMemo, ChangeEvent } from 'react'
import { InventoryItemCategory } from '../../types'
import { getInventoryItems } from '../../services/inventoryService'
import Input from '../ui/Input'
import HelpTip from '../ui/HelpTip'
import Button from '../ui/Button'
import { Plus, Trash2 } from 'lucide-react'

export interface ConsumptionLine {
  id: string
  inventoryItemId: string
  quantity: string
}

interface LineErrors {
  inventoryItemId?: string
  quantity?: string
}

interface Props {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  lines: ConsumptionLine[]
  onLinesChange: (lines: ConsumptionLine[]) => void
  allowedCategories: InventoryItemCategory[]
  title?: string
  helpDescription?: string
  lineErrors?: Record<string, LineErrors>
  disabled?: boolean
}

function makeLineId(): string {
  return `ln_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export function createEmptyConsumptionLine(): ConsumptionLine {
  return {
    id: makeLineId(),
    inventoryItemId: '',
    quantity: '',
  }
}

export default function InventoryConsumptionSection({
  enabled,
  onEnabledChange,
  lines,
  onLinesChange,
  allowedCategories,
  title = 'Dar baixa no estoque',
  helpDescription =
    'Marque para registrar a saída dos itens consumidos diretamente do estoque.',
  lineErrors = {},
  disabled,
}: Props) {
  const eligibleItems = useMemo(
    () =>
      getInventoryItems().filter(
        item =>
          item.status === 'Ativo' &&
          allowedCategories.includes(item.category)
      ),
    [allowedCategories]
  )

  const handleToggle = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked

    onEnabledChange(checked)

    if (
      checked &&
      lines.length === 0
    ) {
      onLinesChange([
        createEmptyConsumptionLine(),
      ])
    }
  }

  const handleLineChange = (
    lineId: string,
    field:
      | 'inventoryItemId'
      | 'quantity',
    value: string
  ) => {
    onLinesChange(
      lines.map(line =>
        line.id === lineId
          ? {
              ...line,
              [field]: value,
            }
          : line
      )
    )
  }

  const handleAddLine = () => {
    onLinesChange([
      ...lines,
      createEmptyConsumptionLine(),
    ])
  }

  const handleRemoveLine = (
    lineId: string
  ) => {
    const next =
      lines.filter(
        line =>
          line.id !== lineId
      )

    onLinesChange(
      next.length > 0
        ? next
        : [
            createEmptyConsumptionLine(),
          ]
    )
  }

  if (
    eligibleItems.length === 0
  ) {
    return (
      <div className="md:col-span-2 mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-sm">
        Nenhum item ativo compatível cadastrado no estoque para esta categoria.
      </div>
    )
  }

  return (
    <div className="md:col-span-2 mt-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center gap-2">
        <input
          id="stock-consumption-enabled"
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          disabled={disabled}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
        />

        <label
          htmlFor="stock-consumption-enabled"
          className="text-sm font-medium"
        >
          {title}
        </label>

        <HelpTip
          title={title}
          description={
            helpDescription
          }
        />
      </div>

      {enabled && (
        <div className="mt-4 space-y-3">
          {lines.map(line => {
            const lineErr =
              lineErrors[line.id] ??
              {}

            return (
              <div
                key={line.id}
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 items-end"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Item de estoque *
                  </label>

                  <select
                    value={
                      line.inventoryItemId
                    }
                    onChange={e =>
                      handleLineChange(
                        line.id,
                        'inventoryItemId',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">
                      Selecione um item
                    </option>

                    {eligibleItems.map(
                      item => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {item.code} —{' '}
                          {item.name}{' '}
                          ({item.unit})
                        </option>
                      )
                    )}
                  </select>

                  {lineErr.inventoryItemId && (
                    <p className="mt-1 text-sm text-red-600">
                      {
                        lineErr.inventoryItemId
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Quantidade *
                  </label>

                  <Input
                    label=""
                    type="number"
                    min="0"
                    step="any"
                    value={
                      line.quantity
                    }
                    onChange={e =>
                      handleLineChange(
                        line.id,
                        'quantity',
                        e.target.value
                      )
                    }
                    placeholder="0"
                  />

                  {lineErr.quantity && (
                    <p className="mt-1 text-sm text-red-600">
                      {
                        lineErr.quantity
                      }
                    </p>
                  )}
                </div>

                <div className="flex md:mb-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveLine(
                        line.id
                      )
                    }
                    className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                    aria-label="Remover linha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}

          <div>
            <Button
              type="button"
              variant="outline"
              onClick={
                handleAddLine
              }
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Adicionar item
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}