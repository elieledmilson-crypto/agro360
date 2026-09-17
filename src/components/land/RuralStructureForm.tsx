import { useState, FormEvent, ChangeEvent, useMemo } from 'react'
import {
  RuralStructure,
  RuralStructureType,
  RuralStructureStatus,
  RuralStructureCondition,
} from '../../types'
import { getLandAreas } from '../../services/landService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface RuralStructureFormData {
  code: string
  name: string
  type: RuralStructureType
  landAreaIds: string[]
  status: RuralStructureStatus
  condition: RuralStructureCondition
  lengthMeters: string
  widthMeters: string
  description: string
}

interface Props {
  structure?: RuralStructure
  onSubmit: (
    data: Omit<
      RuralStructure,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const typeOptions: RuralStructureType[] = [
  'Cerca',
  'Corredor',
  'Porteira',
]

const statusOptions: RuralStructureStatus[] = [
  'Em uso',
  'Em manutenção',
  'Inativa',
]

const conditionOptions: RuralStructureCondition[] = [
  'Boa',
  'Regular',
  'Ruim',
]

export default function RuralStructureForm({
  structure,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const [formData, setFormData] =
    useState<RuralStructureFormData>(() => {
      if (structure) {
        return {
          code: structure.code,
          name: structure.name,
          type: structure.type,
          landAreaIds:
            structure.landAreaIds,
          status: structure.status,
          condition:
            structure.condition,
          lengthMeters:
            structure.lengthMeters?.toString() ??
            '',
          widthMeters:
            structure.widthMeters?.toString() ??
            '',
          description:
            structure.description ?? '',
        }
      }

      return {
        code: '',
        name: '',
        type: 'Cerca',
        landAreaIds: [],
        status: 'Em uso',
        condition: 'Boa',
        lengthMeters: '',
        widthMeters: '',
        description: '',
      }
    })

  const [errors, setErrors] =
    useState<
      Partial<
        Record<
          keyof RuralStructureFormData,
          string
        >
      >
    >({})

  const landAreas = useMemo(
    () => getLandAreas(),
    []
  )

  const handleChange = (
    e: ChangeEvent<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (
      errors[
        name as keyof RuralStructureFormData
      ]
    ) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleAreaToggle = (
    areaId: string
  ) => {
    setFormData(prev => {
      const alreadySelected =
        prev.landAreaIds.includes(areaId)

      return {
        ...prev,
        landAreaIds:
          alreadySelected
            ? prev.landAreaIds.filter(
                id => id !== areaId
              )
            : [
                ...prev.landAreaIds,
                areaId,
              ],
      }
    })
  }

  const validate = (): boolean => {
    const newErrors: Partial<
      Record<
        keyof RuralStructureFormData,
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

    if (!formData.type) {
      newErrors.type =
        'Tipo é obrigatório'
    }

    if (!formData.status) {
      newErrors.status =
        'Situação é obrigatória'
    }

    if (!formData.condition) {
      newErrors.condition =
        'Estado de conservação é obrigatório'
    }

    if (formData.lengthMeters) {
      const length = parseFloat(
        formData.lengthMeters
      )

      if (
        !Number.isFinite(length) ||
        length <= 0
      ) {
        newErrors.lengthMeters =
          'Comprimento deve ser maior que zero'
      }
    }

    if (formData.widthMeters) {
      const width = parseFloat(
        formData.widthMeters
      )

      if (
        !Number.isFinite(width) ||
        width <= 0
      ) {
        newErrors.widthMeters =
          'Largura deve ser maior que zero'
      }
    }

    setErrors(newErrors)

    return (
      Object.keys(newErrors).length ===
      0
    )
  }

  const handleSubmit = (
    e: FormEvent
  ) => {
    e.preventDefault()

    if (!validate()) return

    const payload: Omit<
      RuralStructure,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      type: formData.type,
      landAreaIds:
        formData.landAreaIds,
      status: formData.status,
      condition: formData.condition,
      lengthMeters:
        formData.lengthMeters
          ? parseFloat(
              formData.lengthMeters
            )
          : undefined,
      widthMeters:
        formData.widthMeters
          ? parseFloat(
              formData.widthMeters
            )
          : undefined,
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
              placeholder="Ex: CER-001"
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
              placeholder="Ex: Cerca divisória do piquete 1"
              required
            />

            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tipo *
            </label>

            <select
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
            <label className="block text-sm font-medium mb-1">
              Situação *
            </label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {statusOptions.map(
                option => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>

            {errors.status && (
              <p className="mt-1 text-sm text-red-600">
                {errors.status}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Estado de conservação *
            </label>

            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {conditionOptions.map(
                option => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>

            {errors.condition && (
              <p className="mt-1 text-sm text-red-600">
                {errors.condition}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Comprimento (m)"
              name="lengthMeters"
              type="number"
              min="0"
              step="any"
              value={
                formData.lengthMeters
              }
              onChange={handleChange}
              placeholder="Ex: 120.5"
            />

            {errors.lengthMeters && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.lengthMeters
                }
              </p>
            )}
          </div>

          <div>
            <Input
              label="Largura (m)"
              name="widthMeters"
              type="number"
              min="0"
              step="any"
              value={
                formData.widthMeters
              }
              onChange={handleChange}
              placeholder="Ex: 4.2"
            />

            {errors.widthMeters && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.widthMeters
                }
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-1 mb-2">
            <p className="text-sm font-medium">
              Áreas vinculadas
            </p>

            <HelpTip
              title="O que são áreas vinculadas?"
              description="São as áreas da propriedade relacionadas a esta estrutura, como os piquetes ou talhões ligados por uma cerca, corredor ou porteira."
            />
          </div>

          {landAreas.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma área cadastrada.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
              {landAreas.map(area => (
                <label
                  key={area.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={formData.landAreaIds.includes(
                      area.id
                    )}
                    onChange={() =>
                      handleAreaToggle(
                        area.id
                      )
                    }
                    className="rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
                  />

                  {area.code} —{' '}
                  {area.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Descrição
          </label>

          <textarea
            name="description"
            value={
              formData.description
            }
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

      <div className="mt-6 flex flex-wrap gap-3">
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