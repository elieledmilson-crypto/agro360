import {
  useState,
  FormEvent,
  ChangeEvent,
  useMemo,
} from 'react'
import {
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
  User,
} from '../../types'
import {
  getInventoryItems,
  getInventoryItemById,
} from '../../services/inventoryService'
import { userHasPermission } from '../../services/permissionService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'
import IntegratedFinancialSection, {
  IntegratedFinancialLine,
  createEmptyIntegratedFinancialLine,
} from '../integration/IntegratedFinancialSection'

interface InventoryMovementFormData {
  inventoryItemId: string
  type: InventoryMovementType
  movementDate: string
  quantity: string
  reason: string
  responsible: string
  notes: string
}

export interface InventoryMovementFinancialPayload {
  categoryId: string
  date: string
  description: string
  amount: number
  notes?: string
}

interface Props {
  preselectedItemId?: string
  preselectedType?: InventoryMovementType
  user: User | null
  onSubmit: (
    data: Omit<
      InventoryMovement,
      | 'id'
      | 'createdAt'
      | 'balanceBefore'
      | 'balanceAfter'
    >,
    financial?: InventoryMovementFinancialPayload,
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const typeOptions:
  InventoryMovementType[] = [
    'Entrada',
    'Saída',
  ]

export default function InventoryMovementForm({
  preselectedItemId,
  preselectedType,
  user,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const items = useMemo(
    () => getInventoryItems(),
    [],
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
    useState<InventoryMovementFormData>(
      () => ({
        inventoryItemId:
          preselectedItemId ??
          '',
        type:
          preselectedType ??
          'Entrada',
        movementDate: '',
        quantity: '',
        reason: '',
        responsible: '',
        notes: '',
      }),
    )

  const [
    errors,
    setErrors,
  ] = useState<
    Partial<
      Record<
        keyof InventoryMovementFormData,
        string
      >
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

  const selectedItem:
    InventoryItem | undefined =
    formData.inventoryItemId
      ? items.find(
          item =>
            item.id ===
            formData.inventoryItemId,
        ) ??
        getInventoryItemById(
          formData.inventoryItemId,
        )
      : undefined

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
        name as keyof InventoryMovementFormData
      ]
    ) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }

    if (
      name === 'type' &&
      value !== 'Entrada'
    ) {
      setFinancialEnabled(false)
    }
  }

  const validate = (): boolean => {
    const newErrors:
      Partial<
        Record<
          keyof InventoryMovementFormData,
          string
        >
      > = {}

    if (
      !formData.inventoryItemId
    ) {
      newErrors.inventoryItemId =
        'Item é obrigatório'
    }

    if (!formData.type) {
      newErrors.type =
        'Tipo é obrigatório'
    }

    if (
      !formData.movementDate
    ) {
      newErrors.movementDate =
        'Data é obrigatória'
    }

    if (
      !formData.quantity.trim()
    ) {
      newErrors.quantity =
        'Quantidade é obrigatória'
    } else {
      const quantity =
        Number(
          formData.quantity,
        )

      if (
        !Number.isFinite(
          quantity,
        ) ||
        quantity <= 0
      ) {
        newErrors.quantity =
          'Quantidade deve ser maior que zero'
      }
    }

    if (
      !formData.reason.trim()
    ) {
      newErrors.reason =
        'Motivo é obrigatório'
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
        const amount =
          Number(
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

    setFinancialErrors(
      newFinancialErrors,
    )

    return (
      Object.keys(
        newErrors,
      ).length === 0 &&
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
      InventoryMovement,
      | 'id'
      | 'createdAt'
      | 'balanceBefore'
      | 'balanceAfter'
    > = {
      inventoryItemId:
        formData.inventoryItemId,
      type:
        formData.type,
      movementDate:
        formData.movementDate,
      quantity:
        Number(
          formData.quantity,
        ),
      reason:
        formData.reason.trim(),
      responsible:
        formData.responsible.trim() ||
        undefined,
      notes:
        formData.notes.trim() ||
        undefined,
    }

    let financial:
      | InventoryMovementFinancialPayload
      | undefined

    if (
      financialEnabled &&
      canUseFinance &&
      formData.type === 'Entrada'
    ) {
      financial = {
        categoryId:
          financialLine.categoryId,
        date:
          financialLine.date,
        description:
          financialLine.description.trim(),
        amount:
          Number(
            financialLine.amount,
          ),
        notes:
          financialLine.notes.trim() ||
          undefined,
      }
    }

    onSubmit(
      payload,
      financial,
    )
  }

  const formatQuantity = (
    value: number,
  ) =>
    value.toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    )

  const showFinancialSection =
    canUseFinance &&
    formData.type === 'Entrada'

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="movement-item"
              className="block text-sm font-medium mb-1"
            >
              Item *
            </label>

            {items.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Nenhum item
                cadastrado. Cadastre
                primeiro um item de
                estoque.
              </p>
            ) : (
              <select
                id="movement-item"
                name="inventoryItemId"
                value={
                  formData.inventoryItemId
                }
                onChange={
                  handleChange
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">
                  Selecione um item
                </option>

                {items.map(
                  item => (
                    <option
                      key={
                        item.id
                      }
                      value={
                        item.id
                      }
                      disabled={
                        item.status ===
                        'Inativo'
                      }
                    >
                      {item.code} —{' '}
                      {item.name}
                      {item.status ===
                      'Inativo'
                        ? ' (inativo)'
                        : ''}
                    </option>
                  ),
                )}
              </select>
            )}

            {errors.inventoryItemId && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.inventoryItemId
                }
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="movement-type"
                className="block text-sm font-medium"
              >
                Tipo *
              </label>

              <HelpTip
                title="O que é o tipo da movimentação?"
                description="Entrada aumenta o saldo do item. Saída reduz o saldo disponível no estoque."
              />
            </div>

            <select
              id="movement-type"
              name="type"
              value={
                formData.type
              }
              onChange={
                handleChange
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
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

          {selectedItem && (
            <div className="md:col-span-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex flex-wrap items-center gap-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Saldo atual
                </p>

                <HelpTip
                  title="O que é o saldo atual?"
                  description="É a quantidade disponível deste item antes de registrar esta movimentação."
                />
              </div>

              <p className="font-medium mt-1">
                {formatQuantity(
                  selectedItem.currentQuantity,
                )}{' '}
                {
                  selectedItem.unit
                }
              </p>
            </div>
          )}

          <div>
            <Input
              label="Data *"
              name="movementDate"
              type="date"
              value={
                formData.movementDate
              }
              onChange={
                handleChange
              }
              required
            />

            {errors.movementDate && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.movementDate
                }
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="movement-quantity"
                className="block text-sm font-medium"
              >
                Quantidade *
              </label>

              <HelpTip
                title="Qual quantidade devo informar?"
                description="Informe quanto deste item está entrando ou saindo do estoque."
              />
            </div>

            <Input
              id="movement-quantity"
              label=""
              name="quantity"
              type="number"
              min="0"
              step="any"
              value={
                formData.quantity
              }
              onChange={
                handleChange
              }
              placeholder="0"
              required
            />

            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.quantity
                }
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="movement-reason"
                className="block text-sm font-medium"
              >
                Motivo *
              </label>

              <HelpTip
                title="Por que informar o motivo?"
                description="O motivo registra por que o estoque foi alterado."
              />
            </div>

            <Input
              id="movement-reason"
              label=""
              name="reason"
              value={
                formData.reason
              }
              onChange={
                handleChange
              }
              placeholder="Ex: Compra, Consumo, Perda"
              required
            />

            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">
                {errors.reason}
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
              title="Registrar despesa no Financeiro"
              helpDescription="Marque para criar uma despesa vinculada a esta entrada de estoque."
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