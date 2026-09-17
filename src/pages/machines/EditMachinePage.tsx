import { useState, useMemo } from 'react'
import {
  useParams,
  useNavigate,
} from 'react-router-dom'
import MachineForm from '../../components/machines/MachineForm'
import {
  getMachineById,
  updateMachine,
} from '../../services/machineService'
import { Machine } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditMachinePage() {
  const { id } =
    useParams<{ id: string }>()

  const navigate = useNavigate()

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const machine = useMemo(
    () =>
      id
        ? getMachineById(id)
        : undefined,
    [id]
  )

  if (!machine) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Máquina ou equipamento não encontrado
        </p>

        <button
          onClick={() =>
            navigate('/maquinas')
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para máquinas
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<
      Machine,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const updated =
        updateMachine(
          machine.id,
          data
        )

      if (!updated) {
        throw new Error(
          'Máquina ou equipamento não encontrado.'
        )
      }

      navigate(
        `/maquinas/${updated.id}`,
        {
          state: {
            successMessage:
              'Máquina ou equipamento atualizado com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar máquina.'
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
            Editar Máquina ou Equipamento
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações desta máquina ou equipamento. As alterações serão salvas no cadastro existente."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados da máquina.
        </p>
      </div>

      <MachineForm
        machine={machine}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(
            `/maquinas/${machine.id}`
          )
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}