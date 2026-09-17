import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import {
  IntelligenceInsight,
  IntelligenceSeverity,
} from '../../types'
import {
  AlertTriangle,
  Info,
  Lightbulb,
  Siren,
  ExternalLink,
} from 'lucide-react'

const SEVERITY_LABELS: Record<IntelligenceSeverity, string> = {
  critical: 'Crítico',
  warning: 'Atenção',
  opportunity: 'Oportunidade',
  information: 'Informativo',
}

const SEVERITY_CLASSES: Record<IntelligenceSeverity, string> = {
  critical:
    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  warning:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  opportunity:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  information:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}

const SEVERITY_ICONS: Record<
  IntelligenceSeverity,
  typeof Siren
> = {
  critical: Siren,
  warning: AlertTriangle,
  opportunity: Lightbulb,
  information: Info,
}

interface Props {
  insight: IntelligenceInsight
}

export default function IntelligenceInsightCard({ insight }: Props) {
  const Icon = SEVERITY_ICONS[insight.severity]

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span
            className={`p-2 rounded-lg ${SEVERITY_CLASSES[insight.severity]}`}
            aria-hidden="true"
          >
            <Icon className="w-4 h-4" />
          </span>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {insight.title}
            </h3>

            <p className="text-sm text-gray-700 dark:text-gray-300">
              {insight.description}
            </p>
          </div>
        </div>

        <span
          className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${SEVERITY_CLASSES[insight.severity]}`}
        >
          {SEVERITY_LABELS[insight.severity]}
        </span>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-2">
        <p className="font-medium">Por que este item apareceu?</p>
        <p className="mt-1">{insight.explanation}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Módulo: {insight.moduleLabel}
        </span>

        {insight.sourcePath && (
          <Link
            to={insight.sourcePath}
            className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline"
          >
            Ver no módulo
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </Card>
  )
}