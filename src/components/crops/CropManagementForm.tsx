import {
  useState,
  FormEvent,
  ChangeEvent,
  useMemo,
} from 'react'
import {
  CropManagement,
  CropManagementType,
  CropCycle,
  User,
} from '../../types'
import { getCropCycles } from '../../services/cropService'
import { getLandAreaById } from '../../services/landService'
import { userHasPermission } from '../../services/permissionService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'
import InventoryConsumptionSection, {
  ConsumptionLine,
  createEmptyConsumptionLine,
} from '../inventory/InventoryConsumptionSection'
import IntegratedFinancialSection, {
  IntegratedFinancialLine,
  createEmptyIntegratedFinancialLine,
} from '../integration/IntegratedFinancialSection'

interface CropManagementFormData {
  cropCycleId: string
  date: string
  type: CropManagementType
  description: string
  productOrMaterial: string
  doseOrQuantity: string
  responsible: string
  notes: string
}

export interface CropManagementConsumptionPayload {
  inventoryItemId: string
  quantity: number
}

export interface CropManagementFinancialPayload {
  categoryId: string
  date: string
  description: string
  amount: number
  notes?: string
}

interface Props {
  management?: CropManagement
  preselectedCropCycleId?: string
  hasStockConsumption?: boolean
  user: User | null
  onSubmit: (
    data: Omit<
      CropManagement,
      'id' | 'createdAt' | 'updatedAt'
    >,
    consumptions?: CropManagementConsumptionPayload[],
    financial?: CropManagementFinancialPayload,
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const typeOptions:
  CropManagementType[] = [
    'Adubação',
    'Irrigação',
    'Pulverização',
    'Capina',
    'Controle de plantas daninhas',
    'Controle de pragas',
    'Controle de doenças',
    'Manejo cultural',
    'Outro',
  ]

const ALLOWED_CATEGORIES = [
  'Semente',
  'Fertilizante',
  'Defensivo agrícola',
] as const

function getCropCycleLabel(
  cycle: CropCycle,
): string {
  const area =
    getLandAreaById(
      cycle.landAreaId,
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

export default function CropManagementForm({
  management,
  preselectedCropCycleId,
  hasStockConsumption,
  user,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const isEditMode =
    management !== undefined

  const canUseInventory =
    userHasPermission(
      user,
      'inventory',
    )

  const canUseFinance =
    userHasPermission(
      user,
      'finance',
    )

  const [
    formData,
    setFormData,
  ] =
    useState<CropManagementFormData>(
      () => {
        if (management) {
          return {
            cropCycleId:
              management.cropCycleId,
            date:
              management.date,
            type:
              management.type,
            description:
              management.description,
            productOrMaterial:
              management.productOrMaterial ??
              '',
            doseOrQuantity:
              management.doseOrQuantity ??
              '',
            responsible:
              management.responsible ??
              '',
            notes:
              management.notes ??
              '',
          }
        }

        return {
          cropCycleId:
            preselectedCropCycleId ??
            '',
          date: '',
          type: 'Adubação',
          description: '',
          productOrMaterial: '',
          doseOrQuantity: '',
          responsible: '',
          notes: '',
        }
      },
    )

  const [
    errors,
    setErrors,
  ] = useState<
    Partial<
      Record<
        keyof CropManagementFormData,
        string
      >
    >
  >({})

  const [
    stockEnabled,
    setStockEnabled,
  ] = useState(false)

  const [
    consumptionLines,
    setConsumptionLines,
  ] =
    useState<ConsumptionLine[]>(
      [
        createEmptyConsumptionLine(),
      ],
    )

  const [
    consumptionErrors,
    setConsumptionErrors,
  ] = useState<
    Record<
      string,
      {
        inventoryItemId?: string
        quantity?: string
      }
    >
  >({})

  const [
    financialEnabled,
    setFinancialEnabled,
  ] = useState(false)

  const [
    financialLine,
    setFinancialLine,
  ] =
    useState<IntegratedFinancialLine>(
      () =>
        createEmptyIntegratedFinancialLine(),
    )

  const [
    financialErrors,
    setFinancialErrors,
  ] = useState<{
    categoryId?: string
    date?: string
    description?: string
    amount?: string
  }>({})

  const cropCycles =
    useMemo(
      () => getCropCycles(),
      [],
    )

  const handleChange = (
    e: ChangeEvent<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } =
      e.target

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (
      errors[
        name as keyof CropManagementFormData
      ]
    ) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors:
      Partial<
        Record<
          keyof CropManagementFormData,
          string
        >
      > = {}

    if (
      !formData.cropCycleId
    ) {
      newErrors.cropCycleId =
        'Cultivo é obrigatório'
    }

    if (!formData.date) {
      newErrors.date =
        'Data do manejo é obrigatória'
    }

    if (!formData.type) {
      newErrors.type =
        'Tipo é obrigatório'
    }

    if (
      !formData.description.trim()
    ) {
      newErrors.description =
        'Descrição é obrigatória'
    }

    let consumptionValid = true

    const newConsumptionErrors:
      Record<
        string,
        {
          inventoryItemId?: string
          quantity?: string
        }
      > = {}

    if (
      !isEditMode &&
      canUseInventory &&
      stockEnabled
    ) {
      for (
        const line of
          consumptionLines
      ) {
        const lineErr: {
          inventoryItemId?: string
          quantity?: string
        } = {}

        if (
          !line.inventoryItemId
        ) {
          lineErr.inventoryItemId =
            'Item é obrigatório'

          consumptionValid =
            false
        }

        if (
          !line.quantity.trim()
        ) {
          lineErr.quantity =
            'Quantidade é obrigatória'

          consumptionValid =
            false
        } else {
          const q =
            Number(line.quantity)

          if (
            !Number.isFinite(q) ||
            q <= 0
          ) {
            lineErr.quantity =
              'Quantidade deve ser maior que zero'

            consumptionValid =
              false
          }
        }

        if (
          Object.keys(
            lineErr,
          ).length > 0
        ) {
          newConsumptionErrors[
            line.id
          ] = lineErr
        }
      }
    }

    const newFinancialErrors:
      typeof financialErrors = {}

    if (
      financialEnabled &&
      canUseFinance
    ) {
      if (
        !financialLine.categoryId
      ) {
        newFinancialErrors.categoryId =
          'Categoria é obrigatória'
      }

      if (!financialLine.date) {
        newFinancialErrors.date =
          'Data é obrigatória'
      }

      if (
        !financialLine.description.trim()
      ) {
        newFinancialErrors.description =
          'Descrição é obrigatória'
      }

      if (
        !financialLine.amount.trim()
      ) {
        newFinancialErrors.amount =
          'Valor é obrigatório'
      } else {
        const amount = Number(
          financialLine.amount,
        )

        if (
          !Number.isFinite(
            amount,
          ) ||
          amount <= 0
        ) {
          newFinancialErrors.amount =
            'Valor deve ser maior que zero'
        }
      }
    }

    setErrors(newErrors)

    setConsumptionErrors(
      newConsumptionErrors,
    )

    setFinancialErrors(
      newFinancialErrors,
    )

    return (
      Object.keys(
        newErrors,
      ).length === 0 &&
      consumptionValid &&
      Object.keys(
        newFinancialErrors,
      ).length === 0
    )
  }

  const handleSubmit = (
    e: FormEvent,
  ) => {
    e.preventDefault()

    if (!validate()) return

    const payload: Omit<
      CropManagement,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      cropCycleId:
        formData.cropCycleId,
      date:
        formData.date,
      type:
        formData.type,
      description:
        formData.description.trim(),
      productOrMaterial:
        formData.productOrMaterial.trim() ||
        undefined,
      doseOrQuantity:
        formData.doseOrQuantity.trim() ||
        undefined,
      responsible:
        formData.responsible.trim() ||
        undefined,
      notes:
        formData.notes.trim() ||
        undefined,
    }

    let consumptions:
      | CropManagementConsumptionPayload[]
      | undefined

    if (
      !isEditMode &&
      canUseInventory &&
      stockEnabled
    ) {
      consumptions =
        consumptionLines.map(
          line => ({
            inventoryItemId:
              line.inventoryItemId,
            quantity: Number(
              line.quantity,
            ),
          }),
        )
    }

    let financial:
      | CropManagementFinancialPayload
      | undefined

    if (
      financialEnabled &&
      canUseFinance
    ) {
      financial = {
        categoryId:
          financialLine.categoryId,
        date:
          financialLine.date,
        description:
          financialLine.description.trim(),
        amount: Number(
          financialLine.amount,
        ),
        notes:
          financialLine.notes.trim() ||
          undefined,
      }
    }

    onSubmit(
      payload,
      consumptions,
      financial,
    )
  }

  const locked =
    isEditMode &&
    hasStockConsumption === true

  const disabledClass =
    'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-75'

  const selectClass = (
    disabled: boolean,
  ) =>
    `w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 ${
      disabled
        ? disabledClass
        : ''
    }`

  const showFinancialSection =
    !isEditMode &&
    canUseFinance

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        {locked && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
            Este manejo possui baixa
            de estoque registrada. Os
            dados principais estão
            bloqueados para preservar
            a consistência do
            histórico.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="crop-management-cycle"
                className="block text-sm font-medium"
              >
                Cultivo / Safra *
              </label>

              <HelpTip
                title="O que significa Cultivo / Safra?"
                description="É o cultivo específico ao qual este manejo será vinculado, considerando também a safra registrada."
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
                id="crop-management-cycle"
                name="cropCycleId"
                value={
                  formData.cropCycleId
                }
                onChange={
                  handleChange
                }
                disabled={
                  locked
                }
                className={
                  selectClass(
                    locked,
                  )
                }
              >
                <option value="">
                  Selecione um
                  cultivo
                </option>

                {cropCycles.map(
                  cycle => (
                    <option
                      key={
                        cycle.id
                      }
                      value={
                        cycle.id
                      }
                    >
                      {getCropCycleLabel(
                        cycle,
                      )}
                    </option>
                  ),
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
              label="Data do manejo *"
              name="date"
              type="date"
              value={
                formData.date
              }
              onChange={
                handleChange
              }
              required
              disabled={locked}
              className={
                locked
                  ? disabledClass
                  : ''
              }
            />

            {errors.date && (
              <p className="mt-1 text-sm text-red-600">
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="crop-management-type"
                className="block text-sm font-medium"
              >
                Tipo *
              </label>

              <HelpTip
                title="O que é o tipo de manejo?"
                description="Indica qual operação agrícola foi realizada no cultivo."
              />
            </div>

            <select
              id="crop-management-type"
              name="type"
              value={
                formData.type
              }
              onChange={
                handleChange
              }
              disabled={locked}
              className={
                selectClass(
                  locked,
                )
              }
            >
              {typeOptions.map(
                option => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ),
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
              label="Descrição *"
              name="description"
              value={
                formData.description
              }
              onChange={
                handleChange
              }
              placeholder="Ex: Aplicação de ureia em cobertura"
              required
            />

            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.description
                }
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="crop-management-product"
                className="block text-sm font-medium"
              >
                Produto ou material
              </label>

              <HelpTip
                title="O que informar no produto ou material?"
                description="Registre o nome do produto utilizado na operação."
              />
            </div>

            <Input
              id="crop-management-product"
              label=""
              name="productOrMaterial"
              value={
                formData.productOrMaterial
              }
              onChange={
                handleChange
              }
              placeholder="Ex: Ureia, Herbicida X, Água"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="crop-management-dose"
                className="block text-sm font-medium"
              >
                Dose ou quantidade
              </label>

              <HelpTip
                title="O que é a dose ou quantidade?"
                description="É a quantidade utilizada na operação."
              />
            </div>

            <Input
              id="crop-management-dose"
              label=""
              name="doseOrQuantity"
              value={
                formData.doseOrQuantity
              }
              onChange={
                handleChange
              }
              placeholder="Ex: 150 kg/ha, 2 L/ha"
            />
          </div>

          <div>
            <Input
              label="Responsável"
              name="responsible"
              value={
                formData.responsible
              }
              onChange={
                handleChange
              }
              placeholder="Ex: João, Equipe de campo"
            />
          </div>

          {!isEditMode &&
            canUseInventory && (
              <InventoryConsumptionSection
                enabled={
                  stockEnabled
                }
                onEnabledChange={
                  setStockEnabled
                }
                lines={
                  consumptionLines
                }
                onLinesChange={
                  setConsumptionLines
                }
                allowedCategories={[
                  ...ALLOWED_CATEGORIES,
                ]}
                title="Dar baixa no estoque"
                helpDescription="Marque para registrar a saída dos produtos utilizados neste manejo agrícola."
                lineErrors={
                  consumptionErrors
                }
              />
            )}

          {showFinancialSection && (
            <IntegratedFinancialSection
              enabled={
                financialEnabled
              }
              onEnabledChange={
                setFinancialEnabled
              }
              line={
                financialLine
              }
              onLineChange={
                setFinancialLine
              }
              errors={
                financialErrors
              }
              title="Registrar este custo no Financeiro"
              helpDescription="Marque para criar uma despesa vinculada a este manejo agrícola."
            />
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Observações
          </label>

          <textarea
            name="notes"
            value={
              formData.notes
            }
            onChange={
              handleChange
            }
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