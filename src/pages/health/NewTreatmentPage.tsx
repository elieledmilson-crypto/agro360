import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TreatmentForm, {
  TreatmentConsumptionPayload,
  TreatmentFinancialPayload,
} from '../../components/health/TreatmentForm'
import { createTreatment } from '../../services/healthService'
import { createTreatmentWithConsumption } from '../../services/inventoryIntegrationService'
import { createFinancialTransactionWithOrigin } from '../../services/financialIntegrationService'
import { useAuth } from '../../hooks/useAuth'
import { Treatment } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewTreatmentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const animalId = searchParams.get('animalId') ?? undefined

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (
    data: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt'>,
    consumptions?: TreatmentConsumptionPayload[],
    financial?: TreatmentFinancialPayload,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const financialInput = financial
        ? { type: 'Despesa' as const, ...financial }
        : undefined

      if (consumptions && consumptions.length > 0) {
        createTreatmentWithConsumption(
          user,
          data,
          consumptions,
          financialInput,
        )
      } else {
        const treatment = createTreatment(data)

        if (financialInput) {
          try {
            createFinancialTransactionWithOrigin(user, financialInput, {
              module: 'health',
              type: 'treatment',
              recordId: treatment.id,
            })
          } catch {
            throw new Error(
              'O tratamento foi salvo, mas o lançamento financeiro não pôde ser criado. Verifique o Financeiro manualmente.',
            )
          }
        }
      }

      navigate(`/animais/${data.animalId}`, {
        state: {
          successMessage: 'Tratamento registrado com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao registrar tratamento.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">
            Novo Tratamento
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Registre as informações do tratamento realizado ou iniciado em um animal."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Registre um tratamento para um animal
        </p>
      </div>

      <TreatmentForm
        preselectedAnimalId={animalId}
        user={user}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}