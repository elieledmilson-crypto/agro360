import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PaddockOccupationForm from '../../components/land/PaddockOccupationForm'
import { startPaddockOccupation } from '../../services/paddockOccupationService'
import HelpTip from '../../components/ui/HelpTip'

export default function NewPaddockOccupationPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (data: {
    landAreaId: string
    lotId: string
    entryDate: string
    notes?: string
  }) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      startPaddockOccupation(data)

      navigate('/terras/manejo', {
        state: {
          successMessage:
            'Ocupação iniciada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao iniciar ocupação.'
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
            Alocar lote em piquete
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Use esta página para registrar a entrada de um lote de animais em um piquete."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Registre a entrada de um lote em um piquete
        </p>
      </div>

      <PaddockOccupationForm
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate('/terras/manejo')
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}