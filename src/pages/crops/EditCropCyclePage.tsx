import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CropCycleForm from '../../components/crops/CropCycleForm'
import {
  getCropCycleById,
  updateCropCycle,
} from '../../services/cropService'
import { CropCycle } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditCropCyclePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] =
    useState(false)
  const [submitError, setSubmitError] =
    useState('')

  const cycle = id
    ? getCropCycleById(id)
    : undefined

  if (!cycle) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Cultivo não encontrado
        </p>

        <button
          onClick={() =>
            navigate('/cultivos')
          }
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para cultivos
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<
      CropCycle,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      updateCropCycle(
        cycle.id,
        data
      )

      navigate(
        `/cultivos/${cycle.id}`,
        {
          state: {
            successMessage:
              'Cultivo atualizado com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar cultivo.'
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
            Editar cultivo
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações deste cultivo. As alterações serão salvas no cadastro existente."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados do cultivo.
        </p>
      </div>

      <CropCycleForm
        cropCycle={cycle}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(
            `/cultivos/${cycle.id}`
          )
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}