import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getRuralStructures,
  deleteRuralStructure,
  getRuralStructureCountByType,
  getRuralStructureCountByStatus,
  getLandAreasForStructure,
} from '../../services/ruralStructureService'
import {
  RuralStructure,
  RuralStructureType,
  RuralStructureStatus,
  RuralStructureCondition,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Plus, Eye, Pencil, Trash2, Grid3X3, Wrench } from 'lucide-react'

interface Filters {
  search: string
  type: RuralStructureType | ''
  status: RuralStructureStatus | ''
  condition: RuralStructureCondition | ''
}

const defaultFilters: Filters = {
  search: '',
  type: '',
  status: '',
  condition: '',
}

const typeOptions: RuralStructureType[] = [
  'Cerca',
  'Corredor',
  'Porteira',
]

const statusOptions: RuralStructureStatus[] = [
  'Em uso',
  'Em manutenção',
  'Inativa',
]

const conditionOptions: RuralStructureCondition[] = [
  'Boa',
  'Regular',
  'Ruim',
]

export default function RuralStructuresPage() {
  const navigate = useNavigate()
  const [structures, setStructures] = useState<RuralStructure[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [error, setError] = useState('')

  const loadData = useCallback(() => {
    setStructures(getRuralStructures())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return structures.filter(structure => {
      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        structure.code.toLowerCase().includes(searchTerm) ||
        structure.name.toLowerCase().includes(searchTerm)

      const matchesType =
        !filters.type || structure.type === filters.type

      const matchesStatus =
        !filters.status || structure.status === filters.status

      const matchesCondition =
        !filters.condition || structure.condition === filters.condition

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesCondition
      )
    })
  }, [structures, filters])

  const handleDelete = (id: string) => {
    const structure = structures.find(s => s.id === id)
    if (!structure) return

    if (window.confirm(`Excluir a estrutura ${structure.code}?`)) {
      try {
        deleteRuralStructure(id)
        setError('')
        loadData()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao excluir estrutura.'
        )
      }
    }
  }

  const summaryCards = [
    {
      label: 'Total de estruturas',
      value: structures.length,
      icon: Grid3X3,
      color:
        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Cercas',
      value: getRuralStructureCountByType('Cerca'),
      icon: Grid3X3,
      color:
        'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    },
    {
      label: 'Corredores',
      value: getRuralStructureCountByType('Corredor'),
      icon: Grid3X3,
      color:
        'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Porteiras',
      value: getRuralStructureCountByType('Porteira'),
      icon: Grid3X3,
      color:
        'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
    },
    {
      label: 'Em manutenção',
      value: getRuralStructureCountByStatus('Em manutenção'),
      icon: Wrench,
      color:
        'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Estruturas da Propriedade
            </h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Aqui você cadastra e acompanha estruturas rurais como cercas, corredores e porteiras."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Gerencie cercas, corredores e porteiras.
          </p>
        </div>

        <Button onClick={() => navigate('/terras/estruturas/nova')}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Nova estrutura
        </Button>
      </div>

      {error && <PageFeedback type="error" message={error} />}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map(card => {
          const Icon = card.icon

          return (
            <Card key={card.label} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Pesquisar código ou nome..."
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
                type: e.target.value as RuralStructureType | '',
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

          <select
            value={filters.status}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                status: e.target.value as RuralStructureStatus | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Situação: todas</option>
            {statusOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={filters.condition}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                condition: e.target.value as RuralStructureCondition | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Conservação: todas</option>
            {conditionOptions.map(option => (
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

      {structures.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma estrutura cadastrada.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre a primeira estrutura da propriedade.
          </p>

          <Button
            className="mt-4"
            onClick={() => navigate('/terras/estruturas/nova')}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeira estrutura
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma estrutura encontrada com os filtros selecionados.
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
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Áreas</th>
                  <th className="px-4 py-3">Dimensões</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3">Conservação</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(structure => {
                  const areas = getLandAreasForStructure(structure)

                  return (
                    <tr
                      key={structure.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {structure.code}
                      </td>
                      <td className="px-4 py-3">{structure.name}</td>
                      <td className="px-4 py-3">{structure.type}</td>
                      <td className="px-4 py-3">
                        {areas.length === 0
                          ? '—'
                          : areas.map(a => a.code).join(', ')}
                      </td>
                      <td className="px-4 py-3">
                        {structure.lengthMeters || structure.widthMeters
                          ? `${structure.lengthMeters ?? '—'}m × ${structure.widthMeters ?? '—'}m`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            structure.status === 'Em uso'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : structure.status === 'Em manutenção'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          }`}
                        >
                          {structure.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            structure.condition === 'Boa'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : structure.condition === 'Regular'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          }`}
                        >
                          {structure.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/terras/estruturas/${structure.id}`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Visualizar estrutura"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/terras/estruturas/${structure.id}/editar`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Editar estrutura"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(structure.id)}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                            aria-label="Excluir estrutura"
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
            {filtered.map(structure => {
              const areas = getLandAreasForStructure(structure)

              return (
                <Card key={structure.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {structure.code}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {structure.name}
                      </p>
                    </div>

                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        structure.status === 'Em uso'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : structure.status === 'Em manutenção'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}
                    >
                      {structure.status}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>Tipo: {structure.type}</p>
                    <p>
                      Áreas:{' '}
                      {areas.length === 0
                        ? '—'
                        : areas.map(a => a.code).join(', ')}
                    </p>

                    {structure.lengthMeters && (
                      <p>Comprimento: {structure.lengthMeters}m</p>
                    )}

                    {structure.widthMeters && (
                      <p>Largura: {structure.widthMeters}m</p>
                    )}

                    <p>Conservação: {structure.condition}</p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/terras/estruturas/${structure.id}`)
                      }
                      className="text-xs px-2 py-1"
                    >
                      Ver
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/terras/estruturas/${structure.id}/editar`
                        )
                      }
                      className="text-xs px-2 py-1"
                    >
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleDelete(structure.id)}
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