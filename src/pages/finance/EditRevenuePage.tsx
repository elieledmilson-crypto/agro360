import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import FinancialTransactionForm from '../../components/finance/FinancialTransactionForm'
import {
  getFinancialTransactionById,
  updateFinancialTransaction,
} from '../../services/financeService'
import { FinancialTransaction } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditRevenuePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const transaction = useMemo(
    () => (id ? getFinancialTransactionById(id) : undefined),
    [id],
  )

  if (!transaction || transaction.type !== 'Receita') {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Receita não encontrada
        </p>

        <button
          onClick={() => navigate('/financeiro/receitas')}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para receitas
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<
      FinancialTransaction,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const updated = updateFinancialTransaction(transaction.id, data)

      if (!updated) {
        throw new Error('Receita não encontrada.')
      }

      navigate(`/financeiro/receitas/${updated.id}`, {
        state: {
          successMessage: 'Receita atualizada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar receita.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(`/financeiro/receitas/${transaction.id}`)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
        >
          ← Voltar para a receita
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Editar receita</h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações desta receita."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados da receita.
        </p>
      </div>

      <FinancialTransactionForm
        type="Receita"
        transaction={transaction}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/financeiro/receitas/${transaction.id}`)}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}