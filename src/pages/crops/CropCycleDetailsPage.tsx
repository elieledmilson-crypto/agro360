import { useState, useEffect } from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom'
import { getCropCycleById } from '../../services/cropService'
import { getLandAreaById } from '../../services/landService'
import {
  getCropManagementsByCropCycleId,
} from '../../services/cropManagementService'
import {
  getHarvestRecordByCropCycleId,
  getHarvestProductivityKgPerHectare,
  getHarvestProductivityInOriginalUnitPerHectare,
} from '../../services/harvestService'
import {
  getMachineUsageRecordsByCropCycleId,
} from '../../services/machineUsageService'
import { getMachineById } from '../../services/machineService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import CropCycleStatusBadge from '../../components/crops/CropCycleStatusBadge'
import CropManagementTypeBadge from '../../components/crops/CropManagementTypeBadge'
import {
  Pencil,
  ArrowLeft,
  Plus,
  ClipboardList,
  Gavel,
  BarChart3,
  Tractor,
} from 'lucide-react'

export default function CropCycleDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null)

  const cycle = id
    ? getCropCycleById(id)
    : undefined

  const area = cycle
    ? getLandAreaById(cycle.landAreaId)
    : undefined

  const managements = cycle
    ? getCropManagementsByCropCycleId(
        cycle.id
      )
    : []

  const harvestRecord = cycle
    ? getHarvestRecordByCropCycleId(
        cycle.id
      )
    : undefined

  const machineUsages = cycle
    ? getMachineUsageRecordsByCropCycleId(
        cycle.id
      )
    : []

  useEffect(() => {
    const state = location.state as {
      successMessage?: string
    } | null

    if (!state?.successMessage) return

    setSuccessMessage(
      state.successMessage
    )

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
    if (!successMessage) return

    const timer = setTimeout(
      () => setSuccessMessage(null),
      5000
    )

    return () =>
      clearTimeout(timer)
  }, [successMessage])

  if (!cycle) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Cultivo não encontrado
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate('/cultivos')
          }
        >
          Voltar para cultivos
        </Button>
      </div>
    )
  }

  const formatDate = (
    date?: string
  ) => {
    if (!date) return 'Não informada'

    return new Date(
      date + 'T00:00:00'
    ).toLocaleDateString('pt-BR')
  }

  const formatNumber = (
    value: number
  ) =>
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

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

  const getMachineLabel = (
    machineId: string
  ) => {
    const machine =
      getMachineById(machineId)

    return machine
      ? `${machine.code} — ${machine.name}`
      : 'Máquina ou equipamento não encontrado'
  }

  const usageCount =
    machineUsages.length

  const usageCountLabel =
    usageCount === 1
      ? '1 registro'
      : `${usageCount} registros`

  return (
    <div className="space-y-6">
      {successMessage && (
        <PageFeedback
          type="success"
          message={successMessage}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate('/cultivos')
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para cultivos
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              {cycle.crop}
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados deste cultivo e os históricos vinculados a ele, como manejos, colheita e utilização de máquinas."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {cycle.season}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/cultivos/ciclo-agricola/${cycle.id}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Visão consolidada
          </Link>

          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/cultivos/${cycle.id}/editar`
              )
            }
          >
            <Pencil className="w-4 h-4 mr-2 inline" />
            Editar
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Talhão
            </p>

            {area ? (
              <Link
                to={`/terras/${area.id}`}
                className="font-medium text-green-600 hover:underline"
              >
                {area.code} —{' '}
                {area.name}
              </Link>
            ) : (
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Área não encontrada
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cultura
            </p>
            <p className="font-medium">
              {cycle.crop}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cultivar
            </p>
            <p className="font-medium">
              {cycle.cultivar ??
                'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Safra
            </p>
            <p className="font-medium">
              {cycle.season}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de plantio
            </p>
            <p className="font-medium">
              {formatDate(
                cycle.plantingDate
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Previsão de colheita
            </p>
            <p className="font-medium">
              {formatDate(
                cycle.expectedHarvestDate
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Situação
            </p>

            <CropCycleStatusBadge
              status={cycle.status}
            />
          </div>
        </div>

        {cycle.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Observações
            </p>

            <p className="mt-1">
              {cycle.notes}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de cadastro
            </p>

            <p className="font-medium">
              {new Date(
                cycle.createdAt
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
                cycle.updatedAt
              ).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">
              Manejos agrícolas
            </h2>

            <HelpTip
              title="O que são os manejos agrícolas?"
              description="São as operações realizadas durante o cultivo, como adubação, irrigação, pulverização e controle de pragas."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/cultivos/manejos/novo?cropCycleId=${cycle.id}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo manejo
            </Link>

            <Link
              to="/cultivos/manejos"
              className="inline-flex items-center text-sm text-green-600 hover:underline"
            >
              <ClipboardList className="w-4 h-4 mr-1" />
              Ver todos os manejos
            </Link>
          </div>
        </div>

        {managements.length ===
        0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhum manejo registrado
            neste cultivo.
          </p>
        ) : (
          <div className="space-y-3">
            {managements.map(
              management => (
                <button
                  key={management.id}
                  onClick={() =>
                    navigate(
                      `/cultivos/manejos/${management.id}`
                    )
                  }
                  className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <p className="font-medium">
                    {new Date(
                      management.date +
                        'T00:00:00'
                    ).toLocaleDateString(
                      'pt-BR'
                    )}
                    {` · ${management.type}`}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {
                      management.description
                    }
                  </p>

                  {management.productOrMaterial && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Produto:{' '}
                      {
                        management.productOrMaterial
                      }
                    </p>
                  )}

                  {management.doseOrQuantity && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dose:{' '}
                      {
                        management.doseOrQuantity
                      }
                    </p>
                  )}

                  {management.responsible && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Responsável:{' '}
                      {
                        management.responsible
                      }
                    </p>
                  )}

                  <div className="mt-2">
                    <CropManagementTypeBadge
                      type={
                        management.type
                      }
                    />
                  </div>
                </button>
              )
            )}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">
              Colheita e produtividade
            </h2>

            <HelpTip
              title="O que é produtividade?"
              description="É a quantidade produzida em relação à área colhida. Ela ajuda a comparar o resultado de diferentes cultivos e talhões."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {!harvestRecord && (
              <Link
                to={`/cultivos/colheitas/nova?cropCycleId=${cycle.id}`}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                <Gavel className="w-4 h-4 mr-2" />
                Registrar colheita
              </Link>
            )}

            <Link
              to="/cultivos/colheitas"
              className="inline-flex items-center text-sm text-green-600 hover:underline"
            >
              <Gavel className="w-4 h-4 mr-1" />
              Ver todas as colheitas
            </Link>
          </div>
        </div>

        {!harvestRecord ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma colheita registrada
            neste cultivo.
          </p>
        ) : (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="font-medium">
              Data:{' '}
              {formatDate(
                harvestRecord.harvestDate
              )}
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Área colhida:{' '}
              {formatNumber(
                harvestRecord.harvestedAreaHectares
              )}{' '}
              ha
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Produção:{' '}
              {formatNumber(
                harvestRecord.productionQuantity
              )}{' '}
              {harvestRecord.productionUnit}
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Produtividade:{' '}
              {formatNumber(
                getHarvestProductivityInOriginalUnitPerHectare(
                  harvestRecord
                )
              )}{' '}
              {
                harvestRecord.productionUnit
              }
              /ha
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Produtividade normalizada:{' '}
              {formatNumber(
                getHarvestProductivityKgPerHectare(
                  harvestRecord
                )
              )}{' '}
              kg/ha
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/cultivos/colheitas/${harvestRecord.id}`
                  )
                }
                className="text-xs"
              >
                Ver detalhes da
                colheita
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/cultivos/colheitas/${harvestRecord.id}/editar`
                  )
                }
                className="text-xs"
              >
                Editar colheita
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">
                Utilização de máquinas
              </h2>

              <HelpTip
                title="O que é esta seção?"
                description="Aqui você acompanha quais máquinas foram utilizadas neste cultivo, qual operação realizaram e por quantas horas trabalharam."
              />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {usageCountLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/maquinas/utilizacoes/nova?cropCycleId=${cycle.id}`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              <Tractor className="w-4 h-4 mr-2" />
              Registrar utilização
            </Link>

            {machineUsages.length >
              0 && (
              <Link
                to={`/maquinas/utilizacoes?cropCycleId=${cycle.id}`}
                className="inline-flex items-center text-sm text-green-600 hover:underline"
              >
                <Tractor className="w-4 h-4 mr-1" />
                Ver todo histórico
              </Link>
            )}
          </div>
        </div>

        {machineUsages.length ===
        0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma utilização de
            máquina registrada para este
            cultivo.
          </p>
        ) : (
          <div className="space-y-3">
            {machineUsages
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
                    {getMachineLabel(
                      record.machineId
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