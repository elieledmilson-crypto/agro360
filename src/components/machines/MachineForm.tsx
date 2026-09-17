import { useState, FormEvent, ChangeEvent } from 'react'
import {
  Machine,
  MachineCategory,
  MachineStatus,
} from '../../types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface MachineFormData {
  code: string
  name: string
  category: MachineCategory
  brand: string
  model: string
  year: string
  identification: string
  hourMeter: string
  status: MachineStatus
  notes: string
}

interface Props {
  machine?: Machine
  onSubmit: (
    data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const categoryOptions: MachineCategory[] = [
  'Trator',
  'Colheitadeira',
  'Pulverizador',
  'Plantadeira',
  'Semeadora',
  'Grade',
  'Arado',
  'Roçadeira',
  'Distribuidor',
  'Implemento',
  'Veículo',
  'Outro',
]

const statusOptions: MachineStatus[] = [
  'Operacional',
  'Em manutenção',
  'Inativa',
]

export default function MachineForm({
  machine,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const [formData, setFormData] = useState<MachineFormData>(() => {
    if (machine) {
      return {
        code: machine.code,
        name: machine.name,
        category: machine.category,
        brand: machine.brand ?? '',
        model: machine.model ?? '',
        year: machine.year?.toString() ?? '',
        identification: machine.identification ?? '',
        hourMeter: machine.hourMeter?.toString() ?? '',
        status: machine.status,
        notes: machine.notes ?? '',
      }
    }

    return {
      code: '',
      name: '',
      category: 'Trator',
      brand: '',
      model: '',
      year: '',
      identification: '',
      hourMeter: '',
      status: 'Operacional',
      notes: '',
    }
  })

  const [errors, setErrors] = useState<
    Partial<Record<keyof MachineFormData, string>>
  >({})

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof MachineFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<
      Record<
        keyof MachineFormData,
        string
      >
    > = {}

    if (!formData.code.trim()) {
      newErrors.code =
        'Código é obrigatório'
    }

    if (!formData.name.trim()) {
      newErrors.name =
        'Nome é obrigatório'
    }

    if (!formData.category) {
      newErrors.category =
        'Categoria é obrigatória'
    }

    if (!formData.status) {
      newErrors.status =
        'Situação é obrigatória'
    }

    setErrors(newErrors)

    return (
      Object.keys(newErrors).length === 0
    )
  }

  const handleSubmit = (
    e: FormEvent
  ) => {
    e.preventDefault()

    if (!validate()) return

    const yearValue =
      formData.year.trim()

    const hourMeterValue =
      formData.hourMeter.trim()

    const payload: Omit<
      Machine,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      code:
        formData.code,
      name:
        formData.name.trim(),
      category:
        formData.category,
      brand:
        formData.brand.trim() ||
        undefined,
      model:
        formData.model.trim() ||
        undefined,
      year:
        yearValue
          ? Number(yearValue)
          : undefined,
      identification:
        formData.identification.trim() ||
        undefined,
      hourMeter:
        hourMeterValue
          ? Number(hourMeterValue)
          : undefined,
      status:
        formData.status,
      notes:
        formData.notes.trim() ||
        undefined,
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Código *"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="TR-001"
              required
            />

            {errors.code && (
              <p className="mt-1 text-sm text-red-600">
                {errors.code}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Nome *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Trator Principal"
              required
            />

            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="machine-category"
              className="block text-sm font-medium mb-1"
            >
              Categoria *
            </label>

            <select
              id="machine-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {categoryOptions.map(option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>

            {errors.category && (
              <p className="mt-1 text-sm text-red-600">
                {errors.category}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Marca"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="John Deere"
            />
          </div>

          <div>
            <Input
              label="Modelo"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="6125M"
            />
          </div>

          <div>
            <Input
              label="Ano"
              name="year"
              type="number"
              min={1900}
              max={2100}
              step={1}
              value={formData.year}
              onChange={handleChange}
              placeholder="2024"
            />
          </div>

          <div>
            <Input
              label="Identificação"
              name="identification"
              value={formData.identification}
              onChange={handleChange}
              placeholder="Placa, série ou patrimônio"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="machine-hour-meter"
                className="block text-sm font-medium"
              >
                Horímetro atual (h)
              </label>

              <HelpTip
                title="O que é horímetro?"
                description="É o total de horas de funcionamento registrado pela máquina. Ele ajuda a acompanhar quanto o equipamento já trabalhou."
              />
            </div>

            <Input
              id="machine-hour-meter"
              label=""
              name="hourMeter"
              type="number"
              min={0}
              step={0.1}
              value={formData.hourMeter}
              onChange={handleChange}
              placeholder="1250.5"
            />
          </div>

          <div>
            <label
              htmlFor="machine-status"
              className="block text-sm font-medium mb-1"
            >
              Situação *
            </label>

            <select
              id="machine-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {statusOptions.map(option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>

            {errors.status && (
              <p className="mt-1 text-sm text-red-600">
                {errors.status}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="machine-notes"
            className="block text-sm font-medium mb-1"
          >
            Observações
          </label>

          <textarea
            id="machine-notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
            placeholder="Observações adicionais (opcional)"
          />
        </div>

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {submitError}
          </div>
        )}
      </Card>

      <div className="mt-6 flex gap-3">
        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? 'Salvando...'
            : 'Salvar'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}