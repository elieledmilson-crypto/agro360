import {
  FormEvent,
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { Sprout } from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { createPropertyForCurrentUser } from '../services/propertyService'

export default function PropertySetupPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [totalArea, setTotalArea] = useState('')
  const [owner, setOwner] = useState(user?.name ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.propertyId) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, user?.propertyId])

  const handleSubmit = async (
    event: FormEvent,
  ) => {
    event.preventDefault()
    setError('')

    const parsedArea = Number(
      totalArea.replace(',', '.'),
    )

    if (
      !Number.isFinite(parsedArea) ||
      parsedArea < 0
    ) {
      setError('Informe uma área total válida.')
      return
    }

    setLoading(true)

    try {
      await createPropertyForCurrentUser({
        name,
        location,
        totalArea: parsedArea,
        owner,
      })

      await refreshUser()

      navigate('/dashboard', {
        replace: true,
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível configurar a propriedade.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
            <Sprout className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Configuração inicial
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cadastre a primeira propriedade vinculada à sua conta.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            label="Nome da propriedade"
            value={name}
            onChange={event =>
              setName(event.target.value)
            }
            placeholder="Ex.: Fazenda Boa Vista"
            required
          />

          <Input
            label="Localização"
            value={location}
            onChange={event =>
              setLocation(event.target.value)
            }
            placeholder="Município / estado"
          />

          <Input
            label="Área total (ha)"
            inputMode="decimal"
            value={totalArea}
            onChange={event =>
              setTotalArea(event.target.value)
            }
            placeholder="Ex.: 120,5"
            required
          />

          <Input
            label="Proprietário"
            value={owner}
            onChange={event =>
              setOwner(event.target.value)
            }
            required
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading
              ? 'Criando propriedade...'
              : 'Concluir configuração'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
