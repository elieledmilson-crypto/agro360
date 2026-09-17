import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getLandUseRecords,
  deleteLandUseRecord,
} from '../../services/landUseService'
import { getLandAreas } from '../../services/landService'
import {
  LandUseRecord,
  LandUseType,
  LandArea,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'

interface Filters {
  search: string
  landAreaId: string
  type: LandUseType | ''
  temporal: 'Todos' | 'Em andamento' | 'Finalizados'
}

const defaultFilters: Filters = {
  search: '',
  landAreaId: '',
  type: '',
  temporal: 'Todos',
}

const landUseTypeOptions: LandUseType[] = [
  'Uso produtivo',
  'Descanso',
  'Recuperação',
  'Preservação',
  'Manutenção',
  'Outro',
]

const temporalOptions = [
  'Todos',
  'Em andamento',
  'Finalizados',
]

export default function LandUseHistoryPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<LandUseRecord[]>([])
  const [areas, setAreas] = useState<LandArea[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [error, setError] = useState('')

  const loadData = useCallback(() => {
    setRecords(getLandUseRecords())
    setAreas(getLandAreas())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return records.filter(record => {
      const area = areas.find(
        a => a.id === record.landAreaId
      )

      const searchTerm =
        filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        (area?.code
          .toLowerCase()
          .includes(searchTerm) ??
          false) ||
        (area?.name
          .toLowerCase()
          .includes(searchTerm) ??
          false) ||
        record.type
          .toLowerCase()
          .includes(searchTerm) ||
        (record.description
          ?.toLowerCase()
          .includes(searchTerm) ??
          false)

      const matchesArea =
        !filters.landAreaId ||
        record.landAreaId ===
          filters.landAreaId

      const matchesType =
        !filters.type ||
        record.type === filters.type

      const matchesTemporal =
        filters.temporal === 'Todos' ||
        (filters.temporal ===
          'Em andamento' &&
          !record.endDate) ||
        (filters.temporal ===
          'Finalizados' &&
          !!record.endDate)

      return (
        matchesSearch &&
        matchesArea &&
        matchesType &&
        matchesTemporal
      )
    })
  }, [records, areas, filters])

  const handleDelete = (id: string) => {
    const record = records.find(
      r => r.id === id
    )

    if (!record) return

    if (
      window.confirm(
        'Excluir este registro de utilização?'
      )
    ) {
      try {
        deleteLandUseRecord(id)
        setError('')
        loadData()
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao excluir registro.'
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
    record: LandUseRecord
  ): string => {
    const area = areas.find(
      a => a.id === record.landAreaId
    )

    if (!area) return 'Área não encontrada'

    return `${area.code} — ${area.name}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Histórico de Utilização das Áreas
            </h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Aqui você consulta como as áreas da propriedade foram utilizadas ao longo do tempo."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Registre e consulte como as áreas foram
            utilizadas ao longo do tempo.
          </p>
        </div>

        <Button
          onClick={() =>
            navigate('/terras/historico/novo')
          }
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Novo registro
        </Button>
      </div>

      {error && (
        <PageFeedback
          type="error"
          message={error}
        />
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Pesquisar código, nome, tipo ou descrição..."
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
            <option value="">Área: todas</option>

            {areas.map(area => (
              <option
                key={area.id}
                value={area.id}
              >
                {area.code} — {area.name}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                type:
                  e.target.value as
                    | LandUseType
                    | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Tipo: todos
            </option>

            {landUseTypeOptions.map(
              option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
          </select>

          <select
            value={filters.temporal}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                temporal:
                  e.target
                    .value as Filters['temporal'],
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {temporalOptions.map(
              option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
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
            Nenhum registro de utilização cadastrado.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Registre o primeiro histórico de utilização
            de uma área.
          </p>

          <Button
            className="mt-4"
            onClick={() =>
              navigate('/terras/historico/novo')
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeiro registro
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum registro encontrado com os filtros
            selecionados.
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
                    Área
                  </th>
                  <th className="px-4 py-3">
                    Tipo
                  </th>
                  <th className="px-4 py-3">
                    Início
                  </th>
                  <th className="px-4 py-3">
                    Término
                  </th>
                  <th className="px-4 py-3">
                    Situação
                  </th>
                  <th className="px-4 py-3">
                    Descrição
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
                    <td className="px-4 py-3 font-medium">
                      {getAreaLabel(record)}
                    </td>

                    <td className="px-4 py-3">
                      {record.type}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(
                        record.startDate
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(
                        record.endDate
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {record.endDate ? (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          Finalizado
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          Em andamento
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {record.description ??
                        '—'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/terras/historico/${record.id}`
                            )
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Visualizar registro"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(
                              `/terras/historico/${record.id}/editar`
                            )
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Editar registro"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              record.id
                            )
                          }
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                          aria-label="Excluir registro"
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
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">
                      {getAreaLabel(record)}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {record.type}
                    </p>
                  </div>

                  {record.endDate ? (
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      Finalizado
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                      Em andamento
                    </span>
                  )}
                </div>

                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    Início:{' '}
                    {formatDate(
                      record.startDate
                    )}
                  </p>

                  {record.endDate && (
                    <p>
                      Término:{' '}
                      {formatDate(
                        record.endDate
                      )}
                    </p>
                  )}

                  {record.description && (
                    <p>
                      Descrição:{' '}
                      {record.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/terras/historico/${record.id}`
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
                        `/terras/historico/${record.id}/editar`
                      )
                    }
                    className="text-xs px-2 py-1"
                  >
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      handleDelete(
                        record.id
                      )
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