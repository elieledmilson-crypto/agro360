import { useState, useEffect, useMemo } from 'react'
import {
  useParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom'
import {
  getAnimalById,
  deleteAnimal,
  getAnimalEvents,
} from '../../services/animalService'
import { getLots } from '../../services/lotService'
import { getLandAreaById } from '../../services/landService'
import {
  getVaccinationsByAnimal,
  getTreatmentsByAnimal,
  getHealthOccurrencesByAnimal,
} from '../../services/healthService'
import { useAuth } from '../../hooks/useAuth'
import { userHasPermission } from '../../services/permissionService'
import {
  Animal,
  Lot,
  AnimalEvent,
  Vaccination,
  Treatment,
  HealthOccurrence,
} from '../../types'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import AnimalStatusBadge from '../../components/animals/AnimalStatusBadge'
import AnimalTimeline from '../../components/animals/AnimalTimeline'
import DeleteAnimalDialog from '../../components/animals/DeleteAnimalDialog'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import {
  Pencil,
  Trash2,
  ArrowLeft,
  Syringe,
  Activity,
  ClipboardList,
  Plus,
} from 'lucide-react'
import { calculateAge } from '../../utils/date'
import {
  buildAnimalTimeline,
  TimelineItem,
} from '../../utils/animalTimeline'

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function AnimalDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const canSeeLand =
    userHasPermission(
      user,
      'land',
    )

  const [animal, setAnimal] =
    useState<Animal | undefined>(undefined)

  const [lots, setLots] =
    useState<Lot[]>([])

  const [events, setEvents] =
    useState<AnimalEvent[]>([])

  const [deleteOpen, setDeleteOpen] =
    useState(false)

  const [feedback, setFeedback] =
    useState<FeedbackType>(null)

  const [vaccinations, setVaccinations] =
    useState<Vaccination[]>([])

  const [treatments, setTreatments] =
    useState<Treatment[]>([])

  const [occurrences, setOccurrences] =
    useState<HealthOccurrence[]>([])

  useEffect(() => {
    if (id) {
      const found =
        getAnimalById(id)

      setAnimal(found)

      if (found) {
        setEvents(
          getAnimalEvents(
            found.id,
          ),
        )

        setLots(getLots())

        setVaccinations(
          getVaccinationsByAnimal(
            found.id,
          ),
        )

        setTreatments(
          getTreatmentsByAnimal(
            found.id,
          ),
        )

        setOccurrences(
          getHealthOccurrencesByAnimal(
            found.id,
          ),
        )
      }
    }
  }, [id])

  useEffect(() => {
    const state =
      location.state as {
        successMessage?: string
      } | null

    if (!state?.successMessage) return

    setFeedback({
      type: 'success',
      message: state.successMessage,
    })

    navigate(location.pathname, {
      replace: true,
      state: null,
    })
  }, [
    location.pathname,
    location.state,
    navigate,
  ])

  useEffect(() => {
    if (!feedback) return

    const timer = setTimeout(
      () => setFeedback(null),
      5000,
    )

    return () =>
      clearTimeout(timer)
  }, [feedback])

  const timelineItems:
    TimelineItem[] =
    useMemo(() => {
      if (!animal) return []

      return buildAnimalTimeline(
        animal.id,
        events,
        vaccinations,
        treatments,
        occurrences,
      )
    }, [
      animal,
      events,
      vaccinations,
      treatments,
      occurrences,
    ])

  if (!animal) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Animal não encontrado
        </p>

        <Button
          className="mt-4"
          onClick={() =>
            navigate('/animais')
          }
        >
          Voltar para Animais
        </Button>
      </div>
    )
  }

  const lotName =
    lots.find(
      lot =>
        lot.id === animal.lotId,
    )?.name ??
    'Sem lote'

  const landArea =
    canSeeLand &&
    animal.landAreaId
      ? getLandAreaById(
          animal.landAreaId,
        )
      : undefined

  const ageText =
    animal.birthDate
      ? calculateAge(
          animal.birthDate,
        )
      : 'Não informada'

  const handleDelete = () => {
    if (!id) return

    try {
      deleteAnimal(id)

      navigate('/animais')
    } catch (error) {
      setDeleteOpen(false)

      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao excluir animal.',
      })
    }
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() =>
              navigate('/animais')
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              {animal.identification}
            </h1>

            <HelpTip
              title="O que encontro nesta página?"
              description="Aqui você consulta as informações do animal e seu histórico."
            />
          </div>

          {animal.name && (
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {animal.name}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/animais/${animal.id}/editar`,
              )
            }
          >
            <Pencil className="w-4 h-4 mr-2 inline" />
            Editar
          </Button>

          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30"
            onClick={() =>
              setDeleteOpen(true)
            }
          >
            <Trash2 className="w-4 h-4 mr-2 inline" />
            Excluir
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Espécie
            </p>

            <p className="font-medium">
              {animal.species}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Raça
            </p>

            <p className="font-medium">
              {animal.breed}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sexo
            </p>

            <p className="font-medium">
              {animal.sex}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Categoria
            </p>

            <p className="font-medium">
              {animal.category}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Situação
            </p>

            <AnimalStatusBadge
              status={
                animal.status
              }
            />
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Lote
            </p>

            <p className="font-medium">
              {lotName}
            </p>
          </div>

          {canSeeLand && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Área / Piquete
              </p>

              {landArea ? (
                <Link
                  to={`/terras/${landArea.id}`}
                  className="font-medium text-green-600 hover:underline"
                >
                  {landArea.code} —{' '}
                  {landArea.name}
                </Link>
              ) : (
                <p className="font-medium">
                  Sem área associada
                </p>
              )}
            </div>
          )}

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data de nascimento
            </p>

            <p className="font-medium">
              {animal.birthDate
                ? new Date(
                    animal.birthDate +
                      'T00:00:00',
                  ).toLocaleDateString(
                    'pt-BR',
                  )
                : 'Não informada'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Idade
            </p>

            <p className="font-medium">
              {ageText}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Peso atual
            </p>

            <p className="font-medium">
              {animal.currentWeight
                ? `${animal.currentWeight} kg`
                : 'Não informado'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Origem
            </p>

            <p className="font-medium">
              {animal.origin ??
                'Não informada'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cadastro
            </p>

            <p className="font-medium">
              {new Date(
                animal.createdAt,
              ).toLocaleDateString(
                'pt-BR',
              )}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização
            </p>

            <p className="font-medium">
              {new Date(
                animal.updatedAt,
              ).toLocaleDateString(
                'pt-BR',
              )}
            </p>
          </div>
        </div>

        {animal.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Observações
            </p>

            <p className="mt-1">
              {animal.notes}
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">
          Saúde
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Syringe className="w-5 h-5 text-blue-600" />

              <h3 className="font-medium">
                Vacinações ({vaccinations.length})
              </h3>
            </div>

            {vaccinations.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {vaccinations
                  .slice(0, 3)
                  .map(v => (
                    <li key={v.id}>
                      {v.vaccineName} —{' '}
                      {new Date(
                        v.applicationDate +
                          'T00:00:00',
                      ).toLocaleDateString(
                        'pt-BR',
                      )}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Nenhuma vacinação registrada.
              </p>
            )}

            <Link
              to={`/saude-animal/vacinacoes/nova?animalId=${animal.id}`}
              className="mt-2 inline-flex items-center text-sm text-green-600 hover:underline"
            >
              <Plus className="w-4 h-4 mr-1" />
              Registrar vacinação
            </Link>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-emerald-600" />

              <h3 className="font-medium">
                Tratamentos ({treatments.length})
              </h3>
            </div>

            {treatments.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {treatments
                  .slice(0, 3)
                  .map(t => (
                    <li key={t.id}>
                      {t.reason} — {t.status}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Nenhum tratamento registrado.
              </p>
            )}

            <Link
              to={`/saude-animal/tratamentos/novo?animalId=${animal.id}`}
              className="mt-2 inline-flex items-center text-sm text-green-600 hover:underline"
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo tratamento
            </Link>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-purple-600" />

              <h3 className="font-medium">
                Ocorrências ({occurrences.length})
              </h3>
            </div>

            {occurrences.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {occurrences
                  .slice(0, 3)
                  .map(o => (
                    <li key={o.id}>
                      {o.title} — {o.severity}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Nenhuma ocorrência registrada.
              </p>
            )}

            <Link
              to={`/saude-animal/ocorrencias/nova?animalId=${animal.id}`}
              className="mt-2 inline-flex items-center text-sm text-green-600 hover:underline"
            >
              <Plus className="w-4 h-4 mr-1" />
              Registrar ocorrência
            </Link>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">
          Histórico
        </h2>

        <AnimalTimeline items={timelineItems} />
      </Card>

      <DeleteAnimalDialog
        open={deleteOpen}
        onClose={() =>
          setDeleteOpen(false)
        }
        onConfirm={handleDelete}
        animalName={
          animal.name ??
          animal.identification
        }
      />
    </div>
  )
}