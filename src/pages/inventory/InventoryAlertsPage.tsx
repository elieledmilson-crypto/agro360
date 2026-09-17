import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  getInventoryItems,
  isBelowMinimum,
} from '../../services/inventoryService'
import { InventoryItem } from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import InventoryExpirationBadge from '../../components/inventory/InventoryExpirationBadge'
import { getExpirationStatus } from '../../utils/date'
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  PackageX,
  Eye,
} from 'lucide-react'

type AlertKind =
  | 'below-minimum'
  | 'expired'
  | 'expiring-soon'

interface AlertEntry {
  item: InventoryItem
  kind: AlertKind
}

interface Filters {
  search: string
  kind: AlertKind | ''
}

const defaultFilters: Filters = {
  search: '',
  kind: '',
}

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function InventoryAlertsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [items, setItems] =
    useState<InventoryItem[]>([])

  const [filters, setFilters] =
    useState<Filters>(defaultFilters)

  const [feedback, setFeedback] =
    useState<FeedbackType>(null)

  const loadData = useCallback(() => {
    setItems(getInventoryItems())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const state = location.state as
      | {
          successMessage?: string
        }
      | null

    if (!state?.successMessage) {
      return
    }

    setFeedback({
      type: 'success',
      message:
        state.successMessage,
    })

    navigate(
      location.pathname,
      {
        replace: true,
        state: null,
      }
    )
  }, [
    location.pathname,
    location.state,
    navigate,
  ])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timer =
      setTimeout(
        () =>
          setFeedback(null),
        5000
      )

    return () =>
      clearTimeout(timer)
  }, [feedback])

  const alerts:
    AlertEntry[] = useMemo(
    () => {
      const result:
        AlertEntry[] = []

      for (const item of items) {
        if (
          item.status !== 'Ativo'
        ) {
          continue
        }

        if (
          isBelowMinimum(item)
        ) {
          result.push({
            item,
            kind:
              'below-minimum',
          })
        }

        const expirationStatus =
          getExpirationStatus(
            item.expirationDate
          )

        if (
          expirationStatus ===
          'Vencido'
        ) {
          result.push({
            item,
            kind: 'expired',
          })
        } else if (
          expirationStatus ===
          'Vence em breve'
        ) {
          result.push({
            item,
            kind:
              'expiring-soon',
          })
        }
      }

      return result
    },
    [items]
  )

  const filtered =
    useMemo(() => {
      return alerts.filter(
        entry => {
          const searchTerm =
            filters.search
              .toLowerCase()
              .trim()

          const matchesSearch =
            !searchTerm ||
            entry.item.code
              .toLowerCase()
              .includes(
                searchTerm
              ) ||
            entry.item.name
              .toLowerCase()
              .includes(
                searchTerm
              )

          const matchesKind =
            !filters.kind ||
            entry.kind ===
              filters.kind

          return (
            matchesSearch &&
            matchesKind
          )
        }
      )
    }, [alerts, filters])

  const belowMinimumCount =
    useMemo(
      () =>
        alerts.filter(
          alert =>
            alert.kind ===
            'below-minimum'
        ).length,
      [alerts]
    )

  const expiredCount =
    useMemo(
      () =>
        alerts.filter(
          alert =>
            alert.kind ===
            'expired'
        ).length,
      [alerts]
    )

  const expiringSoonCount =
    useMemo(
      () =>
        alerts.filter(
          alert =>
            alert.kind ===
            'expiring-soon'
        ).length,
      [alerts]
    )

  const formatQuantity = (
    value: number
  ) =>
    value.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )

  const kindBadge = (
    kind: AlertKind
  ) => {
    if (
      kind ===
      'below-minimum'
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <AlertTriangle className="w-3 h-3" />
          Abaixo do mínimo
        </span>
      )
    }

    if (
      kind === 'expired'
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
          <PackageX className="w-3 h-3" />
          Vencido
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
        <Clock className="w-3 h-3" />
        Vence em breve
      </span>
    )
  }

  const summaryCards = [
    {
      label:
        'Abaixo do mínimo',
      value:
        belowMinimumCount,
      icon:
        AlertTriangle,
      color:
        'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    },
    {
      label:
        'Vencidos',
      value:
        expiredCount,
      icon:
        PackageX,
      color:
        'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    },
    {
      label:
        'Próximos do vencimento',
      value:
        expiringSoonCount,
      icon:
        Clock,
      color:
        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate('/estoque')
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para estoque
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Alertas de Estoque
            </h1>

            <HelpTip
              title="Para que servem os alertas?"
              description="Aqui você acompanha itens abaixo do mínimo, produtos vencidos e produtos próximos do vencimento. Apenas itens ativos são exibidos."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Situações que precisam
            da sua atenção no estoque.
          </p>
        </div>
      </div>

      {feedback && (
        <PageFeedback
          type={
            feedback.type
          }
          message={
            feedback.message
          }
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {summaryCards.map(
          card => {
            const Icon =
              card.icon

            return (
              <Card
                key={
                  card.label
                }
                className="p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {
                        card.label
                      }
                    </p>

                    <p className="text-2xl font-bold mt-1">
                      {
                        card.value
                      }
                    </p>
                  </div>

                  <div
                    className={`p-2 rounded-lg ${card.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            )
          }
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por código ou nome..."
            value={
              filters.search
            }
            onChange={event =>
              setFilters(
                previous => ({
                  ...previous,
                  search:
                    event
                      .target
                      .value,
                })
              )
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={
              filters.kind
            }
            onChange={event =>
              setFilters(
                previous => ({
                  ...previous,
                  kind:
                    event
                      .target
                      .value as
                      | AlertKind
                      | '',
                })
              )
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Tipo: todos
            </option>

            <option value="below-minimum">
              Abaixo do mínimo
            </option>

            <option value="expired">
              Vencidos
            </option>

            <option value="expiring-soon">
              Próximos do vencimento
            </option>
          </select>

          <button
            onClick={() =>
              setFilters(
                defaultFilters
              )
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline self-center"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum alerta no
            momento.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Todos os itens ativos
            estão dentro dos
            parâmetros definidos.
          </p>
        </div>
      ) : filtered.length ===
        0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum alerta
            encontrado com os
            filtros selecionados.
          </p>

          <button
            onClick={() =>
              setFilters(
                defaultFilters
              )
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
                    Categoria
                  </th>

                  <th className="px-4 py-3">
                    Quantidade
                  </th>

                  <th className="px-4 py-3">
                    Validade
                  </th>

                  <th className="px-4 py-3">
                    Alerta
                  </th>

                  <th className="px-4 py-3">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(
                  entry => (
                    <tr
                      key={`${entry.item.id}-${entry.kind}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {
                          entry
                            .item
                            .code
                        }
                      </td>

                      <td className="px-4 py-3">
                        {
                          entry
                            .item
                            .name
                        }
                      </td>

                      <td className="px-4 py-3">
                        {
                          entry
                            .item
                            .category
                        }
                      </td>

                      <td className="px-4 py-3">
                        {formatQuantity(
                          entry
                            .item
                            .currentQuantity
                        )}{' '}
                        {
                          entry
                            .item
                            .unit
                        }
                      </td>

                      <td className="px-4 py-3">
                        {entry
                          .item
                          .expirationDate ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span>
                              {new Date(
                                entry
                                  .item
                                  .expirationDate +
                                  'T00:00:00'
                              ).toLocaleDateString(
                                'pt-BR'
                              )}
                            </span>

                            <InventoryExpirationBadge
                              expirationDate={
                                entry
                                  .item
                                  .expirationDate
                              }
                            />
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            Sem validade
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {kindBadge(
                          entry.kind
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            navigate(
                              `/estoque/${entry.item.id}`
                            )
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Visualizar item"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(
              entry => (
                <Card
                  key={`${entry.item.id}-${entry.kind}`}
                  className="p-4"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {
                          entry
                            .item
                            .code
                        }
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {
                          entry
                            .item
                            .name
                        }
                      </p>
                    </div>

                    {kindBadge(
                      entry.kind
                    )}
                  </div>

                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      Categoria:{' '}
                      {
                        entry
                          .item
                          .category
                      }
                    </p>

                    <p>
                      Quantidade:{' '}
                      {formatQuantity(
                        entry
                          .item
                          .currentQuantity
                      )}{' '}
                      {
                        entry
                          .item
                          .unit
                      }
                    </p>

                    {entry
                      .item
                      .expirationDate && (
                      <p>
                        Validade:{' '}
                        {new Date(
                          entry
                            .item
                            .expirationDate +
                            'T00:00:00'
                        ).toLocaleDateString(
                          'pt-BR'
                        )}
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/estoque/${entry.item.id}`
                        )
                      }
                      className="text-xs px-2 py-1"
                    >
                      Ver
                    </Button>
                  </div>
                </Card>
              )
            )}
          </div>
        </>
      )}

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Você também pode acessar
        esta lista a partir da{' '}
        <Link
          to="/estoque"
          className="text-green-600 hover:underline"
        >
          página do estoque
        </Link>
        .
      </p>
    </div>
  )
}