import Card from '../ui/Card'

interface Props {
  label: string
  value: string | number
  helper?: string
}

export default function ReportMetricCard({
  label,
  value,
  helper,
}: Props) {
  return (
    <Card className="p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100 break-words">
        {value}
      </p>

      {helper && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {helper}
        </p>
      )}
    </Card>
  )
}