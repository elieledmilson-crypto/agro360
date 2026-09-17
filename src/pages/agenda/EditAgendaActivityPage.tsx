import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AgendaActivityForm, {
  AgendaActivityPayload,
} from '../../components/agenda/AgendaActivityForm'
import {
  getAgendaActivityById,
  updateAgendaActivity,
} from '../../services/agendaService'
import HelpTip from '../../components/ui/HelpTip'

export default function EditAgendaActivityPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const activity = useMemo(
    () => (id ? getAgendaActivityById(id) : undefined),
    [id],
  )

  if (!activity) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Atividade não encontrada
        </p>

        <button
          onClick={() => navigate('/agenda')}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para Agenda
        </button>
      </div>
    )
  }

  const handleSubmit = (data: AgendaActivityPayload) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const updated = updateAgendaActivity(activity.id, data)

      if (!updated) {
        throw new Error('Atividade não encontrada.')
      }

      navigate(`/agenda/${updated.id}`, {
        state: {
          successMessage: 'Atividade atualizada com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar atividade.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(`/agenda/${activity.id}`)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
        >
          ← Voltar para a atividade
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Editar atividade</h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Aqui você pode atualizar as informações desta atividade da Agenda."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados da atividade.
        </p>
      </div>

      <AgendaActivityForm
        activity={activity}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/agenda/${activity.id}`)}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}