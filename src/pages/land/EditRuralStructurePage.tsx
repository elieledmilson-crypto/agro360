import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import RuralStructureForm from '../../components/land/RuralStructureForm'
import {
  getRuralStructureById,
  updateRuralStructure,
} from '../../services/ruralStructureService'
import { RuralStructure } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditRuralStructurePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const structure = id
    ? getRuralStructureById(id)
    : undefined

  if (!structure) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Estrutura não encontrada
        </p>

        <button
          onClick={() => navigate('/terras/estruturas')}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para estruturas
        </button>
      </div>
    )
  }

  const handleSubmit = (
    data: Omit<RuralStructure, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      updateRuralStructure(structure.id, data)

      navigate(`/terras/estruturas/${structure.id}`, {
        state: {
          successMessage: 'Estrutura atualizada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar estrutura.'
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
            Editar estrutura
          </h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações desta estrutura. As alterações serão salvas no cadastro existente."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados de {structure.code}
        </p>
      </div>

      <RuralStructureForm
        structure={structure}
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(`/terras/estruturas/${structure.id}`)
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}