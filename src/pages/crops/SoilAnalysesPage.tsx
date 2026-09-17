import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getSoilAnalyses,
  deleteSoilAnalysis,
} from '../../services/soilAnalysisService'
import { getLandAreas } from '../../services/landService'
import {
  SoilAnalysis,
  LandArea,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'

interface Filters {
  search: string
  landAreaId: string
}

const defaultFilters: Filters = {
  search: '',
  landAreaId: '',
}

export default function SoilAnalysesPage() {
  const navigate = useNavigate()

  const [analyses, setAnalyses] =
    useState<SoilAnalysis[]>([])

  const [landAreas, setLandAreas] =
    useState<LandArea[]>([])

  const [filters, setFilters] =
    useState<Filters>(defaultFilters)

  const [feedback, setFeedback] =
    useState<{
      type: 'success' | 'error'
      message: string
    } | null>(null)

  const loadData = useCallback(() => {
    setAnalyses(getSoilAnalyses())
    setLandAreas(getLandAreas())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return analyses.filter(analysis => {
      const area = landAreas.find(
        a => a.id === analysis.landAreaId
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
        (analysis.laboratory
          ?.toLowerCase()
          .includes(searchTerm) ??
          false) ||
        (analysis.sampleCode
          ?.toLowerCase()
          .includes(searchTerm) ??
          false) ||
        (analysis.sampleDepth
          ?.toLowerCase()
          .includes(searchTerm) ??
          false)

      const matchesArea =
        !filters.landAreaId ||
        analysis.landAreaId ===
          filters.landAreaId

      return (
        matchesSearch &&
        matchesArea
      )
    })
  }, [
    analyses,
    landAreas,
    filters,
  ])

  const handleDelete = (
    id: string
  ) => {
    const analysis =
      analyses.find(
        a => a.id === id
      )

    if (!analysis) return

    if (
      window.confirm(
        'Excluir esta análise de solo?'
      )
    ) {
      try {
        deleteSoilAnalysis(id)

        setFeedback({
          type: 'success',
          message:
            'Análise de solo excluída com sucesso.',
        })

        loadData()
      } catch (err) {
        setFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Erro ao excluir análise.',
        })
      }
    }
  }

  const currentYear =
    new Date().getFullYear()

  const analysesThisYear =
    analyses.filter(
      analysis =>
        new Date(
          analysis.sampleDate +
            'T00:00:00'
        ).getFullYear() ===
        currentYear
    ).length

  const talhoesComAnalise =
    new Set(
      analyses.map(
        a => a.landAreaId
      )
    ).size

  const formatDate = (
    date?: string
  ) => {
    if (!date) return '—'

    return new Date(
      date + 'T00:00:00'
    ).toLocaleDateString('pt-BR')
  }

  const getAreaLabel = (
    analysis: SoilAnalysis
  ): string => {
    const area =
      landAreas.find(
        a =>
          a.id ===
          analysis.landAreaId
      )

    if (!area) {
      return 'Área não encontrada'
    }

    return `${area.code} — ${area.name}`
  }

  const summaryCards = [
    {
      label: 'Total de análises',
      value: analyses.length,
    },
    {
      label: 'Talhões com análise',
      value: talhoesComAnalise,
    },
    {
      label: `Análises em ${currentYear}`,
      value: analysesThisYear,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Análises de Solo
            </h1>

            <HelpTip
              title="Para que serve a análise de solo?"
              description="A análise de solo mostra características importantes da área e ajuda a entender as condições do talhão antes e durante o cultivo."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe o histórico de análises de solo dos talhões da propriedade.
          </p>
        </div>

        <Button
          onClick={() =>
            navigate(
              '/cultivos/solo/nova'
            )
          }
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Nova análise
        </Button>
      </div>

      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por talhão, laboratório, código ou profundidade..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                search:
                  e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={filters.landAreaId}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                landAreaId:
                  e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Talhão: todos
            </option>

            {landAreas
              .filter(
                a => a.type === 'Talhão'
              )
              .map(area => (
                <option
                  key={area.id}
                  value={area.id}
                >
                  {area.code} — {area.name}
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

      {analyses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma análise de solo cadastrada.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre a primeira análise para um talhão.
          </p>

          <Button
            className="mt-4"
            onClick={() =>
              navigate(
                '/cultivos/solo/nova'
              )
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeira análise
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma análise encontrada com os filtros selecionados.
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
                    Data
                  </th>

                  <th className="px-4 py-3">
                    Laboratório
                  </th>

                  <th className="px-4 py-3">
                    Código da amostra
                  </th>

                  <th className="px-4 py-3">
                    Profundidade
                  </th>

                  <th className="px-4 py-3">
                    pH
                  </th>

                  <th className="px-4 py-3">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(
                  analysis => (
                    <tr
                      key={analysis.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {getAreaLabel(
                          analysis
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {formatDate(
                          analysis.sampleDate
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {analysis.laboratory ??
                          '—'}
                      </td>

                      <td className="px-4 py-3">
                        {analysis.sampleCode ??
                          '—'}
                      </td>

                      <td className="px-4 py-3">
                        {analysis.sampleDepth ??
                          '—'}
                      </td>

                      <td className="px-4 py-3">
                        {analysis.ph ?? '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/cultivos/solo/${analysis.id}`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Visualizar análise"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/cultivos/solo/${analysis.id}/editar`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Editar análise"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                analysis.id
                              )
                            }
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                            aria-label="Excluir análise"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(
              analysis => (
                <Card
                  key={analysis.id}
                  className="p-4"
                >
                  <p className="font-medium">
                    {getAreaLabel(
                      analysis
                    )}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Data:{' '}
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

                  {analysis.sampleDepth && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Profundidade:{' '}
                      {analysis.sampleDepth}
                    </p>
                  )}

                  {analysis.ph !==
                    undefined && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      pH: {analysis.ph}
                    </p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/cultivos/solo/${analysis.id}`
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
                          `/cultivos/solo/${analysis.id}/editar`
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
                          analysis.id
                        )
                      }
                      className="text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}