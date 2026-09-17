import {
  useState,
  FormEvent,
  ChangeEvent,
  useMemo,
} from 'react'
import {
  MachineMaintenanceRecord,
  MachineMaintenanceType,
  User,
} from '../../types'
import { getMachines } from '../../services/machineService'
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

interface MaintenanceFormData {
  machineId: string
  maintenanceDate: string
  type: MachineMaintenanceType
  hourMeter: string
  servicePerformed: string
  responsible: string
  notes: string
}

export interface MachineMaintenanceConsumptionPayload {
  inventoryItemId: string
  quantity: number
}

export interface MachineMaintenanceFinancialPayload {
  categoryId: string
  date: string
  description: string
  amount: number
  notes?: string
}

interface Props {
  record?: MachineMaintenanceRecord
  preselectedMachineId?: string
  hasStockConsumption?: boolean
  user: User | null
  onSubmit: (
    data: Omit<
      MachineMaintenanceRecord,
      'id' | 'createdAt' | 'updatedAt'
    >,
    consumptions?: MachineMaintenanceConsumptionPayload[],
    financial?: MachineMaintenanceFinancialPayload,
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const typeOptions:
  MachineMaintenanceType[] = [
    'Preventiva',
    'Corretiva',
    'Inspeção',
    'Lubrificação',
    'Troca de óleo',
    'Troca de filtros',
    'Reparo',
    'Outro',
  ]

const ALLOWED_CATEGORIES = [
  'Peça',
  'Lubrificante',
  'Material',
] as const

export default function MachineMaintenanceForm({
  record,
  preselectedMachineId,
  hasStockConsumption,
  user,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const isEditMode =
    record !== undefined

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
    useState<MaintenanceFormData>(
      () => {
        if (record) {
          return {
            machineId:
              record.machineId,
            maintenanceDate:
              record.maintenanceDate,
            type:
              record.type,
            hourMeter:
              record.hourMeter?.toString() ??
              '',
            servicePerformed:
              record.servicePerformed,
            responsible:
              record.responsible ??
              '',
            notes:
              record.notes ??
              '',
          }
        }

        return {
          machineId:
            preselectedMachineId ??
            '',
          maintenanceDate: '',
          type: 'Preventiva',
          hourMeter: '',
          servicePerformed: '',
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
        keyof MaintenanceFormData,
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

  const machines = useMemo(
    () => getMachines(),
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
        name as keyof MaintenanceFormData
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
          keyof MaintenanceFormData,
          string
        >
      > = {}

    if (!formData.machineId) {
      newErrors.machineId =
        'Máquina ou equipamento é obrigatório'
    }

    if (
      !formData.maintenanceDate
    ) {
      newErrors.maintenanceDate =
        'Data da manutenção é obrigatória'
    }

    if (!formData.type) {
      newErrors.type =
        'Tipo de manutenção é obrigatório'
    }

    if (
      !formData.servicePerformed.trim()
    ) {
      newErrors.servicePerformed =
        'Serviço realizado é obrigatório'
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

    const hourMeterValue =
      formData.hourMeter.trim()

    const payload: Omit<
      MachineMaintenanceRecord,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      machineId:
        formData.machineId,
      maintenanceDate:
        formData.maintenanceDate,
      type:
        formData.type,
      hourMeter:
        hourMeterValue
          ? Number(
              hourMeterValue,
            )
          : undefined,
      servicePerformed:
        formData.servicePerformed.trim(),
      responsible:
        formData.responsible.trim() ||
        undefined,
      notes:
        formData.notes.trim() ||
        undefined,
    }

    let consumptions:
      | MachineMaintenanceConsumptionPayload[]
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
      | MachineMaintenanceFinancialPayload
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
            Esta manutenção possui
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
            <label
              htmlFor="maintenance-machine"
              className="block text-sm font-medium mb-1"
            >
              Máquina/Equipamento *
            </label>

            {machines.length ===
            0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Nenhuma máquina
                cadastrada.
              </p>
            ) : (
              <select
                id="maintenance-machine"
                name="machineId"
                value={
                  formData.machineId
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
                  Selecione uma
                  máquina
                </option>

                {machines.map(
                  machine => (
                    <option
                      key={
                        machine.id
                      }
                      value={
                        machine.id
                      }
                    >
                      {
                        machine.code
                      }{' '}
                      —{' '}
                      {
                        machine.name
                      }
                    </option>
                  ),
                )}
              </select>
            )}

            {errors.machineId && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.machineId
                }
              </p>
            )}
          </div>

          <div>
            <Input
              label="Data da manutenção *"
              name="maintenanceDate"
              type="date"
              value={
                formData.maintenanceDate
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

            {errors.maintenanceDate && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.maintenanceDate
                }
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="maintenance-type"
              className="block text-sm font-medium mb-1"
            >
              Tipo *
            </label>

            <select
              id="maintenance-type"
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
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="maintenance-hour-meter"
                className="block text-sm font-medium"
              >
                Horímetro na
                manutenção (h)
              </label>

              <HelpTip
                title="Por que informar o horímetro?"
                description="Este valor registra quantas horas a máquina tinha trabalhado no momento da manutenção."
              />
            </div>

            <Input
              id="maintenance-hour-meter"
              label=""
              name="hourMeter"
              type="number"
              min={0}
              step={0.1}
              value={
                formData.hourMeter
              }
              onChange={
                handleChange
              }
              placeholder="1250.5"
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
                helpDescription="Marque para registrar a saída de peças, lubrificantes ou materiais utilizados nesta manutenção."
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
              helpDescription="Marque para criar uma despesa vinculada a esta manutenção."
            />
          )}
        </div>

        <div className="mt-4">
          <label
            htmlFor="maintenance-service"
            className="block text-sm font-medium mb-1"
          >
            Serviço realizado *
          </label>

          <textarea
            id="maintenance-service"
            name="servicePerformed"
            value={
              formData.servicePerformed
            }
            onChange={
              handleChange
            }
            rows={3}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
            placeholder="Descreva o serviço realizado"
          />

          {errors.servicePerformed && (
            <p className="mt-1 text-sm text-red-600">
              {
                errors.servicePerformed
              }
            </p>
          )}
        </div>

        <div className="mt-4">
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

        <div className="mt-4">
          <label
            htmlFor="maintenance-notes"
            className="block text-sm font-medium mb-1"
          >
            Observações
          </label>

          <textarea
            id="maintenance-notes"
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