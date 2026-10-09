import {
  FormEvent,
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { Sprout } from 'lucide-react'

import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { supabase } from '../lib/supabase'
import { updatePasswordFromRecovery } from '../services/authService'

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  const [checkingLink, setCheckingLink] = useState(true)
  const [recoveryReady, setRecoveryReady] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    let recoveryEventSeen = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryEventSeen = true
        setRecoveryReady(true)
        setCheckingLink(false)
        setError('')
        return
      }

      if (event === 'INITIAL_SESSION' && session) {
        setRecoveryReady(true)
        setCheckingLink(false)
        setError('')
        return
      }

      if (
        event === 'INITIAL_SESSION' &&
        !session &&
        !recoveryEventSeen
      ) {
        setCheckingLink(false)
        setError(
          'O link de recuperação é inválido ou expirou. Solicite um novo link para redefinir sua senha.',
        )
      }
    })

    void supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return

        if (data.session) {
          setRecoveryReady(true)
          setCheckingLink(false)
          setError('')
        } else if (sessionError || !recoveryEventSeen) {
          setCheckingLink(false)
          setError(
            'O link de recuperação é inválido ou expirou. Solicite um novo link para redefinir sua senha.',
          )
        }
      })
      .catch(() => {
        if (!active) return

        setCheckingLink(false)
        setError(
          'Não foi possível validar o link. Solicite um novo link para redefinir sua senha.',
        )
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      await updatePasswordFromRecovery(password)
      setSuccess(true)
      setPassword('')
      setPasswordConfirmation('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar sua senha.',
      )
    } finally {
      setLoading(false)
    }
  }

  const returnToLogin = async () => {
    setLoading(true)

    try {
      await supabase.auth.signOut()
    } finally {
      window.location.replace('/login?password-reset=success')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-600 mb-4">
            <Sprout className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold">Agro360</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestão Rural Integrada
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 md:p-8">
          {success ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  Senha alterada com sucesso!
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sua nova senha já pode ser usada para entrar no Agro360.
                </p>
              </div>

              <Button
                type="button"
                disabled={loading}
                onClick={returnToLogin}
                className="w-full"
              >
                {loading ? 'Aguarde...' : 'Voltar para entrar'}
              </Button>
            </div>
          ) : checkingLink ? (
            <div className="py-4 text-center">
              <h2 className="text-lg font-semibold mb-2">
                Validando link de recuperação
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aguarde enquanto verificamos o link enviado por e-mail.
              </p>
            </div>
          ) : !recoveryReady ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold mb-2">
                  Não foi possível validar o link
                </h2>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={() =>
                  navigate('/login', {
                    replace: true,
                    state: { openForgotPassword: true },
                  })
                }
              >
                Solicitar novo link
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-2">
                Criar nova senha
              </h2>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                Escolha uma senha nova com pelo menos 8 caracteres.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <Input
                    label="Nova senha"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    minLength={8}
                    required
                  />

                  <Input
                    label="Confirmar nova senha"
                    type="password"
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={event =>
                      setPasswordConfirmation(event.target.value)
                    }
                    placeholder="Digite a senha novamente"
                    minLength={8}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6"
                >
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
