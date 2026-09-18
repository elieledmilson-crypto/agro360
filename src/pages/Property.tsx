import {
  FormEvent,
  useEffect,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import HelpTip from '../components/ui/HelpTip'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import {
  MapPin,
  User,
  Ruler,
  Map as MapIcon,
  Pencil,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { userHasPermission } from '../services/permissionService'
import {
  getPropertyById,
  updateProperty,
} from '../services/propertyService'
import type { Farm } from '../types'

interface PropertyFormState {
  name: string
  location: string
  totalArea: string
  owner: string
}

function toFormState(farm: Farm): PropertyFormState {
  return {
    name: farm.name,
    location: farm.location,
    totalArea: String(farm.totalArea),
    owner: farm.owner,
  }
}

export default function Property() {
  const { user } = useAuth()
  const canSeeMap = userHasPermission(user, 'map')
  const canEdit = user?.role === 'admin'

  const [farm, setFarm] = useState<Farm | null>(null)
  const [form, setForm] = useState<PropertyFormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!user?.propertyId) {
        if (active) {
          setFarm(null)
          setLoading(false)
        }
        return
      }

      try {
        const data = await getPropertyById(user.propertyId)

        if (active) {
          setFarm(data ?? null)
          setForm(data ? toFormState(data) : null)
          setError(
            data
              ? ''
              : 'Propriedade não encontrada.',
          )
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar a propriedade.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [user?.propertyId])

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!farm || !form || !canEdit) {
      return
    }

    const totalArea = Number(form.totalArea.replace(',', '.'))

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const updated = await updateProperty(farm.id, {
        name: form.name,
        location: form.location,
        totalArea,
        owner: form.owner,
      })

      setFarm(updated)
      setForm(toFormState(updated))
      setEditing(false)
      setSuccess('Informações da propriedade atualizadas com sucesso.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar a propriedade.',
      )
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    if (farm) {
      setForm(toFormState(farm))
    }

    setEditing(false)
    setError('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Propriedade
            </h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Aqui ficam as informações gerais da propriedade rural utilizada no Agro360."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Informações da sua fazenda
          </p>
        </div>

        {!loading && farm && canEdit && !editing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditing(true)
              setSuccess('')
            }}
            className="inline-flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Editar propriedade
          </Button>
        )}
      </div>

      {loading && (
        <Card className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Carregando propriedade...
          </p>
        </Card>
      )}

      {!loading && error && !editing && (
        <Card className="p-6">
          <p className="text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        </Card>
      )}

      {success && (
        <Card className="p-4">
          <p className="text-sm text-green-700 dark:text-green-300">
            {success}
          </p>
        </Card>
      )}

      {!loading && farm && editing && form && (
        <Card className="p-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <h2 className="text-lg font-semibold">
                Editar propriedade
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Apenas administradores podem alterar estas informações.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome da propriedade"
                value={form.name}
                onChange={event =>
                  setForm(current =>
                    current
                      ? {
                          ...current,
                          name: event.target.value,
                        }
                      : current,
                  )
                }
                required
              />

              <Input
                label="Localização"
                value={form.location}
                onChange={event =>
                  setForm(current =>
                    current
                      ? {
                          ...current,
                          location: event.target.value,
                        }
                      : current,
                  )
                }
              />

              <Input
                label="Área total (ha)"
                type="number"
                min="0"
                step="0.01"
                value={form.totalArea}
                onChange={event =>
                  setForm(current =>
                    current
                      ? {
                          ...current,
                          totalArea: event.target.value,
                        }
                      : current,
                  )
                }
                required
              />

              <Input
                label="Proprietário"
                value={form.owner}
                onChange={event =>
                  setForm(current =>
                    current
                      ? {
                          ...current,
                          owner: event.target.value,
                        }
                      : current,
                  )
                }
                required
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Salvando...'
                  : 'Salvar alterações'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!loading && farm && !editing && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50">
                  <MapPin className="w-6 h-6 text-green-700 dark:text-green-300" />
                </div>

                <div>
                  <h2 className="font-semibold text-lg">
                    {farm.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {farm.location || 'Localização não informada'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <User className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                </div>

                <div>
                  <h2 className="font-semibold text-lg">
                    {farm.owner}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Proprietário
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                  <Ruler className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                </div>

                <div>
                  <h2 className="font-semibold text-lg">
                    {farm.totalArea} ha
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Área total
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="font-semibold mb-4">
              Visão geral da estrutura
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Acesse o mapa da propriedade para visualizar as áreas de forma
              integrada e, quando houver conexão com a internet, acompanhar a
              visão de satélite e as condições meteorológicas da região.
            </p>

            {canSeeMap ? (
              <Link
                to="/mapa"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                <MapIcon className="w-4 h-4 mr-2" />
                Abrir mapa da propriedade
              </Link>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Você não possui permissão para acessar o mapa da propriedade.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
