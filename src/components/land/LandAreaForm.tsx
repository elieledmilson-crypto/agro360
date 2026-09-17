import { useState, FormEvent, ChangeEvent } from 'react'
import { LandArea, LandAreaType, LandAreaStatus } from '../../types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface LandAreaFormData {
  code: string
  name: string
  type: LandAreaType
  areaHectares: string
  purpose: string
  status: LandAreaStatus
  description: string
}

interface Props {
  area?: LandArea
  onSubmit: (
    data: Omit<LandArea, 'id' | 'createdAt' | 'updatedAt'>
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const typeOptions: LandAreaType[] = [
  'Piquete',
  'Talhão',
  'Pastagem',
  'Reserva/APP',
  'Infraestrutura',
  'Área ociosa',
  'Outro',
]

const statusOptions: LandAreaStatus[] = [
  'Em uso',
  'Em descanso',
  'Em recuperação',
  'Inativa',
]

export default function LandAreaForm({
  area,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const [formData, setFormData] = useState<LandAreaFormData>(() => {
    if (area) {
      return {
        code: area.code,
        name: area.name,
        type: area.type,
        areaHectares: area.areaHectares.toString(),
        purpose: area.purpose ?? '',
        status: area.status,
        description: area.description ?? '',
      }
    }

    return {
      code: '',
      name: '',
      type: 'Piquete',
      areaHectares: '',
      purpose: '',
      status: 'Em uso',
      description: '',
    }
  })

  const [errors, setErrors] = useState<
    Partial<Record<keyof LandAreaFormData, string>>
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

    if (errors[name as keyof LandAreaFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<
      Record<
        keyof LandAreaFormData,
        string
      >
    > = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Código é obrigatório'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.type) {
      newErrors.type = 'Tipo é obrigatório'
    }

    if (!formData.areaHectares) {
      newErrors.areaHectares =
        'Área em hectares é obrigatória'
    } else {
      const areaValue =
        parseFloat(
          formData.areaHectares
        )

      if (
        !Number.isFinite(areaValue) ||
        areaValue <= 0
      ) {
        newErrors.areaHectares =
          'Área deve ser maior que zero'
      }
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

    const payload: Omit<
      LandArea,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      type: formData.type,
      areaHectares:
        parseFloat(
          formData.areaHectares
        ),
      purpose:
        formData.purpose.trim() ||
        undefined,
      status: formData.status,
      description:
        formData.description.trim() ||
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
              placeholder="Ex: PIQ-001"
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
              placeholder="Ex: Piquete 01"
              required
            />

            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="land-area-type"
                className="block text-sm font-medium"
              >
                Tipo *
              </label>

              <HelpTip
                title="Como escolher o tipo da área?"
                description="Use Talhão para áreas de cultivo, Piquete para áreas de manejo de animais e escolha os outros tipos conforme o uso real da área na propriedade."
              />
            </div>

            <select
              id="land-area-type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {typeOptions.map(option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>

            {errors.type && (
              <p className="mt-1 text-sm text-red-600">
                {errors.type}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Área (ha) *"
              name="areaHectares"
              type="number"
              min="0"
              step="any"
              value={formData.areaHectares}
              onChange={handleChange}
              placeholder="Ex: 12.5"
              required
            />

            {errors.areaHectares && (
              <p className="mt-1 text-sm text-red-600">
                {errors.areaHectares}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Finalidade"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Ex: Pastejo rotacionado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Situação *
            </label>

            <select
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
          <label className="block text-sm font-medium mb-1">
            Descrição / Observações
          </label>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
            placeholder="Informações adicionais (opcional)"
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