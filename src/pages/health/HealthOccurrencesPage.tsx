import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHealthOccurrences, deleteHealthOccurrence } from '../../services/healthService'
import { getAnimals } from '../../services/animalService'
import { HealthOccurrence, Animal } from '../../types'
import HealthOccurrenceTable from '../../components/health/HealthOccurrenceTable'
import HealthOccurrenceCard from '../../components/health/HealthOccurrenceCard'
import DeleteHealthDialog from '../../components/health/DeleteHealthDialog'
import Button from '../../components/ui/Button'
import HelpTip from '../../components/ui/HelpTip'
import { Plus } from 'lucide-react'

interface Filters {
  animalId: string
  type: string
  severity: string
  status: string
}

const defaultFilters: Filters = { animalId: '', type: '', severity: '', status: '' }

export default function HealthOccurrencesPage() {
  const navigate = useNavigate()
  const [occurrences, setOccurrences] = useState<HealthOccurrence[]>([])
  const [animals, setAnimals] = useState<Animal[]>([])
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [toDelete, setToDelete] = useState<HealthOccurrence | null>(null)

  const loadData = useCallback(() => {
    setOccurrences(getHealthOccurrences())
    setAnimals(getAnimals())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return occurrences.filter(o => {
      const matchesAnimal = !filters.animalId || o.animalId === filters.animalId
      const matchesType = !filters.type || o.type === filters.type
      const matchesSeverity = !filters.severity || o.severity === filters.severity
      const matchesStatus = !filters.status || o.status === filters.status
      return matchesAnimal && matchesType && matchesSeverity && matchesStatus
    })
  }, [occurrences, filters])

  const handleDelete = () => {
    if (toDelete) {
      deleteHealthOccurrence(toDelete.id)
      setToDelete(null)
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">Ocorrências de Saúde</h1>
            <HelpTip
              title="Para que serve esta página?"
              description="Aqui você registra problemas, sinais clínicos ou outros acontecimentos relacionados à saúde dos animais."
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Registros de eventos clínicos e observações</p>
        </div>
        <Button onClick={() => navigate('/saude-animal/ocorrencias/nova')}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Registrar ocorrência
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={filters.animalId}
            onChange={e => setFilters(prev => ({ ...prev, animalId: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Animal: todos</option>
            {animals.map(a => (
              <option key={a.id} value={a.id}>{a.identification} {a.name ? `— ${a.name}` : ''}</option>
            ))}
          </select>
          <select
            value={filters.type}
            onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Tipo: todos</option>
            <option value="Doença">Doença</option>
            <option value="Sintoma">Sintoma</option>
            <option value="Ferimento">Ferimento</option>
            <option value="Exame">Exame</option>
            <option value="Observação clínica">Observação clínica</option>
            <option value="Outro">Outro</option>
          </select>
          <select
            value={filters.severity}
            onChange={e => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Severidade: todas</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
          </select>
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Situação: todas</option>
            <option value="Aberta">Aberta</option>
            <option value="Resolvida">Resolvida</option>
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
            Nenhuma ocorrência encontrada.
          </p>
          <Button className="mt-4" onClick={() => navigate('/saude-animal/ocorrencias/nova')}>
            <Plus className="w-4 h-4 mr-2 inline" />
            Registrar primeira ocorrência
          </Button>
        </div>
      ) : (
        <>
          <HealthOccurrenceTable
            occurrences={filtered}
            animals={animals}
            onEdit={id => navigate(`/saude-animal/ocorrencias/${id}/editar`)}
            onDelete={id => setToDelete(filtered.find(o => o.id === id) ?? null)}
          />
          <div className="md:hidden grid grid-cols-1 gap-4">
            {filtered.map(o => (
              <HealthOccurrenceCard
                key={o.id}
                occurrence={o}
                animal={animals.find(a => a.id === o.animalId)}
                onEdit={id => navigate(`/saude-animal/ocorrencias/${id}/editar`)}
                onDelete={id => setToDelete(filtered.find(x => x.id === id) ?? null)}
              />
            ))}
          </div>
        </>
      )}

      <DeleteHealthDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir ocorrência?"
        description="Esta ação removerá o registro de ocorrência permanentemente."
      />
    </div>
  )
}