import { useState, FormEvent, ChangeEvent, useMemo } from 'react'
import {
  MachineUsageRecord,
  MachineOperationType,
} from '../../types'
import { getMachines } from '../../services/machineService'
import { getLandAreas } from '../../services/landService'
import { getCropCycles } from '../../services/cropService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface MachineUsageFormData {
  machineId: string
  landAreaId: string
  cropCycleId: string
  operationDate: string
  operationType: MachineOperationType
  workedHours: string
  notes: string
}

interface Props {
  record?: MachineUsageRecord
  preselectedMachineId?: string
  preselectedLandAreaId?: string
  preselectedCropCycleId?: string
  onSubmit: (
    data: Omit<
      MachineUsageRecord,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const operationTypeOptions: MachineOperationType[] = [
  'Preparo do solo',
  'Plantio',
  'Semeadura',
  'Adubação',
  'Pulverização',
  'Colheita',
  'Roçada',
  'Irrigação',
  'Transporte',
  'Outro',
]

export default function MachineUsageForm({
  record,
  preselectedMachineId,
  preselectedLandAreaId,
  preselectedCropCycleId,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const [formData, setFormData] = useState<MachineUsageFormData>(() => {
    if (record) {
      return {
        machineId: record.machineId,
        landAreaId: record.landAreaId,
        cropCycleId: record.cropCycleId ?? '',
        operationDate: record.operationDate,
        operationType: record.operationType,
        workedHours: record.workedHours.toString(),
        notes: record.notes ?? '',
      }
    }

    return {
      machineId: preselectedMachineId ?? '',
      landAreaId: preselectedLandAreaId ?? '',
      cropCycleId: preselectedCropCycleId ?? '',
      operationDate: '',
      operationType: 'Preparo do solo',
      workedHours: '',
      notes: '',
    }
  })

  const [errors, setErrors] = useState<
    Partial<Record<keyof MachineUsageFormData, string>>
  >({})

  const machines = useMemo(
    () => getMachines(),
    []
  )

  const talhoes = useMemo(
    () =>
      getLandAreas().filter(
        area => area.type === 'Talhão'
      ),
    []
  )

  const allCropCycles = useMemo(
    () => getCropCycles(),
    []
  )

  const availableCropCycles =
    allCropCycles.filter(
      cycle =>
        cycle.landAreaId ===
        formData.landAreaId
    )

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target

    setFormData(prev => {
      const next = {
        ...prev,
        [name]: value,
      }

      if (name === 'landAreaId') {
        const cropStillValid =
          allCropCycles.some(
            cycle =>
              cycle.id ===
                next.cropCycleId &&
              cycle.landAreaId ===
                value
          )

        if (!cropStillValid) {
          next.cropCycleId = ''
        }
      }

      return next
    })

    if (errors[name as keyof MachineUsageFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<
      Record<
        keyof MachineUsageFormData,
        string
      >
    > = {}

    if (!formData.machineId) {
      newErrors.machineId =
        'Máquina ou equipamento é obrigatório'
    }

    if (!formData.landAreaId) {
      newErrors.landAreaId =
        'Talhão é obrigatório'
    }

    if (!formData.operationDate) {
      newErrors.operationDate =
        'Data da utilização é obrigatória'
    }

    if (!formData.operationType) {
      newErrors.operationType =
        'Tipo de operação é obrigatório'
    }

    if (!formData.workedHours.trim()) {
      newErrors.workedHours =
        'Horas trabalhadas são obrigatórias'
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

    const workedHoursValue =
      formData.workedHours.trim()

    const payload: Omit<
      MachineUsageRecord,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      machineId:
        formData.machineId,
      landAreaId:
        formData.landAreaId,
      cropCycleId:
        formData.cropCycleId ||
        undefined,
      operationDate:
        formData.operationDate,
      operationType:
        formData.operationType,
      workedHours:
        Number(workedHoursValue),
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
            <label
              htmlFor="usage-machine"
              className="block text-sm font-medium mb-1"
            >
              Máquina/Equipamento *
            </label>

            {machines.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Nenhuma máquina cadastrada.
              </p>
            ) : (
              <select
                id="usage-machine"
                name="machineId"
                value={formData.machineId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">
                  Selecione uma máquina
                </option>

                {machines.map(machine => (
                  <option
                    key={machine.id}
                    value={machine.id}
                  >
                    {machine.code} — {machine.name}
                  </option>
                ))}
              </select>
            )}

            {errors.machineId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.machineId}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="usage-land-area"
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
                Nenhum talhão cadastrado.
              </p>
            ) : (
              <select
                id="usage-land-area"
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
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="usage-crop-cycle"
                className="block text-sm font-medium"
              >
                Cultivo/Safra
              </label>

              <HelpTip
                title="Preciso vincular um cultivo?"
                description="Não obrigatoriamente. Vincule um cultivo quando a operação estiver relacionada diretamente a uma safra específica. Caso contrário, deixe sem cultivo vinculado."
              />
            </div>

            <select
              id="usage-crop-cycle"
              name="cropCycleId"
              value={formData.cropCycleId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">
                Sem cultivo vinculado
              </option>

              {availableCropCycles.map(cycle => (
                <option
                  key={cycle.id}
                  value={cycle.id}
                >
                  {cycle.crop}{' '}
                  {cycle.cultivar
                    ? `— ${cycle.cultivar}`
                    : ''}{' '}
                  — {cycle.season}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Data da utilização *"
              name="operationDate"
              type="date"
              value={formData.operationDate}
              onChange={handleChange}
              required
            />

            {errors.operationDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.operationDate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="usage-operation-type"
              className="block text-sm font-medium mb-1"
            >
              Tipo de operação *
            </label>

            <select
              id="usage-operation-type"
              name="operationType"
              value={formData.operationType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {operationTypeOptions.map(option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>

            {errors.operationType && (
              <p className="mt-1 text-sm text-red-600">
                {errors.operationType}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="usage-worked-hours"
                className="block text-sm font-medium"
              >
                Horas trabalhadas *
              </label>

              <HelpTip
                title="O que são horas trabalhadas?"
                description="É o tempo que a máquina foi utilizada naquela operação. Por exemplo, se trabalhou por duas horas e meia, informe 2,5 horas."
              />
            </div>

            <Input
              id="usage-worked-hours"
              label=""
              name="workedHours"
              type="number"
              min={0.1}
              step={0.1}
              value={formData.workedHours}
              onChange={handleChange}
              placeholder="2.5"
              required
            />

            {errors.workedHours && (
              <p className="mt-1 text-sm text-red-600">
                {errors.workedHours}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="usage-notes"
            className="block text-sm font-medium mb-1"
          >
            Observações
          </label>

          <textarea
            id="usage-notes"
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