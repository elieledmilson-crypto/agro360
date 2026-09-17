import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import {
  useNavigate,
  useLocation,
} from 'react-router-dom'
import {
  getVaccinations,
  getVaccinationStatus,
  deleteVaccination,
} from '../../services/healthService'
import { getAnimals } from '../../services/animalService'
import {
  Vaccination,
  Animal,
} from '../../types'
import VaccinationTable from '../../components/health/VaccinationTable'
import VaccinationCard from '../../components/health/VaccinationCard'
import DeleteHealthDialog from '../../components/health/DeleteHealthDialog'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Plus } from 'lucide-react'

interface Filters {
  animalId: string
  vaccineName: string
  status: string
}

const defaultFilters: Filters = {
  animalId: '',
  vaccineName: '',
  status: '',
}

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function VaccinationsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [
    vaccinations,
    setVaccinations,
  ] = useState<Vaccination[]>([])

  const [
    animals,
    setAnimals,
  ] = useState<Animal[]>([])

  const [
    filters,
    setFilters,
  ] = useState<Filters>(
    defaultFilters
  )

  const [
    toDelete,
    setToDelete,
  ] = useState<Vaccination | null>(
    null
  )

  const [
    feedback,
    setFeedback,
  ] = useState<FeedbackType>(
    null
  )

  const loadData = useCallback(() => {
    setVaccinations(
      getVaccinations()
    )

    setAnimals(
      getAnimals()
    )
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const state =
      location.state as {
        successMessage?: string
      } | null

    if (!state?.successMessage) return

    setFeedback({
      type: 'success',
      message:
        state.successMessage,
    })

    navigate(
      location.pathname,
      {
        replace: true,
        state: null,
      }
    )
  }, [
    location.pathname,
    location.state,
    navigate,
  ])

  useEffect(() => {
    if (!feedback) return

    const timer =
      setTimeout(
        () =>
          setFeedback(null),
        5000
      )

    return () =>
      clearTimeout(timer)
  }, [feedback])

  const filtered =
    useMemo(() => {
      return vaccinations.filter(
        vaccination => {
          const matchesAnimal =
            !filters.animalId ||
            vaccination.animalId ===
              filters.animalId

          const matchesVaccine =
            !filters.vaccineName ||
            vaccination.vaccineName
              .toLowerCase()
              .includes(
                filters.vaccineName
                  .toLowerCase()
              )

          const matchesStatus =
            !filters.status ||
            getVaccinationStatus(
              vaccination
            ) === filters.status

          return (
            matchesAnimal &&
            matchesVaccine &&
            matchesStatus
          )
        }
      )
    }, [
      vaccinations,
      filters,
    ])

  const handleDelete = () => {
    if (!toDelete) return

    try {
      deleteVaccination(
        toDelete.id
      )

      setToDelete(null)
      loadData()
    } catch (error) {
      setToDelete(null)

      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao excluir vacinação.',
      })

      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">
              Vacinações
            </h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Aqui você registra as vacinas aplicadas nos animais e acompanha o histórico de vacinação e as próximas doses."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Registros de vacinas aplicadas
          </p>
        </div>

        <Button
          onClick={() =>
            navigate(
              '/saude-animal/vacinacoes/nova'
            )
          }
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Registrar vacinação
        </Button>
      </div>

      {feedback && (
        <PageFeedback
          type={feedback.type}
          message={feedback.message}
        />
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.animalId}
            onChange={event =>
              setFilters(
                previous => ({
                  ...previous,
                  animalId:
                    event.target.value,
                })
              )
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Animal: todos
            </option>

            {animals.map(
              animal => (
                <option
                  key={animal.id}
                  value={animal.id}
                >
                  {animal.identification}{' '}
                  {animal.name
                    ? `— ${animal.name}`
                    : ''}
                </option>
              )
            )}
          </select>

          <input
            type="text"
            placeholder="Pesquisar vacina..."
            value={filters.vaccineName}
            onChange={event =>
              setFilters(
                previous => ({
                  ...previous,
                  vaccineName:
                    event.target.value,
                })
              )
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={filters.status}
            onChange={event =>
              setFilters(
                previous => ({
                  ...previous,
                  status:
                    event.target.value,
                })
              )
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Situação: todas
            </option>

            <option value="Em dia">
              Em dia
            </option>

            <option value="Próxima">
              Próxima
            </option>

            <option value="Vencida">
              Vencida
            </option>

            <option value="Sem próxima dose">
              Sem próxima dose
            </option>
          </select>

          <button
            onClick={() =>
              setFilters(
                defaultFilters
              )
            }
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline self-center"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhuma vacinação encontrada.
          </p>

          <Button
            className="mt-4"
            onClick={() =>
              navigate(
                '/saude-animal/vacinacoes/nova'
              )
            }
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Registrar primeira vacinação
          </Button>
        </div>
      ) : (
        <>
          <VaccinationTable
            vaccinations={filtered}
            animals={animals}
            onEdit={id =>
              navigate(
                `/saude-animal/vacinacoes/${id}/editar`
              )
            }
            onDelete={id =>
              setToDelete(
                filtered.find(
                  vaccination =>
                    vaccination.id === id
                ) ?? null
              )
            }
          />

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(
              vaccination => (
                <VaccinationCard
                  key={
                    vaccination.id
                  }
                  vaccination={
                    vaccination
                  }
                  animal={
                    animals.find(
                      animal =>
                        animal.id ===
                        vaccination.animalId
                    )
                  }
                  onEdit={id =>
                    navigate(
                      `/saude-animal/vacinacoes/${id}/editar`
                    )
                  }
                  onDelete={id =>
                    setToDelete(
                      filtered.find(
                        item =>
                          item.id === id
                      ) ?? null
                    )
                  }
                />
              )
            )}
          </div>
        </>
      )}

      <DeleteHealthDialog
        open={!!toDelete}
        onClose={() =>
          setToDelete(null)
        }
        onConfirm={handleDelete}
        title="Excluir vacinação?"
        description="Esta ação removerá o registro de vacinação permanentemente."
      />
    </div>
  )
}