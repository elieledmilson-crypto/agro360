import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AgendaActivityForm, {
  AgendaActivityPayload,
} from '../../components/agenda/AgendaActivityForm'
import { createAgendaActivity } from '../../services/agendaService'
import HelpTip from '../../components/ui/HelpTip'

export default function NewAgendaActivityPage() {
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = (data: AgendaActivityPayload) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      createAgendaActivity(data)

      navigate('/agenda', {
        state: {
          successMessage: 'Atividade cadastrada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar atividade.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/agenda')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
        >
          ← Voltar para Agenda
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Nova atividade</h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Cadastre um lembrete ou compromisso na Agenda da propriedade."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados da nova atividade.
        </p>
      </div>

      <AgendaActivityForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/agenda')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}