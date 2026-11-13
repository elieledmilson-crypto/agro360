import {
  useState,
  FormEvent,
} from 'react'

import {
  useNavigate,
  useLocation,
} from 'react-router-dom'

import { Sprout } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { requestPasswordReset } from '../services/authService'

type AuthMode = 'login' | 'register' | 'forgot'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState<AuthMode>(() =>
    (location.state as { openForgotPassword?: boolean } | null)
      ?.openForgotPassword
      ? 'forgot'
      : 'login',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] =
    useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState(() =>
    new URLSearchParams(location.search).get('password-reset') ===
    'success'
      ? 'Senha redefinida com sucesso. Entre com sua nova senha.'
      : '',
  )
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()

  const from =
    (
      location.state as {
        from?: {
          pathname?: string
        }
      }
    )?.from?.pathname || '/dashboard'

  const handleSubmit = async (
    event: FormEvent,
  ) => {
    event.preventDefault()

    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Informe o e-mail da sua conta.')
      return
    }

    if (mode === 'forgot') {
      setLoading(true)

      try {
        await requestPasswordReset(email)
        setMessage(
          'Se houver uma conta associada a esse e-mail, enviaremos um link para redefinir a senha. Verifique também a pasta de spam.',
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível solicitar a recuperação de senha.',
        )
      } finally {
        setLoading(false)
      }

      return
    }

    if (!password) {
      setError('Informe sua senha.')
      return
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Informe seu nome.')
        return
      }

      if (password !== passwordConfirmation) {
        setError('As senhas não coincidem.')
        return
      }
    }

    setLoading(true)

    try {
      if (mode === 'login') {
        const loggedUser = await login(
          email,
          password,
        )

        navigate(
          loggedUser.propertyId
            ? from
            : '/configuracao-inicial',
          {
            replace: true,
          },
        )

        return
      }

      const result = await register(
        name,
        email,
        password,
      )

      if (result.confirmationRequired) {
        setMessage(
          'Conta criada. Verifique seu e-mail para confirmar o cadastro e depois entre no Agro360.',
        )
        setMode('login')
        setPassword('')
        setPasswordConfirmation('')
        return
      }

      if (result.user) {
        navigate(
          result.user.propertyId
            ? '/dashboard'
            : '/configuracao-inicial',
          {
            replace: true,
          },
        )
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Falha ao autenticar.')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (
    nextMode: AuthMode,
  ) => {
    setMode(nextMode)
    setError('')
    setMessage('')
    setPassword('')
    setPasswordConfirmation('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600 mb-4">
            <Sprout className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold">
            Agro360
          </h1>

          <p className="text-gray-600 dark:text-gray-400">
            Gestão Rural Integrada
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 md:p-8"
        >
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                type="button"
                onClick={() =>
                  switchMode('login')
                }
                className={
                  mode === 'login'
                    ? 'px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium'
                    : 'px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium'
                }
              >
                Entrar
              </button>

              <button
                type="button"
                onClick={() =>
                  switchMode('register')
                }
                className={
                  mode === 'register'
                    ? 'px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium'
                    : 'px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium'
                }
              >
                Criar conta
              </button>
            </div>
          )}

          <h2 className="text-lg font-semibold mb-2">
            {mode === 'login'
              ? 'Entrar'
              : mode === 'register'
                ? 'Criar acesso'
                : 'Recuperar senha'}
          </h2>

          {mode === 'forgot' && (
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Informe o e-mail da sua conta e enviaremos instruções para criar uma nova senha.
            </p>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
              {message}
            </div>
          )}

          <div className="space-y-4">
            {mode === 'register' && (
              <Input
                label="Nome"
                value={name}
                onChange={event =>
                  setName(event.target.value)
                }
                placeholder="Seu nome"
                required
              />
            )}

            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={event =>
                setEmail(event.target.value)
              }
              placeholder="seu@email.com"
              required
            />

            {mode !== 'forgot' && (
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={event =>
                  setPassword(event.target.value)
                }
                placeholder="••••••••"
                minLength={8}
                required
              />
            )}

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-sm text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-left"
              >
                Esqueci minha senha
              </button>
            )}

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-sm text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-left"
              >
                Voltar para entrar
              </button>
            )}

            {mode === 'register' && (
              <Input
                label="Confirmar senha"
                type="password"
                value={passwordConfirmation}
                onChange={event =>
                  setPasswordConfirmation(
                    event.target.value,
                  )
                }
                placeholder="••••••••"
                minLength={8}
                required
              />
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-6"
          >
            {loading
              ? mode === 'forgot'
                ? 'Enviando...'
                : 'Aguarde...'
              : mode === 'login'
                ? 'Entrar'
                : mode === 'register'
                  ? 'Criar conta'
                  : 'Enviar link de recuperação'}
          </Button>

          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
            Autenticação protegida pelo Supabase Auth.
          </p>
        </form>
      </div>
    </div>
  )
}
