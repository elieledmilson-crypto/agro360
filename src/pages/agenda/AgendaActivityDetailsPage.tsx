import {
  useState,
  useEffect,
  useMemo,
} from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
} from 'react-router-dom'
import {
  getAgendaActivityById,
  deleteAgendaActivity,
  getAgendaActivityDisplayStatus,
  getAgendaEmployeeOptions,
} from '../../services/agendaService'
import { AgendaActivity, AgendaDisplayStatus } from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import DeleteAgendaActivityDialog from '../../components/agenda/DeleteAgendaActivityDialog'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function AgendaActivityDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [feedback, setFeedback] = useState<FeedbackType>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const activity: AgendaActivity | undefined = useMemo(
    () => (id ? getAgendaActivityById(id) : undefined),
    [id],
  )

  const employeeOptions = useMemo(() => getAgendaEmployeeOptions(), [])

  useEffect(() => {
    const state = location.state as { successMessage?: string } | null
    if (!state?.successMessage) return

    setFeedback({
      type: 'success',
      message: state.successMessage,
    })

    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

  if (!activity) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Atividade não encontrada
        </p>

        <Button
          className="mt-4"
          onClick={() => navigate('/agenda')}
        >
          Voltar para Agenda
        </Button>
      </div>
    )
  }

  const handleDelete = () => {
    try {
      const deleted = deleteAgendaActivity(activity.id)

      setDeleteOpen(false)

      if (deleted) {
        navigate('/agenda', {
          state: {
            successMessage: 'Atividade excluída com sucesso.',
          },
        })
      } else {
        setFeedback({
          type: 'error',
          message: 'Atividade não encontrada.',
        })
      }
    } catch (error) {
      setDeleteOpen(false)
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao excluir atividade.',
      })
    }
  }

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')

  const responsibleName = activity.responsibleEmployeeId
    ? employeeOptions.find(e => e.id === activity.responsibleEmployeeId)
        ?.name ?? 'Não encontrado'
    : 'Não informado'

  const displayStatus: AgendaDisplayStatus =
    getAgendaActivityDisplayStatus(activity)

  const renderStatusBadge = (status: AgendaDisplayStatus) => {
    if (status === 'Atrasada') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
          Atrasada
        </span>
      )
    }

    if (status === 'Pendente') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Pendente
        </span>
      )
    }

    if (status === 'Concluída') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
          Concluída
        </span>
      )
    }

    return (
      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
        Cancelada
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <PageFeedback type={feedback.type} message={feedback.message} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/agenda')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Agenda
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{activity.title}</h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados desta atividade da Agenda."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {activity.type}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/agenda/${activity.id}/editar`)}
          >
            <Pencil className="w-4 h-4 mr-2 inline" />
            Editar
          </Button>

          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2 inline" />
            Excluir
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Título
            </p>
            <p className="font-medium">{activity.title}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tipo
            </p>
            <p className="font-medium">{activity.type}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data
            </p>
            <p className="font-medium">{formatDate(activity.date)}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hora
            </p>
            <p className="font-medium">
              {activity.time ?? 'Não informada'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Prioridade
            </p>
            <p className="font-medium">{activity.priority}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Situação
            </p>
            {renderStatusBadge(displayStatus)}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Responsável
            </p>
            <p className="font-medium">{responsibleName}</p>
          </div>
        </div>

        {activity.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Observações
            </p>
            <p className="mt-1">{activity.notes}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de criação
            </p>
            <p className="font-medium">
              {new Date(activity.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>
            <p className="font-medium">
              {new Date(activity.updatedAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>

      <DeleteAgendaActivityDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        activityTitle={activity.title}
      />
    </div>
  )
}