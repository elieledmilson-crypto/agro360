import {
  useState,
  useEffect,
  useMemo,
} from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom'
import {
  getMachineUsageRecordById,
  deleteMachineUsageRecord,
} from '../../services/machineUsageService'
import { getMachineById } from '../../services/machineService'
import { getLandAreaById } from '../../services/landService'
import { getCropCycleById } from '../../services/cropService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  Pencil,
  Trash2,
  ArrowLeft,
} from 'lucide-react'

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function MachineUsageDetailsPage() {
  const { id } =
    useParams<{ id: string }>()

  const navigate = useNavigate()
  const location = useLocation()

  const [feedback, setFeedback] =
    useState<FeedbackType>(null)

  const record = useMemo(
    () =>
      id
        ? getMachineUsageRecordById(
            id
          )
        : undefined,
    [id]
  )

  const machine = useMemo(
    () =>
      record
        ? getMachineById(
            record.machineId
          )
        : undefined,
    [record]
  )

  const landArea = useMemo(
    () =>
      record
        ? getLandAreaById(
            record.landAreaId
          )
        : undefined,
    [record]
  )

  const cropCycle = useMemo(
    () =>
      record?.cropCycleId
        ? getCropCycleById(
            record.cropCycleId
          )
        : undefined,
    [record]
  )

  useEffect(() => {
    const state =
      location.state as {
        successMessage?: string
      } | null

    if (!state?.successMessage) {
      return
    }

    setFeedback({
      type: 'success',
      message:
        state.successMessage,
    })

    navigate(location.pathname, {
      replace: true,
      state: null,
    })
  }, [
    location.pathname,
    location.state,
    navigate,
  ])

  useEffect(() => {
    if (!feedback) return

    const timer = setTimeout(
      () => setFeedback(null),
      5000
    )

    return () =>
      clearTimeout(timer)
  }, [feedback])

  if (!record) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Registro de utilização não encontrado
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate(
              '/maquinas/utilizacoes'
            )
          }
        >
          Voltar para utilizações
        </Button>
      </div>
    )
  }

  const handleDelete = () => {
    if (
      window.confirm(
        'Excluir este registro de utilização?'
      )
    ) {
      try {
        const deleted =
          deleteMachineUsageRecord(
            record.id
          )

        if (deleted) {
          navigate(
            '/maquinas/utilizacoes',
            {
              state: {
                successMessage:
                  'Registro de utilização excluído com sucesso.',
              },
            }
          )
        } else {
          setFeedback({
            type: 'error',
            message:
              'Registro de utilização não encontrado.',
          })
        }
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir registro de utilização.',
        })
      }
    }
  }

  const formatDate = (
    date: string
  ) =>
    new Date(
      date + 'T00:00:00'
    ).toLocaleDateString('pt-BR')

  const formatHours = (
    value: number
  ) =>
    `${value.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )} h`

  return (
    <div className="space-y-6">
      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={
            feedback.message
          }
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate(
                '/maquinas/utilizacoes'
              )
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para utilizações
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Utilização Operacional
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados desta utilização, incluindo máquina, talhão, cultivo quando vinculado, operação e horas trabalhadas."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {formatDate(
              record.operationDate
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/maquinas/utilizacoes/${record.id}/editar`
              )
            }
          >
            <Pencil className="w-4 h-4 mr-2 inline" />
            Editar
          </Button>

          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
            onClick={handleDelete}
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
              Máquina/Equipamento
            </p>

            {machine ? (
              <Link
                to={`/maquinas/${machine.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {machine.code} —{' '}
                {machine.name}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Máquina ou equipamento não encontrado
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Talhão
            </p>

            {landArea ? (
              <Link
                to={`/terras/${landArea.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {landArea.code} —{' '}
                {landArea.name}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Talhão não encontrado
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cultivo/Safra
            </p>

            {!record.cropCycleId ? (
              <p className="font-medium">
                Não informado
              </p>
            ) : cropCycle ? (
              <Link
                to={`/cultivos/${cropCycle.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {cropCycle.crop}{' '}
                {cropCycle.cultivar
                  ? `— ${cropCycle.cultivar}`
                  : ''}{' '}
                — {cropCycle.season}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Cultivo não encontrado
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data da utilização
            </p>

            <p className="font-medium">
              {formatDate(
                record.operationDate
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tipo de operação
            </p>

            <p className="font-medium">
              {
                record.operationType
              }
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Horas trabalhadas
            </p>

            <p className="font-medium">
              {formatHours(
                record.workedHours
              )}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Observações
          </p>

          <p className="font-medium">
            {record.notes ??
              'Não informado'}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de cadastro
            </p>

            <p className="font-medium">
              {new Date(
                record.createdAt
              ).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>

            <p className="font-medium">
              {new Date(
                record.updatedAt
              ).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}