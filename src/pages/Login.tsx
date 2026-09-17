import {
  useState,
  FormEvent,
  useMemo,
} from 'react'

import {
  useNavigate,
  useLocation,
} from 'react-router-dom'

import { Sprout } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { getPrimaryAdminLoginEmail } from '../services/employeeService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const primaryAdminEmail = useMemo(
    () => getPrimaryAdminLoginEmail(),
    [],
  )

  const from =
    (
      location.state as {
        from?: {
          pathname?: string
        }
      }
    )?.from?.pathname || '/dashboard'

  const handleSubmit = async (
    e: FormEvent,
  ) => {
    e.preventDefault()

    setError('')

    if (!email || !password) {
      setError('Preencha todos os campos')
      return
    }

    setLoading(true)

    try {
      await login(
        email,
        password,
        remember,
      )

      navigate(from, {
        replace: true,
      })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Falha ao entrar.')
      }
    } finally {
      setLoading(false)
    }
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
          <h2 className="text-lg font-semibold mb-6">
            Entrar
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={e =>
                setEmail(e.target.value)
              }
              placeholder="seu@email.com"
              required
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              required
            />
          </div>

          <label className="flex items-center gap-2 mt-4 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={remember}
              onChange={e =>
                setRemember(e.target.checked)
              }
              className="rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
            />

            Lembrar minha sessão neste dispositivo
          </label>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-6"
          >
            {loading
              ? 'Entrando...'
              : 'Entrar'}
          </Button>

          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
            Acesso simulado — use o e-mail de uma conta ativa e qualquer senha não vazia.
          </p>

          {primaryAdminEmail && (
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              Administrador disponível: {primaryAdminEmail}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}