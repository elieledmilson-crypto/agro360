import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getLandAreas, deleteLandArea } from '../../services/landService'
import { LandArea, LandAreaType, LandAreaStatus } from '../../types'
import LandAreaStatusBadge from '../../components/land/LandAreaStatusBadge'
import DeleteLandAreaDialog from '../../components/land/DeleteLandAreaDialog'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { useAuth } from '../../hooks/useAuth'
import { userHasPermission } from '../../services/permissionService'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  MapPin,
  Ruler,
  Sprout,
  TreePine,
  RefreshCcw,
  Layers,
  Grid3X3,
  Building2,
  History,
  Map as MapIcon,
} from 'lucide-react'

interface Filters {
  search: string
  type: LandAreaType | ''
  status: LandAreaStatus | ''
}

const defaultFilters: Filters = {
  search: '',
  type: '',
  status: '',
}

const typeOptions: LandAreaType[] = [
  'Piquete',
  'Talhão',
  'Pastagem',
  'Reserva/APP',
  'Infraestrutura',
  'Área ociosa',
  'Outro',
]

const statusOptions: LandAreaStatus[] = [
  'Em uso',
  'Em descanso',
  'Em recuperação',
  'Inativa',
]

function formatHectares(value: number): string {
  return (
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) + ' ha'
  )
}

export default function LandAreasPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canSeeMap = userHasPermission(user, 'map')

  const [areas, setAreas] = useState<LandArea[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [toDelete, setToDelete] = useState<LandArea | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const loadData = useCallback(() => {
    setAreas(getLandAreas())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return areas.filter(area => {
      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        area.code.toLowerCase().includes(searchTerm) ||
        area.name.toLowerCase().includes(searchTerm) ||
        (area.purpose?.toLowerCase().includes(searchTerm) ?? false)

      const matchesType =
        !filters.type || area.type === filters.type

      const matchesStatus =
        !filters.status || area.status === filters.status

      return matchesSearch && matchesType && matchesStatus
    })
  }, [areas, filters])

  const totalHectares = useMemo(() => {
    return areas.reduce(
      (sum, area) => sum + area.areaHectares,
      0
    )
  }, [areas])

  const productiveHectares = useMemo(() => {
    return areas
      .filter(area =>
        ['Piquete', 'Talhão', 'Pastagem'].includes(area.type)
      )
      .reduce(
        (sum, area) => sum + area.areaHectares,
        0
      )
  }, [areas])

  const preservationHectares = useMemo(() => {
    return areas
      .filter(area => area.type === 'Reserva/APP')
      .reduce(
        (sum, area) => sum + area.areaHectares,
        0
      )
  }, [areas])

  const idleHectares = useMemo(() => {
    return areas
      .filter(area => area.type === 'Área ociosa')
      .reduce(
        (sum, area) => sum + area.areaHectares,
        0
      )
  }, [areas])

  const recoveringHectares = useMemo(() => {
    return areas
      .filter(area => area.status === 'Em recuperação')
      .reduce(
        (sum, area) => sum + area.areaHectares,
        0
      )
  }, [areas])

  const handleDelete = () => {
    if (toDelete) {
      try {
        deleteLandArea(toDelete.id)
        setToDelete(null)
        setDeleteError('')
        loadData()
      } catch (error) {
        setDeleteError(
          error instanceof Error
            ? error.message
            : 'Erro ao excluir área.'
        )

        setToDelete(null)
      }
    }
  }

  const summaryCards = [
    {
      label: 'Áreas cadastradas',
      value: areas.length.toString(),
      icon: Layers,
      color:
        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Área total cadastrada',
      value: formatHectares(totalHectares),
      icon: Ruler,
      color:
        'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    },
    {
      label: 'Área produtiva',
      value: formatHectares(productiveHectares),
      icon: Sprout,
      color:
        'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Preservação',
      value: formatHectares(preservationHectares),
      icon: TreePine,
      color:
        'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
    },
    {
      label: 'Área ociosa',
      value: formatHectares(idleHectares),
      icon: MapPin,
      color:
        'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    },
    {
      label: 'Em recuperação',
      value: formatHectares(recoveringHectares),
      icon: RefreshCcw,
      color:
        'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">Gestão de Terras</h1>

            <HelpTip
              title="Para que serve a gestão de terras?"
              description="Aqui você organiza as áreas da propriedade, como talhões, piquetes, pastagens, reservas e outras áreas de uso rural."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Organize e acompanhe as áreas da propriedade rural.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canSeeMap && (
            <Link
              to="/mapa"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Ver mapa
            </Link>
          )}

          <Link
            to="/terras/manejo"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Manejo de piquetes
          </Link>

          <Link
            to="/terras/estruturas"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Estruturas
          </Link>

          <Link
            to="/terras/historico"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <History className="w-4 h-4 mr-2" />
            Histórico de utilização
          </Link>

          <Button onClick={() => navigate('/terras/nova')}>
            <Plus className="w-4 h-4 mr-2 inline" />
            Nova área
          </Button>
        </div>
      </div>

      {deleteError && (
        <PageFeedback
          type="error"
          message={deleteError}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map(card => {
          const Icon = card.icon

          return (
            <Card
              key={card.label}
              className="p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.label}
                  </p>

                  <p className="text-2xl font-bold mt-1">
                    {card.value}
                  </p>
                </div>

                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Pesquisar código, nome ou finalidade..."
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
            value={filters.type}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                type:
                  e.target.value as LandAreaType | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Tipo: todos
            </option>

            {typeOptions.map(option => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                status:
                  e.target.value as LandAreaStatus | '',
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

      {areas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma área cadastrada.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre a primeira área da propriedade para iniciar a gestão de terras.
          </p>

          <Button
            className="mt-4"
            onClick={() =>
              navigate('/terras/nova')
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeira área
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma área encontrada com os filtros selecionados.
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
                    Código
                  </th>

                  <th className="px-4 py-3">
                    Nome
                  </th>

                  <th className="px-4 py-3">
                    Tipo
                  </th>

                  <th className="px-4 py-3">
                    Área
                  </th>

                  <th className="px-4 py-3">
                    Situação
                  </th>

                  <th className="px-4 py-3">
                    Finalidade
                  </th>

                  <th className="px-4 py-3">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(area => (
                  <tr
                    key={area.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="px-4 py-3 font-medium">
                      {area.code}
                    </td>

                    <td className="px-4 py-3">
                      {area.name}
                    </td>

                    <td className="px-4 py-3">
                      {area.type}
                    </td>

                    <td className="px-4 py-3">
                      {formatHectares(area.areaHectares)}
                    </td>

                    <td className="px-4 py-3">
                      <LandAreaStatusBadge
                        status={area.status}
                      />
                    </td>

                    <td className="px-4 py-3">
                      {area.purpose ?? '—'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/terras/${area.id}`)
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Visualizar área"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/terras/${area.id}/editar`)
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Editar área"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            setToDelete(area)
                          }
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                          aria-label="Excluir área"
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
            {filtered.map(area => (
              <Card
                key={area.id}
                className="p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">
                      {area.code}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {area.name}
                    </p>
                  </div>

                  <LandAreaStatusBadge
                    status={area.status}
                  />
                </div>

                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    Tipo: {area.type}
                  </p>

                  <p>
                    Área: {formatHectares(area.areaHectares)}
                  </p>

                  {area.purpose && (
                    <p>
                      Finalidade: {area.purpose}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/terras/${area.id}`)
                    }
                    className="text-xs px-2 py-1"
                  >
                    Ver
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/terras/${area.id}/editar`)
                    }
                    className="text-xs px-2 py-1"
                  >
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setToDelete(area)
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

      <DeleteLandAreaDialog
        open={!!toDelete}
        onClose={() =>
          setToDelete(null)
        }
        onConfirm={handleDelete}
        areaCode={toDelete?.code}
        areaName={toDelete?.name}
      />
    </div>
  )
}