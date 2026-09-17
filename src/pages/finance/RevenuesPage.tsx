import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  getFinancialTransactions,
  getFinancialCategories,
  deleteFinancialTransaction,
} from '../../services/financeService'
import {
  FinancialCategory,
  FinancialTransaction,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { formatCurrencyBRL } from '../../utils/format'
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react'

interface Filters {
  search: string
  categoryId: string
  dateFrom: string
  dateTo: string
}

const defaultFilters: Filters = {
  search: '',
  categoryId: '',
  dateFrom: '',
  dateTo: '',
}

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function RevenuesPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [transactions, setTransactions] = useState<
    FinancialTransaction[]
  >([])
  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const loadData = useCallback(() => {
    setTransactions(getFinancialTransactions())
    setCategories(getFinancialCategories())
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

  const revenues = useMemo(
    () => transactions.filter(t => t.type === 'Receita'),
    [transactions],
  )

  const revenueCategories = useMemo(
    () => categories.filter(c => c.type === 'Receita'),
    [categories],
  )

  const filtered = useMemo(() => {
    return revenues.filter(t => {
      const category = categories.find(c => c.id === t.categoryId)

      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        t.description.toLowerCase().includes(searchTerm) ||
        (category?.name.toLowerCase().includes(searchTerm) ?? false) ||
        (t.notes?.toLowerCase().includes(searchTerm) ?? false)

      const matchesCategory =
        !filters.categoryId || t.categoryId === filters.categoryId

      const matchesDateFrom =
        !filters.dateFrom || t.date >= filters.dateFrom

      const matchesDateTo =
        !filters.dateTo || t.date <= filters.dateTo

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDateFrom &&
        matchesDateTo
      )
    })
  }, [revenues, categories, filters])

  const total = useMemo(
    () => filtered.reduce((sum, t) => sum + t.amount, 0),
    [filtered],
  )

  const handleDelete = (id: string) => {
    const transaction = transactions.find(t => t.id === id)
    if (!transaction) return

    if (window.confirm(`Excluir a receita ${transaction.description}?`)) {
      try {
        const deleted = deleteFinancialTransaction(id)

        if (deleted) {
          setFeedback({
            type: 'success',
            message: 'Receita excluída com sucesso.',
          })
        } else {
          setFeedback({
            type: 'error',
            message: 'Receita não encontrada.',
          })
        }

        loadData()
      } catch (error) {
        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao excluir receita.',
        })

        loadData()
      }
    }
  }

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name ?? 'Categoria não encontrada'
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
            <h1 className="text-2xl font-bold">Receitas</h1>

            <HelpTip
              title="O que são receitas?"
              description="São entradas financeiras da propriedade, como venda de gado, venda de grãos, arrendamentos e outras fontes de renda."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe as receitas da propriedade.
          </p>
        </div>

        <Button onClick={() => navigate('/financeiro/receitas/nova')}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Nova receita
        </Button>
      </div>

      {feedback && (
        <PageFeedback type={feedback.type} message={feedback.message} />
      )}

      <Card className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total das receitas filtradas
        </p>

        <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
          {formatCurrencyBRL(total)}
        </p>
      </Card>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por descrição, categoria ou observações..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                search: e.target.value,
              }))
            }
            className="md:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={filters.categoryId}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                categoryId: e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Categoria: todas</option>

            {revenueCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                dateFrom: e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                dateTo: e.target.value,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            onClick={() => setFilters(defaultFilters)}
            className="md:col-span-5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline justify-self-start"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {revenues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma receita cadastrada.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Registre a primeira receita da propriedade.
          </p>

          <Button
            className="mt-4"
            onClick={() => navigate('/financeiro/receitas/nova')}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeira receita
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma receita encontrada com os filtros selecionados.
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
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(transaction => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      {formatDate(transaction.date)}
                    </td>

                    <td className="px-4 py-3">
                      {getCategoryName(transaction.categoryId)}
                    </td>

                    <td className="px-4 py-3">
                      {transaction.description}
                    </td>

                    <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">
                      {formatCurrencyBRL(transaction.amount)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/financeiro/receitas/${transaction.id}`,
                            )
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Visualizar receita"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(
                              `/financeiro/receitas/${transaction.id}/editar`,
                            )
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Editar receita"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                          aria-label="Excluir receita"
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
            {filtered.map(transaction => (
              <Card key={transaction.id} className="p-4">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <p className="font-medium text-sm">
                      {formatDate(transaction.date)}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getCategoryName(transaction.categoryId)}
                    </p>
                  </div>

                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrencyBRL(transaction.amount)}
                  </span>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {transaction.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/financeiro/receitas/${transaction.id}`}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Ver
                  </Link>

                  <Link
                    to={`/financeiro/receitas/${transaction.id}/editar`}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Editar
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() => handleDelete(transaction.id)}
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