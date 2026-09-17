import {
  useState,
  FormEvent,
  ChangeEvent,
  useMemo,
} from 'react'
import {
  Treatment,
  TreatmentStatus,
  User,
} from '../../types'
import { getAnimals } from '../../services/animalService'
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
import { isEndDateBeforeStartDate } from '../../utils/date'

interface TreatmentFormData {
  animalId: string
  reason: string
  medication: string
  dosage: string
  startDate: string
  endDate: string
  status: TreatmentStatus
  responsible: string
  notes: string
}

export interface TreatmentConsumptionPayload {
  inventoryItemId: string
  quantity: number
}

export interface TreatmentFinancialPayload {
  categoryId: string
  date: string
  description: string
  amount: number
  notes?: string
}

interface Props {
  treatment?: Treatment
  preselectedAnimalId?: string
  hasStockConsumption?: boolean
  user: User | null
  onSubmit: (
    data: Omit<
      Treatment,
      'id' | 'createdAt' | 'updatedAt'
    >,
    consumptions?: TreatmentConsumptionPayload[],
    financial?: TreatmentFinancialPayload,
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const statusOptions:
  TreatmentStatus[] = [
    'Em andamento',
    'Concluído',
    'Interrompido',
  ]

const ALLOWED_CATEGORIES = [
  'Medicamento veterinário',
] as const

export default function TreatmentForm({
  treatment,
  preselectedAnimalId,
  hasStockConsumption,
  user,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const animals = useMemo(
    () => getAnimals(),
    [],
  )

  const isEditMode =
    treatment !== undefined

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
    useState<TreatmentFormData>(
      () => {
        if (treatment) {
          return {
            animalId:
              treatment.animalId,
            reason:
              treatment.reason,
            medication:
              treatment.medication ??
              '',
            dosage:
              treatment.dosage ??
              '',
            startDate:
              treatment.startDate,
            endDate:
              treatment.endDate ??
              '',
            status:
              treatment.status,
            responsible:
              treatment.responsible ??
              '',
            notes:
              treatment.notes ??
              '',
          }
        }

        return {
          animalId:
            preselectedAnimalId ??
            '',
          reason: '',
          medication: '',
          dosage: '',
          startDate: '',
          endDate: '',
          status: 'Em andamento',
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
        keyof TreatmentFormData,
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
        name as keyof TreatmentFormData
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
          keyof TreatmentFormData,
          string
        >
      > = {}

    if (!formData.animalId) {
      newErrors.animalId =
        'Animal é obrigatório'
    }

    if (
      !formData.reason.trim()
    ) {
      newErrors.reason =
        'Motivo é obrigatório'
    }

    if (!formData.startDate) {
      newErrors.startDate =
        'Data de início é obrigatória'
    }

    if (
      formData.endDate &&
      formData.startDate
    ) {
      if (
        isEndDateBeforeStartDate(
          formData.startDate,
          formData.endDate,
        )
      ) {
        newErrors.endDate =
          'Data final não pode ser anterior à data inicial'
      }
    }

    if (!formData.status) {
      newErrors.status =
        'Situação é obrigatória'
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
      Treatment,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      animalId:
        formData.animalId,
      reason:
        formData.reason.trim(),
      medication:
        formData.medication.trim() ||
        undefined,
      dosage:
        formData.dosage.trim() ||
        undefined,
      startDate:
        formData.startDate,
      endDate:
        formData.endDate ||
        undefined,
      status:
        formData.status,
      responsible:
        formData.responsible.trim() ||
        undefined,
      notes:
        formData.notes.trim() ||
        undefined,
    }

    let consumptions:
      | TreatmentConsumptionPayload[]
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
      | TreatmentFinancialPayload
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
            Este tratamento possui
            baixa de estoque
            registrada. Os dados
            principais estão
            bloqueados para
            preservar a
            consistência do
            histórico.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Animal *
            </label>

            <select
              name="animalId"
              value={
                formData.animalId
              }
              onChange={
                handleChange
              }
              disabled={locked}
              className={
                selectClass(locked)
              }
            >
              <option value="">
                Selecione um animal
              </option>

              {animals.map(
                animal => (
                  <option
                    key={
                      animal.id
                    }
                    value={
                      animal.id
                    }
                  >
                    {
                      animal.identification
                    }
                    {animal.name
                      ? ` — ${animal.name}`
                      : ''}
                  </option>
                ),
              )}
            </select>

            {errors.animalId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.animalId}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Motivo *"
              name="reason"
              value={
                formData.reason
              }
              onChange={
                handleChange
              }
              placeholder="Ex: Infecção"
              required
              disabled={locked}
              className={
                locked
                  ? disabledClass
                  : ''
              }
            />

            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">
                {errors.reason}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="treatment-medication"
                className="block text-sm font-medium"
              >
                Medicamento
              </label>

              <HelpTip
                title="O que informar em medicamento?"
                description="Informe o nome do medicamento utilizado no tratamento."
              />
            </div>

            <Input
              id="treatment-medication"
              label=""
              name="medication"
              value={
                formData.medication
              }
              onChange={
                handleChange
              }
              placeholder="Nome do medicamento"
              disabled={locked}
              className={
                locked
                  ? disabledClass
                  : ''
              }
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="treatment-dosage"
                className="block text-sm font-medium"
              >
                Dosagem
              </label>

              <HelpTip
                title="O que é a dosagem?"
                description="É a quantidade do medicamento utilizada no tratamento."
              />
            </div>

            <Input
              id="treatment-dosage"
              label=""
              name="dosage"
              value={
                formData.dosage
              }
              onChange={
                handleChange
              }
              placeholder="Ex: 10 mL por dia"
              disabled={locked}
              className={
                locked
                  ? disabledClass
                  : ''
              }
            />
          </div>

          <div>
            <Input
              label="Data de início *"
              name="startDate"
              type="date"
              value={
                formData.startDate
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
              value={
                formData.endDate
              }
              onChange={
                handleChange
              }
            />

            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.endDate}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="treatment-status"
                className="block text-sm font-medium"
              >
                Situação *
              </label>

              <HelpTip
                title="O que significa a situação do tratamento?"
                description="Indica se o tratamento está em andamento, foi concluído ou possui outra situação."
              />
            </div>

            <select
              id="treatment-status"
              name="status"
              value={
                formData.status
              }
              onChange={
                handleChange
              }
              className={
                selectClass(false)
              }
            >
              {statusOptions.map(
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

            {errors.status && (
              <p className="mt-1 text-sm text-red-600">
                {errors.status}
              </p>
            )}
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
              placeholder="Nome do responsável"
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
                helpDescription="Marque para registrar a saída dos medicamentos utilizados neste tratamento."
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
              helpDescription="Marque para criar uma despesa vinculada a este tratamento."
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