import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LandUseForm from '../../components/land/LandUseForm'
import { createLandUseRecord } from '../../services/landUseService'
import { LandUseRecord } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewLandUseRecordPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (
    data: Omit<LandUseRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const record = createLandUseRecord(data)

      navigate(`/terras/historico/${record.id}`, {
        state: {
          successMessage:
            'Registro de utilização criado com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao criar registro.'
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
            Novo registro de utilização
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Registre como uma área foi utilizada ou manejada em um determinado período."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Registre como uma área foi utilizada ou manejada.
        </p>
      </div>

      <LandUseForm
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate('/terras/historico')
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}