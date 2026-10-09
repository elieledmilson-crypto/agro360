import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeForm, {
  EmployeeAccountPayload,
} from '../../components/employees/EmployeeForm'
import { createEmployeeWithOptionalAccount } from '../../services/employeeService'
import { Employee } from '../../types'
import HelpTip from '../../components/ui/HelpTip'
import { useAuth } from '../../hooks/useAuth'

export default function NewEmployeePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

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

      await createEmployeeWithOptionalAccount(user.propertyId, {
        employee: employeeData,
        account: accountData
          ? {
              employeeId: '',
              email: accountData.email,
              password: accountData.password,
              role: accountData.role,
              status: accountData.status,
              permissions: accountData.permissions,
            }
          : null,
      })

      navigate('/funcionarios', {
        state: {
          successMessage: 'Funcionário cadastrado com sucesso.',
        },
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar funcionário.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/funcionarios')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
        >
          ← Voltar para funcionários
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">Novo funcionário</h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Cadastre um funcionário e, opcionalmente, crie uma conta de acesso com permissões."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados do novo funcionário.
        </p>
      </div>

      <EmployeeForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/funcionarios')}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}