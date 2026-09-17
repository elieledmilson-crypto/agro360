import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LandAreaForm from '../../components/land/LandAreaForm'
import { createLandArea } from '../../services/landService'
import { LandArea } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewLandAreaPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (
    data: Omit<LandArea, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const area = createLandArea(data)

      navigate(`/terras/${area.id}`, {
        state: {
          successMessage: 'Área cadastrada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar área.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Nova área</h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Preencha as informações abaixo para cadastrar uma nova área da propriedade no Agro360."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Cadastre uma nova área da propriedade
        </p>
      </div>

      <LandAreaForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/terras')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}