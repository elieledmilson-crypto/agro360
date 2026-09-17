import { useMemo } from 'react'
import { FinancialTransactionType } from '../../types'
import { getFinancialCategoriesByType } from '../../services/financeService'
import HelpTip from '../ui/HelpTip'
import Input from '../ui/Input'

export interface IntegratedFinancialLine {
  categoryId: string
  date: string
  description: string
  amount: string
  notes: string
}

export function createEmptyIntegratedFinancialLine(
  defaults?: Partial<IntegratedFinancialLine>,
): IntegratedFinancialLine {
  return {
    categoryId: '',
    date: '',
    description: '',
    amount: '',
    notes: '',
    ...defaults,
  }
}

interface Props {
  enabled: boolean
  onEnabledChange: (next: boolean) => void
  line: IntegratedFinancialLine
  onLineChange: (next: IntegratedFinancialLine) => void
  errors?: {
    categoryId?: string
    date?: string
    description?: string
    amount?: string
  }
  title?: string
  helpDescription?: string
  type?: FinancialTransactionType
}

export default function IntegratedFinancialSection({
  enabled,
  onEnabledChange,
  line,
  onLineChange,
  errors,
  title = 'Registrar custo no Financeiro',
  helpDescription = 'Marque para registrar uma despesa vinculada a esta operação.',
  type = 'Despesa',
}: Props) {
  const categories = useMemo(
    () =>
      enabled
        ? getFinancialCategoriesByType(type)
        : [],
    [enabled, type],
  )

  const handleChange = (
    field: keyof IntegratedFinancialLine,
    value: string,
  ) => {
    onLineChange({
      ...line,
      [field]: value,
    })
  }

  const selectClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className="md:col-span-2 mt-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center gap-2">
        <input
          id="integrated-financial-enabled"
          type="checkbox"
          checked={enabled}
          onChange={e => onEnabledChange(e.target.checked)}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
        />

        <label
          htmlFor="integrated-financial-enabled"
          className="text-sm font-medium"
        >
          {title}
        </label>

        <HelpTip
          title={title}
          description={helpDescription}
        />
      </div>

      {enabled && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label
              htmlFor="integrated-financial-category"
              className="block text-sm font-medium mb-1"
            >
              Categoria *
            </label>

            <select
              id="integrated-financial-category"
              value={line.categoryId}
              onChange={e =>
                handleChange(
                  'categoryId',
                  e.target.value,
                )
              }
              className={selectClass}
            >
              <option value="">
                Selecione uma categoria
              </option>

              {categories.map(category => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

            {categories.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Nenhuma categoria de{' '}
                {type.toLowerCase()}{' '}
                cadastrada no Financeiro.
                Cadastre uma categoria antes
                de registrar este custo.
              </p>
            )}

            {errors?.categoryId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.categoryId}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Data do custo *"
              name="integrated-financial-date"
              type="date"
              value={line.date}
              onChange={e =>
                handleChange(
                  'date',
                  e.target.value,
                )
              }
            />

            {errors?.date && (
              <p className="mt-1 text-sm text-red-600">
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="integrated-financial-amount"
              className="block text-sm font-medium mb-1"
            >
              Valor (R$) *
            </label>

            <Input
              id="integrated-financial-amount"
              label=""
              name="integrated-financial-amount"
              type="number"
              min="0"
              step="0.01"
              value={line.amount}
              onChange={e =>
                handleChange(
                  'amount',
                  e.target.value,
                )
              }
              placeholder="0.00"
            />

            {errors?.amount && (
              <p className="mt-1 text-sm text-red-600">
                {errors.amount}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="integrated-financial-description"
              className="block text-sm font-medium mb-1"
            >
              Descrição *
            </label>

            <Input
              id="integrated-financial-description"
              label=""
              name="integrated-financial-description"
              value={line.description}
              onChange={e =>
                handleChange(
                  'description',
                  e.target.value,
                )
              }
              placeholder="Descrição do lançamento"
            />

            {errors?.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="integrated-financial-notes"
              className="block text-sm font-medium mb-1"
            >
              Observações
            </label>

            <textarea
              id="integrated-financial-notes"
              value={line.notes}
              onChange={e =>
                handleChange(
                  'notes',
                  e.target.value,
                )
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
              placeholder="Informações adicionais (opcional)"
            />
          </div>
        </div>
      )}
    </div>
  )
}