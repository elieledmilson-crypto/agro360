import {
  useState,
  FormEvent,
  ChangeEvent,
} from 'react'
import {
  InventoryItem,
  InventoryItemCategory,
  InventoryItemStatus,
  InventoryItemUnit,
} from '../../types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface InventoryItemFormData {
  code: string
  name: string
  category: InventoryItemCategory
  unit: InventoryItemUnit
  currentQuantity: string
  minimumQuantity: string
  location: string
  status: InventoryItemStatus
  description: string
  batchNumber: string
  expirationDate: string
}

interface Props {
  item?: InventoryItem
  currentQuantityReadOnly?: boolean

  onSubmit: (
    data: Omit<
      InventoryItem,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
    >
  ) => void

  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const categoryOptions:
  InventoryItemCategory[] = [
  'Ração',
  'Medicamento veterinário',
  'Vacina',
  'Semente',
  'Fertilizante',
  'Defensivo agrícola',
  'Combustível',
  'Lubrificante',
  'Peça',
  'Material',
  'Outro',
]

const unitOptions:
  InventoryItemUnit[] = [
  'kg',
  'g',
  'L',
  'mL',
  'un',
  'sc',
  't',
  'm',
  'Outro',
]

const statusOptions:
  InventoryItemStatus[] = [
  'Ativo',
  'Inativo',
]

export default function InventoryItemForm({
  item,
  currentQuantityReadOnly,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const [
    formData,
    setFormData,
  ] = useState<InventoryItemFormData>(
    () => {
      if (item) {
        return {
          code:
            item.code,
          name:
            item.name,
          category:
            item.category,
          unit:
            item.unit,
          currentQuantity:
            item.currentQuantity.toString(),
          minimumQuantity:
            item.minimumQuantity?.toString() ??
            '',
          location:
            item.location ?? '',
          status:
            item.status,
          description:
            item.description ??
            '',
          batchNumber:
            item.batchNumber ??
            '',
          expirationDate:
            item.expirationDate ??
            '',
        }
      }

      return {
        code: '',
        name: '',
        category: 'Ração',
        unit: 'kg',
        currentQuantity: '',
        minimumQuantity: '',
        location: '',
        status: 'Ativo',
        description: '',
        batchNumber: '',
        expirationDate: '',
      }
    }
  )

  const [
    errors,
    setErrors,
  ] = useState<
    Partial<
      Record<
        keyof InventoryItemFormData,
        string
      >
    >
  >({})

  const handleChange = (
    e: ChangeEvent<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = e.target

    setFormData(
      prev => ({
        ...prev,
        [name]: value,
      })
    )

    if (
      errors[
        name as keyof InventoryItemFormData
      ]
    ) {
      setErrors(
        prev => ({
          ...prev,
          [name]: undefined,
        })
      )
    }
  }

  const validate =
    (): boolean => {
      const newErrors: Partial<
        Record<
          keyof InventoryItemFormData,
          string
        >
      > = {}

      if (
        !formData.code.trim()
      ) {
        newErrors.code =
          'Código é obrigatório'
      }

      if (
        !formData.name.trim()
      ) {
        newErrors.name =
          'Nome é obrigatório'
      }

      if (
        !formData.category
      ) {
        newErrors.category =
          'Categoria é obrigatória'
      }

      if (
        !formData.unit
      ) {
        newErrors.unit =
          'Unidade é obrigatória'
      }

      if (
        !formData.currentQuantity.trim()
      ) {
        newErrors.currentQuantity =
          'Quantidade atual é obrigatória'
      } else {
        const quantity =
          Number(
            formData.currentQuantity
          )

        if (
          !Number.isFinite(
            quantity
          ) ||
          quantity < 0
        ) {
          newErrors.currentQuantity =
            'Quantidade atual deve ser maior ou igual a zero'
        }
      }

      if (
        formData.minimumQuantity.trim()
      ) {
        const minQuantity =
          Number(
            formData.minimumQuantity
          )

        if (
          !Number.isFinite(
            minQuantity
          ) ||
          minQuantity < 0
        ) {
          newErrors.minimumQuantity =
            'Quantidade mínima deve ser maior ou igual a zero'
        }
      }

      if (
        !formData.status
      ) {
        newErrors.status =
          'Situação é obrigatória'
      }

      setErrors(
        newErrors
      )

      return (
        Object.keys(
          newErrors
        ).length === 0
      )
    }

  const handleSubmit = (
    e: FormEvent
  ) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const payload: Omit<
      InventoryItem,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
    > = {
      code:
        formData.code.trim(),

      name:
        formData.name.trim(),

      category:
        formData.category,

      unit:
        formData.unit,

      currentQuantity:
        Number(
          formData.currentQuantity
        ),

      minimumQuantity:
        formData.minimumQuantity.trim()
          ? Number(
              formData.minimumQuantity
            )
          : undefined,

      location:
        formData.location.trim() ||
        undefined,

      description:
        formData.description.trim() ||
        undefined,

      status:
        formData.status,

      batchNumber:
        formData.batchNumber.trim() ||
        undefined,

      expirationDate:
        formData.expirationDate.trim() ||
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
              value={
                formData.code
              }
              onChange={
                handleChange
              }
              placeholder="Ex: EST-001"
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
              value={
                formData.name
              }
              onChange={
                handleChange
              }
              placeholder="Ex: Ração de engorda"
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
              htmlFor="inventory-category"
              className="block text-sm font-medium mb-1"
            >
              Categoria *
            </label>

            <select
              id="inventory-category"
              name="category"
              value={
                formData.category
              }
              onChange={
                handleChange
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {categoryOptions.map(
                option => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option}
                  </option>
                )
              )}
            </select>

            {errors.category && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.category
                }
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="inventory-unit"
                className="block text-sm font-medium"
              >
                Unidade *
              </label>

              <HelpTip
                title="O que significa unidade?"
                description="É a forma utilizada para medir este item no estoque, como kg, litros, unidades, sacas ou toneladas."
              />
            </div>

            <select
              id="inventory-unit"
              name="unit"
              value={
                formData.unit
              }
              onChange={
                handleChange
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {unitOptions.map(
                option => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
                  >
                    {option}
                  </option>
                )
              )}
            </select>

            {errors.unit && (
              <p className="mt-1 text-sm text-red-600">
                {errors.unit}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="inventory-current-quantity"
                className="block text-sm font-medium"
              >
                Quantidade atual *
              </label>

              <HelpTip
                title="O que é a quantidade atual?"
                description="É a quantidade disponível deste item no estoque. No cadastro, esse valor representa o saldo inicial; depois, o saldo deve ser alterado pelas movimentações de estoque."
              />
            </div>

            {currentQuantityReadOnly ? (
              <Input
                id="inventory-current-quantity"
                label=""
                name="currentQuantity"
                type="number"
                value={
                  formData.currentQuantity
                }
                onChange={() => {}}
                disabled
                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
            ) : (
              <Input
                id="inventory-current-quantity"
                label=""
                name="currentQuantity"
                type="number"
                min={0}
                step="any"
                value={
                  formData.currentQuantity
                }
                onChange={
                  handleChange
                }
                placeholder="0"
                required
              />
            )}

            {currentQuantityReadOnly && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                O saldo só pode ser alterado através de movimentações de estoque.
              </p>
            )}

            {errors.currentQuantity && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.currentQuantity
                }
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="inventory-minimum-quantity"
                className="block text-sm font-medium"
              >
                Quantidade mínima
              </label>

              <HelpTip
                title="O que é a quantidade mínima?"
                description="É uma referência definida pela propriedade para identificar quando o saldo do item está ficando baixo."
              />
            </div>

            <Input
              id="inventory-minimum-quantity"
              label=""
              name="minimumQuantity"
              type="number"
              min={0}
              step="any"
              value={
                formData.minimumQuantity
              }
              onChange={
                handleChange
              }
              placeholder="0"
            />

            {errors.minimumQuantity && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.minimumQuantity
                }
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="inventory-batch-number"
                className="block text-sm font-medium"
              >
                Lote
              </label>

              <HelpTip
                title="O que é o lote?"
                description="É uma identificação opcional do lote de fabricação ou compra. Quando o mesmo produto tiver validades diferentes, cadastre cada lote como um item separado."
              />
            </div>

            <Input
              id="inventory-batch-number"
              label=""
              name="batchNumber"
              value={
                formData.batchNumber
              }
              onChange={
                handleChange
              }
              placeholder="Ex: L2026-001"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="inventory-expiration-date"
                className="block text-sm font-medium"
              >
                Validade
              </label>

              <HelpTip
                title="O que é a validade?"
                description="Data limite recomendada de uso do item. Pode ser informada mesmo que já esteja no passado, para fins de controle."
              />
            </div>

            <Input
              id="inventory-expiration-date"
              label=""
              name="expirationDate"
              type="date"
              value={
                formData.expirationDate
              }
              onChange={
                handleChange
              }
            />
          </div>

          <div>
            <Input
              label="Localização"
              name="location"
              value={
                formData.location
              }
              onChange={
                handleChange
              }
              placeholder="Ex: Galpão 1, Prateleira A"
            />
          </div>

          <div>
            <label
              htmlFor="inventory-status"
              className="block text-sm font-medium mb-1"
            >
              Situação *
            </label>

            <select
              id="inventory-status"
              name="status"
              value={
                formData.status
              }
              onChange={
                handleChange
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {statusOptions.map(
                option => (
                  <option
                    key={
                      option
                    }
                    value={
                      option
                    }
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