import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FinancialTransactionForm from '../../components/finance/FinancialTransactionForm'
import { createFinancialTransaction } from '../../services/financeService'
import { FinancialTransaction } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewExpensePage() {
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

      navigate(`/financeiro/despesas/${transaction.id}`, {
        state: {
          successMessage: 'Despesa cadastrada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar despesa.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/financeiro/despesas')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
        >
          ← Voltar para despesas
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Nova despesa</h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Registre uma nova saída financeira da propriedade."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados da nova despesa.
        </p>
      </div>

      <FinancialTransactionForm
        type="Despesa"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/financeiro/despesas')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}