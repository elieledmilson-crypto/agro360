import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MachineMaintenanceForm from '../../components/machines/MachineMaintenanceForm'
import {
  getMachineMaintenanceRecordById,
  updateMachineMaintenanceRecord,
} from '../../services/machineMaintenanceService'
import { hasInventoryMovementByOrigin } from '../../services/inventoryService'
import { useAuth } from '../../hooks/useAuth'
import { MachineMaintenanceRecord } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditMachineMaintenancePage() {
  const { id } =
    useParams<{ id: string }>()

  const navigate =
    useNavigate()

  const { user } =
    useAuth()

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const [
    hasStockConsumption,
    setHasStockConsumption,
  ] = useState(false)

  const record = useMemo(
    () =>
      id
        ? getMachineMaintenanceRecordById(
            id
          )
        : undefined,
    [id]
  )

  useEffect(() => {
    if (record) {
      setHasStockConsumption(
        hasInventoryMovementByOrigin(
          'machines',
          'machine-maintenance',
          record.id
        )
      )
    } else {
      setHasStockConsumption(false)
    }
  }, [record])

  if (!record) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Registro de manutenção não encontrado
        </p>

        <button
          onClick={() =>
            navigate(
              '/maquinas/manutencoes'
            )
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para manutenções
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<
      MachineMaintenanceRecord,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const updated =
        updateMachineMaintenanceRecord(
          record.id,
          data
        )

      if (!updated) {
        throw new Error(
          'Registro de manutenção não encontrado.'
        )
      }

      navigate(
        `/maquinas/manutencoes/${updated.id}`,
        {
          state: {
            successMessage:
              'Registro de manutenção atualizado com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar manutenção.'
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
            Editar Manutenção
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações deste registro de manutenção."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados da manutenção.
        </p>
      </div>

      <MachineMaintenanceForm
        record={
          record
        }
        hasStockConsumption={
          hasStockConsumption
        }
        user={user}
        onSubmit={
          handleSubmit
        }
        onCancel={() =>
          navigate(
            `/maquinas/manutencoes/${record.id}`
          )
        }
        submitting={
          submitting
        }
        submitError={
          submitError
        }
      />
    </div>
  )
}