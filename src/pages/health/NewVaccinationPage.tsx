import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import VaccinationForm, {
  VaccinationConsumptionPayload,
  VaccinationFinancialPayload,
} from '../../components/health/VaccinationForm'
import { createVaccination } from '../../services/healthService'
import { createVaccinationWithConsumption } from '../../services/inventoryIntegrationService'
import { useAuth } from '../../hooks/useAuth'
import { Vaccination } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewVaccinationPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const animalId = searchParams.get('animalId') ?? undefined

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async (
    data: Omit<Vaccination, 'id' | 'createdAt' | 'updatedAt'>,
    consumption?: VaccinationConsumptionPayload,
    financial?: VaccinationFinancialPayload,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      const financialInput = financial
        ? { type: 'Despesa' as const, ...financial }
        : undefined

      if (consumption) {
        createVaccinationWithConsumption(
          user,
          data,
          consumption,
          financialInput,
        )
      } else {
        const vaccination = createVaccination(data)

        if (financialInput) {
          const { createFinancialTransactionWithOrigin } = await import(
            '../../services/financialIntegrationService'
          )

          try {
            createFinancialTransactionWithOrigin(user, financialInput, {
              module: 'health',
              type: 'vaccination',
              recordId: vaccination.id,
            })
          } catch {
            throw new Error(
              'A vacinação foi salva, mas o lançamento financeiro não pôde ser criado. Verifique o Financeiro manualmente.',
            )
          }
        }
      }

      navigate(`/animais/${data.animalId}`, {
        state: {
          successMessage: 'Vacinação registrada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao registrar vacinação.',
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
            Registrar Vacinação
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Selecione o animal e informe os dados da vacina aplicada."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados da vacina aplicada
        </p>
      </div>

      <VaccinationForm
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