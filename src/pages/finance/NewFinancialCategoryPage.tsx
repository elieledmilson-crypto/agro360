import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FinancialCategoryForm from '../../components/finance/FinancialCategoryForm'
import { createFinancialCategory } from '../../services/financeService'
import { FinancialCategory } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewFinancialCategoryPage() {
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (
    data: Omit<FinancialCategory, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      createFinancialCategory(data)

      navigate('/financeiro/categorias', {
        state: {
          successMessage: 'Categoria financeira cadastrada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar categoria.',
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
            Nova categoria financeira
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Cadastre uma nova categoria para organizar suas receitas ou despesas."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados da nova categoria.
        </p>
      </div>

      <FinancialCategoryForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/financeiro/categorias')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}