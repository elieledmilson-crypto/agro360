import {
  useState,
  FormEvent,
  ChangeEvent,
} from 'react'
import {
  AccessAccount,
  AccessAccountStatus,
  Employee,
  EmployeeStatus,
  PermissionKey,
  UserRole,
} from '../../types'
import {
  PERMISSION_OPTIONS,
} from '../../services/permissionService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

export interface EmployeeAccountPayload {
  email: string
  password?: string
  role: UserRole
  status: AccessAccountStatus
  permissions: PermissionKey[]
}

interface EmployeeFormData {
  name: string
  function: string
  phone: string
  email: string
  status: EmployeeStatus
  notes: string

  createAccount: boolean
  accountEmail: string
  accountPassword: string
  accountPasswordConfirm: string
  accountRole: UserRole
  accountStatus: AccessAccountStatus
}

interface Props {
  employee?: Employee
  account?: AccessAccount
  onSubmit: (
    employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>,
    accountData?: EmployeeAccountPayload | null,
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const roleOptions: UserRole[] = ['admin', 'user']

const employeeStatusOptions: EmployeeStatus[] = ['Ativo', 'Inativo']

const accountStatusOptions: AccessAccountStatus[] = ['Ativo', 'Inativo']

export default function EmployeeForm({
  employee,
  account,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const isEdit = employee !== undefined
  const hasAccount = account !== undefined

  const [formData, setFormData] = useState<EmployeeFormData>(() => {
    if (employee) {
      return {
        name: employee.name,
        function: employee.function,
        phone: employee.phone ?? '',
        email: employee.email ?? '',
        status: employee.status,
        notes: employee.notes ?? '',

        createAccount: hasAccount,
        accountEmail: account?.email ?? '',
        accountPassword: '',
        accountPasswordConfirm: '',
        accountRole: account?.role ?? 'user',
        accountStatus: account?.status ?? 'Ativo',
      }
    }

    return {
      name: '',
      function: '',
      phone: '',
      email: '',
      status: 'Ativo',
      notes: '',

      createAccount: false,
      accountEmail: '',
      accountPassword: '',
      accountPasswordConfirm: '',
      accountRole: 'user',
      accountStatus: 'Ativo',
    }
  })

  const [permissions, setPermissions] = useState<PermissionKey[]>(
    () => account?.permissions ?? [],
  )

  const [errors, setErrors] = useState<
    Partial<Record<keyof EmployeeFormData, string>>
  >({})

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof EmployeeFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleCreateAccountToggle = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const checked = e.target.checked

    setFormData(prev => ({
      ...prev,
      createAccount: checked,
    }))
  }

  const handlePermissionToggle = (permission: PermissionKey) => {
    setPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(item => item !== permission)
      }

      return [...prev, permission]
    })
  }

  const validate = (): boolean => {
    const newErrors: Partial<
      Record<keyof EmployeeFormData, string>
    > = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.function.trim()) {
      newErrors.function = 'Função é obrigatória'
    }

    if (!formData.status) {
      newErrors.status = 'Situação é obrigatória'
    }

    const shouldManageAccount = isEdit
      ? hasAccount || formData.createAccount
      : formData.createAccount

    if (shouldManageAccount) {
      if (!formData.accountEmail.trim()) {
        newErrors.accountEmail = 'E-mail de acesso é obrigatório'
      }

      const creatingAccess = !hasAccount && formData.createAccount
      const changingPassword =
        formData.accountPassword.length > 0 ||
        formData.accountPasswordConfirm.length > 0

      if (creatingAccess || changingPassword) {
        if (formData.accountPassword.length < 8) {
          newErrors.accountPassword =
            'A senha deve ter pelo menos 8 caracteres'
        }

        if (
          formData.accountPassword !==
          formData.accountPasswordConfirm
        ) {
          newErrors.accountPasswordConfirm =
            'As senhas não coincidem'
        }
      }

      if (!formData.accountRole) {
        newErrors.accountRole = 'Perfil é obrigatório'
      }

      if (!formData.accountStatus) {
        newErrors.accountStatus = 'Situação da conta é obrigatória'
      }
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const employeePayload: Omit<
      Employee,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      name: formData.name.trim(),
      function: formData.function.trim(),
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      status: formData.status,
      notes: formData.notes.trim() || undefined,
    }

    let accountPayload: EmployeeAccountPayload | null = null

    if (isEdit && hasAccount) {
      accountPayload = {
        email: formData.accountEmail.trim(),
        password: formData.accountPassword || undefined,
        role: formData.accountRole,
        status: formData.accountStatus,
        permissions:
          formData.accountRole === 'admin' ? [] : permissions,
      }
    } else if (!isEdit && formData.createAccount) {
      accountPayload = {
        email: formData.accountEmail.trim(),
        password: formData.accountPassword || undefined,
        role: formData.accountRole,
        status: formData.accountStatus,
        permissions:
          formData.accountRole === 'admin' ? [] : permissions,
      }
    } else if (isEdit && !hasAccount && formData.createAccount) {
      accountPayload = {
        email: formData.accountEmail.trim(),
        password: formData.accountPassword || undefined,
        role: formData.accountRole,
        status: formData.accountStatus,
        permissions:
          formData.accountRole === 'admin' ? [] : permissions,
      }
    }

    onSubmit(employeePayload, accountPayload)
  }

  const showAccountSection =
    isEdit ? hasAccount || formData.createAccount : formData.createAccount

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Nome *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Carlos Pereira"
              required
            />

            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="employee-function"
                className="block text-sm font-medium"
              >
                Função *
              </label>

              <HelpTip
                title="O que é a função?"
                description="Ex.: gerente, veterinário, agrônomo, operador."
              />
            </div>

            <Input
              id="employee-function"
              label=""
              name="function"
              value={formData.function}
              onChange={handleChange}
              placeholder="Ex: Veterinário"
              required
            />

            {errors.function && (
              <p className="mt-1 text-sm text-red-600">
                {errors.function}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Telefone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ex: (11) 99999-0000"
            />
          </div>

          <div>
            <Input
              label="E-mail de contato"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contato@exemplo.com"
            />
          </div>

          <div>
            <label
              htmlFor="employee-status"
              className="block text-sm font-medium mb-1"
            >
              Situação *
            </label>

            <select
              id="employee-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {employeeStatusOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {errors.status && (
              <p className="mt-1 text-sm text-red-600">
                {errors.status}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Observações
          </label>

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
            placeholder="Informações adicionais (opcional)"
          />
        </div>

        {!isEdit && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.createAccount}
                onChange={handleCreateAccountToggle}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />

              Criar conta de acesso
            </label>
          </div>
        )}

        {isEdit && !hasAccount && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.createAccount}
                onChange={handleCreateAccountToggle}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />

              Criar conta de acesso
            </label>
          </div>
        )}

        {showAccountSection && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-semibold mb-4">
              Conta de acesso
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="E-mail de acesso *"
                  name="accountEmail"
                  type="email"
                  value={formData.accountEmail}
                  onChange={handleChange}
                  placeholder="usuario@agro360.com"
                  required
                />

                {errors.accountEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.accountEmail}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label={hasAccount ? 'Nova senha (opcional)' : 'Senha inicial *'}
                  name="accountPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={formData.accountPassword}
                  onChange={handleChange}
                  placeholder={hasAccount ? 'Deixe em branco para manter' : 'Mínimo de 8 caracteres'}
                  required={!hasAccount}
                />

                {errors.accountPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.accountPassword}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label={hasAccount ? 'Confirmar nova senha' : 'Confirmar senha inicial *'}
                  name="accountPasswordConfirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={formData.accountPasswordConfirm}
                  onChange={handleChange}
                  placeholder="Digite a senha novamente"
                  required={!hasAccount}
                />

                {errors.accountPasswordConfirm && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.accountPasswordConfirm}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label
                    htmlFor="employee-account-role"
                    className="block text-sm font-medium"
                  >
                    Perfil de acesso *
                  </label>

                  <HelpTip
                    title="Qual a diferença entre os perfis?"
                    description="Administrador possui acesso total, inclusive à área de Funcionários. Usuário acessa apenas os módulos marcados nas permissões."
                  />
                </div>

                <select
                  id="employee-account-role"
                  name="accountRole"
                  value={formData.accountRole}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {roleOptions.map(option => (
                    <option key={option} value={option}>
                      {option === 'admin'
                        ? 'Administrador'
                        : 'Usuário'}
                    </option>
                  ))}
                </select>

                {errors.accountRole && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.accountRole}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="employee-account-status"
                  className="block text-sm font-medium mb-1"
                >
                  Situação da conta *
                </label>

                <select
                  id="employee-account-status"
                  name="accountStatus"
                  value={formData.accountStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {accountStatusOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                {errors.accountStatus && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.accountStatus}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              A senha é enviada ao Supabase Auth e não fica armazenada nos
              dados do Agro360.
            </p>

            {formData.accountRole === 'admin' && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                Administradores possuem acesso total ao sistema.
              </div>
            )}

            {formData.accountRole === 'user' && (
              <div className="mt-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm font-medium">
                    Permissões de acesso
                  </span>

                  <HelpTip
                    title="O que são as permissões?"
                    description="Definem quais módulos um usuário comum pode acessar. O Dashboard continua sempre disponível."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {PERMISSION_OPTIONS.map(option => {
                    const checked = permissions.includes(option.key)

                    return (
                      <label
                        key={option.key}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            handlePermissionToggle(option.key)
                          }
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />

                        {option.label}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {submitError}
          </div>
        )}
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}