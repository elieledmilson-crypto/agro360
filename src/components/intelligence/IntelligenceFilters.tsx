import Card from '../ui/Card'
import {
  IntelligenceModule,
  IntelligenceSeverity,
} from '../../types'

export interface IntelligenceFiltersValue {
  severity: 'all' | IntelligenceSeverity
  module: 'all' | IntelligenceModule
  search: string
}

export const defaultIntelligenceFilters: IntelligenceFiltersValue = {
  severity: 'all',
  module: 'all',
  search: '',
}

interface Props {
  value: IntelligenceFiltersValue
  onChange: (next: IntelligenceFiltersValue) => void
}

const SEVERITY_OPTIONS: {
  value: IntelligenceFiltersValue['severity']
  label: string
}[] = [
  { value: 'all', label: 'Todos' },
  { value: 'critical', label: 'Críticos' },
  { value: 'warning', label: 'Atenção' },
  { value: 'opportunity', label: 'Oportunidades' },
  { value: 'information', label: 'Informativos' },
]

const MODULE_OPTIONS: {
  value: IntelligenceFiltersValue['module']
  label: string
}[] = [
  { value: 'all', label: 'Todos os módulos' },
  { value: 'animals', label: 'Animais' },
  { value: 'health', label: 'Saúde' },
  { value: 'land', label: 'Terras' },
  { value: 'crops', label: 'Cultivos' },
  { value: 'machines', label: 'Máquinas' },
  { value: 'inventory', label: 'Estoque' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'map', label: 'Mapa' },
]

export default function IntelligenceFilters({
  value,
  onChange,
}: Props) {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex flex-col text-sm">
          <span className="text-gray-700 dark:text-gray-300 mb-1">
            Classificação
          </span>

          <select
            value={value.severity}
            onChange={event =>
              onChange({
                ...value,
                severity:
                  event.target
                    .value as IntelligenceFiltersValue['severity'],
              })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {SEVERITY_OPTIONS.map(option => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="text-gray-700 dark:text-gray-300 mb-1">
            Módulo
          </span>

          <select
            value={value.module}
            onChange={event =>
              onChange({
                ...value,
                module:
                  event.target
                    .value as IntelligenceFiltersValue['module'],
              })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {MODULE_OPTIONS.map(option => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <span className="text-gray-700 dark:text-gray-300 mb-1">
            Buscar
          </span>

          <input
            type="text"
            placeholder="Título, descrição ou módulo..."
            value={value.search}
            onChange={event =>
              onChange({
                ...value,
                search: event.target.value,
              })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </label>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() =>
            onChange(defaultIntelligenceFilters)
          }
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
        >
          Limpar filtros
        </button>
      </div>
    </Card>
  )
}