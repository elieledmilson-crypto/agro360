import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MachineMaintenanceForm, {
  MachineMaintenanceConsumptionPayload,
  MachineMaintenanceFinancialPayload,
} from '../../components/machines/MachineMaintenanceForm'
import { createMachineMaintenanceRecord } from '../../services/machineMaintenanceService'
import { createMachineMaintenanceWithConsumption } from '../../services/inventoryIntegrationService'
import { createFinancialTransactionWithOrigin } from '../../services/financialIntegrationService'
import { getMachineById } from '../../services/machineService'
import { useAuth } from '../../hooks/useAuth'
import { MachineMaintenanceRecord } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewMachineMaintenancePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const preselectedMachineId = useMemo(() => {
    const rawId = searchParams.get('machineId')

    if (!rawId) return undefined

    const machine = getMachineById(rawId)

    return machine ? machine.id : undefined
  }, [searchParams])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (
    data: Omit<
      MachineMaintenanceRecord,
      'id' | 'createdAt' | 'updatedAt'
    >,
    consumptions?: MachineMaintenanceConsumptionPayload[],
    financial?: MachineMaintenanceFinancialPayload,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const financialInput = financial
        ? { type: 'Despesa' as const, ...financial }
        : undefined

      if (consumptions && consumptions.length > 0) {
        const result = createMachineMaintenanceWithConsumption(
          user,
          data,
          consumptions,
          financialInput,
        )

        navigate(`/maquinas/manutencoes/${result.record.id}`, {
          state: {
            successMessage:
              'Registro de manutenção cadastrado com sucesso.',
          },
        })
      } else {
        const record = createMachineMaintenanceRecord(data)

        if (financialInput) {
          try {
            createFinancialTransactionWithOrigin(user, financialInput, {
              module: 'machines',
              type: 'machine-maintenance',
              recordId: record.id,
            })
          } catch {
            throw new Error(
              'A manutenção foi salva, mas o lançamento financeiro não pôde ser criado. Verifique o Financeiro manualmente.',
            )
          }
        }

        navigate(`/maquinas/manutencoes/${record.id}`, {
          state: {
            successMessage:
              'Registro de manutenção cadastrado com sucesso.',
          },
        })
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar manutenção.',
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
            Nova Manutenção
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Registre um serviço realizado em uma máquina ou equipamento."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Registre uma manutenção para uma máquina ou equipamento.
        </p>
      </div>

      <MachineMaintenanceForm
        preselectedMachineId={preselectedMachineId}
        user={user}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/maquinas/manutencoes')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}