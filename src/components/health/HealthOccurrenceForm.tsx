import { useState, FormEvent, ChangeEvent, useMemo } from 'react'
import { HealthOccurrence, HealthOccurrenceType, HealthSeverity, HealthOccurrenceStatus } from '../../types'
import { getAnimals } from '../../services/animalService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'
import { isFutureDate } from '../../utils/date'

interface HealthOccurrenceFormData {
  animalId: string
  date: string
  type: HealthOccurrenceType
  title: string
  description: string
  severity: HealthSeverity
  status: HealthOccurrenceStatus
}

interface Props {
  occurrence?: HealthOccurrence
  preselectedAnimalId?: string
  onSubmit: (data: Omit<HealthOccurrence, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const typeOptions: HealthOccurrenceType[] = ['Doença', 'Sintoma', 'Ferimento', 'Exame', 'Observação clínica', 'Outro']
const severityOptions: HealthSeverity[] = ['Baixa', 'Média', 'Alta']
const statusOptions: HealthOccurrenceStatus[] = ['Aberta', 'Resolvida']

export default function HealthOccurrenceForm({ occurrence, preselectedAnimalId, onSubmit, onCancel, submitting, submitError }: Props) {
  const animals = useMemo(() => getAnimals(), [])

  const [formData, setFormData] = useState<HealthOccurrenceFormData>(() => {
    if (occurrence) {
      return {
        animalId: occurrence.animalId,
        date: occurrence.date,
        type: occurrence.type,
        title: occurrence.title,
        description: occurrence.description ?? '',
        severity: occurrence.severity,
        status: occurrence.status,
      }
    }
    return {
      animalId: preselectedAnimalId ?? '',
      date: '',
      type: 'Observação clínica',
      title: '',
      description: '',
      severity: 'Baixa',
      status: 'Aberta',
    }
  })

  const [errors, setErrors] = useState<Partial<Record<keyof HealthOccurrenceFormData, string>>>({})

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof HealthOccurrenceFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof HealthOccurrenceFormData, string>> = {}

    if (!formData.animalId) newErrors.animalId = 'Animal é obrigatório'
    if (!formData.date) newErrors.date = 'Data é obrigatória'
    else if (isFutureDate(formData.date)) newErrors.date = 'Data não pode ser futura'
    if (!formData.type) newErrors.type = 'Tipo é obrigatório'
    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório'
    if (!formData.severity) newErrors.severity = 'Severidade é obrigatória'
    if (!formData.status) newErrors.status = 'Situação é obrigatória'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload: Omit<HealthOccurrence, 'id' | 'createdAt' | 'updatedAt'> = {
      animalId: formData.animalId,
      date: formData.date,
      type: formData.type,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      severity: formData.severity,
      status: formData.status,
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Animal *</label>
            <select
              name="animalId"
              value={formData.animalId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione um animal</option>
              {animals.map(animal => (
                <option key={animal.id} value={animal.id}>
                  {animal.identification} {animal.name ? `— ${animal.name}` : ''}
                </option>
              ))}
            </select>
            {errors.animalId && <p className="mt-1 text-sm text-red-600">{errors.animalId}</p>}
          </div>

          <div>
            <Input
              label="Data *"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label htmlFor="occurrence-type" className="block text-sm font-medium">
                Tipo *
              </label>
              <HelpTip
                title="O que é o tipo da ocorrência?"
                description="É a classificação do acontecimento de saúde registrado para o animal."
              />
            </div>
            <select
              id="occurrence-type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {typeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
          </div>

          <div>
            <Input
              label="Título *"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Claudicação"
              required
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label htmlFor="occurrence-severity" className="block text-sm font-medium">
                Severidade *
              </label>
              <HelpTip
                title="O que significa severidade?"
                description="É uma classificação usada para registrar a intensidade da ocorrência observada no animal."
              />
            </div>
            <select
              id="occurrence-severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {severityOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.severity && <p className="mt-1 text-sm text-red-600">{errors.severity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Situação *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {statusOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
            placeholder="Detalhes da ocorrência (opcional)"
          />
        </div>

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {submitError}
          </div>
        )}
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}