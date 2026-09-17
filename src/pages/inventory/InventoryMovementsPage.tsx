import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  getInventoryMovements,
  getInventoryItems,
  getInventoryItemById,
} from '../../services/inventoryService'
import {
  InventoryItem,
  InventoryItemCategory,
  InventoryMovement,
  InventoryMovementType,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  Plus,
  Eye,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react'

type OriginFilter =
  | ''
  | 'manual'
  | 'vaccination'
  | 'treatment'
  | 'crop-management'
  | 'machine-maintenance'

interface Filters {
  search: string
  inventoryItemId: string
  type: InventoryMovementType | ''
  category: InventoryItemCategory | ''
  origin: OriginFilter
  dateFrom: string
  dateTo: string
}

const defaultFilters: Filters = {
  search: '',
  inventoryItemId: '',
  type: '',
  category: '',
  origin: '',
  dateFrom: '',
  dateTo: '',
}

const typeOptions: InventoryMovementType[] = ['Entrada', 'Saída']

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

const originOptions: { value: OriginFilter; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'vaccination', label: 'Baixa por vacinação' },
  { value: 'treatment', label: 'Baixa por tratamento' },
  { value: 'crop-management', label: 'Baixa por manejo agrícola' },
  { value: 'machine-maintenance', label: 'Baixa por manutenção de máquina' },
]

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

function getOriginLabel(movement: InventoryMovement): string {
  if (!movement.origin) return 'Manual'

  const { module, type } = movement.origin

  if (module === 'health' && type === 'vaccination') {
    return 'Baixa por vacinação'
  }

  if (module === 'health' && type === 'treatment') {
    return 'Baixa por tratamento'
  }

  if (module === 'crops' && type === 'crop-management') {
    return 'Baixa por manejo agrícola'
  }

  if (module === 'machines' && type === 'machine-maintenance') {
    return 'Baixa por manutenção de máquina'
  }

  return 'Origem desconhecida'
}

function movementMatchesOrigin(
  movement: InventoryMovement,
  origin: OriginFilter
): boolean {
  if (origin === '') return true
  if (origin === 'manual') return movement.origin === undefined

  return movement.origin?.type === origin
}

export default function InventoryMovementsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])

  const [filters, setFilters] = useState<Filters>(() => {
    const query = new URLSearchParams(location.search)

    const requestedItemId = query.get('inventoryItemId') ?? ''

    const validItemId =
      requestedItemId && getInventoryItemById(requestedItemId)
        ? requestedItemId
        : ''

    return {
      ...defaultFilters,
      inventoryItemId: validItemId,
    }
  })

  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const loadData = useCallback(() => {
    setMovements(getInventoryMovements())
    setItems(getInventoryItems())
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

  const getItemForMovement = useCallback(
    (movement: InventoryMovement): InventoryItem | undefined =>
      items.find(item => item.id === movement.inventoryItemId),
    [items]
  )

  const filtered = useMemo(() => {
    return movements.filter(movement => {
      const item = getItemForMovement(movement)

      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        (item?.code.toLowerCase().includes(searchTerm) ?? false) ||
        (item?.name.toLowerCase().includes(searchTerm) ?? false) ||
        (movement.itemCodeSnapshot?.toLowerCase().includes(searchTerm) ??
          false) ||
        (movement.itemNameSnapshot?.toLowerCase().includes(searchTerm) ??
          false) ||
        movement.reason.toLowerCase().includes(searchTerm) ||
        (movement.responsible?.toLowerCase().includes(searchTerm) ?? false) ||
        (movement.notes?.toLowerCase().includes(searchTerm) ?? false)

      const matchesItem =
        !filters.inventoryItemId ||
        movement.inventoryItemId === filters.inventoryItemId

      const matchesType = !filters.type || movement.type === filters.type

      const matchesCategory =
        !filters.category || item?.category === filters.category

      const matchesOriginFilter = movementMatchesOrigin(
        movement,
        filters.origin
      )

      const matchesDateFrom =
        !filters.dateFrom || movement.movementDate >= filters.dateFrom

      const matchesDateTo =
        !filters.dateTo || movement.movementDate <= filters.dateTo

      return (
        matchesSearch &&
        matchesItem &&
        matchesType &&
        matchesCategory &&
        matchesOriginFilter &&
        matchesDateFrom &&
        matchesDateTo
      )
    })
  }, [movements, filters, getItemForMovement])

  const summary = useMemo(() => {
    let entries = 0
    let exits = 0
    let integrated = 0

    for (const movement of filtered) {
      if (movement.type === 'Entrada') {
        entries++
      } else {
        exits++
      }

      if (movement.origin !== undefined) {
        integrated++
      }
    }

    return {
      total: filtered.length,
      entries,
      exits,
      integrated,
    }
  }, [filtered])

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')

  const formatQuantity = (value: number) =>
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })

  const getItemLabel = (movement: InventoryMovement): string => {
    if (movement.itemCodeSnapshot && movement.itemNameSnapshot) {
      return `${movement.itemCodeSnapshot} — ${movement.itemNameSnapshot}`
    }

    const item = getItemForMovement(movement)

    if (!item) return 'Item não encontrado'

    return `${item.code} — ${item.name}`
  }

  const getItemUnit = (movement: InventoryMovement): string => {
    if (movement.unitSnapshot) return movement.unitSnapshot

    const item = getItemForMovement(movement)

    return item?.unit ?? ''
  }

  const renderTypeBadge = (type: InventoryMovementType) => {
    if (type === 'Entrada') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
          <ArrowDownCircle className="w-3 h-3" />
          Entrada
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
        <ArrowUpCircle className="w-3 h-3" />
        Saída
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Histórico Consolidado de Estoque
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você acompanha todas as entradas e saídas registradas no estoque, incluindo movimentações manuais e baixas integradas a outros módulos."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Registro histórico de todas as movimentações do estoque.
          </p>
        </div>

        <Button onClick={() => navigate('/estoque/movimentacoes/nova')}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Nova movimentação
        </Button>
      </div>

      {feedback && (
        <PageFeedback type={feedback.type} message={feedback.message} />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Movimentações filtradas
          </p>
          <p className="text-2xl font-bold mt-1">{summary.total}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Entradas</p>
          <p className="text-2xl font-bold mt-1">{summary.entries}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Saídas</p>
          <p className="text-2xl font-bold mt-1">{summary.exits}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Integradas
          </p>
          <p className="text-2xl font-bold mt-1">{summary.integrated}</p>
        </Card>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por item, motivo ou responsável..."
            aria-label="Pesquisar movimentações"
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
            className="md:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            aria-label="Filtrar por item"
            value={filters.inventoryItemId}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                inventoryItemId: e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Item: todos</option>

            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.code} — {item.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por tipo"
            value={filters.type}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                type: e.target.value as InventoryMovementType | '',
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
            aria-label="Filtrar por categoria"
            value={filters.category}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                category: e.target.value as InventoryItemCategory | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Categoria: todas</option>

            {categoryOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por origem"
            value={filters.origin}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                origin: e.target.value as OriginFilter,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Origem: todas</option>

            {originOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            aria-label="Data inicial"
            value={filters.dateFrom}
            onChange={e =>
              setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="date"
            aria-label="Data final"
            value={filters.dateTo}
            onChange={e =>
              setFilters(prev => ({ ...prev, dateTo: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            onClick={() => setFilters(defaultFilters)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline self-center"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {movements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma movimentação registrada.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Registre a primeira entrada ou saída de estoque.
          </p>

          <Button
            className="mt-4"
            onClick={() => navigate('/estoque/movimentacoes/nova')}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Registrar primeira movimentação
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma movimentação encontrada com os filtros selecionados.
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
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Quantidade</th>
                  <th className="px-4 py-3">Saldo antes</th>
                  <th className="px-4 py-3">Saldo após</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(movement => {
                  const unit = getItemUnit(movement)

                  return (
                    <tr
                      key={movement.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        {formatDate(movement.movementDate)}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {getItemLabel(movement)}
                      </td>

                      <td className="px-4 py-3">
                        {renderTypeBadge(movement.type)}
                      </td>

                      <td className="px-4 py-3">
                        {formatQuantity(movement.quantity)} {unit}
                      </td>

                      <td className="px-4 py-3">
                        {formatQuantity(movement.balanceBefore)} {unit}
                      </td>

                      <td className="px-4 py-3">
                        {formatQuantity(movement.balanceAfter)} {unit}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        {getOriginLabel(movement)}
                      </td>

                      <td className="px-4 py-3">{movement.reason}</td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            navigate(`/estoque/movimentacoes/${movement.id}`)
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Visualizar movimentação"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(movement => {
              const unit = getItemUnit(movement)

              return (
                <Card key={movement.id} className="p-4">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {formatDate(movement.movementDate)}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getItemLabel(movement)}
                      </p>
                    </div>

                    {renderTypeBadge(movement.type)}
                  </div>

                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      Quantidade: {formatQuantity(movement.quantity)} {unit}
                    </p>

                    <p>
                      Saldo antes: {formatQuantity(movement.balanceBefore)}{' '}
                      {unit}
                    </p>

                    <p>
                      Saldo após: {formatQuantity(movement.balanceAfter)} {unit}
                    </p>

                    <p>Origem: {getOriginLabel(movement)}</p>

                    <p>Motivo: {movement.reason}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/estoque/movimentacoes/${movement.id}`)
                      }
                      className="text-xs px-2 py-1"
                    >
                      Ver
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {items.length === 0 && movements.length === 0 && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Para registrar movimentações,{' '}
          <Link to="/estoque/novo" className="text-green-600 hover:underline">
            cadastre primeiro um item de estoque
          </Link>
          .
        </p>
      )}
    </div>
  )
}