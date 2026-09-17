import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  getEmployees,
  getAccessAccountByEmployeeId,
} from '../../services/employeeService'
import {
  AccessAccount,
  Employee,
  EmployeeStatus,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Plus, Eye, Pencil } from 'lucide-react'

interface Filters {
  search: string
  status: EmployeeStatus | ''
}

const defaultFilters: Filters = {
  search: '',
  status: '',
}

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

interface EmployeeRow {
  employee: Employee
  account?: AccessAccount
}

export default function EmployeesPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [rows, setRows] = useState<EmployeeRow[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const loadData = useCallback(() => {
    const employees = getEmployees()

    setRows(
      employees.map(employee => ({
        employee,
        account: getAccessAccountByEmployeeId(employee.id),
      })),
    )
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
    return rows.filter(({ employee }) => {
      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        employee.name.toLowerCase().includes(searchTerm) ||
        employee.function.toLowerCase().includes(searchTerm) ||
        (employee.phone?.toLowerCase().includes(searchTerm) ?? false) ||
        (employee.email?.toLowerCase().includes(searchTerm) ?? false)

      const matchesStatus =
        !filters.status || employee.status === filters.status

      return matchesSearch && matchesStatus
    })
  }, [rows, filters])

  const renderAccessBadge = (account?: AccessAccount) => {
    if (!account) {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          Sem conta
        </span>
      )
    }

    if (account.status === 'Inativo') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Conta inativa
        </span>
      )
    }

    if (account.role === 'admin') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          Administrador
        </span>
      )
    }

    return (
      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
        Usuário
      </span>
    )
  }

  const renderStatusBadge = (status: EmployeeStatus) => {
    if (status === 'Ativo') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
          Ativo
        </span>
      )
    }

    return (
      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
        Inativo
      </span>
    )
  }

  const getContactLabel = (employee: Employee): string => {
    if (employee.phone && employee.email) {
      return `${employee.phone} · ${employee.email}`
    }
    if (employee.phone) return employee.phone
    if (employee.email) return employee.email
    return '—'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">Funcionários</h1>

            <HelpTip
              title="Para que servem os funcionários?"
              description="Aqui você cadastra as pessoas que trabalham na propriedade e define quem tem acesso ao Agro360, com quais permissões."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Gerencie funcionários e acessos ao Agro360.
          </p>
        </div>

        <Button onClick={() => navigate('/funcionarios/novo')}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Novo funcionário
        </Button>
      </div>

      {feedback && (
        <PageFeedback type={feedback.type} message={feedback.message} />
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Pesquisar por nome, função, telefone ou e-mail..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
            className="md:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={filters.status}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                status: e.target.value as EmployeeStatus | '',
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Status: todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>

          <button
            onClick={() => setFilters(defaultFilters)}
            className="md:col-span-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline justify-self-start"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum funcionário cadastrado.
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre o primeiro funcionário da propriedade.
          </p>

          <Button
            className="mt-4"
            onClick={() => navigate('/funcionarios/novo')}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar primeiro funcionário
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum funcionário encontrado com os filtros selecionados.
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
                  <th className="px-4 py-3">Função</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Acesso</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(({ employee, account }) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {employee.name}
                    </td>

                    <td className="px-4 py-3">{employee.function}</td>

                    <td className="px-4 py-3">
                      {getContactLabel(employee)}
                    </td>

                    <td className="px-4 py-3">
                      {renderStatusBadge(employee.status)}
                    </td>

                    <td className="px-4 py-3">
                      {renderAccessBadge(account)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/funcionarios/${employee.id}`)
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Visualizar funcionário"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/funcionarios/${employee.id}/editar`)
                          }
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Editar funcionário"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(({ employee, account }) => (
              <Card key={employee.id} className="p-4">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <p className="font-medium">{employee.name}</p>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {employee.function}
                    </p>
                  </div>

                  {renderStatusBadge(employee.status)}
                </div>

                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>Contato: {getContactLabel(employee)}</p>

                  <div className="mt-1">
                    {renderAccessBadge(account)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/funcionarios/${employee.id}`}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Ver
                  </Link>

                  <Link
                    to={`/funcionarios/${employee.id}/editar`}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Editar
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}