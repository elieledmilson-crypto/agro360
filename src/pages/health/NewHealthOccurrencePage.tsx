import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import HealthOccurrenceForm from '../../components/health/HealthOccurrenceForm'
import { createHealthOccurrence } from '../../services/healthService'
import { HealthOccurrence } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewHealthOccurrencePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const animalId = searchParams.get('animalId') ?? undefined
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async (data: Omit<HealthOccurrence, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      createHealthOccurrence(data)
      navigate(`/animais/${data.animalId}`, {
        state: { successMessage: 'Ocorrência registrada com sucesso.' },
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Erro ao registrar ocorrência.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Registrar Ocorrência</h1>
          <HelpTip
            title="O que devo fazer aqui?"
            description="Registre um acontecimento relacionado à saúde de um animal para manter seu histórico atualizado."
          />
        </div>
        <p className="text-gray-600 dark:text-gray-400">Registre um evento clínico ou observação</p>
      </div>
      <HealthOccurrenceForm
        preselectedAnimalId={animalId}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}