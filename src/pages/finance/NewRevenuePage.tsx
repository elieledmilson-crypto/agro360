import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FinancialTransactionForm from '../../components/finance/FinancialTransactionForm'
import { createFinancialTransaction } from '../../services/financeService'
import { FinancialTransaction } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewRevenuePage() {
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (
    data: Omit<
      FinancialTransaction,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const transaction = createFinancialTransaction(data)

      navigate(`/financeiro/receitas/${transaction.id}`, {
        state: {
          successMessage: 'Receita cadastrada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar receita.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/financeiro/receitas')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
        >
          ← Voltar para receitas
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Nova receita</h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Registre uma nova entrada financeira para a propriedade."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados da nova receita.
        </p>
      </div>

      <FinancialTransactionForm
        type="Receita"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/financeiro/receitas')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}