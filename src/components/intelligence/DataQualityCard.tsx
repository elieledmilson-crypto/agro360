import { Database } from 'lucide-react'
import Card from '../ui/Card'
import { IntelligenceDataQualityIssue } from '../../types'

interface Props {
  issue: IntelligenceDataQualityIssue
}

export default function DataQualityCard({
  issue,
}: Props) {
  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-start gap-3">
        <span
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          aria-hidden="true"
        >
          <Database className="w-4 h-4" />
        </span>

        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {issue.title}
          </h3>

          <p className="text-sm text-gray-700 dark:text-gray-300">
            {issue.description}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-2">
        {issue.explanation}
      </p>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Módulo: {issue.moduleLabel}

        {issue.affectedCount > 1
          ? ` · ${issue.affectedCount} registros afetados`
          : ''}
      </p>
    </Card>
  )
}