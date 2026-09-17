import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  getTreatments,
  deleteTreatment,
} from '../../services/healthService'
import { getAnimals } from '../../services/animalService'
import { Treatment, Animal } from '../../types'
import TreatmentTable from '../../components/health/TreatmentTable'
import TreatmentCard from '../../components/health/TreatmentCard'
import DeleteHealthDialog from '../../components/health/DeleteHealthDialog'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Plus } from 'lucide-react'

interface Filters {
  animalId: string
  search: string
  status: string
}

const defaultFilters: Filters = { animalId: '', search: '', status: '' }

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function TreatmentsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [animals, setAnimals] = useState<Animal[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [toDelete, setToDelete] = useState<Treatment | null>(null)
  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const loadData = useCallback(() => {
    setTreatments(getTreatments())
    setAnimals(getAnimals())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const state = location.state as { successMessage?: string } | null
    if (!state?.successMessage) return

    setFeedback({ type: 'success', message: state.successMessage })

    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

  const filtered = useMemo(() => {
    return treatments.filter(t => {
      const matchesAnimal = !filters.animalId || t.animalId === filters.animalId
      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        t.reason.toLowerCase().includes(searchTerm) ||
        (t.medication?.toLowerCase().includes(searchTerm) ?? false)

      const matchesStatus = !filters.status || t.status === filters.status

      return matchesAnimal && matchesSearch && matchesStatus
    })
  }, [treatments, filters])

  const handleDelete = () => {
    if (!toDelete) return

    try {
      deleteTreatment(toDelete.id)
      setToDelete(null)
      loadData()
    } catch (error) {
      setToDelete(null)
      setFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Erro ao excluir tratamento.',
      })
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">Tratamentos</h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Aqui você registra tratamentos realizados nos animais e acompanha o período, medicamento e evolução registrada."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Tratamentos em andamento e concluídos
          </p>
        </div>

        <Button onClick={() => navigate('/saude-animal/tratamentos/novo')}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Novo tratamento
        </Button>
      </div>

      {feedback && (
        <PageFeedback type={feedback.type} message={feedback.message} />
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.animalId}
            onChange={e =>
              setFilters(prev => ({ ...prev, animalId: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Animal: todos</option>

            {animals.map(a => (
              <option key={a.id} value={a.id}>
                {a.identification} {a.name ? `— ${a.name}` : ''}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Pesquisar motivo ou medicamento..."
            value={filters.search}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <select
            value={filters.status}
            onChange={e =>
              setFilters(prev => ({ ...prev, status: e.target.value }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Situação: todas</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluído">Concluído</option>
            <option value="Interrompido">Interrompido</option>
          </select>

          <button
            onClick={() => setFilters(defaultFilters)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline self-center"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum tratamento encontrado.
          </p>

          <Button
            className="mt-4"
            onClick={() => navigate('/saude-animal/tratamentos/novo')}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Registrar primeiro tratamento
          </Button>
        </div>
      ) : (
        <>
          <TreatmentTable
            treatments={filtered}
            animals={animals}
            onEdit={id => navigate(`/saude-animal/tratamentos/${id}/editar`)}
            onDelete={id =>
              setToDelete(filtered.find(t => t.id === id) ?? null)
            }
          />

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(t => (
              <TreatmentCard
                key={t.id}
                treatment={t}
                animal={animals.find(a => a.id === t.animalId)}
                onEdit={id => navigate(`/saude-animal/tratamentos/${id}/editar`)}
                onDelete={id =>
                  setToDelete(filtered.find(x => x.id === id) ?? null)
                }
              />
            ))}
          </div>
        </>
      )}

      <DeleteHealthDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir tratamento?"
        description="Esta ação removerá o registro de tratamento permanentemente."
      />
    </div>
  )
}