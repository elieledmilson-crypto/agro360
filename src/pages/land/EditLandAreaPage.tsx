import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LandAreaForm from '../../components/land/LandAreaForm'
import {
  getLandAreaById,
  updateLandArea,
} from '../../services/landService'
import { LandArea } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditLandAreaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const area = id
    ? getLandAreaById(id)
    : undefined

  if (!area) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Área não encontrada
        </p>

        <button
          onClick={() => navigate('/terras')}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para terras
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<
      LandArea,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      updateLandArea(area.id, data)

      navigate(`/terras/${area.id}`, {
        state: {
          successMessage:
            'Área atualizada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar área.'
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
            Editar área
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações desta área. As alterações serão salvas no cadastro existente."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados de {area.code}
        </p>
      </div>

      <LandAreaForm
        area={area}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(`/terras/${area.id}`)
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}