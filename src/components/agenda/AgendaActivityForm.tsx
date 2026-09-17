import {
  useState,
  FormEvent,
  ChangeEvent,
  useMemo,
} from 'react'
import {
  AgendaActivity,
  AgendaActivityPriority,
  AgendaActivityStatus,
  AgendaActivityType,
} from '../../types'
import {
  getAgendaEmployeeOptions,
} from '../../services/agendaService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface AgendaFormData {
  title: string
  type: AgendaActivityType
  date: string
  time: string
  priority: AgendaActivityPriority
  status: AgendaActivityStatus
  responsibleEmployeeId: string
  notes: string
}

export interface AgendaActivityPayload {
  title: string
  type: AgendaActivityType
  date: string
  time?: string
  priority: AgendaActivityPriority
  status: AgendaActivityStatus
  responsibleEmployeeId?: string
  notes?: string
}

interface Props {
  activity?: AgendaActivity
  onSubmit: (data: AgendaActivityPayload) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const typeOptions: AgendaActivityType[] = [
  'Tarefa',
  'Vacinação',
  'Tratamento',
  'Plantio',
  'Colheita',
  'Manutenção',
  'Irrigação',
  'Pagamento',
  'Reposição de estoque',
  'Outro',
]

const priorityOptions: AgendaActivityPriority[] = [
  'Baixa',
  'Média',
  'Alta',
]

const statusOptions: AgendaActivityStatus[] = [
  'Pendente',
  'Concluída',
  'Cancelada',
]

function isValidFormTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false

  const [hours, minutes] = time.split(':').map(Number)

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return false
  }

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

export default function AgendaActivityForm({
  activity,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const isEdit = activity !== undefined

  const [formData, setFormData] = useState<AgendaFormData>(() => {
    if (activity) {
      return {
        title: activity.title,
        type: activity.type,
        date: activity.date,
        time: activity.time ?? '',
        priority: activity.priority,
        status: activity.status,
        responsibleEmployeeId: activity.responsibleEmployeeId ?? '',
        notes: activity.notes ?? '',
      }
    }

    return {
      title: '',
      type: 'Tarefa',
      date: '',
      time: '',
      priority: 'Média',
      status: 'Pendente',
      responsibleEmployeeId: '',
      notes: '',
    }
  })

  const [errors, setErrors] = useState<
    Partial<Record<keyof AgendaFormData, string>>
  >({})

  const employees = useMemo(() => getAgendaEmployeeOptions(), [])

  const eligibleEmployees = useMemo(() => {
    if (!isEdit) {
      return employees.filter(employee => !employee.inactive)
    }

    const currentId = activity?.responsibleEmployeeId

    return employees.filter(
      employee => !employee.inactive || employee.id === currentId,
    )
  }, [employees, isEdit, activity])

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof AgendaFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AgendaFormData, string>> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório.'
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória.'
    }

    if (formData.time && !isValidFormTime(formData.time)) {
      newErrors.time = 'Horário da atividade inválido.'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const payload: AgendaActivityPayload = {
      title: formData.title.trim(),
      type: formData.type,
      date: formData.date,
      time: formData.time.trim() || undefined,
      priority: formData.priority,
      status: formData.status,
      responsibleEmployeeId: formData.responsibleEmployeeId || undefined,
      notes: formData.notes.trim() || undefined,
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Título *"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Vacinar lote de engorda"
              required
            />

            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="agenda-type"
                className="block text-sm font-medium"
              >
                Tipo *
              </label>

              <HelpTip
                title="O que é o tipo da atividade?"
                description="O tipo serve para organizar a atividade como um lembrete na Agenda. Ele não cria registros nos outros módulos do Agro360."
              />
            </div>

            <select
              id="agenda-type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {typeOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Data *"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
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
                htmlFor="agenda-time"
                className="block text-sm font-medium"
              >
                Hora
              </label>

              <HelpTip
                title="Preciso informar a hora?"
                description="A hora é opcional. Quando informada, a atividade aparece com horário definido na Agenda."
              />
            </div>

            <Input
              id="agenda-time"
              label=""
              name="time"
              type="time"
              value={formData.time}
              onChange={handleChange}
            />

            {errors.time && (
              <p className="mt-1 text-sm text-red-600">
                {errors.time}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="agenda-priority"
              className="block text-sm font-medium mb-1"
            >
              Prioridade *
            </label>

            <select
              id="agenda-priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {priorityOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="agenda-status"
              className="block text-sm font-medium mb-1"
            >
              Situação *
            </label>

            <select
              id="agenda-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {statusOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="agenda-responsible"
              className="block text-sm font-medium mb-1"
            >
              Responsável
            </label>

            {eligibleEmployees.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Nenhum funcionário ativo cadastrado. Cadastre um funcionário para atribuir como responsável.
              </p>
            ) : (
              <select
                id="agenda-responsible"
                name="responsibleEmployeeId"
                value={formData.responsibleEmployeeId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Sem responsável</option>

                {eligibleEmployees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                    {employee.inactive ? ' — Inativo' : ''}
                  </option>
                ))}
              </select>
            )}
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

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
          Atividades cadastradas na Agenda funcionam como lembretes e não criam
          registros automaticamente nos outros módulos.
        </div>

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {submitError}
          </div>
        )}
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
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