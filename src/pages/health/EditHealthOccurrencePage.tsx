import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import HealthOccurrenceForm from '../../components/health/HealthOccurrenceForm'
import { getHealthOccurrenceById, updateHealthOccurrence } from '../../services/healthService'
import { HealthOccurrence } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditHealthOccurrencePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [occurrence, setOccurrence] = useState<HealthOccurrence | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (id) {
      const found = getHealthOccurrenceById(id)
      setOccurrence(found)
    }
  }, [id])

  if (!occurrence) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Ocorrência não encontrada</p>
        <button
          onClick={() => navigate('/saude-animal/ocorrencias')}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para ocorrências
        </button>
      </div>
    )
  }

  const handleSubmit = async (data: Omit<HealthOccurrence, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      updateHealthOccurrence(occurrence.id, data)
      navigate(`/animais/${data.animalId}`, {
        state: { successMessage: 'Ocorrência atualizada com sucesso.' },
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Erro ao atualizar ocorrência.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Editar Ocorrência</h1>
          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações desta ocorrência. As alterações serão salvas no registro existente."
          />
        </div>
        <p className="text-gray-600 dark:text-gray-400">Atualize os dados da ocorrência</p>
      </div>
      <HealthOccurrenceForm
        occurrence={occurrence}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}