import {
  useState,
  FormEvent,
  ChangeEvent,
  useMemo,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FinancialTransaction,
  FinancialTransactionType,
} from '../../types'
import {
  getFinancialCategoriesByType,
  getFinancialCategoryById,
} from '../../services/financeService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'
import { isFutureDate } from '../../utils/date'

interface FinancialTransactionFormData {
  date: string
  categoryId: string
  description: string
  amount: string
  notes: string
}

interface Props {
  type: FinancialTransactionType
  transaction?: FinancialTransaction
  onSubmit: (
    data: Omit<
      FinancialTransaction,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

export default function FinancialTransactionForm({
  type,
  transaction,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const navigate = useNavigate()

  const eligibleCategories = useMemo(
    () => getFinancialCategoriesByType(type),
    [type],
  )

  const [formData, setFormData] =
    useState<FinancialTransactionFormData>(() => {
      if (transaction) {
        return {
          date: transaction.date,
          categoryId: transaction.categoryId,
          description: transaction.description,
          amount: transaction.amount.toString(),
          notes: transaction.notes ?? '',
        }
      }

      return {
        date: '',
        categoryId: '',
        description: '',
        amount: '',
        notes: '',
      }
    })

  const [errors, setErrors] = useState<
    Partial<Record<keyof FinancialTransactionFormData, string>>
  >({})

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof FinancialTransactionFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<
      Record<keyof FinancialTransactionFormData, string>
    > = {}

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória'
    } else if (isFutureDate(formData.date)) {
      newErrors.date =
        'A data da movimentação financeira não pode ser futura'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Categoria é obrigatória'
    } else {
      const category = getFinancialCategoryById(formData.categoryId)

      if (!category) {
        newErrors.categoryId = 'Categoria financeira não encontrada'
      } else if (category.type !== type) {
        newErrors.categoryId =
          'A categoria selecionada não é compatível com o tipo da movimentação'
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'O valor deve ser maior que zero'
    } else {
      const amount = Number(formData.amount)

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        newErrors.amount = 'O valor deve ser maior que zero'
      }
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const payload: Omit<
      FinancialTransaction,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      type,
      date: formData.date,
      categoryId: formData.categoryId,
      description: formData.description.trim(),
      amount: Number(formData.amount),
      notes: formData.notes.trim() || undefined,
    }

    onSubmit(payload)
  }

  const typeLabel = type === 'Receita' ? 'receita' : 'despesa'

  if (eligibleCategories.length === 0) {
    return (
      <Card className="p-6">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-sm">
          Não há nenhuma categoria financeira do tipo{' '}
          <strong>{type}</strong> cadastrada. Cadastre uma categoria antes de
          registrar uma {typeLabel}.
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => navigate('/financeiro/categorias/nova')}
          >
            Cadastrar categoria
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Data *"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />

            {errors.date && (
              <p className="mt-1 text-sm text-red-600">
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="transaction-category"
                className="block text-sm font-medium"
              >
                Categoria *
              </label>

              <HelpTip
                title="O que é a categoria?"
                description="A categoria organiza esta movimentação financeira dentro de um grupo, como venda de gado, custeio agrícola, manutenção de máquina e outros."
              />
            </div>

            <select
              id="transaction-category"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione uma categoria</option>

              {eligibleCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.categoryId}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Descrição *"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ex: Venda de 3 bois"
              required
            />

            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="transaction-amount"
                className="block text-sm font-medium"
              >
                Valor (R$) *
              </label>

              <HelpTip
                title="Como informar o valor?"
                description="Informe o valor em reais. O sistema entende automaticamente se é receita ou despesa pelo tipo da movimentação."
              />
            </div>

            <Input
              id="transaction-amount"
              label=""
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0,00"
              required
            />

            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">
                {errors.amount}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Observações
          </label>

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
            placeholder="Informações adicionais (opcional)"
          />
        </div>

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {submitError}
          </div>
        )}
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}