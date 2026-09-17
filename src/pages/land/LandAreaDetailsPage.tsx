import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { getLandAreaById, deleteLandArea } from '../../services/landService'
import {
  getActiveOccupationByLandAreaId,
  getOccupationHistoryByLandAreaId,
  getAnimalsInPaddockOccupation,
  getCurrentOccupationDays,
  getDaysBetween,
} from '../../services/paddockOccupationService'
import { getLotById } from '../../services/lotService'
import { getRuralStructuresByLandAreaId } from '../../services/ruralStructureService'
import { getLandUseRecordsByLandAreaId } from '../../services/landUseService'
import {
  getCropCyclesByLandAreaId,
  getCropCycleById,
} from '../../services/cropService'
import { getSoilAnalysesByLandAreaId } from '../../services/soilAnalysisService'
import { getCropManagementsByLandAreaId } from '../../services/cropManagementService'
import { getHarvestRecordsByLandAreaId } from '../../services/harvestService'
import { getMachineUsageRecordsByLandAreaId } from '../../services/machineUsageService'
import { getMachineById } from '../../services/machineService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import LandAreaStatusBadge from '../../components/land/LandAreaStatusBadge'
import DeleteLandAreaDialog from '../../components/land/DeleteLandAreaDialog'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import CropCycleStatusBadge from '../../components/crops/CropCycleStatusBadge'
import CropManagementTypeBadge from '../../components/crops/CropManagementTypeBadge'
import {
  Pencil,
  Trash2,
  ArrowLeft,
  Grid3X3,
  Building2,
  History,
  Sprout,
  FlaskConical,
  ClipboardList,
  Gavel,
  Tractor,
} from 'lucide-react'

export default function LandAreaDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const area = id ? getLandAreaById(id) : undefined

  const activeOccupation =
    area?.type === 'Piquete' && id
      ? getActiveOccupationByLandAreaId(id)
      : undefined

  const occupationHistory =
    area?.type === 'Piquete' && id
      ? getOccupationHistoryByLandAreaId(id)
      : []

  const linkedStructures = id
    ? getRuralStructuresByLandAreaId(id)
    : []

  const landUseRecords = id
    ? getLandUseRecordsByLandAreaId(id)
    : []

  const cropCycles =
    area?.type === 'Talhão' && id
      ? getCropCyclesByLandAreaId(id)
      : []

  const soilAnalyses =
    area?.type === 'Talhão' && id
      ? getSoilAnalysesByLandAreaId(id)
      : []

  const cropManagements =
    area?.type === 'Talhão' && id
      ? getCropManagementsByLandAreaId(id)
      : []

  const harvestRecords =
    area?.type === 'Talhão' && id
      ? getHarvestRecordsByLandAreaId(id)
      : []

  const machineUsageRecords =
    area?.type === 'Talhão' && id
      ? getMachineUsageRecordsByLandAreaId(id)
      : []

  useEffect(() => {
    const state = location.state as {
      successMessage?: string
    } | null

    if (!state?.successMessage) return

    setSuccessMessage(state.successMessage)
    navigate(location.pathname, {
      replace: true,
      state: null,
    })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!successMessage) return

    const timer = setTimeout(
      () => setSuccessMessage(null),
      5000
    )

    return () => clearTimeout(timer)
  }, [successMessage])

  if (!area) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Área não encontrada
        </p>

        <Button
          className="mt-4"
          onClick={() => navigate('/terras')}
        >
          Voltar para terras
        </Button>
      </div>
    )
  }

  const handleDelete = () => {
    if (!id) return

    try {
      deleteLandArea(id)
      navigate('/terras')
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Erro ao excluir área.'
      )
      setDeleteOpen(false)
    }
  }

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')

  const getMachineLabel = (machineId: string) => {
    const machine = getMachineById(machineId)

    return machine
      ? `${machine.code} — ${machine.name}`
      : 'Máquina ou equipamento não encontrado'
  }

  const getCropLabel = (cropCycleId?: string) => {
    if (!cropCycleId) return 'Sem cultivo'

    const cycle = getCropCycleById(cropCycleId)

    return cycle
      ? `${cycle.crop} — ${cycle.season}`
      : 'Cultivo não encontrado'
  }

  const usageCount = machineUsageRecords.length

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

      {deleteError && (
        <PageFeedback
          type="error"
          message={deleteError}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/terras')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para terras
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              {area.code}
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta as informações desta área e os históricos vinculados a ela, como manejo de piquete, cultivos, análises de solo, estruturas e uso de máquinas."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {area.name}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/terras/${area.id}/editar`)
            }
          >
            <Pencil className="w-4 h-4 mr-2 inline" />
            Editar área
          </Button>

          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2 inline" />
            Excluir área
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Código
            </p>
            <p className="font-medium">{area.code}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nome
            </p>
            <p className="font-medium">{area.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tipo
            </p>
            <p className="font-medium">{area.type}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Área em hectares
            </p>
            <p className="font-medium">
              {area.areaHectares.toLocaleString('pt-BR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}{' '}
              ha
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Finalidade
            </p>
            <p className="font-medium">
              {area.purpose ?? 'Não informada'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Situação
            </p>
            <LandAreaStatusBadge status={area.status} />
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de cadastro
            </p>
            <p className="font-medium">
              {new Date(area.createdAt).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>
            <p className="font-medium">
              {new Date(area.updatedAt).toLocaleDateString(
                'pt-BR'
              )}
            </p>
          </div>
        </div>

        {area.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Descrição
            </p>
            <p className="mt-1">{area.description}</p>
          </div>
        )}
      </Card>

      {area.type === 'Piquete' && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">
                Manejo do piquete
              </h2>

              <HelpTip
                title="Para que serve o manejo do piquete?"
                description="Aqui você acompanha qual lote está no piquete, desde quando e por quantos dias, além das ocupações anteriores."
              />
            </div>

            <Link
              to="/terras/manejo"
              className="inline-flex items-center text-sm text-green-600 hover:underline"
            >
              <Grid3X3 className="w-4 h-4 mr-1" />
              Ver manejo completo
            </Link>
          </div>

          {activeOccupation ? (
            (() => {
              const lot = getLotById(
                activeOccupation.lotId
              )

              const animals =
                getAnimalsInPaddockOccupation(
                  activeOccupation
                )

              const days =
                getCurrentOccupationDays(
                  activeOccupation
                )

              return (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium">
                    {lot?.name ??
                      'Lote não encontrado'}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Data de entrada:{' '}
                    {formatDate(
                      activeOccupation.entryDate
                    )}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dias de ocupação: {days}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Animais no piquete:{' '}
                    {animals.length}
                  </p>

                  {activeOccupation.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Observações:{' '}
                      {activeOccupation.notes}
                    </p>
                  )}
                </div>
              )
            })()
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Piquete sem ocupação atual.
            </p>
          )}

          <h3 className="font-medium mt-6 mb-3">
            Histórico de ocupações
          </h3>

          {occupationHistory.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nenhuma ocupação anterior registrada.
            </p>
          ) : (
            <div className="space-y-3">
              {occupationHistory.map(occ => {
                const lot = getLotById(occ.lotId)

                return (
                  <div
                    key={occ.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <p className="font-medium">
                      {lot?.name ??
                        'Lote não encontrado'}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Entrada:{' '}
                      {formatDate(occ.entryDate)} ·
                      Saída:{' '}
                      {occ.exitDate
                        ? formatDate(occ.exitDate)
                        : '—'}
                    </p>

                    {occ.exitDate && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Duração:{' '}
                        {getDaysBetween(
                          occ.entryDate,
                          occ.exitDate
                        )}{' '}
                        dias
                      </p>
                    )}

                    {occ.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {occ.notes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">
              Histórico de utilização
            </h2>

            <HelpTip
              title="O que é este histórico?"
              description="Aqui você consulta como esta área foi utilizada ao longo do tempo, com tipo de uso, período e observações."
            />
          </div>

          <Link
            to="/terras/historico"
            className="inline-flex items-center text-sm text-green-600 hover:underline"
          >
            <History className="w-4 h-4 mr-1" />
            Ver histórico completo
          </Link>
        </div>

        {landUseRecords.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhum registro de utilização para esta área.
          </p>
        ) : (
          <div className="space-y-3">
            {landUseRecords.map(record => (
              <button
                key={record.id}
                onClick={() =>
                  navigate(
                    `/terras/historico/${record.id}`
                  )
                }
                className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <p className="font-medium">
                  {record.type}
                </p>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(record.startDate)}
                  {record.endDate
                    ? ` → ${formatDate(
                        record.endDate
                      )}`
                    : ' → em andamento'}
                </p>

                {record.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {record.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>

      {area.type === 'Talhão' && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-semibold">
              Cultivos e safras
            </h2>

            <Link
              to="/cultivos"
              className="inline-flex items-center text-sm text-green-600 hover:underline"
            >
              <Sprout className="w-4 h-4 mr-1" />
              Ver todos os cultivos
            </Link>
          </div>

          {cropCycles.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nenhum cultivo registrado neste talhão.
            </p>
          ) : (
            <div className="space-y-3">
              {cropCycles.map(cycle => (
                <button
                  key={cycle.id}
                  onClick={() =>
                    navigate(`/cultivos/${cycle.id}`)
                  }
                  className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <p className="font-medium">
                    {cycle.crop}{' '}
                    {cycle.cultivar
                      ? `— ${cycle.cultivar}`
                      : ''}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Safra: {cycle.season}
                  </p>

                  {cycle.plantingDate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Plantio:{' '}
                      {formatDate(
                        cycle.plantingDate
                      )}
                    </p>
                  )}

                  {cycle.expectedHarvestDate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Colheita prevista:{' '}
                      {formatDate(
                        cycle.expectedHarvestDate
                      )}
                    </p>
                  )}

                  <CropCycleStatusBadge
                    status={cycle.status}
                  />
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {area.type === 'Talhão' && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-semibold">
              Análises de solo
            </h2>

            <Link
              to="/cultivos/solo"
              className="inline-flex items-center text-sm text-green-600 hover:underline"
            >
              <FlaskConical className="w-4 h-4 mr-1" />
              Ver todas as análises
            </Link>
          </div>

          {soilAnalyses.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nenhuma análise de solo registrada neste
              talhão.
            </p>
          ) : (
            <div className="space-y-3">
              {soilAnalyses.map(analysis => (
                <button
                  key={analysis.id}
                  onClick={() =>
                    navigate(
                      `/cultivos/solo/${analysis.id}`
                    )
                  }
                  className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <p className="font-medium">
                    {formatDate(
                      analysis.sampleDate
                    )}
                  </p>

                  {analysis.laboratory && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Laboratório:{' '}
                      {analysis.laboratory}
                    </p>
                  )}

                  {analysis.sampleCode && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Código:{' '}
                      {analysis.sampleCode}
                    </p>
                  )}

                  {analysis.ph !== undefined && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      pH: {analysis.ph}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {area.type === 'Talhão' && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-semibold">
              Manejos agrícolas
            </h2>

            <Link
              to="/cultivos/manejos"
              className="inline-flex items-center text-sm text-green-600 hover:underline"
            >
              <ClipboardList className="w-4 h-4 mr-1" />
              Ver todos os manejos
            </Link>
          </div>

          {cropManagements.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nenhum manejo agrícola registrado neste
              talhão.
            </p>
          ) : (
            <div className="space-y-3">
              {cropManagements.map(management => {
                const cycle = cropCycles.find(
                  item =>
                    item.id ===
                    management.cropCycleId
                )

                return (
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
                      {formatDate(
                        management.date
                      )}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {cycle
                        ? `${cycle.crop} — ${cycle.season}`
                        : 'Cultivo não encontrado'}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {management.type}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {management.description}
                    </p>

                    <CropManagementTypeBadge
                      type={management.type}
                    />
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {area.type === 'Talhão' && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-semibold">
              Colheitas e produtividade
            </h2>

            <Link
              to="/cultivos/colheitas"
              className="inline-flex items-center text-sm text-green-600 hover:underline"
            >
              <Gavel className="w-4 h-4 mr-1" />
              Ver todas as colheitas
            </Link>
          </div>

          {harvestRecords.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nenhuma colheita registrada neste talhão.
            </p>
          ) : (
            <div className="space-y-3">
              {harvestRecords.map(record => {
                const cycle = cropCycles.find(
                  item =>
                    item.id ===
                    record.cropCycleId
                )

                return (
                  <button
                    key={record.id}
                    onClick={() =>
                      navigate(
                        `/cultivos/colheitas/${record.id}`
                      )
                    }
                    className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <p className="font-medium">
                      {formatDate(
                        record.harvestDate
                      )}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {cycle
                        ? `${cycle.crop}${
                            cycle.cultivar
                              ? ` — ${cycle.cultivar}`
                              : ''
                          } — ${
                            cycle.season
                          }`
                        : 'Cultivo não encontrado'}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Área:{' '}
                      {record.harvestedAreaHectares.toLocaleString(
                        'pt-BR',
                        {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        }
                      )}{' '}
                      ha
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Produção:{' '}
                      {record.productionQuantity.toLocaleString(
                        'pt-BR',
                        {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        }
                      )}{' '}
                      {record.productionUnit}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {area.type === 'Talhão' && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">
                  Utilização de máquinas
                </h2>

                <HelpTip
                  title="O que é esta seção?"
                  description="Aqui você acompanha quais máquinas foram utilizadas neste talhão, qual operação realizaram e por quantas horas trabalharam."
                />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {usageCountLabel}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to={`/maquinas/utilizacoes/nova?landAreaId=${area.id}`}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                <Tractor className="w-4 h-4 mr-2" />
                Registrar utilização
              </Link>

              {machineUsageRecords.length > 0 && (
                <Link
                  to={`/maquinas/utilizacoes?landAreaId=${area.id}`}
                  className="inline-flex items-center text-sm text-green-600 hover:underline"
                >
                  <Tractor className="w-4 h-4 mr-1" />
                  Ver todo histórico
                </Link>
              )}
            </div>
          </div>

          {machineUsageRecords.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nenhuma utilização de máquina registrada
              para este talhão.
            </p>
          ) : (
            <div className="space-y-3">
              {machineUsageRecords
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
                      · {record.operationType}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getMachineLabel(
                        record.machineId
                      )}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getCropLabel(
                        record.cropCycleId
                      )}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Horas:{' '}
                      {record.workedHours.toLocaleString(
                        'pt-BR',
                        {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        }
                      )}{' '}
                      h
                    </p>
                  </button>
                ))}
            </div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">
            Estruturas vinculadas
          </h2>

          <Link
            to="/terras/estruturas"
            className="inline-flex items-center text-sm text-green-600 hover:underline"
          >
            <Building2 className="w-4 h-4 mr-1" />
            Ver todas
          </Link>
        </div>

        {linkedStructures.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma estrutura vinculada a esta área.
          </p>
        ) : (
          <div className="space-y-3">
            {linkedStructures.map(structure => (
              <button
                key={structure.id}
                onClick={() =>
                  navigate(
                    `/terras/estruturas/${structure.id}`
                  )
                }
                className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <p className="font-medium">
                  {structure.code} —{' '}
                  {structure.name}
                </p>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {structure.type} ·{' '}
                  {structure.status} ·{' '}
                  {structure.condition}
                </p>
              </button>
            ))}
          </div>
        )}
      </Card>

      <DeleteLandAreaDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        areaCode={area.code}
        areaName={area.name}
      />
    </div>
  )
}