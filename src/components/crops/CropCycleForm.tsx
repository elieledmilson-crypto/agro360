import { useState, FormEvent, ChangeEvent, useMemo } from 'react'
import { CropCycle, CropCycleStatus } from '../../types'
import { getLandAreas } from '../../services/landService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface CropCycleFormData {
  landAreaId: string
  crop: string
  cultivar: string
  season: string
  status: CropCycleStatus
  plantingDate: string
  expectedHarvestDate: string
  notes: string
}

interface Props {
  cropCycle?: CropCycle
  onSubmit: (
    data: Omit<CropCycle, 'id' | 'createdAt' | 'updatedAt'>
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const statusOptions: CropCycleStatus[] = [
  'Planejado',
  'Em andamento',
  'Concluído',
  'Cancelado',
]

export default function CropCycleForm({
  cropCycle,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const [formData, setFormData] = useState<CropCycleFormData>(() => {
    if (cropCycle) {
      return {
        landAreaId: cropCycle.landAreaId,
        crop: cropCycle.crop,
        cultivar: cropCycle.cultivar ?? '',
        season: cropCycle.season,
        status: cropCycle.status,
        plantingDate: cropCycle.plantingDate ?? '',
        expectedHarvestDate: cropCycle.expectedHarvestDate ?? '',
        notes: cropCycle.notes ?? '',
      }
    }

    return {
      landAreaId: '',
      crop: '',
      cultivar: '',
      season: '',
      status: 'Planejado',
      plantingDate: '',
      expectedHarvestDate: '',
      notes: '',
    }
  })

  const [errors, setErrors] = useState<
    Partial<Record<keyof CropCycleFormData, string>>
  >({})

  const talhoes = useMemo(
    () =>
      getLandAreas().filter(
        area => area.type === 'Talhão'
      ),
    []
  )

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

    if (errors[name as keyof CropCycleFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<
      Record<
        keyof CropCycleFormData,
        string
      >
    > = {}

    if (!formData.landAreaId) {
      newErrors.landAreaId =
        'Talhão é obrigatório'
    }

    if (!formData.crop.trim()) {
      newErrors.crop =
        'Cultura é obrigatória'
    }

    if (!formData.season.trim()) {
      newErrors.season =
        'Safra é obrigatória'
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
      CropCycle,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      landAreaId:
        formData.landAreaId,
      crop:
        formData.crop.trim(),
      cultivar:
        formData.cultivar.trim() ||
        undefined,
      season:
        formData.season.trim(),
      status:
        formData.status,
      plantingDate:
        formData.plantingDate.trim() ||
        undefined,
      expectedHarvestDate:
        formData.expectedHarvestDate.trim() ||
        undefined,
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
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="crop-cycle-land-area"
                className="block text-sm font-medium"
              >
                Talhão *
              </label>

              <HelpTip
                title="O que é um talhão?"
                description="É uma divisão da propriedade usada para organizar uma área de produção. Um talhão pode reunir cultivo, análises de solo, manejos, colheitas e operações realizadas naquela área."
              />
            </div>

            {talhoes.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Nenhum talhão cadastrado. Cadastre primeiro uma área do tipo Talhão.
              </p>
            ) : (
              <select
                id="crop-cycle-land-area"
                name="landAreaId"
                value={formData.landAreaId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">
                  Selecione um talhão
                </option>

                {talhoes.map(area => (
                  <option
                    key={area.id}
                    value={area.id}
                  >
                    {area.code} — {area.name}
                  </option>
                ))}
              </select>
            )}

            {errors.landAreaId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.landAreaId}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Cultura *"
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              placeholder="Ex: Milho"
              required
            />

            {errors.crop && (
              <p className="mt-1 text-sm text-red-600">
                {errors.crop}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="crop-cycle-cultivar"
                className="block text-sm font-medium"
              >
                Cultivar
              </label>

              <HelpTip
                title="O que é cultivar?"
                description="É a variedade específica de uma cultura. Por exemplo, duas plantações de soja podem utilizar cultivares diferentes."
              />
            </div>

            <Input
              id="crop-cycle-cultivar"
              label=""
              name="cultivar"
              value={formData.cultivar}
              onChange={handleChange}
              placeholder="Ex: AG 1051"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="crop-cycle-season"
                className="block text-sm font-medium"
              >
                Safra *
              </label>

              <HelpTip
                title="O que é safra?"
                description="É o período de produção de um cultivo. Por exemplo: Soja — Safra 2026/2027."
              />
            </div>

            <Input
              id="crop-cycle-season"
              label=""
              name="season"
              value={formData.season}
              onChange={handleChange}
              placeholder="Ex: Safra 2025/2026"
              required
            />

            {errors.season && (
              <p className="mt-1 text-sm text-red-600">
                {errors.season}
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

          <div>
            <Input
              label="Data de plantio"
              name="plantingDate"
              type="date"
              value={formData.plantingDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Previsão de colheita"
              name="expectedHarvestDate"
              type="date"
              value={formData.expectedHarvestDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Observações
          </label>

          <textarea
            name="notes"
            value={formData.notes}
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