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

type AuthMode = 'login' | 'register'

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] =
    useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

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

    if (!email || !password) {
      setError('Preencha todos os campos obrigatórios.')
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

          <h2 className="text-lg font-semibold mb-6">
            {mode === 'login'
              ? 'Entrar'
              : 'Criar acesso'}
          </h2>

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
              ? 'Aguarde...'
              : mode === 'login'
                ? 'Entrar'
                : 'Criar conta'}
          </Button>

          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
            Autenticação protegida pelo Supabase Auth.
          </p>
        </form>
      </div>
    </div>
  )
}
