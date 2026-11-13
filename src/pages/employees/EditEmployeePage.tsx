import {
  useState,
  useMemo,
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import EmployeeForm, {
  EmployeeAccountPayload,
} from '../../components/employees/EmployeeForm'
import {
  getEmployeeById,
  getAccessAccountByEmployeeId,
  updateEmployeeWithOptionalAccount,
} from '../../services/employeeService'
import { useAuth } from '../../hooks/useAuth'
import { Employee } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { refreshUser, user } = useAuth()

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const employee = useMemo(
    () => (id ? getEmployeeById(id) : undefined),
    [id],
  )

  const account = useMemo(
    () => (id ? getAccessAccountByEmployeeId(id) : undefined),
    [id],
  )

  if (!employee) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Funcionário não encontrado
        </p>

        <button
          onClick={() => navigate('/funcionarios')}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Voltar para funcionários
        </button>
      </div>
    )
  }

  const handleSubmit = async (
    employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>,
    accountData?: EmployeeAccountPayload | null,
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      if (!user?.propertyId) {
        throw new Error('Propriedade não encontrada.')
      }

      const result = await updateEmployeeWithOptionalAccount(
        user.propertyId,
        employee.id,
        {
        employee: employeeData,
        account: accountData
          ? {
              employeeId: employee.id,
              email: accountData.email,
              password: accountData.password,
              role: accountData.role,
              status: accountData.status,
              permissions: accountData.permissions,
            }
          : null,
        },
      )

      if (!result) {
        throw new Error('Funcionário não encontrado.')
      }

      await refreshUser()

      navigate(`/funcionarios/${employee.id}`, {
        state: {
          successMessage: 'Funcionário atualizado com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar funcionário.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(`/funcionarios/${employee.id}`)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
        >
          ← Voltar para o funcionário
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Editar funcionário</h1>

          <HelpTip
            title="Para que serve esta página?"
            description="Atualize os dados do funcionário e as configurações da conta de acesso."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Atualize os dados de {employee.name}.
        </p>
      </div>

      <EmployeeForm
        employee={employee}
        account={account}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/funcionarios/${employee.id}`)}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}