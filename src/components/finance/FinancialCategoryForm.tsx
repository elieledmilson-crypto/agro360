import {
  useState,
  FormEvent,
  ChangeEvent,
} from 'react'
import {
  FinancialCategory,
  FinancialTransactionType,
} from '../../types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface FinancialCategoryFormData {
  name: string
  type: FinancialTransactionType
  description: string
}

interface Props {
  category?: FinancialCategory
  typeChangeBlocked?: boolean
  onSubmit: (
    data: Omit<
      FinancialCategory,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const typeOptions: FinancialTransactionType[] = [
  'Receita',
  'Despesa',
]

export default function FinancialCategoryForm({
  category,
  typeChangeBlocked,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const [formData, setFormData] =
    useState<FinancialCategoryFormData>(() => {
      if (category) {
        return {
          name: category.name,
          type: category.type,
          description: category.description ?? '',
        }
      }

      return {
        name: '',
        type: 'Receita',
        description: '',
      }
    })

  const [errors, setErrors] = useState<
    Partial<Record<keyof FinancialCategoryFormData, string>>
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

    if (errors[name as keyof FinancialCategoryFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<
      Record<keyof FinancialCategoryFormData, string>
    > = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.type) {
      newErrors.type = 'Tipo é obrigatório'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const payload: Omit<
      FinancialCategory,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      name: formData.name.trim(),
      type: formData.type,
      description: formData.description.trim() || undefined,
    }

    onSubmit(payload)
  }

  const disabledClass =
    'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-75'

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        {typeChangeBlocked && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
            Esta categoria já possui movimentações financeiras vinculadas. O
            tipo não pode ser alterado, mas nome e descrição continuam
            editáveis.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Nome *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Venda de gado"
              required
            />

            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="category-type"
                className="block text-sm font-medium"
              >
                Tipo *
              </label>

              <HelpTip
                title="O que é o tipo da categoria?"
                description="Define se a categoria será usada em receitas ou despesas. Receitas entram como ganhos e despesas como gastos."
              />
            </div>

            <select
              id="category-type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={typeChangeBlocked}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                typeChangeBlocked ? disabledClass : ''
              }`}
            >
              {typeOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {errors.type && (
              <p className="mt-1 text-sm text-red-600">
                {errors.type}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Descrição
          </label>

          <textarea
            name="description"
            value={formData.description}
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