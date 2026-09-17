import {
  useState,
  useEffect,
  useMemo,
} from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
} from 'react-router-dom'
import {
  getEmployeeById,
  getAccessAccountByEmployeeId,
} from '../../services/employeeService'
import { getPermissionLabel } from '../../services/permissionService'
import { Employee } from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Pencil, ArrowLeft, UserX } from 'lucide-react'

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function EmployeeDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const employee: Employee | undefined = useMemo(
    () => (id ? getEmployeeById(id) : undefined),
    [id],
  )

  const account = useMemo(
    () => (id ? getAccessAccountByEmployeeId(id) : undefined),
    [id],
  )

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

  if (!employee) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Funcionário não encontrado
        </p>

        <Button
          className="mt-4"
          onClick={() => navigate('/funcionarios')}
        >
          Voltar para funcionários
        </Button>
      </div>
    )
  }

  const renderAccountStatusBadge = () => {
    if (!account) return null

    if (account.status === 'Ativo') {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
          Ativo
        </span>
      )
    }

    return (
      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        Inativo
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <PageFeedback type={feedback.type} message={feedback.message} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/funcionarios')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para funcionários
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{employee.name}</h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta os dados do funcionário e o estado atual da conta de acesso."
            />
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            {employee.function}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/funcionarios/${employee.id}/editar`)
            }
          >
            <Pencil className="w-4 h-4 mr-2 inline" />
            Editar
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">
          Dados pessoais
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nome
            </p>
            <p className="font-medium">{employee.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Função
            </p>
            <p className="font-medium">{employee.function}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Telefone
            </p>
            <p className="font-medium">
              {employee.phone ?? 'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              E-mail
            </p>
            <p className="font-medium">
              {employee.email ?? 'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Status
            </p>
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                employee.status === 'Ativo'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {employee.status}
            </span>
          </div>
        </div>

        {employee.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Observações
            </p>
            <p className="mt-1">{employee.notes}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de cadastro
            </p>
            <p className="font-medium">
              {new Date(employee.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>
            <p className="font-medium">
              {new Date(employee.updatedAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">
          Conta de acesso
        </h2>

        {!account ? (
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <UserX className="w-4 h-4" />
            Este funcionário não possui conta de acesso.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                E-mail de acesso
              </p>
              <p className="font-medium">{account.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Perfil
              </p>
              <p className="font-medium">
                {account.role === 'admin'
                  ? 'Administrador'
                  : 'Usuário'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Situação da conta
              </p>
              {renderAccountStatusBadge()}
            </div>

            {account.role === 'user' && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Permissões
                </p>

                {account.permissions.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nenhuma permissão específica. O usuário terá acesso
                    apenas ao Dashboard.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {account.permissions.map(permission => (
                      <li
                        key={permission}
                        className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {getPermissionLabel(permission)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {account.role === 'admin' && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Acesso total ao sistema.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}