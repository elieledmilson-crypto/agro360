import {
  useState,
  useEffect,
  useMemo,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getFinancialCategories,
  getFinancialTransactions,
} from '../../services/financeService'
import {
  FinancialCategory,
  FinancialTransaction,
} from '../../types'
import Card from '../../components/ui/Card'
import HelpTip from '../../components/ui/HelpTip'
import { formatCurrencyBRL } from '../../utils/format'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRightLeft,
  Tag,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react'

interface PeriodFilter {
  startDate: string
  endDate: string
}

const defaultPeriod: PeriodFilter = {
  startDate: '',
  endDate: '',
}

export default function FinanceDashboardPage() {
  const navigate = useNavigate()

  const [transactions, setTransactions] = useState<
    FinancialTransaction[]
  >([])

  const [categories, setCategories] = useState<
    FinancialCategory[]
  >([])

  const [period, setPeriod] = useState<PeriodFilter>(defaultPeriod)

  useEffect(() => {
    setTransactions(getFinancialTransactions())
    setCategories(getFinancialCategories())
  }, [])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      if (period.startDate && transaction.date < period.startDate) {
        return false
      }

      if (period.endDate && transaction.date > period.endDate) {
        return false
      }

      return true
    })
  }, [transactions, period])

  const receitas = useMemo(
    () =>
      filteredTransactions.filter(t => t.type === 'Receita'),
    [filteredTransactions],
  )

  const despesas = useMemo(
    () =>
      filteredTransactions.filter(t => t.type === 'Despesa'),
    [filteredTransactions],
  )

  const totalReceitas = useMemo(
    () => receitas.reduce((sum, t) => sum + t.amount, 0),
    [receitas],
  )

  const totalDespesas = useMemo(
    () => despesas.reduce((sum, t) => sum + t.amount, 0),
    [despesas],
  )

  const resultado = totalReceitas - totalDespesas

  const resultadoStyles = useMemo(() => {
    if (resultado > 0) {
      return {
        color:
          'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
        label: 'Resultado positivo',
      }
    }

    if (resultado < 0) {
      return {
        color:
          'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
        label: 'Resultado negativo',
      }
    }

    return {
      color:
        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      label: 'Resultado neutro',
    }
  }, [resultado])

  const recentTransactions = useMemo(() => {
    return [...filteredTransactions].slice(0, 5)
  }, [filteredTransactions])

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name ?? 'Categoria não encontrada'
  }

  const handleClearPeriod = () => {
    setPeriod(defaultPeriod)
  }

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">Financeiro</h1>

            <HelpTip
              title="Para que serve o Financeiro?"
              description="Aqui você acompanha receitas, despesas e o resultado financeiro da propriedade no período selecionado."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Indicadores financeiros da propriedade.
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label
              htmlFor="finance-period-start"
              className="block text-sm font-medium mb-1"
            >
              Data inicial
            </label>

            <input
              id="finance-period-start"
              type="date"
              value={period.startDate}
              onChange={e =>
                setPeriod(prev => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label
              htmlFor="finance-period-end"
              className="block text-sm font-medium mb-1"
            >
              Data final
            </label>

            <input
              id="finance-period-end"
              type="date"
              value={period.endDate}
              onChange={e =>
                setPeriod(prev => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="self-end">
            <button
              type="button"
              onClick={handleClearPeriod}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
            >
              Limpar período
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receitas
              </p>

              <p className="text-2xl font-bold mt-1">
                {formatCurrencyBRL(totalReceitas)}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {receitas.length}{' '}
                {receitas.length === 1 ? 'lançamento' : 'lançamentos'}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Despesas
              </p>

              <p className="text-2xl font-bold mt-1">
                {formatCurrencyBRL(totalDespesas)}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {despesas.length}{' '}
                {despesas.length === 1 ? 'lançamento' : 'lançamentos'}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Resultado
              </p>

              <p className="text-2xl font-bold mt-1">
                {formatCurrencyBRL(resultado)}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {resultadoStyles.label}
              </p>
            </div>

            <div
              className={`p-2 rounded-lg ${resultadoStyles.color}`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">
          Acesso rápido
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Link
            to="/financeiro/receitas/nova"
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova receita
          </Link>

          <Link
            to="/financeiro/despesas/nova"
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova despesa
          </Link>

          <Link
            to="/financeiro/receitas"
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-center"
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            Receitas
          </Link>

          <Link
            to="/financeiro/despesas"
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-center"
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" />
            Despesas
          </Link>

          <Link
            to="/financeiro/categorias"
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-center"
          >
            <Tag className="w-4 h-4 mr-2" />
            Categorias
          </Link>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">
              Últimas movimentações
            </h2>

            <HelpTip
              title="O que são as últimas movimentações?"
              description="Mostra as 5 movimentações financeiras mais recentes dentro do período selecionado."
            />
          </div>

          <Link
            to="/financeiro/receitas"
            className="inline-flex items-center text-sm text-green-600 hover:underline"
          >
            <ArrowRightLeft className="w-4 h-4 mr-1" />
            Ver receitas
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhuma movimentação financeira registrada no período.
          </p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map(transaction => (
              <button
                key={transaction.id}
                onClick={() =>
                  navigate(
                    transaction.type === 'Receita'
                      ? `/financeiro/receitas/${transaction.id}`
                      : `/financeiro/despesas/${transaction.id}`,
                  )
                }
                className="block w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {formatDate(transaction.date)} ·{' '}
                      {transaction.type}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {transaction.description}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Categoria: {getCategoryName(transaction.categoryId)}
                    </p>
                  </div>

                  <span
                    className={`font-medium ${
                      transaction.type === 'Receita'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrencyBRL(transaction.amount)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}