import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  getInventoryItems,
  deleteInventoryItem,
  isBelowMinimum,
} from '../../services/inventoryService'
import {
  InventoryItem,
  InventoryItemCategory,
  InventoryItemStatus,
} from '../../types'
import { getExpirationStatus } from '../../utils/date'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import InventoryExpirationBadge from '../../components/inventory/InventoryExpirationBadge'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  ArrowRightLeft,
  BellRing,
} from 'lucide-react'

interface Filters {
  search: string
  category: InventoryItemCategory | ''
  status: InventoryItemStatus | ''
}

const defaultFilters: Filters = {
  search: '',
  category: '',
  status: '',
}

const categoryOptions: InventoryItemCategory[] = [
  'Ração',
  'Medicamento veterinário',
  'Vacina',
  'Semente',
  'Fertilizante',
  'Defensivo agrícola',
  'Combustível',
  'Lubrificante',
  'Peça',
  'Material',
  'Outro',
]

const statusOptions: InventoryItemStatus[] = [
  'Ativo',
  'Inativo',
]

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function InventoryItemsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [items, setItems] = useState<InventoryItem[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [feedback, setFeedback] = useState<FeedbackType>(null)

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
      message: state.successMessage,
    })

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
    if (!feedback) {
      return
    }

    const timer = setTimeout(
      () => setFeedback(null),
      5000
    )

    return () => clearTimeout(timer)
  }, [feedback])

  const filtered = useMemo(() => {
    return items.filter(item => {
      const searchTerm =
        filters.search
          .toLowerCase()
          .trim()

      const matchesSearch =
        !searchTerm ||
        item.code
          .toLowerCase()
          .includes(searchTerm) ||
        item.name
          .toLowerCase()
          .includes(searchTerm) ||
        (
          item.location
            ?.toLowerCase()
            .includes(searchTerm) ??
          false
        ) ||
        (
          item.batchNumber
            ?.toLowerCase()
            .includes(searchTerm) ??
          false
        )

      const matchesCategory =
        !filters.category ||
        item.category === filters.category

      const matchesStatus =
        !filters.status ||
        item.status === filters.status

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      )
    })
  }, [items, filters])

  const alertCount = useMemo(() => {
    let count = 0

    for (const item of items) {
      if (item.status !== 'Ativo') {
        continue
      }

      if (isBelowMinimum(item)) {
        count++
      }

      const expirationStatus =
        getExpirationStatus(
          item.expirationDate
        )

      if (
        expirationStatus === 'Vencido' ||
        expirationStatus === 'Vence em breve'
      ) {
        count++
      }
    }

    return count
  }, [items])

  const handleDelete = (id: string) => {
    const item = items.find(
      item => item.id === id
    )

    if (!item) {
      return
    }

    if (
      window.confirm(
        `Excluir o item de estoque ${item.name}?`
      )
    ) {
      try {
        const deleted =
          deleteInventoryItem(id)

        if (deleted) {
          setFeedback({
            type: 'success',
            message:
              'Item de estoque excluído com sucesso.',
          })
        } else {
          setFeedback({
            type: 'error',
            message:
              'Item de estoque não encontrado.',
          })
        }

        loadData()
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir item de estoque.',
        })

        loadData()
      }
    }
  }

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

  const totalItems =
    items.length

  const activeItems =
    items.filter(
      item =>
        item.status === 'Ativo'
    ).length

  const belowMinimumItems =
    items.filter(
      isBelowMinimum
    ).length

  const summaryCards = [
    {
      label: 'Total de itens',
      value: totalItems,
      icon: Package,
      color:
        'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Itens ativos',
      value: activeItems,
      icon: Package,
      color:
        'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    },
    {
      label:
        'Itens abaixo do mínimo',
      value:
        belowMinimumItems,
      icon:
        AlertTriangle,
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
              Estoque
            </h1>

            <HelpTip
              title="Para que serve o Estoque?"
              description="Aqui você cadastra e acompanha os itens armazenados na propriedade, como rações, medicamentos, sementes, fertilizantes, combustíveis e peças."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Controle dos itens armazenados na propriedade.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/estoque/alertas"
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <span className="relative mr-2">
              <BellRing className="w-4 h-4" />

              {alertCount > 0 && (
                <span
                  className="absolute -top-2.5 -right-2.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold leading-none shadow-sm"
                  aria-label={`${alertCount} alerta${
                    alertCount === 1
                      ? ''
                      : 's'
                  }`}
                >
                  {alertCount > 99
                    ? '99+'
                    : alertCount}
                </span>
              )}
            </span>

            Alertas
          </Link>

          <Link
            to="/estoque/movimentacoes"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Movimentações
          </Link>

          <Button
            onClick={() =>
              navigate('/estoque/novo')
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Novo item
          </Button>
        </div>
      </div>

      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {summaryCards.map(
          card => {
            const Icon =
              card.icon

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por código, nome, lote ou localização..."
            aria-label="Pesquisar itens de estoque"
            value={filters.search}
            onChange={event =>
              setFilters(
                previous => ({
                  ...previous,
                  search:
                    event.target.value,
                })
              )
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            aria-label="Filtrar por categoria"
            value={filters.category}
            onChange={event =>
              setFilters(
                previous => ({
                  ...previous,
                  category:
                    event.target
                      .value as
                      | InventoryItemCategory
                      | '',
                })
              )
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Categoria: todas
            </option>

            {categoryOptions.map(
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
            aria-label="Filtrar por situação"
            value={filters.status}
            onChange={event =>
              setFilters(
                previous => ({
                  ...previous,
                  status:
                    event.target
                      .value as
                      | InventoryItemStatus
                      | '',
                })
              )
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Situação: todas
            </option>

            {statusOptions.map(
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

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum item de estoque cadastrado.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre o primeiro item para começar a organizar o estoque da propriedade.
          </p>

          <Button
            className="mt-4"
            onClick={() =>
              navigate('/estoque/novo')
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeiro item
          </Button>
        </div>
      ) : filtered.length ===
        0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum item encontrado com os filtros selecionados.
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
                    Lote
                  </th>

                  <th className="px-4 py-3">
                    Validade
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
                {filtered.map(
                  item => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {item.code}
                      </td>

                      <td className="px-4 py-3">
                        {item.name}
                      </td>

                      <td className="px-4 py-3">
                        {item.category}
                      </td>

                      <td className="px-4 py-3">
                        <span>
                          {formatQuantity(
                            item.currentQuantity
                          )}{' '}
                          {item.unit}
                        </span>

                        {isBelowMinimum(
                          item
                        ) && (
                          <span className="ml-2 inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            Abaixo do mínimo
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {item.batchNumber ??
                          '—'}
                      </td>

                      <td className="px-4 py-3">
                        {item.expirationDate ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span>
                              {new Date(
                                item.expirationDate +
                                  'T00:00:00'
                              ).toLocaleDateString(
                                'pt-BR'
                              )}
                            </span>

                            <InventoryExpirationBadge
                              expirationDate={
                                item.expirationDate
                              }
                            />
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            item.status ===
                            'Ativo'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/estoque/${item.id}`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Visualizar item"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/estoque/${item.id}/editar`
                              )
                            }
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Editar item"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                item.id
                              )
                            }
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                            aria-label="Excluir item"
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
              item => (
                <Card
                  key={item.id}
                  className="p-4"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {item.code}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.name}
                      </p>
                    </div>

                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        item.status ===
                        'Ativo'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      Categoria:{' '}
                      {item.category}
                    </p>

                    <p>
                      Quantidade:{' '}
                      {formatQuantity(
                        item.currentQuantity
                      )}{' '}
                      {item.unit}
                    </p>

                    {isBelowMinimum(
                      item
                    ) && (
                      <p className="text-amber-600 dark:text-amber-400 font-medium">
                        Abaixo do mínimo
                      </p>
                    )}

                    {item.batchNumber && (
                      <p>
                        Lote:{' '}
                        {item.batchNumber}
                      </p>
                    )}

                    {item.expirationDate && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span>
                          Validade:{' '}
                          {new Date(
                            item.expirationDate +
                              'T00:00:00'
                          ).toLocaleDateString(
                            'pt-BR'
                          )}
                        </span>

                        <InventoryExpirationBadge
                          expirationDate={
                            item.expirationDate
                          }
                        />
                      </div>
                    )}

                    {item.location && (
                      <p>
                        Localização:{' '}
                        {item.location}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/estoque/${item.id}`
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
                          `/estoque/${item.id}/editar`
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
                          item.id
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