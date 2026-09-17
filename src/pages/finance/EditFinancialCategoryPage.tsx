import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import FinancialCategoryForm from '../../components/finance/FinancialCategoryForm'
import {
  getFinancialCategoryById,
  updateFinancialCategory,
  financialCategoryHasTransactions,
} from '../../services/financeService'
import { FinancialCategory } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditFinancialCategoryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const category = useMemo(
    () => (id ? getFinancialCategoryById(id) : undefined),
    [id],
  )

  const isInUse = useMemo(
    () => (id ? financialCategoryHasTransactions(id) : false),
    [id],
  )

  if (!category) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Categoria financeira não encontrada
        </p>

        <button
          onClick={() => navigate('/financeiro/categorias')}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para categorias
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const updated = updateFinancialCategory(category.id, data)

      if (!updated) {
        throw new Error('Categoria financeira não encontrada.')
      }

      navigate('/financeiro/categorias', {
        state: {
          successMessage: 'Categoria financeira atualizada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar categoria.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/financeiro/categorias')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
        >
          ← Voltar para categorias
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">
            Editar categoria financeira
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações desta categoria financeira."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados da categoria.
        </p>
      </div>

      <FinancialCategoryForm
        category={category}
        typeChangeBlocked={isInUse}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/financeiro/categorias')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}