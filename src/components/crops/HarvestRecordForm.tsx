import {
  useState,
  FormEvent,
  ChangeEvent,
  useMemo,
} from 'react'
import {
  HarvestRecord,
  HarvestProductionUnit,
  CropCycle,
} from '../../types'
import { getCropCycles } from '../../services/cropService'
import { getLandAreaById } from '../../services/landService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface HarvestRecordFormData {
  cropCycleId: string
  harvestDate: string
  harvestedAreaHectares: string
  productionQuantity: string
  productionUnit: HarvestProductionUnit
  sackWeightKg: string
  notes: string
}

interface Props {
  record?: HarvestRecord
  preselectedCropCycleId?: string
  onSubmit: (
    data: Omit<
      HarvestRecord,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const unitOptions: HarvestProductionUnit[] =
  ['kg', 't', 'sc']

function getCropCycleLabel(
  cycle: CropCycle
): string {
  const area = getLandAreaById(
    cycle.landAreaId
  )

  const areaLabel = area
    ? `${area.code} — ${area.name}`
    : 'Área não encontrada'

  const cultivarPart =
    cycle.cultivar
      ? ` — ${cycle.cultivar}`
      : ''

  return `${areaLabel} | ${cycle.crop}${cultivarPart} — ${cycle.season}`
}

export default function HarvestRecordForm({
  record,
  preselectedCropCycleId,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const [formData, setFormData] =
    useState<HarvestRecordFormData>(
      () => {
        if (record) {
          return {
            cropCycleId:
              record.cropCycleId,
            harvestDate:
              record.harvestDate,
            harvestedAreaHectares:
              record.harvestedAreaHectares.toString(),
            productionQuantity:
              record.productionQuantity.toString(),
            productionUnit:
              record.productionUnit,
            sackWeightKg:
              record.sackWeightKg?.toString() ??
              '',
            notes:
              record.notes ?? '',
          }
        }

        return {
          cropCycleId:
            preselectedCropCycleId ??
            '',
          harvestDate: '',
          harvestedAreaHectares: '',
          productionQuantity: '',
          productionUnit: 'kg',
          sackWeightKg: '',
          notes: '',
        }
      }
    )

  const [errors, setErrors] =
    useState<
      Partial<
        Record<
          keyof HarvestRecordFormData,
          string
        >
      >
    >({})

  const cropCycles = useMemo(
    () => getCropCycles(),
    []
  )

  const handleChange = (
    e: ChangeEvent<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >
  ) => {
    const { name, value } =
      e.target

    setFormData(prev => {
      const next = {
        ...prev,
        [name]: value,
      }

      if (
        name ===
          'productionUnit' &&
        value !== 'sc'
      ) {
        next.sackWeightKg = ''
      }

      return next
    })

    if (
      errors[
        name as keyof HarvestRecordFormData
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
        keyof HarvestRecordFormData,
        string
      >
    > = {}

    if (!formData.cropCycleId) {
      newErrors.cropCycleId =
        'Cultivo é obrigatório'
    }

    if (!formData.harvestDate) {
      newErrors.harvestDate =
        'Data da colheita é obrigatória'
    }

    if (
      !formData.harvestedAreaHectares
    ) {
      newErrors.harvestedAreaHectares =
        'Área colhida é obrigatória'
    }

    if (
      !formData.productionQuantity
    ) {
      newErrors.productionQuantity =
        'Produção total é obrigatória'
    }

    if (
      !formData.productionUnit
    ) {
      newErrors.productionUnit =
        'Unidade é obrigatória'
    }

    if (
      formData.productionUnit ===
        'sc' &&
      !formData.sackWeightKg
    ) {
      newErrors.sackWeightKg =
        'Peso da saca é obrigatório'
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
      HarvestRecord,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      cropCycleId:
        formData.cropCycleId,

      harvestDate:
        formData.harvestDate,

      harvestedAreaHectares:
        Number(
          formData.harvestedAreaHectares
        ),

      productionQuantity:
        Number(
          formData.productionQuantity
        ),

      productionUnit:
        formData.productionUnit,

      sackWeightKg:
        formData.productionUnit ===
        'sc'
          ? Number(
              formData.sackWeightKg
            )
          : undefined,

      notes:
        formData.notes.trim() ||
        undefined,
    }

    onSubmit(payload)
  }

  const showSackWeight =
    formData.productionUnit ===
    'sc'

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="harvest-crop-cycle"
                className="block text-sm font-medium"
              >
                Cultivo / Safra *
              </label>

              <HelpTip
                title="O que significa Cultivo / Safra?"
                description="É o cultivo e a safra aos quais esta colheita pertence. Escolha o registro correto para que a produção e a produtividade fiquem no histórico certo."
              />
            </div>

            {cropCycles.length ===
            0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Nenhum cultivo
                cadastrado. Cadastre
                primeiro um cultivo.
              </p>
            ) : (
              <select
                id="harvest-crop-cycle"
                name="cropCycleId"
                value={
                  formData.cropCycleId
                }
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">
                  Selecione um cultivo
                </option>

                {cropCycles.map(
                  cycle => (
                    <option
                      key={cycle.id}
                      value={cycle.id}
                    >
                      {getCropCycleLabel(
                        cycle
                      )}
                    </option>
                  )
                )}
              </select>
            )}

            {errors.cropCycleId && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.cropCycleId
                }
              </p>
            )}
          </div>

          <div>
            <Input
              label="Data da colheita *"
              name="harvestDate"
              type="date"
              value={
                formData.harvestDate
              }
              onChange={handleChange}
              required
            />

            {errors.harvestDate && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.harvestDate
                }
              </p>
            )}
          </div>

          <div>
            <Input
              label="Área colhida (ha) *"
              name="harvestedAreaHectares"
              type="number"
              step="any"
              value={
                formData.harvestedAreaHectares
              }
              onChange={handleChange}
              placeholder="Ex: 10.5"
              required
            />

            {errors.harvestedAreaHectares && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.harvestedAreaHectares
                }
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="harvest-production-quantity"
                className="block text-sm font-medium"
              >
                Produção total *
              </label>

              <HelpTip
                title="O que é a produção total?"
                description="É a quantidade total colhida neste cultivo. Junto com a área colhida, ela ajuda a calcular a produtividade."
              />
            </div>

            <Input
              id="harvest-production-quantity"
              label=""
              name="productionQuantity"
              type="number"
              step="any"
              value={
                formData.productionQuantity
              }
              onChange={handleChange}
              placeholder="Ex: 45000"
              required
            />

            {errors.productionQuantity && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.productionQuantity
                }
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="harvest-production-unit"
                className="block text-sm font-medium"
              >
                Unidade *
              </label>

              <HelpTip
                title="Qual unidade escolher?"
                description="Use a unidade em que a produção foi medida: quilogramas (kg), toneladas (t) ou sacas (sc)."
              />
            </div>

            <select
              id="harvest-production-unit"
              name="productionUnit"
              value={
                formData.productionUnit
              }
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {unitOptions.map(
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

            {errors.productionUnit && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.productionUnit
                }
              </p>
            )}
          </div>

          {showSackWeight && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label
                  htmlFor="harvest-sack-weight"
                  className="block text-sm font-medium"
                >
                  Peso da saca (kg) *
                </label>

                <HelpTip
                  title="O que é o peso da saca?"
                  description="É o peso de cada saca utilizada na produção. Por exemplo, uma saca de soja normalmente pesa 60 kg."
                />
              </div>

              <Input
                id="harvest-sack-weight"
                label=""
                name="sackWeightKg"
                type="number"
                step="any"
                value={
                  formData.sackWeightKg
                }
                onChange={handleChange}
                placeholder="Ex: 60"
                required
              />

              {errors.sackWeightKg && (
                <p className="mt-1 text-sm text-red-600">
                  {
                    errors.sackWeightKg
                  }
                </p>
              )}
            </div>
          )}
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
            placeholder="Observações adicionais (opcional)"
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