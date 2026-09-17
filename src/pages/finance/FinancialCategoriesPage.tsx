import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  getFinancialCategories,
  deleteFinancialCategory,
  getFinancialCategoryTransactionCount,
  getFinancialTransactions,
} from '../../services/financeService'
import {
  FinancialCategory,
  FinancialTransaction,
  FinancialTransactionType,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Filters {
  search: string
  type: FinancialTransactionType | ''
}

const defaultFilters: Filters = {
  search: '',
  type: '',
}

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function FinancialCategoriesPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [transactions, setTransactions] = useState<
    FinancialTransaction[]
  >([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const loadData = useCallback(() => {
    setCategories(getFinancialCategories())
    setTransactions(getFinancialTransactions())
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
    return categories.filter(category => {
      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        category.name.toLowerCase().includes(searchTerm) ||
        (category.description?.toLowerCase().includes(searchTerm) ?? false)

      const matchesType = !filters.type || category.type === filters.type

      return matchesSearch && matchesType
    })
  }, [categories, filters])

  const handleDelete = (id: string) => {
    const category = categories.find(c => c.id === id)
    if (!category) return

    if (
      window.confirm(
        `Excluir a categoria ${category.name}?`,
      )
    ) {
      try {
        const deleted = deleteFinancialCategory(id)

        if (deleted) {
          setFeedback({
            type: 'success',
            message: 'Categoria financeira excluída com sucesso.',
          })
        } else {
          setFeedback({
            type: 'error',
            message: 'Categoria financeira não encontrada.',
          })
        }

        loadData()
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir categoria.',
        })

        loadData()
      }
    }
  }

  const renderTypeBadge = (type: FinancialTransactionType) => {
    if (type === 'Receita') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
          Receita
        </span>
      )
    }

    return (
      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
        Despesa
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/financeiro')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
          >
            ← Voltar para Financeiro
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Categorias Financeiras
            </h1>

            <HelpTip
              title="Para que servem as categorias?"
              description="As categorias organizam as movimentações financeiras em grupos como venda de gado, custeio agrícola, manutenção de máquinas e outros."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Organize suas receitas e despesas em categorias.
          </p>
        </div>

        <Button
          onClick={() => navigate('/financeiro/categorias/nova')}
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Nova categoria
        </Button>
      </div>

      {feedback && (
        <PageFeedback type={feedback.type} message={feedback.message} />
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por nome ou descrição..."
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
                type: e.target.value as
                  | FinancialTransactionType
                  | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Tipo: todos</option>
            <option value="Receita">Receita</option>
            <option value="Despesa">Despesa</option>
          </select>

          <button
            onClick={() => setFilters(defaultFilters)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline self-center"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma categoria financeira cadastrada.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre a primeira categoria para começar a registrar receitas e
            despesas.
          </p>

          <Button
            className="mt-4"
            onClick={() => navigate('/financeiro/categorias/nova')}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeira categoria
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma categoria encontrada com os filtros selecionados.
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
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Movimentações</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(category => (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {category.name}
                    </td>

                    <td className="px-4 py-3">
                      {renderTypeBadge(category.type)}
                    </td>

                    <td className="px-4 py-3">
                      {category.description ?? '—'}
                    </td>

                    <td className="px-4 py-3">
                      {transactions.filter(
                        t => t.categoryId === category.id,
                      ).length}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/financeiro/categorias/${category.id}/editar`,
                            )
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Editar categoria"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                          aria-label="Excluir categoria"
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
            {filtered.map(category => (
              <Card key={category.id} className="p-4">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <p className="font-medium">{category.name}</p>

                    {category.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.description}
                      </p>
                    )}

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getFinancialCategoryTransactionCount(category.id)}{' '}
                      {getFinancialCategoryTransactionCount(category.id) ===
                      1
                        ? 'movimentação'
                        : 'movimentações'}
                    </p>
                  </div>

                  {renderTypeBadge(category.type)}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/financeiro/categorias/${category.id}/editar`}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Editar
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() => handleDelete(category.id)}
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