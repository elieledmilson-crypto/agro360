import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CropManagementForm, {
  CropManagementConsumptionPayload,
  CropManagementFinancialPayload,
} from '../../components/crops/CropManagementForm'
import { createCropManagement } from '../../services/cropManagementService'
import { createCropManagementWithConsumption } from '../../services/inventoryIntegrationService'
import { createFinancialTransactionWithOrigin } from '../../services/financialIntegrationService'
import { getCropCycleById } from '../../services/cropService'
import { useAuth } from '../../hooks/useAuth'
import { CropManagement } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewCropManagementPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const preselectedCropCycleId = useMemo(() => {
    const rawId = searchParams.get('cropCycleId')

    if (!rawId) return undefined

    const cropCycle = getCropCycleById(rawId)

    return cropCycle ? cropCycle.id : undefined
  }, [searchParams])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (
    data: Omit<CropManagement, 'id' | 'createdAt' | 'updatedAt'>,
    consumptions?: CropManagementConsumptionPayload[],
    financial?: CropManagementFinancialPayload,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const financialInput = financial
        ? { type: 'Despesa' as const, ...financial }
        : undefined

      if (consumptions && consumptions.length > 0) {
        const result = createCropManagementWithConsumption(
          user,
          data,
          consumptions,
          financialInput,
        )

        navigate(`/cultivos/manejos/${result.management.id}`, {
          state: {
            successMessage: 'Manejo cadastrado com sucesso.',
          },
        })
      } else {
        const management = createCropManagement(data)

        if (financialInput) {
          try {
            createFinancialTransactionWithOrigin(user, financialInput, {
              module: 'crops',
              type: 'crop-management',
              recordId: management.id,
            })
          } catch {
            throw new Error(
              'O manejo foi salvo, mas o lançamento financeiro não pôde ser criado. Verifique o Financeiro manualmente.',
            )
          }
        }

        navigate(`/cultivos/manejos/${management.id}`, {
          state: {
            successMessage: 'Manejo cadastrado com sucesso.',
          },
        })
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar manejo.',
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
            Novo manejo
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Registre uma operação agrícola realizada em um cultivo."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Registre uma operação agrícola para um cultivo.
        </p>
      </div>

      <CropManagementForm
        preselectedCropCycleId={preselectedCropCycleId}
        user={user}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/cultivos/manejos')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}