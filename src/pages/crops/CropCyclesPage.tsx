import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  getCropCycles,
  deleteCropCycle,
} from '../../services/cropService'
import { getLandAreas } from '../../services/landService'
import {
  CropCycle,
  CropCycleStatus,
  LandArea,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import CropCycleStatusBadge from '../../components/crops/CropCycleStatusBadge'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  FlaskConical,
  ClipboardList,
  Gavel,
  BarChart3,
} from 'lucide-react'

interface Filters {
  search: string
  landAreaId: string
  crop: string
  status: CropCycleStatus | ''
}

const defaultFilters: Filters = {
  search: '',
  landAreaId: '',
  crop: '',
  status: '',
}

const statusOptions: CropCycleStatus[] = [
  'Planejado',
  'Em andamento',
  'Concluído',
  'Cancelado',
]

export default function CropCyclesPage() {
  const navigate = useNavigate()
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([])
  const [landAreas, setLandAreas] = useState<LandArea[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [error, setError] = useState('')

  const loadData = useCallback(() => {
    setCropCycles(getCropCycles())
    setLandAreas(getLandAreas())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return cropCycles.filter(cycle => {
      const area = landAreas.find(
        a => a.id === cycle.landAreaId
      )

      const searchTerm =
        filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        (area?.code.toLowerCase().includes(searchTerm) ?? false) ||
        (area?.name.toLowerCase().includes(searchTerm) ?? false) ||
        cycle.crop.toLowerCase().includes(searchTerm) ||
        (cycle.cultivar?.toLowerCase().includes(searchTerm) ?? false) ||
        cycle.season.toLowerCase().includes(searchTerm)

      const matchesArea =
        !filters.landAreaId ||
        cycle.landAreaId === filters.landAreaId

      const matchesCrop =
        !filters.crop ||
        cycle.crop.toLowerCase().includes(
          filters.crop.toLowerCase()
        )

      const matchesStatus =
        !filters.status ||
        cycle.status === filters.status

      return (
        matchesSearch &&
        matchesArea &&
        matchesCrop &&
        matchesStatus
      )
    })
  }, [cropCycles, landAreas, filters])

  const handleDelete = (id: string) => {
    const cycle = cropCycles.find(
      c => c.id === id
    )

    if (!cycle) return

    if (
      window.confirm(
        `Excluir o cultivo ${cycle.crop}?`
      )
    ) {
      try {
        deleteCropCycle(id)
        setError('')
        loadData()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao excluir cultivo.'
        )
      }
    }
  }

  const formatDate = (date?: string) => {
    if (!date) return '—'

    return new Date(
      date + 'T00:00:00'
    ).toLocaleDateString('pt-BR')
  }

  const getAreaLabel = (
    cycle: CropCycle
  ): string => {
    const area = landAreas.find(
      a => a.id === cycle.landAreaId
    )

    if (!area) {
      return 'Área não encontrada'
    }

    return `${area.code} — ${area.name}`
  }

  const summaryCards = [
    {
      label: 'Total de cultivos',
      value: cropCycles.length,
    },
    {
      label: 'Planejados',
      value: cropCycles.filter(
        c => c.status === 'Planejado'
      ).length,
    },
    {
      label: 'Em andamento',
      value: cropCycles.filter(
        c => c.status === 'Em andamento'
      ).length,
    },
    {
      label: 'Concluídos',
      value: cropCycles.filter(
        c => c.status === 'Concluído'
      ).length,
    },
    {
      label: 'Cancelados',
      value: cropCycles.filter(
        c => c.status === 'Cancelado'
      ).length,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Gestão de Cultivos
            </h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Aqui você organiza os cultivos de cada talhão e acompanha a safra, o plantio, os manejos e a colheita."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe os cultivos e safras dos talhões da propriedade.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/cultivos/solo"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <FlaskConical className="w-4 h-4 mr-2" />
            Análises de solo
          </Link>

          <Link
            to="/cultivos/manejos"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Manejos agrícolas
          </Link>

          <Link
            to="/cultivos/colheitas"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <Gavel className="w-4 h-4 mr-2" />
            Colheitas
          </Link>

          <Link
            to="/cultivos/ciclo-agricola"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Ciclo agrícola
          </Link>

          <Button
            onClick={() =>
              navigate('/cultivos/novo')
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Novo cultivo
          </Button>
        </div>
      </div>

      {error && (
        <PageFeedback
          type="error"
          message={error}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por talhão, cultura, cultivar ou safra..."
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

            {landAreas
              .filter(a => a.type === 'Talhão')
              .map(area => (
                <option
                  key={area.id}
                  value={area.id}
                >
                  {area.code} — {area.name}
                </option>
              ))}
          </select>

          <input
            type="text"
            placeholder="Cultura..."
            value={filters.crop}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                crop: e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={filters.status}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                status:
                  e.target.value as CropCycleStatus | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Situação: todas
            </option>

            {statusOptions.map(option => (
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

      {cropCycles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum cultivo cadastrado.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre o primeiro cultivo para um talhão.
          </p>

          <Button
            className="mt-4"
            onClick={() =>
              navigate('/cultivos/novo')
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeiro cultivo
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum cultivo encontrado com os filtros selecionados.
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
                    Talhão
                  </th>

                  <th className="px-4 py-3">
                    Cultura
                  </th>

                  <th className="px-4 py-3">
                    Cultivar
                  </th>

                  <th className="px-4 py-3">
                    Safra
                  </th>

                  <th className="px-4 py-3">
                    Plantio
                  </th>

                  <th className="px-4 py-3">
                    Previsão de colheita
                  </th>

                  <th className="px-4 py-3">
                    Situação
                  </th>

                  <th className="px-4 py-3">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(cycle => (
                  <tr
                    key={cycle.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {getAreaLabel(cycle)}
                    </td>

                    <td className="px-4 py-3">
                      {cycle.crop}
                    </td>

                    <td className="px-4 py-3">
                      {cycle.cultivar ?? '—'}
                    </td>

                    <td className="px-4 py-3">
                      {cycle.season}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(cycle.plantingDate)}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(cycle.expectedHarvestDate)}
                    </td>

                    <td className="px-4 py-3">
                      <CropCycleStatusBadge
                        status={cycle.status}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/cultivos/${cycle.id}`)
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Visualizar cultivo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/cultivos/${cycle.id}/editar`)
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Editar cultivo"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(cycle.id)
                          }
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                          aria-label="Excluir cultivo"
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
            {filtered.map(cycle => (
              <Card
                key={cycle.id}
                className="p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">
                      {getAreaLabel(cycle)}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {cycle.crop}{' '}
                      {cycle.cultivar
                        ? `— ${cycle.cultivar}`
                        : ''}
                    </p>
                  </div>

                  <CropCycleStatusBadge
                    status={cycle.status}
                  />
                </div>

                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    Safra: {cycle.season}
                  </p>

                  {cycle.plantingDate && (
                    <p>
                      Plantio: {formatDate(cycle.plantingDate)}
                    </p>
                  )}

                  {cycle.expectedHarvestDate && (
                    <p>
                      Colheita prevista:{' '}
                      {formatDate(cycle.expectedHarvestDate)}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/cultivos/${cycle.id}`)
                    }
                    className="text-xs px-2 py-1"
                  >
                    Ver
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/cultivos/${cycle.id}/editar`)
                    }
                    className="text-xs px-2 py-1"
                  >
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      handleDelete(cycle.id)
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