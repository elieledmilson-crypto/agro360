import {
  useState,
  FormEvent,
  ChangeEvent,
  useMemo,
} from 'react'
import {
  User,
  Vaccination,
} from '../../types'
import { getAnimals } from '../../services/animalService'
import { getInventoryItems } from '../../services/inventoryService'
import { userHasPermission } from '../../services/permissionService'
import IntegratedFinancialSection, {
  IntegratedFinancialLine,
  createEmptyIntegratedFinancialLine,
} from '../integration/IntegratedFinancialSection'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'
import {
  isFutureDate,
  isEndDateBeforeStartDate,
} from '../../utils/date'

interface VaccinationFormData {
  animalId: string
  vaccineName: string
  applicationDate: string
  nextDoseDate: string
  dose: string
  batch: string
  responsible: string
  notes: string
  stockEnabled: boolean
  stockItemId: string
  stockQuantity: string
}

export interface VaccinationConsumptionPayload {
  inventoryItemId: string
  quantity: number
}

export interface VaccinationFinancialPayload {
  categoryId: string
  date: string
  description: string
  amount: number
  notes?: string
}

interface Props {
  vaccination?: Vaccination
  preselectedAnimalId?: string
  hasStockConsumption?: boolean
  user: User | null
  onSubmit: (
    data: Omit<
      Vaccination,
      'id' | 'createdAt' | 'updatedAt'
    >,
    consumption?: VaccinationConsumptionPayload,
    financial?: VaccinationFinancialPayload,
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

export default function VaccinationForm({
  vaccination,
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
    vaccination !== undefined

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

  const eligibleStockItems =
    useMemo(() => {
      if (
        isEditMode ||
        !canUseInventory
      ) {
        return []
      }

      return getInventoryItems().filter(
        item =>
          item.category ===
            'Vacina' &&
          item.status ===
            'Ativo',
      )
    }, [
      isEditMode,
      canUseInventory,
    ])

  const [
    formData,
    setFormData,
  ] =
    useState<VaccinationFormData>(
      () => {
        if (vaccination) {
          return {
            animalId:
              vaccination.animalId,
            vaccineName:
              vaccination.vaccineName,
            applicationDate:
              vaccination.applicationDate,
            nextDoseDate:
              vaccination.nextDoseDate ??
              '',
            dose:
              vaccination.dose ??
              '',
            batch:
              vaccination.batch ??
              '',
            responsible:
              vaccination.responsible ??
              '',
            notes:
              vaccination.notes ??
              '',
            stockEnabled: false,
            stockItemId: '',
            stockQuantity: '',
          }
        }

        return {
          animalId:
            preselectedAnimalId ??
            '',
          vaccineName: '',
          applicationDate: '',
          nextDoseDate: '',
          dose: '',
          batch: '',
          responsible: '',
          notes: '',
          stockEnabled: false,
          stockItemId: '',
          stockQuantity: '',
        }
      },
    )

  const [
    errors,
    setErrors,
  ] = useState<
    Partial<
      Record<
        keyof VaccinationFormData,
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
        name as keyof VaccinationFormData
      ]
    ) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleStockEnabledChange =
    (
      e: ChangeEvent<HTMLInputElement>,
    ) => {
      const checked =
        e.target.checked

      setFormData(prev => ({
        ...prev,
        stockEnabled: checked,
        stockItemId: checked
          ? prev.stockItemId
          : '',
        stockQuantity: checked
          ? prev.stockQuantity
          : '',
      }))

      if (
        errors.stockItemId ||
        errors.stockQuantity
      ) {
        setErrors(prev => ({
          ...prev,
          stockItemId:
            undefined,
          stockQuantity:
            undefined,
        }))
      }
    }

  const validate = (): boolean => {
    const newErrors:
      Partial<
        Record<
          keyof VaccinationFormData,
          string
        >
      > = {}

    if (!formData.animalId) {
      newErrors.animalId =
        'Animal é obrigatório'
    }

    if (
      !formData.vaccineName.trim()
    ) {
      newErrors.vaccineName =
        'Vacina é obrigatória'
    }

    if (
      !formData.applicationDate
    ) {
      newErrors.applicationDate =
        'Data de aplicação é obrigatória'
    } else if (
      isFutureDate(
        formData.applicationDate,
      )
    ) {
      newErrors.applicationDate =
        'Aplicação não pode estar no futuro'
    }

    if (
      formData.nextDoseDate &&
      formData.applicationDate
    ) {
      if (
        isEndDateBeforeStartDate(
          formData.applicationDate,
          formData.nextDoseDate,
        )
      ) {
        newErrors.nextDoseDate =
          'Próxima dose não pode ser anterior à aplicação'
      }
    }

    if (
      !isEditMode &&
      canUseInventory &&
      formData.stockEnabled
    ) {
      if (
        !formData.stockItemId
      ) {
        newErrors.stockItemId =
          'Item de estoque é obrigatório'
      }

      if (
        !formData.stockQuantity.trim()
      ) {
        newErrors.stockQuantity =
          'Quantidade é obrigatória'
      } else {
        const quantity = Number(
          formData.stockQuantity,
        )

        if (
          !Number.isFinite(
            quantity,
          ) ||
          quantity <= 0
        ) {
          newErrors.stockQuantity =
            'Quantidade deve ser maior que zero'
        }
      }
    }

    const newFinancialErrors:
      typeof financialErrors = {}

    if (financialEnabled) {
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
      Vaccination,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      animalId:
        formData.animalId,
      vaccineName:
        formData.vaccineName.trim(),
      applicationDate:
        formData.applicationDate,
      nextDoseDate:
        formData.nextDoseDate ||
        undefined,
      dose:
        formData.dose.trim() ||
        undefined,
      batch:
        formData.batch.trim() ||
        undefined,
      responsible:
        formData.responsible.trim() ||
        undefined,
      notes:
        formData.notes.trim() ||
        undefined,
    }

    let consumption:
      | VaccinationConsumptionPayload
      | undefined

    if (
      !isEditMode &&
      canUseInventory &&
      formData.stockEnabled
    ) {
      consumption = {
        inventoryItemId:
          formData.stockItemId,
        quantity: Number(
          formData.stockQuantity,
        ),
      }
    }

    let financial:
      | VaccinationFinancialPayload
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
      consumption,
      financial,
    )
  }

  const lockedByStockConsumption =
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

  const renderStockSection =
    () => {
      if (isEditMode) {
        return null
      }

      if (!canUseInventory) {
        return null
      }

      if (
        eligibleStockItems.length ===
        0
      ) {
        return (
          <div className="md:col-span-2 mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-sm">
            Nenhuma vacina ativa
            cadastrada no estoque.
            Cadastre um item da
            categoria Vacina para
            poder dar baixa.
          </div>
        )
      }

      return (
        <div className="md:col-span-2 mt-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              id="vaccine-stock-enabled"
              type="checkbox"
              name="stockEnabled"
              checked={
                formData.stockEnabled
              }
              onChange={
                handleStockEnabledChange
              }
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />

            <label
              htmlFor="vaccine-stock-enabled"
              className="text-sm font-medium"
            >
              Dar baixa no estoque
            </label>

            <HelpTip
              title="O que é dar baixa no estoque?"
              description="Marque para registrar a saída da vacina utilizada diretamente do estoque."
            />
          </div>

          {formData.stockEnabled && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="vaccine-stock-item"
                  className="block text-sm font-medium mb-1"
                >
                  Item de estoque *
                </label>

                <select
                  id="vaccine-stock-item"
                  name="stockItemId"
                  value={
                    formData.stockItemId
                  }
                  onChange={
                    handleChange
                  }
                  className={
                    selectClass(
                      false,
                    )
                  }
                >
                  <option value="">
                    Selecione um
                    item
                  </option>

                  {eligibleStockItems.map(
                    item => (
                      <option
                        key={
                          item.id
                        }
                        value={
                          item.id
                        }
                      >
                        {
                          item.code
                        }{' '}
                        —{' '}
                        {
                          item.name
                        }{' '}
                        (
                        {
                          item.unit
                        }
                        )
                      </option>
                    ),
                  )}
                </select>

                {errors.stockItemId && (
                  <p className="mt-1 text-sm text-red-600">
                    {
                      errors.stockItemId
                    }
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="vaccine-stock-quantity"
                  className="block text-sm font-medium mb-1"
                >
                  Quantidade
                  consumida *
                </label>

                <Input
                  id="vaccine-stock-quantity"
                  label=""
                  name="stockQuantity"
                  type="number"
                  min="0"
                  step="any"
                  value={
                    formData.stockQuantity
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0"
                />

                {errors.stockQuantity && (
                  <p className="mt-1 text-sm text-red-600">
                    {
                      errors.stockQuantity
                    }
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }

  const showFinancialSection =
    !isEditMode &&
    canUseFinance

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        {lockedByStockConsumption && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
            Esta vacinação possui
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
              disabled={
                lockedByStockConsumption
              }
              className={selectClass(
                lockedByStockConsumption,
              )}
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
                    }{' '}
                    {animal.name
                      ? `— ${animal.name}`
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
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="vaccine-name"
                className="block text-sm font-medium"
              >
                Vacina *
              </label>

              <HelpTip
                title="O que informar na vacina?"
                description="Informe o nome da vacina aplicada ao animal para manter o histórico sanitário organizado."
              />
            </div>

            <Input
              id="vaccine-name"
              label=""
              name="vaccineName"
              value={
                formData.vaccineName
              }
              onChange={
                handleChange
              }
              placeholder="Ex: Raiva"
              required
              disabled={
                lockedByStockConsumption
              }
              className={
                lockedByStockConsumption
                  ? disabledClass
                  : ''
              }
            />

            {errors.vaccineName && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.vaccineName
                }
              </p>
            )}
          </div>

          <div>
            <Input
              label="Data de aplicação *"
              name="applicationDate"
              type="date"
              value={
                formData.applicationDate
              }
              onChange={
                handleChange
              }
              required
              disabled={
                lockedByStockConsumption
              }
              className={
                lockedByStockConsumption
                  ? disabledClass
                  : ''
              }
            />

            {errors.applicationDate && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.applicationDate
                }
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="vaccine-next-dose"
                className="block text-sm font-medium"
              >
                Próxima dose
              </label>

              <HelpTip
                title="O que significa próxima dose?"
                description="É a data prevista para uma nova aplicação da vacina quando o protocolo exigir reforço."
              />
            </div>

            <Input
              id="vaccine-next-dose"
              label=""
              name="nextDoseDate"
              type="date"
              value={
                formData.nextDoseDate
              }
              onChange={
                handleChange
              }
            />

            {errors.nextDoseDate && (
              <p className="mt-1 text-sm text-red-600">
                {
                  errors.nextDoseDate
                }
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="vaccine-dose"
                className="block text-sm font-medium"
              >
                Dose
              </label>

              <HelpTip
                title="O que informar na dose?"
                description="Informe a quantidade da vacina aplicada ao animal."
              />
            </div>

            <Input
              id="vaccine-dose"
              label=""
              name="dose"
              value={
                formData.dose
              }
              onChange={
                handleChange
              }
              placeholder="Ex: 2 mL"
              disabled={
                lockedByStockConsumption
              }
              className={
                lockedByStockConsumption
                  ? disabledClass
                  : ''
              }
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="vaccine-batch"
                className="block text-sm font-medium"
              >
                Lote da vacina
              </label>

              <HelpTip
                title="O que é o lote da vacina?"
                description="É a identificação do lote de fabricação do produto, normalmente informada na embalagem ou no frasco."
              />
            </div>

            <Input
              id="vaccine-batch"
              label=""
              name="batch"
              value={
                formData.batch
              }
              onChange={
                handleChange
              }
              placeholder="Lote do produto"
              disabled={
                lockedByStockConsumption
              }
              className={
                lockedByStockConsumption
                  ? disabledClass
                  : ''
              }
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
              placeholder="Nome do responsável"
            />
          </div>

          {renderStockSection()}

          {showFinancialSection && (
            <IntegratedFinancialSection
              enabled={
                financialEnabled
              }
              onEnabledChange={
                setFinancialEnabled
              }
              line={financialLine}
              onLineChange={
                setFinancialLine
              }
              errors={
                financialErrors
              }
              title="Registrar este custo no Financeiro"
              helpDescription="Marque para criar uma despesa vinculada a esta vacinação."
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