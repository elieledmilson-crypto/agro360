import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  getMachineUsageRecords,
  deleteMachineUsageRecord,
} from '../../services/machineUsageService'
import { getMachines, getMachineById } from '../../services/machineService'
import { getLandAreas, getLandAreaById } from '../../services/landService'
import { getCropCycles, getCropCycleById } from '../../services/cropService'
import {
  MachineUsageRecord,
  MachineOperationType,
  Machine,
  LandArea,
  CropCycle,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'

interface Filters {
  search: string
  machineId: string
  landAreaId: string
  cropCycleId: string
  operationType: MachineOperationType | ''
}

const defaultFilters: Filters = {
  search: '',
  machineId: '',
  landAreaId: '',
  cropCycleId: '',
  operationType: '',
}

const operationTypeOptions: MachineOperationType[] = [
  'Preparo do solo',
  'Plantio',
  'Semeadura',
  'Adubação',
  'Pulverização',
  'Colheita',
  'Roçada',
  'Irrigação',
  'Transporte',
  'Outro',
]

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function MachineUsageRecordsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [records, setRecords] = useState<MachineUsageRecord[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [talhoes, setTalhoes] = useState<LandArea[]>([])
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([])

  const [filters, setFilters] = useState<Filters>(() => {
    const query = new URLSearchParams(location.search)

    const requestedMachineId = query.get('machineId') ?? ''
    const requestedLandAreaId = query.get('landAreaId') ?? ''
    const requestedCropCycleId = query.get('cropCycleId') ?? ''

    const validMachineId =
      requestedMachineId && getMachineById(requestedMachineId)
        ? requestedMachineId
        : ''

    const landAreaFromQuery = requestedLandAreaId
      ? getLandAreaById(requestedLandAreaId)
      : undefined

    const validLandAreaId =
      landAreaFromQuery && landAreaFromQuery.type === 'Talhão'
        ? requestedLandAreaId
        : ''

    const cropCycleFromQuery = requestedCropCycleId
      ? getCropCycleById(requestedCropCycleId)
      : undefined

    const validCropCycleId = cropCycleFromQuery
      ? requestedCropCycleId
      : ''

    return {
      ...defaultFilters,
      machineId: validMachineId,
      landAreaId: validLandAreaId,
      cropCycleId: validCropCycleId,
    }
  })

  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const loadData = useCallback(() => {
    setRecords(getMachineUsageRecords())
    setMachines(getMachines())
    setTalhoes(getLandAreas().filter(area => area.type === 'Talhão'))
    setCropCycles(getCropCycles())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  const filtered = useMemo(() => {
    return records.filter(record => {
      const machine = machines.find(m => m.id === record.machineId)
      const landArea = talhoes.find(a => a.id === record.landAreaId)
      const cropCycle = record.cropCycleId
        ? cropCycles.find(c => c.id === record.cropCycleId)
        : undefined

      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        (machine?.code.toLowerCase().includes(searchTerm) ?? false) ||
        (machine?.name.toLowerCase().includes(searchTerm) ?? false) ||
        (landArea?.code.toLowerCase().includes(searchTerm) ?? false) ||
        (landArea?.name.toLowerCase().includes(searchTerm) ?? false) ||
        (cropCycle?.crop.toLowerCase().includes(searchTerm) ?? false) ||
        (cropCycle?.cultivar?.toLowerCase().includes(searchTerm) ?? false) ||
        (cropCycle?.season.toLowerCase().includes(searchTerm) ?? false) ||
        record.operationType.toLowerCase().includes(searchTerm) ||
        (record.notes?.toLowerCase().includes(searchTerm) ?? false)

      const matchesMachine =
        !filters.machineId ||
        record.machineId === filters.machineId

      const matchesLandArea =
        !filters.landAreaId ||
        record.landAreaId === filters.landAreaId

      const matchesCropCycle =
        !filters.cropCycleId ||
        record.cropCycleId === filters.cropCycleId

      const matchesOperationType =
        !filters.operationType ||
        record.operationType === filters.operationType

      return (
        matchesSearch &&
        matchesMachine &&
        matchesLandArea &&
        matchesCropCycle &&
        matchesOperationType
      )
    })
  }, [records, machines, talhoes, cropCycles, filters])

  const handleDelete = (id: string) => {
    const record = records.find(r => r.id === id)
    if (!record) return

    if (window.confirm('Excluir este registro de utilização?')) {
      try {
        const deleted = deleteMachineUsageRecord(id)

        if (deleted) {
          setFeedback({
            type: 'success',
            message: 'Registro de utilização excluído com sucesso.',
          })
        } else {
          setFeedback({
            type: 'error',
            message: 'Registro de utilização não encontrado.',
          })
        }

        loadData()
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir registro de utilização.',
        })

        loadData()
      }
    }
  }

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')

  const formatHours = (value: number) =>
    `${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} h`

  const getMachineLabel = (record: MachineUsageRecord): string => {
    const machine = machines.find(m => m.id === record.machineId)

    if (!machine) {
      return 'Máquina ou equipamento não encontrado'
    }

    return `${machine.code} — ${machine.name}`
  }

  const getLandAreaLabel = (record: MachineUsageRecord): string => {
    const area = talhoes.find(a => a.id === record.landAreaId)

    if (!area) {
      return 'Talhão não encontrado'
    }

    return `${area.code} — ${area.name}`
  }

  const getCropCycleLabel = (record: MachineUsageRecord): string => {
    if (!record.cropCycleId) return '—'

    const cycle = cropCycles.find(c => c.id === record.cropCycleId)

    if (!cycle) {
      return 'Cultivo não encontrado'
    }

    return `${cycle.crop}${cycle.cultivar ? ` — ${cycle.cultivar}` : ''} — ${cycle.season}`
  }

  const totalRecords = records.length

  const totalWorkedHours = records.reduce(
    (sum, record) => sum + record.workedHours,
    0
  )

  const machinesUsed = new Set(records.map(r => r.machineId)).size
  const talhoesUsed = new Set(records.map(r => r.landAreaId)).size

  const summaryCards = [
    {
      label: 'Total de utilizações',
      value: totalRecords,
    },
    {
      label: 'Horas trabalhadas',
      value: formatHours(totalWorkedHours),
    },
    {
      label: 'Máquinas utilizadas',
      value: machinesUsed,
    },
    {
      label: 'Talhões atendidos',
      value: talhoesUsed,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Utilizações Operacionais
            </h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Aqui você registra onde uma máquina foi utilizada, qual operação realizou e por quantas horas trabalhou."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe onde e como as máquinas e equipamentos foram utilizados.
          </p>
        </div>

        <Button
          onClick={() =>
            navigate('/maquinas/utilizacoes/nova')
          }
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Nova utilização
        </Button>
      </div>

      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <Card
            key={card.label}
            className="p-4"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {card.label}
            </p>

            <p className="text-2xl font-bold mt-1">
              {card.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Pesquisar máquina, talhão, cultivo, operação..."
            aria-label="Pesquisar utilizações"
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                search: e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            aria-label="Filtrar por máquina"
            value={filters.machineId}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                machineId: e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Máquina: todas
            </option>

            {machines.map(machine => (
              <option
                key={machine.id}
                value={machine.id}
              >
                {machine.code} — {machine.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por talhão"
            value={filters.landAreaId}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                landAreaId: e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Talhão: todos
            </option>

            {talhoes.map(area => (
              <option
                key={area.id}
                value={area.id}
              >
                {area.code} — {area.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por cultivo"
            value={filters.cropCycleId}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                cropCycleId: e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Cultivo: todos
            </option>

            {cropCycles.map(cycle => (
              <option
                key={cycle.id}
                value={cycle.id}
              >
                {cycle.crop}{' '}
                {cycle.cultivar
                  ? `— ${cycle.cultivar}`
                  : ''}{' '}
                — {cycle.season}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por operação"
            value={filters.operationType}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                operationType:
                  e.target.value as
                    | MachineOperationType
                    | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Operação: todas
            </option>

            {operationTypeOptions.map(option => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              setFilters(defaultFilters)
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline self-center"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma utilização cadastrada.
          </p>

          <Button
            className="mt-4"
            onClick={() =>
              navigate('/maquinas/utilizacoes/nova')
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Registrar primeira utilização
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma utilização encontrada com os filtros selecionados.
          </p>

          <button
            onClick={() =>
              setFilters(defaultFilters)
            }
            className="mt-2 text-green-600 hover:underline text-sm"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3">
                    Data
                  </th>

                  <th className="px-4 py-3">
                    Máquina
                  </th>

                  <th className="px-4 py-3">
                    Talhão
                  </th>

                  <th className="px-4 py-3">
                    Cultivo/Safra
                  </th>

                  <th className="px-4 py-3">
                    Operação
                  </th>

                  <th className="px-4 py-3">
                    Horas
                  </th>

                  <th className="px-4 py-3">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(record => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      {formatDate(record.operationDate)}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {getMachineLabel(record)}
                    </td>

                    <td className="px-4 py-3">
                      {getLandAreaLabel(record)}
                    </td>

                    <td className="px-4 py-3">
                      {getCropCycleLabel(record)}
                    </td>

                    <td className="px-4 py-3">
                      {record.operationType}
                    </td>

                    <td className="px-4 py-3">
                      {formatHours(record.workedHours)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/maquinas/utilizacoes/${record.id}`
                            )
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Visualizar utilização"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(
                              `/maquinas/utilizacoes/${record.id}/editar`
                            )
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Editar utilização"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(record.id)
                          }
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                          aria-label="Excluir utilização"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(record => (
              <Card
                key={record.id}
                className="p-4"
              >
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-sm">
                      {formatDate(record.operationDate)}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getMachineLabel(record)}
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    Talhão: {getLandAreaLabel(record)}
                  </p>

                  <p>
                    Cultivo: {getCropCycleLabel(record)}
                  </p>

                  <p>
                    Operação: {record.operationType}
                  </p>

                  <p>
                    Horas: {formatHours(record.workedHours)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/maquinas/utilizacoes/${record.id}`
                      )
                    }
                    className="text-xs px-2 py-1"
                  >
                    Ver
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/maquinas/utilizacoes/${record.id}/editar`
                      )
                    }
                    className="text-xs px-2 py-1"
                  >
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      handleDelete(record.id)
                    }
                    className="text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
                  >
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}