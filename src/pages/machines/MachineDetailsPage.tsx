import { useState, useEffect, useMemo } from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom'
import {
  getMachineById,
  deleteMachine,
} from '../../services/machineService'
import {
  getMachineMaintenanceRecordsByMachineId,
} from '../../services/machineMaintenanceService'
import {
  getMachineUsageRecordsByMachineId,
} from '../../services/machineUsageService'
import { getLandAreaById } from '../../services/landService'
import { getCropCycleById } from '../../services/cropService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import MachineStatusBadge from '../../components/machines/MachineStatusBadge'
import {
  Pencil,
  Trash2,
  ArrowLeft,
  Wrench,
  Plus,
  ClipboardList,
} from 'lucide-react'

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function MachineDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [feedback, setFeedback] =
    useState<FeedbackType>(null)

  const machine = useMemo(
    () =>
      id
        ? getMachineById(id)
        : undefined,
    [id]
  )

  const maintenanceRecords =
    useMemo(
      () =>
        machine
          ? getMachineMaintenanceRecordsByMachineId(
              machine.id
            )
          : [],
      [machine]
    )

  const usageRecords = useMemo(
    () =>
      machine
        ? getMachineUsageRecordsByMachineId(
            machine.id
          )
        : [],
    [machine]
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

  if (!machine) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Máquina ou equipamento não encontrado
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate('/maquinas')
          }
        >
          Voltar para máquinas
        </Button>
      </div>
    )
  }

  const handleDelete = () => {
    if (
      window.confirm(
        `Excluir a máquina/equipamento ${machine.name}?`
      )
    ) {
      try {
        const deleted =
          deleteMachine(
            machine.id
          )

        if (deleted) {
          navigate('/maquinas', {
            state: {
              successMessage:
                'Máquina ou equipamento excluído com sucesso.',
            },
          })
        } else {
          setFeedback({
            type: 'error',
            message:
              'Máquina ou equipamento não encontrado.',
          })
        }
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir máquina ou equipamento.',
        })
      }
    }
  }

  const formatHourMeter = (
    value?: number
  ) => {
    if (value === undefined) {
      return 'Não informado'
    }

    return `${value.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }
    )} h`
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

  const maintenanceCount =
    maintenanceRecords.length

  const maintenanceCountLabel =
    maintenanceCount === 1
      ? '1 registro'
      : `${maintenanceCount} registros`

  const usageCount =
    usageRecords.length

  const usageCountLabel =
    usageCount === 1
      ? '1 registro'
      : `${usageCount} registros`

  const getUsageLandAreaLabel = (
    record: typeof usageRecords[number]
  ) => {
    const area =
      getLandAreaById(
        record.landAreaId
      )

    return area
      ? `${area.code} — ${area.name}`
      : 'Talhão não encontrado'
  }

  const getUsageCropLabel = (
    record: typeof usageRecords[number]
  ) => {
    if (!record.cropCycleId) {
      return 'Sem cultivo'
    }

    const cycle =
      getCropCycleById(
        record.cropCycleId
      )

    return cycle
      ? `${cycle.crop} — ${cycle.season}`
      : 'Cultivo não encontrado'
  }

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
              navigate('/maquinas')
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para máquinas
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              {machine.code}
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados da máquina e seus históricos de manutenção e utilização."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {machine.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/maquinas/manutencoes/nova?machineId=${machine.id}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar manutenção
          </Link>

          <Link
            to={`/maquinas/utilizacoes/nova?machineId=${machine.id}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Registrar utilização
          </Link>

          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/maquinas/${machine.id}/editar`
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
              Código
            </p>

            <p className="font-medium">
              {machine.code}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nome
            </p>

            <p className="font-medium">
              {machine.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Categoria
            </p>

            <p className="font-medium">
              {machine.category}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Marca
            </p>

            <p className="font-medium">
              {machine.brand ??
                'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Modelo
            </p>

            <p className="font-medium">
              {machine.model ??
                'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ano
            </p>

            <p className="font-medium">
              {machine.year ??
                'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Identificação
            </p>

            <p className="font-medium">
              {machine.identification ??
                'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Horímetro atual
            </p>

            <p className="font-medium">
              {formatHourMeter(
                machine.hourMeter
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Situação
            </p>

            <MachineStatusBadge
              status={machine.status}
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Observações
          </p>

          <p className="font-medium">
            {machine.notes ??
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
                machine.createdAt
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
                machine.updatedAt
              ).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">
                Histórico de manutenção
              </h2>

              <HelpTip
                title="O que é este histórico?"
                description="Aqui ficam registrados os serviços de manutenção realizados nesta máquina ao longo do tempo."
              />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {maintenanceCountLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/maquinas/manutencoes/nova?machineId=${machine.id}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Registrar manutenção
            </Link>

            {maintenanceRecords.length >
              0 && (
              <Link
                to={`/maquinas/manutencoes?machineId=${machine.id}`}
                className="inline-flex items-center text-sm text-green-600 hover:underline"
              >
                <Wrench className="w-4 h-4 mr-1" />
                Ver todo histórico
              </Link>
            )}
          </div>
        </div>

        {maintenanceRecords.length ===
        0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma manutenção
            registrada para esta
            máquina ou equipamento.
          </p>
        ) : (
          <div className="space-y-3">
            {maintenanceRecords
              .slice(0, 5)
              .map(record => (
                <button
                  key={record.id}
                  onClick={() =>
                    navigate(
                      `/maquinas/manutencoes/${record.id}`
                    )
                  }
                  className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <p className="font-medium">
                    {formatDate(
                      record.maintenanceDate
                    )}{' '}
                    · {record.type}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {
                      record.servicePerformed
                    }
                  </p>

                  {record.hourMeter !==
                    undefined && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Horímetro:{' '}
                      {formatHourMeter(
                        record.hourMeter
                      )}
                    </p>
                  )}
                </button>
              ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">
                Histórico de utilização
              </h2>

              <HelpTip
                title="O que é este histórico?"
                description="Aqui você acompanha onde esta máquina foi utilizada, quais operações realizou e quantas horas trabalhou."
              />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {usageCountLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/maquinas/utilizacoes/nova?machineId=${machine.id}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Registrar utilização
            </Link>

            {usageRecords.length > 0 && (
              <Link
                to={`/maquinas/utilizacoes?machineId=${machine.id}`}
                className="inline-flex items-center text-sm text-green-600 hover:underline"
              >
                <ClipboardList className="w-4 h-4 mr-1" />
                Ver todo histórico
              </Link>
            )}
          </div>
        </div>

        {usageRecords.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma utilização
            registrada para esta
            máquina ou equipamento.
          </p>
        ) : (
          <div className="space-y-3">
            {usageRecords
              .slice(0, 5)
              .map(record => (
                <button
                  key={record.id}
                  onClick={() =>
                    navigate(
                      `/maquinas/utilizacoes/${record.id}`
                    )
                  }
                  className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <p className="font-medium">
                    {formatDate(
                      record.operationDate
                    )}{' '}
                    ·{' '}
                    {
                      record.operationType
                    }
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getUsageLandAreaLabel(
                      record
                    )}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getUsageCropLabel(
                      record
                    )}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Horas:{' '}
                    {formatHours(
                      record.workedHours
                    )}
                  </p>
                </button>
              ))}
          </div>
        )}
      </Card>
    </div>
  )
}