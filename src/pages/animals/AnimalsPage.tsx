import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getAnimals, deleteAnimal } from '../../services/animalService'
import { getLots } from '../../services/lotService'
import { Animal, Lot } from '../../types'
import AnimalSummaryCards from '../../components/animals/AnimalSummaryCards'
import AnimalFilters, { AnimalFiltersState } from '../../components/animals/AnimalFilters'
import AnimalsTable from '../../components/animals/AnimalsTable'
import AnimalCard from '../../components/animals/AnimalCard'
import DeleteAnimalDialog from '../../components/animals/DeleteAnimalDialog'
import Button from '../../components/ui/Button'
import PageFeedback from '../../components/ui/PageFeedback'
import HelpTip from '../../components/ui/HelpTip'
import { Plus, FolderOpen } from 'lucide-react'

const defaultFilters: AnimalFiltersState = {
  search: '',
  species: '',
  sex: '',
  category: '',
  status: '',
  lotId: '',
}

type FeedbackType = {
  type: 'success' | 'error'
  message: string
} | null

export default function AnimalsPage() {
  const navigate = useNavigate()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [filters, setFilters] = useState<AnimalFiltersState>(defaultFilters)
  const [animalToDelete, setAnimalToDelete] = useState<Animal | null>(null)
  const [feedback, setFeedback] = useState<FeedbackType>(null)

  const loadData = useCallback(() => {
    setAnimals(getAnimals())
    setLots(getLots())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 5000)
    return () => clearTimeout(timer)
  }, [feedback])

  const filteredAnimals = useMemo(() => {
    return animals.filter(animal => {
      const searchTerm = filters.search.toLowerCase().trim()

      const matchesSearch =
        !searchTerm ||
        animal.identification.toLowerCase().includes(searchTerm) ||
        (animal.name?.toLowerCase().includes(searchTerm) ?? false) ||
        animal.breed.toLowerCase().includes(searchTerm)

      const matchesSpecies =
        !filters.species || animal.species === filters.species

      const matchesSex =
        !filters.sex || animal.sex === filters.sex

      const matchesCategory =
        !filters.category || animal.category === filters.category

      const matchesStatus =
        !filters.status || animal.status === filters.status

      const matchesLot =
        !filters.lotId || animal.lotId === filters.lotId

      return (
        matchesSearch &&
        matchesSpecies &&
        matchesSex &&
        matchesCategory &&
        matchesStatus &&
        matchesLot
      )
    })
  }, [animals, filters])

  const handleClearFilters = () => setFilters(defaultFilters)

  const handleDeleteConfirm = () => {
    if (!animalToDelete) return

    try {
      deleteAnimal(animalToDelete.id)
      setAnimalToDelete(null)
      loadData()
    } catch (error) {
      setAnimalToDelete(null)
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao excluir animal.',
      })
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">Gestão de Animais</h1>

            <HelpTip
              title="Para que serve esta página?"
              description="Aqui você cadastra e acompanha os animais da propriedade, incluindo identificação, categoria, situação e vínculo com lotes."
            />
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Visualize e gerencie o rebanho da propriedade
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/animais/lotes"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Gerenciar lotes
          </Link>

          <Button onClick={() => navigate('/animais/novo')}>
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar animal
          </Button>
        </div>
      </div>

      {feedback && (
        <PageFeedback type={feedback.type} message={feedback.message} />
      )}

      <AnimalSummaryCards animals={animals} lots={lots} />

      <AnimalFilters
        filters={filters}
        onChange={setFilters}
        onClear={handleClearFilters}
        lots={lots}
      />

      {animals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum animal cadastrado
          </p>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cadastre o primeiro animal da propriedade para começar a organizar o rebanho.
          </p>

          <Button className="mt-4" onClick={() => navigate('/animais/novo')}>
            <Plus className="w-4 h-4 mr-2 inline" />
            Cadastrar animal
          </Button>
        </div>
      ) : filteredAnimals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Nenhum animal encontrado com os filtros selecionados.
          </p>

          <button
            onClick={handleClearFilters}
            className="mt-2 text-green-600 hover:underline text-sm"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <>
          <AnimalsTable
            animals={filteredAnimals}
            lots={lots}
            onView={(id) => navigate(`/animais/${id}`)}
            onEdit={(id) => navigate(`/animais/${id}/editar`)}
            onDelete={(id) =>
              setAnimalToDelete(
                filteredAnimals.find(a => a.id === id) ?? null
              )
            }
          />

          <div className="md:hidden grid grid-cols-1 gap-4">
            {filteredAnimals.map(animal => (
              <AnimalCard
                key={animal.id}
                animal={animal}
                lotName={lots.find(lot => lot.id === animal.lotId)?.name}
                onView={(id) => navigate(`/animais/${id}`)}
                onEdit={(id) => navigate(`/animais/${id}/editar`)}
                onDelete={(id) =>
                  setAnimalToDelete(
                    animals.find(a => a.id === id) ?? null
                  )
                }
              />
            ))}
          </div>
        </>
      )}

      <DeleteAnimalDialog
        open={!!animalToDelete}
        onClose={() => setAnimalToDelete(null)}
        onConfirm={handleDeleteConfirm}
        animalName={
          animalToDelete
            ? (animalToDelete.name ?? animalToDelete.identification)
            : undefined
        }
      />
    </div>
  )
}