import { useState, useMemo } from 'react'
import {
  useParams,
  useNavigate,
} from 'react-router-dom'
import MachineUsageForm from '../../components/machines/MachineUsageForm'
import {
  getMachineUsageRecordById,
  updateMachineUsageRecord,
} from '../../services/machineUsageService'
import { MachineUsageRecord } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditMachineUsagePage() {
  const { id } =
    useParams<{ id: string }>()

  const navigate = useNavigate()

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const record = useMemo(
    () =>
      id
        ? getMachineUsageRecordById(
            id
          )
        : undefined,
    [id]
  )

  if (!record) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Registro de utilização não encontrado
        </p>

        <button
          onClick={() =>
            navigate(
              '/maquinas/utilizacoes'
            )
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para utilizações
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<
      MachineUsageRecord,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const updated =
        updateMachineUsageRecord(
          record.id,
          data
        )

      if (!updated) {
        throw new Error(
          'Registro de utilização não encontrado.'
        )
      }

      navigate(
        `/maquinas/utilizacoes/${updated.id}`,
        {
          state: {
            successMessage:
              'Registro de utilização atualizado com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar utilização.'
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
            Editar Utilização Operacional
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações deste registro de utilização da máquina."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados da utilização.
        </p>
      </div>

      <MachineUsageForm
        record={record}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(
            `/maquinas/utilizacoes/${record.id}`
          )
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}