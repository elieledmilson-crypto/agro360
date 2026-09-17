import { useState, FormEvent, ChangeEvent, useMemo } from 'react'
import { LandUseRecord, LandUseType } from '../../types'
import { getLandAreas } from '../../services/landService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface LandUseFormData {
  landAreaId: string
  type: LandUseType
  startDate: string
  endDate: string
  description: string
}

interface Props {
  record?: LandUseRecord
  preselectedLandAreaId?: string
  onSubmit: (
    data: Omit<
      LandUseRecord,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const landUseTypeOptions: LandUseType[] = [
  'Uso produtivo',
  'Descanso',
  'Recuperação',
  'Preservação',
  'Manutenção',
  'Outro',
]

export default function LandUseForm({
  record,
  preselectedLandAreaId,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const [formData, setFormData] =
    useState<LandUseFormData>(() => {
      if (record) {
        return {
          landAreaId:
            record.landAreaId,
          type: record.type,
          startDate:
            record.startDate,
          endDate:
            record.endDate ?? '',
          description:
            record.description ?? '',
        }
      }

      return {
        landAreaId:
          preselectedLandAreaId ??
          '',
        type: 'Uso produtivo',
        startDate: '',
        endDate: '',
        description: '',
      }
    })

  const [errors, setErrors] =
    useState<
      Partial<
        Record<
          keyof LandUseFormData,
          string
        >
      >
    >({})

  const areas = useMemo(
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
        name as keyof LandUseFormData
      ]
    ) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<
      Record<
        keyof LandUseFormData,
        string
      >
    > = {}

    if (!formData.landAreaId) {
      newErrors.landAreaId =
        'Área é obrigatória'
    }

    if (!formData.type) {
      newErrors.type =
        'Tipo de utilização é obrigatório'
    }

    if (!formData.startDate) {
      newErrors.startDate =
        'Data de início é obrigatória'
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
      LandUseRecord,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      landAreaId:
        formData.landAreaId,
      type: formData.type,
      startDate:
        formData.startDate,
      endDate:
        formData.endDate.trim() ||
        undefined,
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
            <label className="block text-sm font-medium mb-1">
              Área *
            </label>

            <select
              name="landAreaId"
              value={
                formData.landAreaId
              }
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">
                Selecione uma área
              </option>

              {areas.map(area => (
                <option
                  key={area.id}
                  value={area.id}
                >
                  {area.code} —{' '}
                  {area.name}
                </option>
              ))}
            </select>

            {errors.landAreaId && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.landAreaId
                }
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="land-use-type"
                className="block text-sm font-medium"
              >
                Tipo de utilização *
              </label>

              <HelpTip
                title="O que é o tipo de utilização?"
                description="Indica como a área foi usada no período informado. Por exemplo: uso produtivo, descanso, recuperação ou preservação."
              />
            </div>

            <select
              id="land-use-type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {landUseTypeOptions.map(
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

            {errors.type && (
              <p className="mt-1 text-sm text-red-600">
                {errors.type}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Data de início *"
              name="startDate"
              type="date"
              value={
                formData.startDate
              }
              onChange={handleChange}
              required
            />

            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.startDate
                }
              </p>
            )}
          </div>

          <div>
            <Input
              label="Data de término"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
            />
          </div>
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
            placeholder="Observações (opcional)"
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