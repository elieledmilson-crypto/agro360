import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  getCropManagements,
  deleteCropManagement,
} from '../../services/cropManagementService'
import { getCropCycles } from '../../services/cropService'
import { getLandAreas } from '../../services/landService'
import {
  CropManagement,
  CropCycle,
  LandArea,
  CropManagementType,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import CropManagementTypeBadge from '../../components/crops/CropManagementTypeBadge'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'

interface Filters {
  search: string
  landAreaId: string
  cropCycleId: string
  type: CropManagementType | ''
}

const defaultFilters: Filters = {
  search: '',
  landAreaId: '',
  cropCycleId: '',
  type: '',
}

const typeOptions: CropManagementType[] = [
  'Adubação',
  'Irrigação',
  'Pulverização',
  'Capina',
  'Controle de plantas daninhas',
  'Controle de pragas',
  'Controle de doenças',
  'Manejo cultural',
  'Outro',
]

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function CropManagementsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [managements, setManagements] = useState<CropManagement[]>([])
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([])
  const [landAreas, setLandAreas] = useState<LandArea[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const loadData = useCallback(() => {
    setManagements(getCropManagements())
    setCropCycles(getCropCycles())
    setLandAreas(getLandAreas())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const state = location.state as { successMessage?: string } | null
    if (!state?.successMessage) return

    setFeedback({ type: 'success', message: state.successMessage })
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

  const filtered = useMemo(() => {
    return managements.filter(management => {
      const cycle = cropCycles.find(item => item.id === management.cropCycleId)

      const area = cycle
        ? landAreas.find(a => a.id === cycle.landAreaId)
        : undefined

      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        (area?.code.toLowerCase().includes(searchTerm) ?? false) ||
        (area?.name.toLowerCase().includes(searchTerm) ?? false) ||
        (cycle?.crop.toLowerCase().includes(searchTerm) ?? false) ||
        (cycle?.cultivar?.toLowerCase().includes(searchTerm) ?? false) ||
        (cycle?.season.toLowerCase().includes(searchTerm) ?? false) ||
        management.description.toLowerCase().includes(searchTerm) ||
        (management.productOrMaterial?.toLowerCase().includes(searchTerm) ??
          false) ||
        (management.responsible?.toLowerCase().includes(searchTerm) ?? false)

      const matchesArea =
        !filters.landAreaId || cycle?.landAreaId === filters.landAreaId

      const matchesCropCycle =
        !filters.cropCycleId || management.cropCycleId === filters.cropCycleId

      const matchesType = !filters.type || management.type === filters.type

      return matchesSearch && matchesArea && matchesCropCycle && matchesType
    })
  }, [managements, cropCycles, landAreas, filters])

  const handleDelete = (id: string) => {
    const management = managements.find(item => item.id === id)
    if (!management) return

    if (window.confirm('Excluir este manejo?')) {
      try {
        const deleted = deleteCropManagement(id)

        if (deleted) {
          setFeedback({
            type: 'success',
            message: 'Manejo excluído com sucesso.',
          })
        } else {
          setFeedback({ type: 'error', message: 'Manejo não encontrado.' })
        }

        loadData()
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error ? error.message : 'Erro ao excluir manejo.',
        })

        loadData()
      }
    }
  }

  const currentYear = new Date().getFullYear()

  const managementsThisYear = managements.filter(
    management =>
      new Date(management.date + 'T00:00:00').getFullYear() === currentYear
  ).length

  const validCropCycleIds = useMemo(
    () => new Set(cropCycles.map(cycle => cycle.id)),
    [cropCycles]
  )

  const cropCyclesWithManagement = useMemo(
    () =>
      new Set(
        managements
          .filter(management => validCropCycleIds.has(management.cropCycleId))
          .map(management => management.cropCycleId)
      ).size,
    [managements, validCropCycleIds]
  )

  const formatDate = (date?: string) => {
    if (!date) return '—'
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const summaryCards = [
    { label: 'Total de manejos', value: managements.length },
    { label: `Manejos em ${currentYear}`, value: managementsThisYear },
    { label: 'Cultivos com manejo', value: cropCyclesWithManagement },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">Manejos Agrícolas</h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Aqui você registra e consulta operações realizadas durante o cultivo, como adubação, irrigação, pulverização e controle de pragas."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe as operações e manejos realizados nos cultivos da
            propriedade.
          </p>
        </div>

        <Button onClick={() => navigate('/cultivos/manejos/novo')}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Novo manejo
        </Button>
      </div>

      {feedback && (
        <PageFeedback type={feedback.type} message={feedback.message} />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {summaryCards.map(card => (
          <Card key={card.label} className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {card.label}
            </p>

            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </Card>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por talhão, cultivo, descrição, produto ou responsável..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={filters.landAreaId}
            onChange={e =>
              setFilters(prev => ({ ...prev, landAreaId: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Talhão: todos</option>

            {landAreas
              .filter(area => area.type === 'Talhão')
              .map(area => (
                <option key={area.id} value={area.id}>
                  {area.code} — {area.name}
                </option>
              ))}
          </select>

          <select
            value={filters.cropCycleId}
            onChange={e =>
              setFilters(prev => ({ ...prev, cropCycleId: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Cultivo: todos</option>

            {cropCycles.map(cycle => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.crop} {cycle.cultivar ? `— ${cycle.cultivar}` : ''} —{' '}
                {cycle.season}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                type: e.target.value as CropManagementType | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Tipo: todos</option>

            {typeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilters(defaultFilters)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline self-center"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {managements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum manejo cadastrado.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre o primeiro manejo para um cultivo.
          </p>

          <Button
            className="mt-4"
            onClick={() => navigate('/cultivos/manejos/novo')}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeiro manejo
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum manejo encontrado com os filtros selecionados.
          </p>

          <button
            onClick={() => setFilters(defaultFilters)}
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
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Talhão</th>
                  <th className="px-4 py-3">Cultivo</th>
                  <th className="px-4 py-3">Safra</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Produto/Material</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(management => {
                  const cycle = cropCycles.find(
                    item => item.id === management.cropCycleId
                  )

                  const area = cycle
                    ? landAreas.find(a => a.id === cycle.landAreaId)
                    : undefined

                  return (
                    <tr
                      key={management.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        {formatDate(management.date)}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {area
                          ? `${area.code} — ${area.name}`
                          : 'Área não encontrada'}
                      </td>

                      <td className="px-4 py-3">
                        {cycle ? cycle.crop : 'Cultivo não encontrado'}
                      </td>

                      <td className="px-4 py-3">{cycle?.season ?? '—'}</td>

                      <td className="px-4 py-3">
                        <CropManagementTypeBadge type={management.type} />
                      </td>

                      <td className="px-4 py-3">{management.description}</td>

                      <td className="px-4 py-3">
                        {management.productOrMaterial ?? '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(`/cultivos/manejos/${management.id}`)
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Visualizar manejo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/cultivos/manejos/${management.id}/editar`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Editar manejo"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(management.id)}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                            aria-label="Excluir manejo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(management => {
              const cycle = cropCycles.find(
                item => item.id === management.cropCycleId
              )

              const area = cycle
                ? landAreas.find(a => a.id === cycle.landAreaId)
                : undefined

              return (
                <Card key={management.id} className="p-4">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {formatDate(management.date)}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {area
                          ? `${area.code} — ${area.name}`
                          : 'Área não encontrada'}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cycle
                          ? `${cycle.crop} — ${cycle.season}`
                          : 'Cultivo não encontrado'}
                      </p>
                    </div>

                    <CropManagementTypeBadge type={management.type} />
                  </div>

                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>{management.description}</p>

                    {management.productOrMaterial && (
                      <p>Produto: {management.productOrMaterial}</p>
                    )}

                    {management.doseOrQuantity && (
                      <p>Dose: {management.doseOrQuantity}</p>
                    )}

                    {management.responsible && (
                      <p>Responsável: {management.responsible}</p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/cultivos/manejos/${management.id}`)
                      }
                      className="text-xs px-2 py-1"
                    >
                      Ver
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/cultivos/manejos/${management.id}/editar`)
                      }
                      className="text-xs px-2 py-1"
                    >
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleDelete(management.id)}
                      className="text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}