import {
  FormEvent,
  useEffect,
  useState,
} from 'react'
import Card from '../components/ui/Card'
import HelpTip from '../components/ui/HelpTip'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import {
  updateAccountEmail,
  updateAccountPassword,
  updateProfileName,
} from '../services/authService'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [savingName, setSavingName] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [nameMessage, setNameMessage] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
  }, [user?.name, user?.email])

  const handleNameSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setSavingName(true)
    setNameError('')
    setNameMessage('')

    try {
      await updateProfileName(name)
      await refreshUser()
      setNameMessage('Nome atualizado com sucesso.')
    } catch (err) {
      setNameError(
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar seu nome.',
      )
    } finally {
      setSavingName(false)
    }
  }

  const handleEmailSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setSavingEmail(true)
    setEmailError('')
    setEmailMessage('')

    try {
      const result = await updateAccountEmail(email)

      await refreshUser()

      if (result.confirmationRequired) {
        setEmailMessage(
          'Solicitação enviada. Confirme a alteração pelo e-mail enviado pelo Supabase. Até a confirmação, o e-mail atual continua válido.',
        )
      } else {
        setEmailMessage('E-mail atualizado com sucesso.')
      }
    } catch (err) {
      setEmailError(
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar seu e-mail.',
      )
    } finally {
      setSavingEmail(false)
    }
  }

  const handlePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')

    if (password !== passwordConfirm) {
      setPasswordError('As senhas não coincidem.')
      return
    }

    setSavingPassword(true)

    try {
      await updateAccountPassword(password)
      setPassword('')
      setPasswordConfirm('')
      setPasswordMessage('Senha atualizada com sucesso.')
    } catch (err) {
      setPasswordError(
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar sua senha.',
      )
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">
            Meu perfil
          </h1>

          <HelpTip
            title="Configurações da conta"
            description="Aqui você altera seus próprios dados de acesso. Seu perfil de permissão e sua função na propriedade não podem ser alterados por esta página."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Gerencie seus dados pessoais e sua senha
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1">
          Informações da conta
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Perfil de acesso:{' '}
          <span className="font-medium">
            {user?.role === 'admin'
              ? 'Administrador'
              : 'Usuário'}
          </span>
        </p>

        <form
          onSubmit={handleNameSubmit}
          className="space-y-4"
        >
          <Input
            label="Nome"
            value={name}
            onChange={event =>
              setName(event.target.value)
            }
            required
          />

          {nameError && (
            <p className="text-sm text-red-600 dark:text-red-300">
              {nameError}
            </p>
          )}

          {nameMessage && (
            <p className="text-sm text-green-700 dark:text-green-300">
              {nameMessage}
            </p>
          )}

          <Button
            type="submit"
            disabled={
              savingName ||
              name.trim() === (user?.name ?? '').trim()
            }
          >
            {savingName
              ? 'Salvando...'
              : 'Salvar nome'}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1">
          E-mail de acesso
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Dependendo da configuração de segurança, a alteração precisa ser
          confirmada pelo novo endereço de e-mail.
        </p>

        <form
          onSubmit={handleEmailSubmit}
          className="space-y-4"
        >
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={event =>
              setEmail(event.target.value)
            }
            required
          />

          {emailError && (
            <p className="text-sm text-red-600 dark:text-red-300">
              {emailError}
            </p>
          )}

          {emailMessage && (
            <p className="text-sm text-green-700 dark:text-green-300">
              {emailMessage}
            </p>
          )}

          <Button
            type="submit"
            disabled={
              savingEmail ||
              email.trim().toLowerCase() ===
                (user?.email ?? '').trim().toLowerCase()
            }
          >
            {savingEmail
              ? 'Salvando...'
              : 'Alterar e-mail'}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1">
          Alterar senha
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Use uma senha com pelo menos 8 caracteres.
        </p>

        <form
          onSubmit={handlePasswordSubmit}
          className="space-y-4"
        >
          <Input
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={event =>
              setPassword(event.target.value)
            }
            required
          />

          <Input
            label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={passwordConfirm}
            onChange={event =>
              setPasswordConfirm(event.target.value)
            }
            required
          />

          {passwordError && (
            <p className="text-sm text-red-600 dark:text-red-300">
              {passwordError}
            </p>
          )}

          {passwordMessage && (
            <p className="text-sm text-green-700 dark:text-green-300">
              {passwordMessage}
            </p>
          )}

          <Button
            type="submit"
            disabled={savingPassword}
          >
            {savingPassword
              ? 'Atualizando...'
              : 'Alterar senha'}
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Função, permissões e vínculos com propriedades são administrados
          separadamente e não podem ser modificados pelo próprio usuário nesta
          página.
        </p>
      </Card>
    </div>
  )
}
